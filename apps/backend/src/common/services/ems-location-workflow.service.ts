import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { HospitalBoundsService } from './hospital-bounds.service';
import axios from 'axios';

// Interface removed - now using real-time GPS data from external API

export interface EmsStatusTransition {
  assignmentId: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
  hospitalName?: string;
  distance?: number;
}

@Injectable()
export class EmsLocationWorkflowService {
  private readonly logger = new Logger(EmsLocationWorkflowService.name);

  constructor(
    private prisma: PrismaService,
    private hospitalBoundsService: HospitalBoundsService
  ) {}

  /**
   * Fetch real-time GPS location for an ambulance from external API
   */
  private async fetchAmbulanceLocation(imei: string): Promise<any> {
    try {
      this.logger.log(`Fetching GPS location for IMEI: ${imei}`);
      
      const response = await axios.post('http://gps3.tawasolmap.com/new_api/', {
        api_key: "7798AA377F99763506758557AC7741A1",
        service: "objects",
        imeis: imei
      }, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status && response.data.data && response.data.data.length > 0) {
        const gpsData = response.data.data[0];
        this.logger.log(`GPS data retrieved for IMEI ${imei}: ${gpsData.lat}, ${gpsData.lng}`);
        return gpsData;
      } else {
        this.logger.warn(`No GPS data found for IMEI: ${imei}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Failed to fetch GPS location for IMEI ${imei}: ${(error as Error).message}`);
      throw new Error(`GPS API request failed: ${(error as Error).message}`);
    }
  }

  /**
   * Process ambulance location update and update EMS assignment status accordingly
   */
  async processLocationUpdate(assignmentId: string): Promise<EmsStatusTransition | null> {
    try {
      this.logger.log(`Processing location update for assignment ${assignmentId}`);

      // 1. Fetch the EMS assignment
      const assignment = await this.prisma.eMSAssignment.findFirst({
        where: {
          id: assignmentId,
          deletedAt: null
        },
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
        throw new Error(`EMS assignment ${assignmentId} not found`);
      }

      if (!assignment.ambulance?.vehicleImei) {
        throw new Error(`No ambulance IMEI found for assignment ${assignmentId}`);
      }

      if (!assignment.ticket.originHospital?.latitude || !assignment.ticket.originHospital?.longitude) {
        throw new Error(`Origin hospital coordinates not available for assignment ${assignmentId}`);
      }

      // Destination might be null for some workflows, but usually required for DEPARTED->ARRIVED
      // We'll check it when needed.

      const currentStatus = assignment.status;

      // 2. Fetch real-time GPS coordinates from external API
      const gpsData = await this.fetchAmbulanceLocation(assignment.ambulance.vehicleImei);
      
      if (!gpsData) {
        throw new Error(`Failed to fetch GPS data for ambulance IMEI: ${assignment.ambulance.vehicleImei}`);
      }

      const ambulancePosition = {
        latitude: parseFloat(gpsData.lat),
        longitude: parseFloat(gpsData.lng)
      };

      this.logger.log(`Current assignment status: ${currentStatus}`);
      this.logger.log(`Ambulance GPS coordinates: ${ambulancePosition.latitude}, ${ambulancePosition.longitude}`);

      // 2. Check proximity to origin and destination hospitals
      const originDistance = this.hospitalBoundsService.calculateDistance(
        ambulancePosition.latitude,
        ambulancePosition.longitude,
        assignment.ticket.originHospital.latitude!,
        assignment.ticket.originHospital.longitude!
      );

      let destinationDistance = 0;
      let isInDestinationZone = false;

      if (assignment.ticket.destinationHospital?.latitude && assignment.ticket.destinationHospital?.longitude) {
        destinationDistance = this.hospitalBoundsService.calculateDistance(
          ambulancePosition.latitude,
          ambulancePosition.longitude,
          assignment.ticket.destinationHospital.latitude,
          assignment.ticket.destinationHospital.longitude
        );
        isInDestinationZone = destinationDistance <= 2; // 2km radius
      }

      const isInOriginZone = originDistance <= 2; // 2km radius

      this.logger.log(`Ambulance distances - Origin: ${originDistance.toFixed(3)}km, Destination: ${destinationDistance.toFixed(3)}km`);
      this.logger.log(`In origin zone: ${isInOriginZone}, In destination zone: ${isInDestinationZone}`);

      // 3. Enforce minimum interval between status transitions (60 seconds)
      const candidateTransitionTimes: (Date | null | undefined)[] = [
        assignment.emsContactTime as any,
        assignment.actualArrivalTime as any,
        assignment.journeyStartTime as any,
        assignment.journeyEndTime as any,
      ];
      const lastTransitionAt = candidateTransitionTimes
        .filter(Boolean)
        .map((d) => new Date(d as Date))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      const nowForInterval = new Date();
      if (lastTransitionAt && nowForInterval.getTime() - lastTransitionAt.getTime() < 60_000) {
        this.logger.log(
          `Skipping transition due to min-interval guard. Last at: ${lastTransitionAt.toISOString()} (delta ${(nowForInterval.getTime() - lastTransitionAt.getTime()) / 1000}s)`
        );
        return null;
      }

      // 4. Determine new status based on current status and location
      let newStatus: string | null = null;
      let reason = '';
      let hospitalName = '';

      // Priority check: If at destination, mark as ARRIVED regardless of previous flow
      if (isInDestinationZone && currentStatus !== 'ARRIVED' && assignment.ticket.destinationHospital) {
        newStatus = 'ARRIVED';
        reason = 'Ambulance is at destination hospital zone';
        hospitalName = assignment.ticket.destinationHospital.name;
      } else {
        // Standard flow logic
        switch (currentStatus) {
          case 'EMS_CONTACT':
            if (isInOriginZone) {
              newStatus = 'EMS_ARRIVAL';
              reason = 'Ambulance entered origin hospital zone';
              hospitalName = assignment.ticket.originHospital.name;
            }
            break;

          case 'EMS_ARRIVAL':
            if (!isInOriginZone) {
              newStatus = 'DEPARTED';
              reason = 'Ambulance left origin hospital zone';
              hospitalName = assignment.ticket.originHospital.name;
            }
            break;

          case 'DEPARTED':
            if (isInDestinationZone && assignment.ticket.destinationHospital) {
              newStatus = 'ARRIVED';
              reason = 'Ambulance arrived at destination hospital zone';
              hospitalName = assignment.ticket.destinationHospital.name;
            } else if (isInOriginZone) {
              // Allow reverting to EMS_ARRIVAL if ambulance returns to origin
              newStatus = 'EMS_ARRIVAL';
              reason = 'Ambulance returned to origin hospital zone';
              hospitalName = assignment.ticket.originHospital.name;
            }
            break;

          default:
            this.logger.log(`No status transition needed for status: ${currentStatus}`);
            break;
        }
      }

      // 4b. Historical Check: If still DEPARTED (or no change detected), check if we missed the arrival
      // Use emsContactTime as the primary baseline because ticket.createdAt might be retroactive (e.g. created at 9:34 PM for a 2:08 PM case).
      // If emsContactTime is missing, fall back to ticket.createdAt.
      const referenceTime = assignment.emsContactTime || assignment.ticket.createdAt;
      
      if (!newStatus && 
          currentStatus === 'DEPARTED' && 
          referenceTime && 
          assignment.ticket.destinationHospital) {
        
        this.logger.log(`Checking historical logs for assignment ${assignmentId} at hospital ${assignment.ticket.destinationHospital.id} after ${new Date(referenceTime).toISOString()}`);

        const missedArrivalLog = await this.prisma.ambulanceZoneLog.findFirst({
          where: {
            ambulanceId: assignment.ambulanceId,
            hospitalId: assignment.ticket.destinationHospital!.id,
            entryTime: {
              gt: referenceTime
            }
          },
          orderBy: {
            entryTime: 'asc' // Get the first entry after assignment
          }
        });

        if (missedArrivalLog) {
          this.logger.log(`Found missed arrival log: ${missedArrivalLog.id} at ${missedArrivalLog.entryTime.toISOString()}`);
          newStatus = 'ARRIVED';
          reason = 'Detected past arrival from zone logs';
          hospitalName = assignment.ticket.destinationHospital.name;
          
          // Use the log time for the journey end
          // We'll handle this in the update block logic by checking if we have a missedArrivalLog
        } else {
          this.logger.log(`No missed arrival log found after ${new Date(referenceTime).toISOString()}`);
        }
      }

      // 5. Update assignment status if needed
      if (newStatus && newStatus !== currentStatus) {
        const now = new Date();
        
        // Prepare update data with appropriate timestamp
        const updateData: any = {
          status: newStatus as any,
          updatedAt: now
        };

        // Add the appropriate timestamp based on the new status
        switch (newStatus) {
          case 'EMS_CONTACT':
            updateData.emsContactTime = now;
            break;
          case 'EMS_ARRIVAL':
            updateData.actualArrivalTime = now;
            break;
          case 'DEPARTED':
            updateData.journeyStartTime = now;
            break;
          case 'ARRIVED':
            updateData.journeyEndTime = now; 
            break;
        }

        await this.prisma.eMSAssignment.update({
          where: { id: assignmentId },
          data: updateData
        });

        // Update Ticket's EMS status
        await this.prisma.ticket.update({
          where: { id: assignment.ticketId },
          data: { 
            emsAssignmentStatus: newStatus as any,
            emsStatusUpdatedAt: now,
            emsStatusUpdatedBy: 'system'
          }
        });

        this.logger.log(`✅ Updated assignment ${assignmentId}: ${currentStatus} → ${newStatus} at ${now.toISOString()}`);

        // TODO: Create timeline event when user ID is available
        // await this.createTimelineEvent(assignment.ticketId, newStatus, reason, hospitalName);

        return {
          assignmentId: assignmentId,
          previousStatus: currentStatus,
          newStatus,
          reason,
          hospitalName,
          distance: newStatus === 'EMS_ARRIVAL' ? originDistance : destinationDistance
        };
      } else {
        this.logger.log(`No status change needed for assignment ${assignmentId}`);
        return null;
      }

    } catch (error) {
      this.logger.error(`Failed to process location update for assignment ${assignmentId}: ${(error as Error).message}`, error);
      throw error;
    }
  }

  /**
   * Get current status of an EMS assignment with location info
   */
  async getAssignmentStatus(assignmentId: string): Promise<{
    assignment: any;
    originDistance?: number;
    destinationDistance?: number;
    isInOriginZone?: boolean;
    isInDestinationZone?: boolean;
  } | null> {
    try {
      const assignment = await this.prisma.eMSAssignment.findFirst({
        where: {
          id: assignmentId,
          deletedAt: null
        },
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
        return null;
      }

      // For now, return mock location data
      // In a real implementation, you'd get the actual ambulance location
      const mockAmbulanceLocation = {
        latitude: 16.8892, // Mock coordinates near Jazan General Hospital
        longitude: 42.5511
      };

      const originDistance = this.hospitalBoundsService.calculateDistance(
        mockAmbulanceLocation.latitude,
        mockAmbulanceLocation.longitude,
        assignment.ticket.originHospital.latitude!,
        assignment.ticket.originHospital.longitude!
      );

      const destinationDistance = assignment.ticket.destinationHospital ? 
        this.hospitalBoundsService.calculateDistance(
          mockAmbulanceLocation.latitude,
          mockAmbulanceLocation.longitude,
          assignment.ticket.destinationHospital.latitude!,
          assignment.ticket.destinationHospital.longitude!
        ) : 0;

      return {
        assignment,
        originDistance,
        destinationDistance,
        isInOriginZone: originDistance <= 1,
        isInDestinationZone: destinationDistance <= 1
      };

    } catch (error) {
      this.logger.error(`Failed to get assignment status: ${(error as Error).message}`, error);
      throw error;
    }
  }

  /**
   * Create timeline event for status change
   */
  private async createTimelineEvent(
    ticketId: string,
    status: string,
    reason: string,
    hospitalName: string
  ): Promise<void> {
    try {
      await this.prisma.timelineEvent.create({
        data: {
          ticketId,
          eventType: 'STATUS_CHANGE',
          eventCategory: 'EMS',
          eventDescription: `Status updated to ${status}: ${reason} at ${hospitalName}`,
          eventTimestamp: new Date(),
          triggeredBy: 'SYSTEM',
          createdById: 'SYSTEM' // This will need to be a valid user ID
        }
      });

      this.logger.log(`Created timeline event for ticket ${ticketId}: ${status}`);
    } catch (error) {
      this.logger.error(`Failed to create timeline event: ${(error as Error).message}`, error);
    }
  }

  /**
   * Simulate ambulance movement for testing
   */
  async simulateAmbulanceMovement(assignmentId: string): Promise<EmsStatusTransition[]> {
    const transitions: EmsStatusTransition[] = [];

    try {
      // Get assignment details
      const assignment = await this.prisma.eMSAssignment.findFirst({
        where: { id: assignmentId },
        include: {
          ticket: {
            include: {
              originHospital: true,
              destinationHospital: true
            }
          }
        }
      });

      if (!assignment) {
        throw new Error(`Assignment ${assignmentId} not found`);
      }

      // Simulate movement: Outside → Origin → Outside → Destination
      const simulationPoints = [
        {
          name: 'Outside origin',
          lat: assignment.ticket.originHospital.latitude! + 0.1,
          lng: assignment.ticket.originHospital.longitude! + 0.1,
          expectedStatus: 'EMS_CONTACT'
        },
        {
          name: 'At origin hospital',
          lat: assignment.ticket.originHospital.latitude! + 0.005,
          lng: assignment.ticket.originHospital.longitude! + 0.005,
          expectedStatus: 'EMS_ARRIVAL'
        },
        {
          name: 'Left origin',
          lat: assignment.ticket.originHospital.latitude! + 0.1,
          lng: assignment.ticket.originHospital.longitude! + 0.1,
          expectedStatus: 'DEPARTED'
        },
        {
          name: 'At destination hospital',
          lat: assignment.ticket.destinationHospital?.latitude! + 0.005 || 0,
          lng: assignment.ticket.destinationHospital?.longitude! + 0.005 || 0,
          expectedStatus: 'ARRIVED'
        }
      ];

      for (const point of simulationPoints) {
        const transition = await this.processLocationUpdate(assignmentId);

        if (transition) {
          transitions.push(transition);
        }

        // Small delay between updates
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return transitions;

    } catch (error) {
      this.logger.error(`Failed to simulate ambulance movement: ${(error as Error).message}`, error);
      throw error;
    }
  }
}
