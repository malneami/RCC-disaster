import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ZoneApiService, ZoneData } from './zone-api.service';
import { GpsApiService } from './gps-api.service';
import { AssignmentStatus } from '@prisma/client';
import { VehicleStatus } from '../interfaces/gps.interfaces';

export interface ZoneStatusUpdate {
  assignmentId: string;
  ticketId: string;
  ambulanceId: string;
  newStatus: AssignmentStatus;
  previousStatus: AssignmentStatus;
  zoneInfo: {
    currentZone?: ZoneData;
    originZone?: ZoneData;
    destinationZone?: ZoneData;
    isInOriginZone: boolean;
    isInDestinationZone: boolean;
  };
  timestamp: Date;
  triggeredBy: 'zone_entry' | 'zone_exit' | 'manual';
}

@Injectable()
export class ZoneBasedGpsMonitoringService {
  private readonly logger = new Logger(ZoneBasedGpsMonitoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly zoneApiService: ZoneApiService,
    private readonly gpsApiService: GpsApiService
  ) {}

  /**
   * Process GPS location update and check for zone-based status changes
   */
  async processGpsLocationUpdate(
    ambulanceId: string,
    gpsLocation: VehicleStatus
  ): Promise<ZoneStatusUpdate[]> {
    const updates: ZoneStatusUpdate[] = [];

    try {
      // Get active assignments for this ambulance
      const activeAssignments = await this.prisma.eMSAssignment.findMany({
        where: {
          ambulanceId,
          status: {
            in: ['ASSIGNED', 'EN_ROUTE', 'AT_PICKUP', 'EMS_ARRIVAL'] as AssignmentStatus[]
          },
          deletedAt: null
        },
        include: {
          ticket: {
            include: {
              originHospital: true,
              destinationHospital: true
            }
          }
        }
      });

      if (activeAssignments.length === 0) {
        this.logger.debug(`No active assignments found for ambulance ${ambulanceId}`);
        return updates;
      }

      // Get all zones
      const allZones = await this.zoneApiService.getAllZones();

      for (const assignment of activeAssignments) {
        const statusUpdate = await this.checkAssignmentStatusUpdate(
          assignment,
          gpsLocation,
          allZones
        );

        if (statusUpdate) {
          updates.push(statusUpdate);
        }
      }

      // Apply status updates
      for (const update of updates) {
        await this.applyStatusUpdate(update);
      }

    } catch (error) {
      this.logger.error(`Error processing GPS location update for ambulance ${ambulanceId}:`, error);
    }

    return updates;
  }

  /**
   * Check if an assignment status should be updated based on zone boundaries
   */
  private async checkAssignmentStatusUpdate(
    assignment: any,
    gpsLocation: VehicleStatus,
    allZones: ZoneData[]
  ): Promise<ZoneStatusUpdate | null> {
    const { ticket, status: currentStatus } = assignment;
    const { latitude, longitude } = gpsLocation.location;

    // Find zones containing current location
    const currentZones = allZones.filter(zone => 
      this.isPointInZone(latitude, longitude, zone)
    );

    // Find zones for origin and destination hospitals
    const originZones = ticket.originHospital?.latitude && ticket.originHospital?.longitude
      ? allZones.filter(zone => 
          this.isPointInZone(ticket.originHospital.latitude, ticket.originHospital.longitude, zone)
        )
      : [];

    const destinationZones = ticket.destinationHospital?.latitude && ticket.destinationHospital?.longitude
      ? allZones.filter(zone => 
          this.isPointInZone(ticket.destinationHospital.latitude, ticket.destinationHospital.longitude, zone)
        )
      : [];

    const originZone = originZones[0];
    const destinationZone = destinationZones[0];
    const currentZone = currentZones[0];

    // Determine if ambulance is in origin or destination zones
    const isInOriginZone = originZone && currentZones.some(zone => zone.zone_id === originZone.zone_id);
    const isInDestinationZone = destinationZone && currentZones.some(zone => zone.zone_id === destinationZone.zone_id);

    // Determine new status based on current location and assignment status
    const newStatus = this.determineNewStatus(
      currentStatus,
      isInOriginZone,
      isInDestinationZone,
      assignment
    );

    // Only update if status actually changed
    if (newStatus && newStatus !== currentStatus) {
      this.logger.log(`Zone-based status update: Ambulance ${assignment.ambulanceId} status changing from ${currentStatus} to ${newStatus}`);
      
      return {
        assignmentId: assignment.id,
        ticketId: assignment.ticketId,
        ambulanceId: assignment.ambulanceId,
        newStatus,
        previousStatus: currentStatus,
        zoneInfo: {
          currentZone,
          originZone,
          destinationZone,
          isInOriginZone,
          isInDestinationZone
        },
        timestamp: new Date(),
        triggeredBy: 'zone_entry'
      };
    }

    return null;
  }

  /**
   * Determine new assignment status based on zone location and current status
   */
  private determineNewStatus(
    currentStatus: AssignmentStatus,
    isInOriginZone: boolean,
    isInDestinationZone: boolean,
    assignment: any
  ): AssignmentStatus | null {
    const { ticket } = assignment;

    switch (currentStatus) {
      case 'ASSIGNED':
        // If ambulance enters origin hospital zone, update to AT_PICKUP
        if (isInOriginZone) {
          return 'AT_PICKUP';
        }
        // If ambulance is moving towards origin, update to EN_ROUTE
        if (!isInOriginZone && !isInDestinationZone) {
          return 'EN_ROUTE';
        }
        break;

      case 'EN_ROUTE':
        // If ambulance reaches origin hospital zone, update to AT_PICKUP
        if (isInOriginZone) {
          return 'AT_PICKUP';
        }
        // If ambulance reaches destination hospital zone, update to EMS_ARRIVAL
        if (isInDestinationZone) {
          return 'EMS_ARRIVAL';
        }
        break;

      case 'AT_PICKUP':
        // If ambulance leaves origin zone, update to EN_ROUTE (going to destination)
        if (!isInOriginZone) {
          return 'EN_ROUTE';
        }
        break;

      case 'EMS_ARRIVAL':
        // Arrived at destination - no automatic status change
        break;
    }

    return null;
  }

  /**
   * Apply status update to database and create timeline events
   */
  private async applyStatusUpdate(update: ZoneStatusUpdate): Promise<void> {
    try {
      // Update EMS assignment status
      await this.prisma.eMSAssignment.update({
        where: { id: update.assignmentId },
        data: {
          status: update.newStatus,
          ...(update.newStatus === 'AT_PICKUP' && { actualArrivalTime: new Date() }),
          ...(update.newStatus === 'EMS_ARRIVAL' && { journeyEndTime: new Date() })
        }
      });

      // Update ticket EMS status
      await this.prisma.ticket.update({
        where: { id: update.ticketId },
        data: {
          emsAssignmentStatus: update.newStatus,
          emsStatusUpdatedAt: new Date(),
          emsStatusUpdatedBy: 'system'
        }
      });

      // Create activity log
      await this.prisma.activity.create({
        data: {
          type: 'TICKET_UPDATED',
          description: `Zone-based status update: ${update.previousStatus} → ${update.newStatus}`,
          userId: 'system',
          ticketId: update.ticketId,
          metadata: JSON.stringify({
            assignmentId: update.assignmentId,
            ambulanceId: update.ambulanceId,
            zoneBasedUpdate: true,
            zoneInfo: update.zoneInfo,
            triggeredBy: update.triggeredBy,
            previousStatus: update.previousStatus,
            newStatus: update.newStatus
          })
        }
      });

      // Create timeline event
      await this.prisma.timelineEvent.create({
        data: {
          ticketId: update.ticketId,
          eventType: this.getEventTypeForStatus(update.newStatus),
          eventCategory: 'EMS',
          eventTimestamp: new Date(),
          eventDescription: this.getEventDescription(update),
          gpsCoordinates: JSON.stringify({
            latitude: update.zoneInfo.currentZone?.center.lat,
            longitude: update.zoneInfo.currentZone?.center.lng
          }),
          triggeredBy: 'system',
          createdById: 'system'
        }
      });

      this.logger.log(`Applied zone-based status update: ${update.assignmentId} → ${update.newStatus}`);

    } catch (error) {
      this.logger.error(`Failed to apply status update for assignment ${update.assignmentId}:`, error);
    }
  }

  /**
   * Check if a point is within a zone's bounding box
   */
  private isPointInZone(latitude: number, longitude: number, zone: ZoneData): boolean {
    const bbox = zone.bounding_box;
    return (
      latitude >= bbox.min_lat &&
      latitude <= bbox.max_lat &&
      longitude >= bbox.min_lng &&
      longitude <= bbox.max_lng
    );
  }

  /**
   * Get event type for timeline based on status
   */
  private getEventTypeForStatus(status: AssignmentStatus): string {
    switch (status) {
      case 'AT_PICKUP':
        return 'AMBULANCE_ARRIVED';
      case 'EN_ROUTE':
        return 'EMS_TRANSPORT_START';
      case 'EMS_ARRIVAL':
        return 'AMBULANCE_ARRIVED';
      default:
        return 'STATUS_CHANGE';
    }
  }

  /**
   * Get event description for timeline
   */
  private getEventDescription(update: ZoneStatusUpdate): string {
    const { zoneInfo, newStatus } = update;
    
    switch (newStatus) {
      case 'AT_PICKUP':
        return `Ambulance arrived at pickup location (Zone: ${zoneInfo.currentZone?.zone_name || 'Unknown'})`;
      case 'EN_ROUTE':
        return `Ambulance en route to ${zoneInfo.isInDestinationZone ? 'destination' : 'pickup location'}`;
      case 'EMS_ARRIVAL':
        return `Ambulance arrived at destination (Zone: ${zoneInfo.currentZone?.zone_name || 'Unknown'})`;
      default:
        return `Status updated to ${newStatus} based on zone location`;
    }
  }

  /**
   * Get zone-based status summary for an assignment
   */
  async getAssignmentZoneStatus(assignmentId: string): Promise<{
    assignment: any;
    currentZone?: ZoneData;
    originZone?: ZoneData;
    destinationZone?: ZoneData;
    isInOriginZone: boolean;
    isInDestinationZone: boolean;
    nextExpectedStatus?: AssignmentStatus;
  }> {
    const assignment = await this.prisma.eMSAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        ticket: {
          include: {
            originHospital: true,
            destinationHospital: true
          }
        },
        ambulance: true
      }
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Get current GPS location
    const gpsLocation = await this.getCurrentGpsLocation(assignment.ambulanceId);
    if (!gpsLocation) {
      throw new Error('No GPS location available for ambulance');
    }

    // Get zones
    const allZones = await this.zoneApiService.getAllZones();
    const { latitude, longitude } = gpsLocation.location;

    const currentZones = allZones.filter(zone => 
      this.isPointInZone(latitude, longitude, zone)
    );

    const originZones = assignment.ticket.originHospital?.latitude && assignment.ticket.originHospital?.longitude
      ? allZones.filter(zone => 
          this.isPointInZone(assignment.ticket.originHospital.latitude, assignment.ticket.originHospital.longitude, zone)
        )
      : [];

    const destinationZones = assignment.ticket.destinationHospital?.latitude && assignment.ticket.destinationHospital?.longitude
      ? allZones.filter(zone => 
          this.isPointInZone(assignment.ticket.destinationHospital.latitude, assignment.ticket.destinationHospital.longitude, zone)
        )
      : [];

    const originZone = originZones[0];
    const destinationZone = destinationZones[0];
    const currentZone = currentZones[0];

    const isInOriginZone = originZone && currentZones.some(zone => zone.zone_id === originZone.zone_id);
    const isInDestinationZone = destinationZone && currentZones.some(zone => zone.zone_id === destinationZone.zone_id);

    const nextExpectedStatus = this.determineNewStatus(
      assignment.status,
      isInOriginZone,
      isInDestinationZone,
      assignment
    );

    return {
      assignment,
      currentZone,
      originZone,
      destinationZone,
      isInOriginZone,
      isInDestinationZone,
      nextExpectedStatus
    };
  }

  /**
   * Get current GPS location for ambulance
   */
  private async getCurrentGpsLocation(ambulanceId: string): Promise<VehicleStatus | null> {
    return await this.gpsApiService.getVehicleLocation(ambulanceId);
  }
}
