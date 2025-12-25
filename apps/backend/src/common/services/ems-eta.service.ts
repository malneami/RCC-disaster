import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EMSAssignment, AssignmentStatus } from '@prisma/client';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class EMSETAService {
  private readonly logger = new Logger(EMSETAService.name);
  private readonly OSRM_API_URL: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.OSRM_API_URL = this.configService.get<string>('OSRM_API_URL') || 'http://localhost:5001/route/v1/driving';
  }

  /**
   * Calculate ETA and distance using OSRM Routing
   */
  async calculateETAWithRouting(
    currentLocation: { lat: number; lng: number },
    targetLocation: { lat: number; lng: number }
  ): Promise<{ durationMinutes: number; distanceKm: number }> {
    try {
      // OSRM expects: longitude,latitude
      const start = `${currentLocation.lng},${currentLocation.lat}`;
      const end = `${targetLocation.lng},${targetLocation.lat}`;
      const url = `${this.OSRM_API_URL}/${start};${end}?overview=false`;

      const response = await fetch(url);
      if (!response.ok) {
        this.logger.error(`OSRM Request failed: ${response.status} ${response.statusText}`);
        throw new Error(`OSRM API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // duration is in seconds, convert to minutes
        const durationMinutes = Math.round(route.duration / 60);
        // distance is in meters, convert to km
        const distanceKm = Number((route.distance / 1000).toFixed(1));

        return { durationMinutes, distanceKm };
      }

      throw new Error('No routes found');
    } catch (error) {
      this.logger.warn(`Routing failed, falling back to straight-line: ${(error as Error).message}`);
      return this.calculateETAStraightLine(currentLocation, targetLocation);
    }
  }

  /**
   * Fallback: Calculate ETA using Haversine distance and assumed speed
   */
  calculateETAStraightLine(
    currentLocation: { lat: number; lng: number },
    targetLocation: { lat: number; lng: number }
  ): { durationMinutes: number; distanceKm: number } {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(targetLocation.lat - currentLocation.lat);
    const dLng = this.deg2rad(targetLocation.lng - currentLocation.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(currentLocation.lat)) *
        Math.cos(this.deg2rad(targetLocation.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Number((R * c).toFixed(1));

    // Assume average speed of 40 km/h for urban EMS
    const assumedSpeedKmH = 40;
    const durationMinutes = Math.round((distanceKm / assumedSpeedKmH) * 60);

    return { durationMinutes, distanceKm };
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Update ETA for a specific assignment
   */
  async updateAssignmentETA(assignmentId: string): Promise<void> {
    try {
      const assignment = await this.prisma.eMSAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          ambulance: true,
          ticket: {
            include: {
              originHospital: true,
              destinationHospital: true,
            },
          },
        },
      });

      if (!assignment || !assignment.ambulance) {
        return; // Cannot calculate without ambulance or assignment
      }

      const ambulance = assignment.ambulance;

      // Need current location of ambulance
      // Assuming ambulance.currentLocationLat/Lng are up to date from tracking service
      if (!ambulance.currentLocationLat || !ambulance.currentLocationLng) {
        return;
      }

      const currentLocation = {
        lat: ambulance.currentLocationLat,
        lng: ambulance.currentLocationLng,
      };

      let targetLocation: { lat: number; lng: number } | null = null;
      let targetType: 'ORIGIN' | 'DESTINATION' | null = null;

      // Determine target based on status
      switch (assignment.status) {
        case 'EMS_CONTACT':
        case 'EN_ROUTE':
          if (assignment.ticket.originHospital) {
            targetLocation = {
              lat: assignment.ticket.originHospital.latitude || 0,
              lng: assignment.ticket.originHospital.longitude || 0,
            };
            targetType = 'ORIGIN';
          }
          break;

        case 'PATIENT_LOADED':
        case 'DEPARTED':
        case 'IN_TRANSPORT' as any: // In case enum is extended
          if (assignment.ticket.destinationHospital) {
            targetLocation = {
              lat: assignment.ticket.destinationHospital.latitude || 0,
              lng: assignment.ticket.destinationHospital.longitude || 0,
            };
            targetType = 'DESTINATION';
          }
          break;

        case 'EMS_ARRIVAL':
        case 'AT_PICKUP':
          // Already at origin
          await this.prisma.eMSAssignment.update({
            where: { id: assignmentId },
            data: {
              estimatedArrivalMinutes: 0,
              etaToOrigin: 0,
              lastEtaUpdateTime: new Date(),
            },
          });
          return;

        case 'ARRIVED':
        case 'CANCELLED':
          // No ETA needed
          return;
      }

      if (!targetLocation || (targetLocation.lat === 0 && targetLocation.lng === 0)) {
        return; // Cannot route to invalid target
      }

      // Calculate ETA
      const result = await this.calculateETAWithRouting(currentLocation, targetLocation);

      // Update database
      const updateData: any = {
        estimatedArrivalMinutes: result.durationMinutes,
        routeDistanceKm: result.distanceKm,
        lastEtaUpdateTime: new Date(),
      };

      // Set baseline Estimated Arrival Time if not set
      // This allows tracking if the ambulance is "late" vs the initial prediction
      if (!assignment.estimatedArrivalTime) {
        updateData.estimatedArrivalTime = new Date(Date.now() + result.durationMinutes * 60000);
      }

      if (targetType === 'ORIGIN') {
        updateData.etaToOrigin = result.durationMinutes;
      } else if (targetType === 'DESTINATION') {
        updateData.etaToDestination = result.durationMinutes;
      }

      await this.prisma.eMSAssignment.update({
        where: { id: assignmentId },
        data: updateData,
      });

    } catch (error) {
      this.logger.error(`Failed to update ETA for assignment ${assignmentId}: ${(error as Error).message}`);
    }
  }

  /**
   * Batch update active assignments
   * Should be called periodically (e.g. cron job)
   */
  async updateAllActiveAssignmentETAs(): Promise<void> {
    const activeAssignments = await this.prisma.eMSAssignment.findMany({
      where: {
        status: {
          in: ['EMS_CONTACT', 'EN_ROUTE', 'AT_PICKUP', 'PATIENT_LOADED', 'EMS_ARRIVAL', 'DEPARTED'],
        },
        ambulanceId: { not: null },
      },
      select: { id: true },
    });

    this.logger.log(`Updating ETA for ${activeAssignments.length} active assignments`);

    for (const assignment of activeAssignments) {
      // Run sequentially to avoid rate limits if using public OSRM
      await this.updateAssignmentETA(assignment.id);
      // Small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}
