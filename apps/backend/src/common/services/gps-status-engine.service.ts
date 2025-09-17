import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GpsApiService } from './gps-api.service';
import { GpsValidationService } from './gps-validation.service';
import { EmsGateway } from '../../modules/ems-gateway/ems.gateway';
import { 
  VehicleStatus, 
  GpsStatusAnalysis, 
  StatusTransitionRule,
  GpsMovementAnalysis 
} from '../interfaces/gps.interfaces';
import { GPS_CONSTANTS, GPS_STATUS_TYPES } from '../constants/gps.constants';

// Re-export interfaces for backward compatibility
export { GpsStatusAnalysis };

@Injectable()
export class GpsStatusEngineService {
  private readonly logger = new Logger(GpsStatusEngineService.name);
  
  // Use constants from centralized configuration
  private readonly GPS_CONFIG = GPS_CONSTANTS;

  // Status Transition Rules
  private readonly STATUS_RULES: StatusTransitionRule[] = [
    // ASSIGNED → EN_ROUTE (ambulance starts moving)
    {
      fromStatus: GPS_STATUS_TYPES.ASSIGNMENT_STATUS.ASSIGNED,
      toStatus: GPS_STATUS_TYPES.ASSIGNMENT_STATUS.EN_ROUTE,
      conditions: {
        speedRange: [this.GPS_CONFIG.SPEED.MOVING_THRESHOLD, this.GPS_CONFIG.SPEED.MAX_REASONABLE_SPEED],
        locationType: 'any',
      },
      priority: 1,
    },
    
    // EN_ROUTE → AT_PICKUP (ambulance arrives at pickup location)
    {
      fromStatus: GPS_STATUS_TYPES.ASSIGNMENT_STATUS.EN_ROUTE,
      toStatus: GPS_STATUS_TYPES.ASSIGNMENT_STATUS.AT_PICKUP,
      conditions: {
        speedRange: [0, this.GPS_CONFIG.SPEED.STATIONARY_THRESHOLD],
        distanceThreshold: this.GPS_CONFIG.DISTANCE.PICKUP_ARRIVAL_THRESHOLD,
        locationType: 'pickup',
        minStationaryTime: this.GPS_CONFIG.TIME.MIN_STATIONARY_TIME,
      },
      priority: 2,
    },
    
    // AT_PICKUP → PATIENT_LOADED (manual confirmation + GPS stationary)
    {
      fromStatus: GPS_STATUS_TYPES.ASSIGNMENT_STATUS.AT_PICKUP,
      toStatus: GPS_STATUS_TYPES.ASSIGNMENT_STATUS.PATIENT_LOADED,
      conditions: {
        speedRange: [0, this.GPS_CONFIG.SPEED.STATIONARY_THRESHOLD],
        locationType: 'pickup',
        minStationaryTime: this.GPS_CONFIG.TIME.MIN_STATIONARY_TIME,
      },
      priority: 3,
    },
    
    // PATIENT_LOADED → EN_ROUTE (ambulance starts moving with patient)
    {
      fromStatus: GPS_STATUS_TYPES.ASSIGNMENT_STATUS.PATIENT_LOADED,
      toStatus: GPS_STATUS_TYPES.ASSIGNMENT_STATUS.EN_ROUTE,
      conditions: {
        speedRange: [this.GPS_CONFIG.SPEED.MOVING_THRESHOLD, this.GPS_CONFIG.SPEED.MAX_REASONABLE_SPEED],
        locationType: 'any',
      },
      priority: 4,
    },
    
    // EN_ROUTE → ARRIVED (ambulance arrives at destination)
    {
      fromStatus: GPS_STATUS_TYPES.ASSIGNMENT_STATUS.EN_ROUTE,
      toStatus: GPS_STATUS_TYPES.ASSIGNMENT_STATUS.ARRIVED,
      conditions: {
        speedRange: [0, this.GPS_CONFIG.SPEED.STATIONARY_THRESHOLD],
        distanceThreshold: this.GPS_CONFIG.DISTANCE.DESTINATION_ARRIVAL_THRESHOLD,
        locationType: 'destination',
        minStationaryTime: this.GPS_CONFIG.TIME.MIN_STATIONARY_TIME,
      },
      priority: 5,
    },
  ];

  constructor(
    private prisma: PrismaService,
    private gpsApiService: GpsApiService,
    private gpsValidationService: GpsValidationService,
    private emsGateway: EmsGateway,
  ) {}

  /**
   * Analyze GPS data and determine if status should be updated
   */
  async analyzeGpsStatus(ambulanceId: string, gpsData: VehicleStatus): Promise<GpsStatusAnalysis> {
    try {
      // Get current assignment
      const assignment = await this.getCurrentAssignment(ambulanceId);
      if (!assignment) {
        return this.createNoAssignmentAnalysis(gpsData);
      }

      // Validate GPS data
      const validation = await this.gpsValidationService.validateVehicleStatus(gpsData);
      if (!validation.isValid) {
        return this.createInvalidGpsAnalysis(gpsData, validation.error!);
      }

      // Calculate distances
      const distances = await this.calculateDistances(assignment, gpsData);
      
      // Analyze movement patterns
      const movementAnalysis = this.analyzeMovement(gpsData);
      
      // Determine status transition
      const statusTransition = await this.determineStatusTransition(
        assignment.status,
        gpsData,
        distances,
        movementAnalysis
      );

      return {
        currentStatus: assignment.status,
        recommendedStatus: statusTransition.toStatus,
        confidence: statusTransition.confidence,
        reason: statusTransition.reason,
        gpsData: {
          speed: gpsData.location.speed || 0,
          distanceToPickup: distances.pickup,
          distanceToDestination: distances.destination,
          isMoving: movementAnalysis.isMoving,
          isStationary: movementAnalysis.isStationary,
        },
        shouldUpdateStatus: statusTransition.shouldUpdate,
      };

    } catch (error) {
      this.logger.error(`Error analyzing GPS status for ambulance ${ambulanceId}:`, error);
      return this.createErrorAnalysis(gpsData, (error as Error).message);
    }
  }

  /**
   * Process GPS data and update status if needed
   */
  async processGpsUpdate(ambulanceId: string, gpsData: VehicleStatus): Promise<void> {
    try {
      const analysis = await this.analyzeGpsStatus(ambulanceId, gpsData);
      
      if (analysis.shouldUpdateStatus && analysis.confidence >= this.GPS_CONFIG.CONFIDENCE.MIN_STATUS_UPDATE) {
        await this.updateAssignmentStatus(ambulanceId, analysis);
      }

      // Always broadcast GPS update for real-time tracking
      await this.broadcastGpsUpdate(ambulanceId, gpsData, analysis);

    } catch (error) {
      this.logger.error(`Error processing GPS update for ambulance ${ambulanceId}:`, error);
    }
  }

  /**
   * Get current active assignment for ambulance
   */
  private async getCurrentAssignment(ambulanceId: string) {
    return this.prisma.eMSAssignment.findFirst({
      where: {
        ambulanceId,
        status: { in: [
          GPS_STATUS_TYPES.ASSIGNMENT_STATUS.ASSIGNED,
          GPS_STATUS_TYPES.ASSIGNMENT_STATUS.EN_ROUTE,
          GPS_STATUS_TYPES.ASSIGNMENT_STATUS.AT_PICKUP,
          GPS_STATUS_TYPES.ASSIGNMENT_STATUS.PATIENT_LOADED,
          GPS_STATUS_TYPES.ASSIGNMENT_STATUS.ARRIVED
        ] as any[] },
        deletedAt: null,
      },
      include: {
        ticket: {
          include: {
            originHospital: true,
            destinationHospital: true,
          },
        },
      },
    });
  }

  /**
   * Calculate distances to pickup and destination locations
   */
  private async calculateDistances(assignment: any, gpsData: VehicleStatus) {
    const distances = {
      pickup: null as number | null,
      destination: null as number | null,
    };

    try {
      // Calculate distance to pickup location (origin hospital)
      if (assignment.ticket.originHospital?.latitude && assignment.ticket.originHospital?.longitude) {
        distances.pickup = await this.gpsApiService.calculateDistance(
          gpsData.location.latitude,
          gpsData.location.longitude,
          assignment.ticket.originHospital.latitude,
          assignment.ticket.originHospital.longitude
        ) * 1000; // Convert to meters
      }

      // Calculate distance to destination location
      if (assignment.ticket.destinationHospital?.latitude && assignment.ticket.destinationHospital?.longitude) {
        distances.destination = await this.gpsApiService.calculateDistance(
          gpsData.location.latitude,
          gpsData.location.longitude,
          assignment.ticket.destinationHospital.latitude,
          assignment.ticket.destinationHospital.longitude
        ) * 1000; // Convert to meters
      }

    } catch (error) {
      this.logger.error('Error calculating distances:', error);
    }

    return distances;
  }

  /**
   * Analyze movement patterns from GPS data
   */
  private analyzeMovement(gpsData: VehicleStatus): GpsMovementAnalysis {
    const speed = gpsData.location.speed || 0; // Default to 0 if undefined
    
    return {
      isMoving: speed > this.GPS_CONFIG.SPEED.MOVING_THRESHOLD,
      isStationary: speed < this.GPS_CONFIG.SPEED.STATIONARY_THRESHOLD,
      speed: speed,
      direction: gpsData.location.direction || 0,
      movementType: speed > this.GPS_CONFIG.SPEED.MOVING_THRESHOLD ? 'MOVING' : 
                   speed < this.GPS_CONFIG.SPEED.STATIONARY_THRESHOLD ? 'STATIONARY' : 
                   'SLOW_MOVING',
    };
  }

  /**
   * Determine status transition based on rules
   */
  private async determineStatusTransition(
    currentStatus: string,
    gpsData: VehicleStatus,
    distances: { pickup: number | null; destination: number | null },
    movementAnalysis: any
  ) {
    // Sort rules by priority (highest first)
    const sortedRules = [...this.STATUS_RULES].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (rule.fromStatus !== currentStatus) continue;

      const matches = this.evaluateRuleConditions(rule, gpsData, distances, movementAnalysis);
      
      if (matches) {
        return {
          toStatus: rule.toStatus,
          confidence: this.calculateConfidence(rule, gpsData, distances, movementAnalysis),
          reason: this.generateReason(rule, gpsData, distances, movementAnalysis),
          shouldUpdate: true,
        };
      }
    }

    return {
      toStatus: currentStatus,
      confidence: 0,
      reason: 'No matching status transition rules',
      shouldUpdate: false,
    };
  }

  /**
   * Evaluate if rule conditions are met
   */
  private evaluateRuleConditions(
    rule: StatusTransitionRule,
    gpsData: VehicleStatus,
    distances: { pickup: number | null; destination: number | null },
    movementAnalysis: any
  ): boolean {
    const { conditions } = rule;
    const speed = gpsData.location.speed || 0;

    // Check speed range
    if (conditions.speedRange) {
      const [minSpeed, maxSpeed] = conditions.speedRange;
      const currentSpeed = speed || 0; // Default to 0 if undefined
      if (currentSpeed < minSpeed || currentSpeed > maxSpeed) {
        return false;
      }
    }

    // Check distance threshold
    if (conditions.distanceThreshold) {
      let distance: number | null = null;
      
      if (conditions.locationType === 'pickup') {
        distance = distances.pickup;
      } else if (conditions.locationType === 'destination') {
        distance = distances.destination;
      }

      if (distance === null || distance > conditions.distanceThreshold) {
        return false;
      }
    }

    // Check minimum stationary time (would need historical data)
    if (conditions.minStationaryTime) {
      // This would require tracking movement history
      // For now, we'll skip this check
    }

    return true;
  }

  /**
   * Calculate confidence level for status transition
   */
  private calculateConfidence(
    rule: StatusTransitionRule,
    gpsData: VehicleStatus,
    distances: { pickup: number | null; destination: number | null },
    movementAnalysis: any
  ): number {
    let confidence = 50; // Base confidence

    // Increase confidence based on speed accuracy
    if (rule.conditions.speedRange) {
      const [minSpeed, maxSpeed] = rule.conditions.speedRange;
      const speed = gpsData.location.speed || 0;
      const speedAccuracy = Math.min(100, (maxSpeed - minSpeed) / maxSpeed * 100);
      confidence += speedAccuracy * 0.3;
    }

    // Increase confidence based on distance accuracy
    if (rule.conditions.distanceThreshold) {
      let distance: number | null = null;
      
      if (rule.conditions.locationType === 'pickup') {
        distance = distances.pickup;
      } else if (rule.conditions.locationType === 'destination') {
        distance = distances.destination;
      }

      if (distance !== null) {
        const distanceAccuracy = Math.max(0, (rule.conditions.distanceThreshold - distance) / rule.conditions.distanceThreshold * 100);
        confidence += distanceAccuracy * 0.4;
      }
    }

    // Increase confidence for stationary conditions
    if (movementAnalysis.isStationary) {
      confidence += 20;
    }

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Generate human-readable reason for status change
   */
  private generateReason(
    rule: StatusTransitionRule,
    gpsData: VehicleStatus,
    distances: { pickup: number | null; destination: number | null },
    movementAnalysis: any
  ): string {
    const speed = gpsData.location.speed || 0; // Default to 0 if undefined
    
    switch (rule.toStatus) {
      case 'EN_ROUTE':
        return `Ambulance started moving (speed: ${speed.toFixed(1)} km/h)`;
      
      case 'AT_PICKUP':
        const pickupDistance = distances.pickup ? `${distances.pickup.toFixed(0)}m` : 'unknown';
        return `Ambulance arrived at pickup location (distance: ${pickupDistance}, speed: ${speed.toFixed(1)} km/h)`;
      
      case 'PATIENT_LOADED':
        return `Patient loaded, ambulance stationary at pickup (speed: ${speed.toFixed(1)} km/h)`;
      
      case 'ARRIVED':
        const destDistance = distances.destination ? `${distances.destination.toFixed(0)}m` : 'unknown';
        return `Ambulance arrived at destination (distance: ${destDistance}, speed: ${speed.toFixed(1)} km/h)`;
      
      default:
        return `Status change based on GPS analysis (speed: ${speed.toFixed(1)} km/h)`;
    }
  }

  /**
   * Update assignment status in database
   */
  private async updateAssignmentStatus(ambulanceId: string, analysis: GpsStatusAnalysis): Promise<void> {
    try {
      const assignment = await this.getCurrentAssignment(ambulanceId);
      if (!assignment) return;

      // Update assignment status
      await this.prisma.eMSAssignment.update({
        where: { id: assignment.id },
        data: {
          status: analysis.recommendedStatus as any,
          updatedAt: new Date(),
        },
      });

      // Update ticket status
      await this.prisma.ticket.update({
        where: { id: assignment.ticketId },
        data: {
          emsAssignmentStatus: analysis.recommendedStatus as any,
          emsStatusUpdatedAt: new Date(),
          emsStatusUpdatedBy: 'system', // GPS system user
        },
      });

      // Create timeline event
      await this.createTimelineEvent(assignment.ticketId, {
        eventType: this.getEventTypeForStatus(analysis.recommendedStatus),
        description: analysis.reason,
        gpsData: analysis.gpsData,
        confidence: analysis.confidence,
      });

      this.logger.log(`Updated assignment ${assignment.id} status: ${assignment.status} → ${analysis.recommendedStatus}`);

    } catch (error) {
      this.logger.error(`Error updating assignment status:`, error);
    }
  }

  /**
   * Broadcast GPS update via WebSocket
   */
  private async broadcastGpsUpdate(ambulanceId: string, gpsData: VehicleStatus, analysis: GpsStatusAnalysis): Promise<void> {
    try {
      await this.emsGateway.broadcastAmbulanceLocationUpdate(ambulanceId, {
        latitude: gpsData.location.latitude,
        longitude: gpsData.location.longitude,
        speed: gpsData.location.speed || 0,
        direction: gpsData.location.direction,
        timestamp: gpsData.location.timestamp,
        fuelLevel: gpsData.fuelLevel,
        engineStatus: gpsData.engineStatus,
        address: gpsData.address,
        statusAnalysis: analysis,
      });
    } catch (error) {
      this.logger.error(`Error broadcasting GPS update:`, error);
    }
  }

  /**
   * Create timeline event for status change
   */
  private async createTimelineEvent(ticketId: string, eventData: any): Promise<void> {
    try {
      await this.prisma.timelineEvent.create({
        data: {
          ticketId,
          eventType: eventData.eventType,
          eventCategory: 'GPS_STATUS_CHANGE',
          eventTimestamp: new Date(),
          eventDescription: eventData.description,
          gpsCoordinates: JSON.stringify({
            latitude: eventData.gpsData.speed,
            longitude: eventData.gpsData.distanceToPickup,
            speed: eventData.gpsData.speed,
            distanceToPickup: eventData.gpsData.distanceToPickup,
            distanceToDestination: eventData.gpsData.distanceToDestination,
            isMoving: eventData.gpsData.isMoving,
            isStationary: eventData.gpsData.isStationary,
          }),
          triggeredBy: 'system',
          createdById: 'system',
          metadata: JSON.stringify({
            confidence: eventData.confidence,
            gpsAnalysis: eventData.gpsData,
          }),
        },
      });
    } catch (error) {
      this.logger.error(`Error creating timeline event:`, error);
    }
  }

  /**
   * Get event type for status
   */
  private getEventTypeForStatus(status: string): string {
    const eventTypeMap: Record<string, string> = {
      [GPS_STATUS_TYPES.ASSIGNMENT_STATUS.EN_ROUTE]: GPS_STATUS_TYPES.EVENT_TYPES.EMS_TRANSPORT_START,
      [GPS_STATUS_TYPES.ASSIGNMENT_STATUS.AT_PICKUP]: GPS_STATUS_TYPES.EVENT_TYPES.AMBULANCE_ARRIVED,
      [GPS_STATUS_TYPES.ASSIGNMENT_STATUS.PATIENT_LOADED]: GPS_STATUS_TYPES.EVENT_TYPES.PATIENT_LOADED,
      [GPS_STATUS_TYPES.ASSIGNMENT_STATUS.ARRIVED]: GPS_STATUS_TYPES.EVENT_TYPES.EMS_ARRIVAL,
    };
    
    return eventTypeMap[status] || GPS_STATUS_TYPES.EVENT_TYPES.STATUS_CHANGE;
  }

  // Helper methods for creating analysis results
  private createNoAssignmentAnalysis(gpsData: VehicleStatus): GpsStatusAnalysis {
    return {
      currentStatus: 'NO_ASSIGNMENT',
      recommendedStatus: 'NO_ASSIGNMENT',
      confidence: 0,
      reason: 'No active assignment found',
      gpsData: {
        speed: gpsData.location.speed || 0,
        distanceToPickup: null,
        distanceToDestination: null,
        isMoving: (gpsData.location.speed || 0) > this.GPS_CONFIG.SPEED.MOVING_THRESHOLD,
        isStationary: (gpsData.location.speed || 0) < this.GPS_CONFIG.SPEED.STATIONARY_THRESHOLD,
      },
      shouldUpdateStatus: false,
    };
  }

  private createInvalidGpsAnalysis(gpsData: VehicleStatus, error: string): GpsStatusAnalysis {
    return {
      currentStatus: 'INVALID_GPS',
      recommendedStatus: 'INVALID_GPS',
      confidence: 0,
      reason: `GPS validation failed: ${error}`,
      gpsData: {
        speed: gpsData.location.speed || 0,
        distanceToPickup: null,
        distanceToDestination: null,
        isMoving: false,
        isStationary: true,
      },
      shouldUpdateStatus: false,
    };
  }

  private createErrorAnalysis(gpsData: VehicleStatus, error: string): GpsStatusAnalysis {
    return {
      currentStatus: 'ERROR',
      recommendedStatus: 'ERROR',
      confidence: 0,
      reason: `Analysis error: ${error}`,
      gpsData: {
        speed: gpsData.location.speed || 0,
        distanceToPickup: null,
        distanceToDestination: null,
        isMoving: false,
        isStationary: true,
      },
      shouldUpdateStatus: false,
    };
  }
}
