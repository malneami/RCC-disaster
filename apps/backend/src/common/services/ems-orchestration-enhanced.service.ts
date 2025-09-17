import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GpsApiService, VehicleStatus } from './gps-api.service';
import { GpsValidationService, GPSValidationResult } from './gps-validation.service';
import { GpsMonitoringEnhancedService, GpsAlert } from './gps-monitoring-enhanced.service';
import { EmsGateway } from '../../modules/ems-gateway/ems.gateway';

@Injectable()
export class EmsOrchestrationEnhancedService {
  private readonly logger = new Logger(EmsOrchestrationEnhancedService.name);

  constructor(
    private prisma: PrismaService,
    private gpsApiService: GpsApiService,
    private gpsValidationService: GpsValidationService,
    private gpsMonitoringService: GpsMonitoringEnhancedService,
    private emsGateway: EmsGateway,
  ) {}

  /**
   * Enhanced ambulance assignment with GPS validation
   */
  async assignAmbulanceWithValidation(
    ticketId: string, 
    ambulanceData: {
      plateNumber: string;
      driverName: string;
      driverPhone: string;
    }
  ) {
    try {
      // 1. Find ambulance
      const ambulance = await this.prisma.ambulance.findFirst({
        where: {
          plateNumber: ambulanceData.plateNumber,
          status: 'AVAILABLE',
          deletedAt: null
        }
      });

      if (!ambulance) {
        throw new Error(`Ambulance ${ambulanceData.plateNumber} not found or not available`);
      }

      // 2. Validate GPS data
      const vehicleStatus = await this.gpsApiService.getVehicleLocation(ambulance.id);
      if (!vehicleStatus) {
        throw new Error('GPS location not available for ambulance');
      }
      const gpsValidation = await this.gpsValidationService.validateVehicleStatus(vehicleStatus);
      
      if (!gpsValidation.isValid) {
        throw new Error(`GPS validation failed: ${gpsValidation.error}`);
      }

      // 3. Update ambulance status
      await this.prisma.ambulance.update({
        where: { id: ambulance.id },
        data: { 
          status: 'IN_USE',
          driverName: ambulanceData.driverName,
          driverPhone: ambulanceData.driverPhone
        }
      });

      // 4. Create EMS assignment
      const assignment = await this.prisma.eMSAssignment.create({
        data: {
          ticketId,
          ambulanceId: ambulance.id,
          driverId: '1', // Default driver ID
          status: 'ASSIGNED' as any,
          assignedAt: new Date(),
          createdBy: '1' // System user
        }
      });

      // 5. Create timeline event with GPS metadata
      await this.createTimelineEvent({
        ticketId,
        eventType: 'ems_contact',
        eventTime: new Date().toISOString(),
        description: `Ambulance ${ambulanceData.plateNumber} assigned with GPS validation`,
        metadata: {
          ambulanceNumber: ambulanceData.plateNumber,
          driverName: ambulanceData.driverName,
          driverPhone: ambulanceData.driverPhone,
          gpsCoordinates: gpsValidation.coordinates,
          gpsValidation: gpsValidation
        }
      });

      // 6. Broadcast assignment update
      await this.emsGateway.broadcastAssignmentStatusUpdate(assignment.id, {
        status: 'ASSIGNED',
        gpsValidation: gpsValidation
      });

      this.logger.log(`Ambulance ${ambulanceData.plateNumber} assigned to ticket ${ticketId} with GPS validation`);
      
      return {
        success: true,
        assignment,
        gpsValidation
      };
    } catch (error) {
      this.logger.error(`Failed to assign ambulance: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Enhanced location tracking during transport
   */
  async trackAmbulanceWithValidation(ambulanceId: string, ticketId: string) {
    try {
      const vehicleStatus = await this.gpsApiService.getVehicleLocation(ambulanceId);
      
      if (!vehicleStatus) {
        await this.createGPSAlert({
          type: 'SIGNAL_LOSS',
          ambulanceId,
          ticketId,
          severity: 'HIGH',
          message: `GPS signal lost for ambulance during transport`,
          timestamp: new Date(),
          requiresAction: true
        });
        return;
      }

      // Validate GPS data
      const validation = await this.gpsValidationService.validateVehicleStatus(vehicleStatus);
      
      if (!validation.isValid) {
        await this.createGPSAlert({
          type: 'INVALID_COORDINATES',
          ambulanceId,
          ticketId,
          severity: 'MEDIUM',
          message: `GPS validation failed during transport: ${validation.error}`,
          timestamp: new Date(),
          requiresAction: true,
          metadata: { validation, vehicleStatus }
        });
      }

      // Create GPS log with validation
      await this.createGpsLog(ambulanceId, vehicleStatus, validation);
      
      // Broadcast location update
      await this.emsGateway.broadcastAmbulanceLocationUpdate(ambulanceId, {
        ...vehicleStatus.location,
        validation: validation,
        timestamp: new Date()
      });

      // Check for route deviations if we have a planned route
      await this.checkRouteDeviation(ambulanceId, ticketId, vehicleStatus);

    } catch (error) {
      this.logger.error(`Error tracking ambulance ${ambulanceId}:`, error);
    }
  }

  /**
   * Enhanced transfer completion with GPS validation
   */
  async completeTransferWithValidation(ticketId: string, ambulanceId: string) {
    try {
      // 1. Get final GPS location
      const finalLocation = await this.gpsApiService.getVehicleLocation(ambulanceId);
      const destinationValidation = await this.validateDestinationArrival(finalLocation, ticketId);
      
      if (!destinationValidation.isValid) {
        throw new Error(`Destination validation failed: ${destinationValidation.error}`);
      }

      // 2. Update assignment status
      await this.prisma.eMSAssignment.updateMany({
        where: {
          ticketId,
          ambulanceId
        },
        data: {
          status: 'COMPLETED' as any,
          journeyEndTime: new Date()
        }
      });

      // 3. Release ambulance
      await this.prisma.ambulance.update({
        where: { id: ambulanceId },
        data: { status: 'AVAILABLE' }
      });

      // 4. Create completion timeline event
      await this.createTimelineEvent({
        ticketId,
        eventType: 'transfer_completed',
        eventTime: new Date().toISOString(),
        description: 'Transfer completed successfully with GPS validation',
        metadata: {
          finalLocation: finalLocation?.location,
          completionTime: new Date().toISOString(),
          gpsValidation: destinationValidation
        }
      });

      // 5. Update ticket status
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { 
          status: 'COMPLETED',
          actualArrival: new Date().toISOString()
        }
      });

      this.logger.log(`Transfer completed for ticket ${ticketId} with GPS validation`);
      
      return {
        success: true,
        finalLocation: finalLocation?.location,
        validation: destinationValidation
      };
    } catch (error) {
      this.logger.error(`Failed to complete transfer: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Sync ambulance locations with validation
   */
  async syncAmbulanceLocationsWithValidation(): Promise<void> {
    try {
      this.logger.log('Starting enhanced ambulance location sync...');

      const activeAmbulances = await this.prisma.ambulance.findMany({
        where: {
          status: 'IN_USE',
          deletedAt: null
        }
      });

      if (activeAmbulances.length === 0) {
        this.logger.log('No active ambulances found for location sync');
        return;
      }

      const vehicleIds = activeAmbulances.map(a => a.id).filter(id => id);
      const vehicleStatuses = await this.gpsApiService.getMultipleVehicleLocations(vehicleIds);
      
      const validatedVehicles = await this.gpsValidationService.getValidatedVehicleLocations(vehicleStatuses);

      for (const vehicle of validatedVehicles) {
        const ambulance = activeAmbulances.find(a => a.id === vehicle.vehicleId);
        
        if (ambulance) {
          await this.createGpsLog(ambulance.id, vehicle, vehicle.validation);
          await this.broadcastLocationUpdate(ambulance.id, vehicle);
          
          // Create alerts for invalid GPS data
          if (!vehicle.validation.isValid) {
            await this.createGPSAlert({
              type: 'INVALID_COORDINATES',
              ambulanceId: ambulance.id,
              severity: 'MEDIUM',
              message: `GPS validation failed for ambulance ${ambulance.callSign}: ${vehicle.validation.error}`,
              timestamp: new Date(),
              requiresAction: true,
              metadata: { validation: vehicle.validation }
            });
          }
          
          this.logger.debug(`Updated location for ambulance ${ambulance.callSign} with validation`);
        }
      }

      this.logger.log(`Enhanced location sync completed for ${validatedVehicles.length} ambulances`);
    } catch (error) {
      this.logger.error(`Failed to sync ambulance locations: ${(error as Error).message}`);
    }
  }

  // Helper methods
  private async createGpsLog(ambulanceId: string, vehicleStatus: VehicleStatus, validation: GPSValidationResult) {
    await this.prisma.gPSTrackingLog.create({
      data: {
        ambulanceId,
        latitude: vehicleStatus.location.latitude,
        longitude: vehicleStatus.location.longitude,
        speed: vehicleStatus.location.speed,
        direction: vehicleStatus.location.direction,
        timestamp: vehicleStatus.location.timestamp,
        fuelLevel: vehicleStatus.fuelLevel,
        engineStatus: vehicleStatus.engineStatus,
        locationAddress: vehicleStatus.address,
        accuracy: vehicleStatus.location.accuracy,
        // validationResult: JSON.stringify(validation) // Field doesn't exist in schema
      }
    });
  }

  private async broadcastLocationUpdate(ambulanceId: string, vehicleStatus: VehicleStatus & { validation: GPSValidationResult }) {
    await this.emsGateway.broadcastAmbulanceLocationUpdate(ambulanceId, {
      latitude: vehicleStatus.location.latitude,
      longitude: vehicleStatus.location.longitude,
      speed: vehicleStatus.location.speed,
      direction: vehicleStatus.location.direction,
      fuelLevel: vehicleStatus.fuelLevel,
      engineStatus: vehicleStatus.engineStatus,
      address: vehicleStatus.address,
      timestamp: vehicleStatus.location.timestamp,
      validation: vehicleStatus.validation
    });
  }

  private async createTimelineEvent(data: {
    ticketId: string;
    eventType: string;
    eventTime: string;
    description: string;
    metadata?: any;
  }) {
    await this.prisma.timelineEvent.create({
      data: {
        ticketId: data.ticketId,
        eventType: data.eventType,
        eventCategory: 'EMS',
        eventTimestamp: new Date(data.eventTime),
        eventDescription: data.description,
        gpsCoordinates: data.metadata?.gpsCoordinates ? JSON.stringify(data.metadata.gpsCoordinates) : null,
        triggeredBy: '1', // System user
        createdById: '1' // System user
      }
    });
  }

  private async createGPSAlert(alert: GpsAlert) {
    await this.prisma.activity.create({
      data: {
        description: alert.message,
        type: 'GPS_ALERT' as any,
        userId: '1', // System user
        ticketId: null,
        metadata: JSON.stringify({
          alertType: alert.type,
          severity: alert.severity,
          requiresAction: alert.requiresAction,
          ambulanceId: alert.ambulanceId,
          ...alert.metadata
        })
      }
    });
  }

  private async validateDestinationArrival(location: VehicleStatus | null, ticketId: string): Promise<GPSValidationResult> {
    if (!location) {
      return {
        isValid: false,
        error: 'No GPS location available'
      };
    }

    // Get ticket destination
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { destinationHospital: true }
    });

    if (!ticket?.destinationHospital) {
      return {
        isValid: false,
        error: 'No destination hospital found'
      };
    }

    // Basic validation - in a real implementation, you'd check if the ambulance
    // is within the hospital's perimeter
    const validation = await this.gpsValidationService.validateVehicleStatus(location);
    
    return validation;
  }

  private async checkRouteDeviation(ambulanceId: string, ticketId: string, vehicleStatus: VehicleStatus) {
    // This would implement route deviation checking
    // For now, it's a placeholder
    this.logger.debug(`Checking route deviation for ambulance ${ambulanceId}`);
  }
}
