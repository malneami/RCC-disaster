import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AssignmentStatus } from '@prisma/client';
import { AmbulancePosition } from './hospital-bounds.service';

export interface StatusDetermination {
  suggestedStatus: AssignmentStatus;
  confidence: number;
  reason: string;
  zoneInfo?: {
    inOriginZone: boolean;
    inDestinationZone: boolean;
    recentOriginEntry?: Date;
    recentDestinationEntry?: Date;
  };
  directionInfo?: {
    movingTowardOrigin: boolean;
    movingTowardDestination: boolean;
    confidence: number;
  };
  timestamp?: Date;
}

@Injectable()
export class EMSStatusUpdaterService {
  private readonly logger = new Logger(EMSStatusUpdaterService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Handle zone entry event - update EMS assignment status based on zone type
   */
  async handleZoneEntry(
    ambulanceId: string,
    hospitalId: string,
    zoneType: string
  ): Promise<void> {
    const assignment = await this.findActiveAssignment(ambulanceId);
    if (!assignment) return;

    this.logger.log(`Handling zone entry: ${ambulanceId} entered ${zoneType} at ${hospitalId}`);

    // Update status based on zone type
    if (zoneType === 'ORIGIN_ZONE' && assignment.status === 'EN_ROUTE') {
      await this.updateAssignmentStatus(assignment.id, 'AT_PICKUP', {
        actualArrivalTime: new Date()
      });
      this.logger.log(`Updated assignment ${assignment.id} to AT_PICKUP`);
    } else if (zoneType === 'DESTINATION_ZONE' && assignment.status === 'PATIENT_LOADED') {
      await this.updateAssignmentStatus(assignment.id, 'EMS_ARRIVAL', {
        journeyEndTime: new Date()
      });
      this.logger.log(`Updated assignment ${assignment.id} to EMS_ARRIVAL`);
    }
  }

  /**
   * Handle zone exit event - update EMS assignment status based on duration and zone type
   */
  async handleZoneExit(
    ambulanceId: string,
    hospitalId: string,
    zoneType: string,
    durationMinutes: number
  ): Promise<void> {
    const assignment = await this.findActiveAssignment(ambulanceId);
    if (!assignment) return;

    this.logger.log(`Handling zone exit: ${ambulanceId} exited ${zoneType} after ${durationMinutes} mins`);

    // Determine next status based on current status, zone type, and duration
    if (zoneType === 'ORIGIN_ZONE' && assignment.status === 'AT_PICKUP') {
      // If spent >3 minutes at origin, likely loaded patient
      if (durationMinutes >= 3) {
        await this.updateAssignmentStatus(assignment.id, 'PATIENT_LOADED');
        this.logger.log(`Updated assignment ${assignment.id} to PATIENT_LOADED (spent ${durationMinutes} mins at origin)`);
      }
    } else if (zoneType === 'DESTINATION_ZONE' && assignment.status === 'EMS_ARRIVAL') {
      // If spent >2 minutes at destination, likely delivered patient
      if (durationMinutes >= 2) {
        await this.updateAssignmentStatus(assignment.id, 'ARRIVED');
        this.logger.log(`Updated assignment ${assignment.id} to ARRIVED (spent ${durationMinutes} mins at destination)`);
      }
    }
  }

  /**
   * Find active assignment for ambulance
   */
  private async findActiveAssignment(ambulanceId: string) {
    return await this.prisma.eMSAssignment.findFirst({
      where: {
        ambulanceId,
        status: { in: ['ASSIGNED', 'EMS_CONTACT', 'EN_ROUTE', 'AT_PICKUP', 'PATIENT_LOADED', 'EMS_ARRIVAL'] }
      },
      include: {
        ticket: {
          select: {
            originHospitalId: true,
            destinationHospitalId: true
          }
        }
      }
    });
  }

  /**
   * Update assignment status
   */
  private async updateAssignmentStatus(
    assignmentId: string, 
    status: AssignmentStatus, 
    additionalData: any = {}
  ): Promise<void> {
    await this.prisma.eMSAssignment.update({
      where: { id: assignmentId },
      data: { 
        status,
        ...additionalData
      }
    });
  }


  /**
   * Update EMS assignment status based on ambulance location and movement
   */
  async updateStatusForAssignment(
    assignmentId: string,
    ambulanceId: string
  ): Promise<void> {
    try {
      const assignment = await this.prisma.eMSAssignment.findUnique({
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

      if (!assignment || !assignment.ticket) {
        this.logger.warn(`Assignment ${assignmentId} not found or has no ticket`);
        return;
      }

      // Don't update if assignment is already completed or cancelled
      if (['ARRIVED', 'CANCELLED'].includes(assignment.status)) {
        return;
      }

      const determination = await this.determineStatus(assignmentId, ambulanceId);

      // Only update if we have high confidence and status is different
      if (determination.confidence >= 0.7 && determination.suggestedStatus !== assignment.status) {
        await this.prisma.eMSAssignment.update({
          where: { id: assignmentId },
          data: {
            status: determination.suggestedStatus,
            // Update timing fields based on status
            ...(determination.suggestedStatus === 'AT_PICKUP' && !assignment.actualArrivalTime
              ? { actualArrivalTime: new Date() }
              : {}),
            ...(determination.suggestedStatus === 'DEPARTED' && !assignment.journeyStartTime
              ? { journeyStartTime: determination.timestamp || new Date() }
              : {}),
            ...(determination.suggestedStatus === 'EMS_ARRIVAL' && !assignment.journeyEndTime
              ? { journeyEndTime: new Date() }
              : {})
          }
        });

        this.logger.log(
          `Updated assignment ${assignmentId} status to ${determination.suggestedStatus} (confidence: ${determination.confidence.toFixed(2)}, reason: ${determination.reason})`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to update status for assignment ${assignmentId}: ${(error as Error).message}`,
        error
      );
    }
  }

  /**
   * Get all active assignments for an ambulance
   */
  async getActiveAssignmentsForAmbulance(ambulanceId: string) {
    return this.prisma.eMSAssignment.findMany({
      where: {
        ambulanceId,
        status: {
          notIn: ['ARRIVED', 'CANCELLED']
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
      },
      orderBy: {
        assignedAt: 'desc'
      }
    });
  }

  /**
   * Determine the appropriate status for an assignment based on location and movement
   */
  async determineStatus(
    assignmentId: string,
    ambulanceId: string
  ): Promise<StatusDetermination> {
    const assignment = await this.prisma.eMSAssignment.findUnique({
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

    if (!assignment || !assignment.ticket) {
      return {
        suggestedStatus: 'EMS_CONTACT',
        confidence: 0,
        reason: 'Assignment or ticket not found'
      };
    }

    const { originHospital, destinationHospital } = assignment.ticket;

    if (!originHospital || !destinationHospital) {
      return {
        suggestedStatus: 'EMS_CONTACT',
        confidence: 0,
        reason: 'Origin or destination hospital not specified'
      };
    }

    // Get current position
    const currentPosition = await this.getCurrentPosition(ambulanceId);
    if (!currentPosition) {
      return {
        suggestedStatus: assignment.status,
        confidence: 0,
        reason: 'No GPS data available'
      };
    }

    // Get zone entry logs
    const zoneEntries = await this.getRecentZoneEntries(
      ambulanceId,
      [originHospital.id, destinationHospital.id],
      assignment.assignedAt
    );

    // Get GPS history for directional analysis
    const gpsHistory = await this.getGPSHistory(ambulanceId, 20); // Last 20 minutes

    return this.determineStatusFromZoneAndDirection(
      assignment,
      currentPosition,
      zoneEntries,
      gpsHistory,
      originHospital,
      destinationHospital
    );
  }

  /**
   * Core logic to determine status from zone entries and directional analysis
   */
  private determineStatusFromZoneAndDirection(
    assignment: any,
    currentPosition: AmbulancePosition,
    zoneEntries: any[],
    gpsHistory: any[],
    originHospital: any,
    destinationHospital: any
  ): StatusDetermination {
    // Check for active zone entries
    const activeOriginEntry = zoneEntries.find(
      ze => ze.hospitalId === originHospital.id && !ze.exitTime
    );
    const activeDestinationEntry = zoneEntries.find(
      ze => ze.hospitalId === destinationHospital.id && !ze.exitTime
    );

    // Check for recent zone entries (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentOriginEntry = zoneEntries.find(
      ze => ze.hospitalId === originHospital.id && new Date(ze.entryTime) > fiveMinutesAgo
    );
    const recentDestinationEntry = zoneEntries.find(
      ze => ze.hospitalId === destinationHospital.id && new Date(ze.entryTime) > fiveMinutesAgo
    );

    const zoneInfo = {
      inOriginZone: !!activeOriginEntry,
      inDestinationZone: !!activeDestinationEntry,
      recentOriginEntry: recentOriginEntry?.entryTime,
      recentDestinationEntry: recentDestinationEntry?.entryTime
    };

    // Priority 1: Currently in destination zone
    if (activeDestinationEntry) {
      return {
        suggestedStatus: 'EMS_ARRIVAL',
        confidence: 1.0,
        reason: 'Ambulance is currently in destination hospital zone',
        zoneInfo
      };
    }

    // Priority 2: Currently in origin zone
    if (activeOriginEntry) {
      // If we've already picked up the patient (status is PATIENT_LOADED or later), don't go back
      if (['PATIENT_LOADED', 'DEPARTED', 'EN_ROUTE'].includes(assignment.status)) {
        return {
          suggestedStatus: assignment.status,
          confidence: 0.5,
          reason: 'In origin zone but patient already loaded',
          zoneInfo
        };
      }
      return {
        suggestedStatus: 'AT_PICKUP',
        confidence: 1.0,
        reason: 'Ambulance is currently in origin hospital zone',
        zoneInfo
      };
    }

    // Priority 3: Recently exited origin zone (patient loaded)
    const recentOriginExit = zoneEntries.find(
      ze => ze.hospitalId === originHospital.id && 
           ze.exitTime && 
           new Date(ze.exitTime) > fiveMinutesAgo
    );

    if (recentOriginExit && ['AT_PICKUP', 'PATIENT_LOADED'].includes(assignment.status)) {
      return {
        suggestedStatus: 'DEPARTED',
        confidence: 0.95,
        reason: 'Recently exited origin hospital zone',
        zoneInfo,
        timestamp: recentOriginExit.exitTime
      };
    }

    // Priority 4: Directional analysis (when outside zones)
    if (gpsHistory.length >= 3 && originHospital.latitude && destinationHospital.latitude) {
      const directionAnalysis = this.analyzeDirection(
        gpsHistory,
        { latitude: originHospital.latitude, longitude: originHospital.longitude },
        { latitude: destinationHospital.latitude, longitude: destinationHospital.longitude }
      );

      const directionInfo = {
        movingTowardOrigin: directionAnalysis.towardOrigin,
        movingTowardDestination: directionAnalysis.towardDestination,
        confidence: directionAnalysis.confidence
      };

      // If moving toward destination with high confidence
      if (directionAnalysis.towardDestination && directionAnalysis.confidence >= 0.8) {
        // If we haven't picked up patient yet, this doesn't make sense
        if (['ASSIGNED', 'EMS_CONTACT'].includes(assignment.status)) {
          return {
            suggestedStatus: 'EMS_CONTACT',
            confidence: 0.6,
            reason: 'Moving toward destination but patient not picked up yet',
            zoneInfo,
            directionInfo
          };
        }
        return {
          suggestedStatus: 'EN_ROUTE',
          confidence: directionAnalysis.confidence,
          reason: 'Moving toward destination hospital',
          zoneInfo,
          directionInfo
        };
      }

      // If moving toward origin with high confidence
      if (directionAnalysis.towardOrigin && directionAnalysis.confidence >= 0.8) {
        return {
          suggestedStatus: 'EMS_CONTACT',
          confidence: directionAnalysis.confidence,
          reason: 'Moving toward origin hospital',
          zoneInfo,
          directionInfo
        };
      }
    }

    // Default: Keep current status
    return {
      suggestedStatus: assignment.status,
      confidence: 0.3,
      reason: 'Insufficient data for status determination',
      zoneInfo
    };
  }

  /**
   * Analyze ambulance direction based on GPS history
   */
  private analyzeDirection(
    gpsHistory: any[],
    originPos: AmbulancePosition,
    destinationPos: AmbulancePosition
  ): { towardOrigin: boolean; towardDestination: boolean; confidence: number } {
    if (gpsHistory.length < 2) {
      return { towardOrigin: false, towardDestination: false, confidence: 0 };
    }

    // Sort by timestamp (newest first)
    const sorted = [...gpsHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const current = sorted[0];
    const previous = sorted[1];

    // Calculate distances
    const currentToOrigin = this.calculateDistance(
      current.latitude,
      current.longitude,
      originPos.latitude,
      originPos.longitude
    );
    const previousToOrigin = this.calculateDistance(
      previous.latitude,
      previous.longitude,
      originPos.latitude,
      originPos.longitude
    );

    const currentToDestination = this.calculateDistance(
      current.latitude,
      current.longitude,
      destinationPos.latitude,
      destinationPos.longitude
    );
    const previousToDestination = this.calculateDistance(
      previous.latitude,
      previous.longitude,
      destinationPos.latitude,
      destinationPos.longitude
    );

    // Determine if moving toward origin or destination
    const movingTowardOrigin = currentToOrigin < previousToOrigin;
    const movingTowardDestination = currentToDestination < previousToDestination;

    // Calculate confidence based on distance change and number of points
    const originDistanceChange = Math.abs(previousToOrigin - currentToOrigin);
    const destinationDistanceChange = Math.abs(previousToDestination - currentToDestination);

    // Higher confidence if we have more points showing consistent direction
    let confidence = 0.5;
    if (gpsHistory.length >= 3) {
      const third = sorted[2];
      const thirdToOrigin = this.calculateDistance(
        third.latitude,
        third.longitude,
        originPos.latitude,
        originPos.longitude
      );
      const thirdToDestination = this.calculateDistance(
        third.latitude,
        third.longitude,
        destinationPos.latitude,
        destinationPos.longitude
      );

      // Check consistency
      const consistentTowardOrigin = currentToOrigin < previousToOrigin && previousToOrigin < thirdToOrigin;
      const consistentTowardDestination = currentToDestination < previousToDestination && previousToDestination < thirdToDestination;

      if (consistentTowardOrigin || consistentTowardDestination) {
        confidence = 0.9;
      } else {
        confidence = 0.7;
      }
    }

    // Reduce confidence if distance change is very small (might be stationary)
    const minDistanceChange = 0.05; // 50 meters
    if (originDistanceChange < minDistanceChange && destinationDistanceChange < minDistanceChange) {
      confidence *= 0.5;
    }

    return {
      towardOrigin: movingTowardOrigin,
      towardDestination: movingTowardDestination,
      confidence
    };
  }

  /**
   * Get current GPS position for ambulance
   */
  private async getCurrentPosition(ambulanceId: string): Promise<AmbulancePosition | null> {
    const latestLog = await this.prisma.gPSTrackingLog.findFirst({
      where: { ambulanceId },
      orderBy: { timestamp: 'desc' }
    });

    if (!latestLog) return null;

    return {
      latitude: latestLog.latitude,
      longitude: latestLog.longitude
    };
  }

  /**
   * Get recent zone entries for an ambulance
   */
  private async getRecentZoneEntries(
    ambulanceId: string,
    hospitalIds: string[],
    since: Date
  ) {
    return this.prisma.ambulanceZoneLog.findMany({
      where: {
        ambulanceId,
        hospitalId: { in: hospitalIds },
        entryTime: { gte: since }
      },
      orderBy: { entryTime: 'desc' }
    });
  }

  /**
   * Get GPS history for the last N minutes
   */
  private async getGPSHistory(ambulanceId: string, minutes: number) {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return this.prisma.gPSTrackingLog.findMany({
      where: {
        ambulanceId,
        timestamp: { gte: since }
      },
      orderBy: { timestamp: 'desc' },
      take: 20 // Limit to 20 most recent points
    });
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const EARTH_RADIUS_KM = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
