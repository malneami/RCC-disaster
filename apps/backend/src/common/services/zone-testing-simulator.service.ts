import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { ZoneBasedGpsMonitoringService } from './zone-based-gps-monitoring.service';
import { ZoneApiService } from './zone-api.service';
import { VehicleStatus } from '../interfaces/gps.interfaces';

export interface TestScenario {
  id: string;
  name: string;
  assignmentId: string;
  ambulanceId: string;
  originZone: {
    latitude: number;
    longitude: number;
    zoneId: string;
  };
  destinationZone: {
    latitude: number;
    longitude: number;
    zoneId: string;
  };
  currentStep: number;
  totalSteps: number;
  isActive: boolean;
  createdAt: Date;
  lastUpdate: Date;
}

export interface MovementStep {
  step: number;
  name: string;
  description: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  expectedStatus: string;
  expectedZone: 'origin' | 'destination' | 'none';
}

@Injectable()
export class ZoneTestingSimulatorService {
  private readonly logger = new Logger(ZoneTestingSimulatorService.name);
  private activeTestScenarios: Map<string, TestScenario> = new Map();
  private isSimulationActive = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly zoneBasedMonitoring: ZoneBasedGpsMonitoringService,
    private readonly zoneApiService: ZoneApiService
  ) {}

  /**
   * Start testing simulation for an EMS assignment
   */
  async startTestingSimulation(assignmentId: string): Promise<TestScenario> {
    try {
      // Get assignment details
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
        throw new Error(`Assignment ${assignmentId} not found`);
      }

      if (!assignment.ticket.originHospital?.latitude || !assignment.ticket.originHospital?.longitude) {
        throw new Error('Origin hospital coordinates not available');
      }

      if (!assignment.ticket.destinationHospital?.latitude || !assignment.ticket.destinationHospital?.longitude) {
        throw new Error('Destination hospital coordinates not available');
      }

      // Get zones for origin and destination hospitals
      const allZones = await this.zoneApiService.getAllZones();
      
      const originZones = allZones.filter(zone => 
        this.isPointInZone(
          assignment.ticket.originHospital.latitude!,
          assignment.ticket.originHospital.longitude!,
          zone
        )
      );

      const destinationZones = allZones.filter(zone => 
        this.isPointInZone(
          assignment.ticket.destinationHospital.latitude!,
          assignment.ticket.destinationHospital.longitude!,
          zone
        )
      );

      if (originZones.length === 0) {
        this.logger.warn('No zone found for origin hospital, using hospital coordinates');
      }

      if (destinationZones.length === 0) {
        this.logger.warn('No zone found for destination hospital, using hospital coordinates');
      }

      // Create test scenario
      const scenario: TestScenario = {
        id: `test-${assignmentId}-${Date.now()}`,
        name: `Zone Test for Assignment ${assignmentId}`,
        assignmentId,
        ambulanceId: assignment.ambulanceId!,
        originZone: {
          latitude: assignment.ticket.originHospital.latitude!,
          longitude: assignment.ticket.originHospital.longitude!,
          zoneId: originZones[0]?.zone_id || 'origin-hospital'
        },
        destinationZone: {
          latitude: assignment.ticket.destinationHospital.latitude!,
          longitude: assignment.ticket.destinationHospital.longitude!,
          zoneId: destinationZones[0]?.zone_id || 'destination-hospital'
        },
        currentStep: 0,
        totalSteps: 6,
        isActive: true,
        createdAt: new Date(),
        lastUpdate: new Date()
      };

      this.activeTestScenarios.set(scenario.id, scenario);
      this.isSimulationActive = true;

      this.logger.log(`Started zone testing simulation for assignment ${assignmentId}`);
      
      // Create activity log
      await this.prisma.activity.create({
        data: {
          type: 'TICKET_UPDATED',
          description: `Zone testing simulation started for assignment ${assignmentId}`,
          userId: 'system',
          ticketId: assignment.ticketId,
          metadata: JSON.stringify({
            simulationId: scenario.id,
            originZone: scenario.originZone,
            destinationZone: scenario.destinationZone,
            totalSteps: scenario.totalSteps
          })
        }
      });

      return scenario;

    } catch (error) {
      this.logger.error(`Failed to start testing simulation for assignment ${assignmentId}:`, error);
      throw error;
    }
  }

  /**
   * Cron job that runs every minute to execute test steps
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async executeTestSteps(): Promise<void> {
    if (!this.isSimulationActive || this.activeTestScenarios.size === 0) {
      return;
    }

    this.logger.debug(`Executing test steps for ${this.activeTestScenarios.size} active scenarios`);

    for (const [scenarioId, scenario] of this.activeTestScenarios) {
      try {
        await this.executeScenarioStep(scenario);
      } catch (error) {
        this.logger.error(`Error executing step for scenario ${scenarioId}:`, error);
      }
    }
  }

  /**
   * Execute the next step in a test scenario
   */
  private async executeScenarioStep(scenario: TestScenario): Promise<void> {
    if (scenario.currentStep >= scenario.totalSteps) {
      await this.completeScenario(scenario);
      return;
    }

    const movementSteps = this.getMovementSteps(scenario);
    const currentStep = movementSteps[scenario.currentStep];

    if (!currentStep) {
      this.logger.warn(`No step found for scenario ${scenario.id} at step ${scenario.currentStep}`);
      return;
    }

    this.logger.log(`Executing step ${scenario.currentStep + 1}/${scenario.totalSteps} for scenario ${scenario.id}: ${currentStep.name}`);

    // Create mock GPS location
    const mockGpsLocation: VehicleStatus = {
      vehicleId: scenario.ambulanceId,
      location: {
        latitude: currentStep.coordinates.latitude,
        longitude: currentStep.coordinates.longitude,
        speed: scenario.currentStep === 0 ? 0 : 50, // Start stationary, then moving
        direction: 0,
        timestamp: new Date(),
        accuracy: 5
      },
      fuelLevel: 80,
      engineStatus: true,
      address: currentStep.description
    };

    // Process GPS location update
    const statusUpdates = await this.zoneBasedMonitoring.processGpsLocationUpdate(
      scenario.ambulanceId,
      mockGpsLocation
    );

    // Log the test step execution
    await this.logTestStep(scenario, currentStep, statusUpdates);

    // Update scenario
    scenario.currentStep++;
    scenario.lastUpdate = new Date();
    this.activeTestScenarios.set(scenario.id, scenario);

    this.logger.log(`Completed step ${scenario.currentStep}/${scenario.totalSteps} for scenario ${scenario.id}`);
  }

  /**
   * Get movement steps for a test scenario
   */
  private getMovementSteps(scenario: TestScenario): MovementStep[] {
    // Calculate intermediate points between origin and destination
    const origin = scenario.originZone;
    const destination = scenario.destinationZone;
    
    // Calculate distance and bearing for intermediate points
    const distance = this.calculateDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    const bearing = this.calculateBearing(origin.latitude, origin.longitude, destination.latitude, destination.longitude);

    return [
      {
        step: 0,
        name: 'At Base/Starting Position',
        description: 'Ambulance at base station, not in any hospital zone',
        coordinates: {
          latitude: origin.latitude - 0.01, // Slightly outside origin zone
          longitude: origin.longitude - 0.01
        },
        expectedStatus: 'ASSIGNED',
        expectedZone: 'none'
      },
      {
        step: 1,
        name: 'En Route to Origin Hospital',
        description: 'Ambulance moving towards origin hospital',
        coordinates: {
          latitude: origin.latitude - 0.005, // Approaching origin zone
          longitude: origin.longitude - 0.005
        },
        expectedStatus: 'EN_ROUTE',
        expectedZone: 'none'
      },
      {
        step: 2,
        name: 'Arrived at Origin Hospital',
        description: 'Ambulance entered origin hospital zone',
        coordinates: {
          latitude: origin.latitude,
          longitude: origin.longitude
        },
        expectedStatus: 'AT_PICKUP',
        expectedZone: 'origin'
      },
      {
        step: 3,
        name: 'Patient Loaded, Departing Origin',
        description: 'Ambulance leaving origin hospital with patient',
        coordinates: {
          latitude: origin.latitude + 0.005, // Just outside origin zone
          longitude: origin.longitude + 0.005
        },
        expectedStatus: 'EN_ROUTE',
        expectedZone: 'none'
      },
      {
        step: 4,
        name: 'En Route to Destination',
        description: 'Ambulance traveling to destination hospital',
        coordinates: {
          latitude: destination.latitude - 0.005, // Approaching destination zone
          longitude: destination.longitude - 0.005
        },
        expectedStatus: 'EN_ROUTE',
        expectedZone: 'none'
      },
      {
        step: 5,
        name: 'Arrived at Destination Hospital',
        description: 'Ambulance entered destination hospital zone',
        coordinates: {
          latitude: destination.latitude,
          longitude: destination.longitude
        },
        expectedStatus: 'EMS_ARRIVAL',
        expectedZone: 'destination'
      }
    ];
  }

  /**
   * Log test step execution
   */
  private async logTestStep(
    scenario: TestScenario,
    step: MovementStep,
    statusUpdates: any[]
  ): Promise<void> {
    await this.prisma.activity.create({
      data: {
        type: 'TICKET_UPDATED',
        description: `Zone Test Step ${step.step + 1}: ${step.name} - ${step.description}`,
        userId: 'system',
        ticketId: scenario.assignmentId,
        metadata: JSON.stringify({
          simulationId: scenario.id,
          step: step.step,
          stepName: step.name,
          coordinates: step.coordinates,
          expectedStatus: step.expectedStatus,
          expectedZone: step.expectedZone,
          actualStatusUpdates: statusUpdates,
          timestamp: new Date().toISOString()
        })
      }
    });
  }

  /**
   * Complete a test scenario
   */
  private async completeScenario(scenario: TestScenario): Promise<void> {
    this.logger.log(`Completing test scenario ${scenario.id}`);

    // Create completion activity log
    await this.prisma.activity.create({
      data: {
        type: 'TICKET_UPDATED',
        description: `Zone testing simulation completed for assignment ${scenario.assignmentId}`,
        userId: 'system',
        ticketId: scenario.assignmentId,
        metadata: JSON.stringify({
          simulationId: scenario.id,
          totalSteps: scenario.totalSteps,
          completedAt: new Date().toISOString(),
          duration: Date.now() - scenario.createdAt.getTime()
        })
      }
    });

    // Remove from active scenarios
    this.activeTestScenarios.delete(scenario.id);

    // Check if any scenarios are still active
    if (this.activeTestScenarios.size === 0) {
      this.isSimulationActive = false;
      this.logger.log('All test scenarios completed, simulation stopped');
    }
  }

  /**
   * Stop all active test scenarios
   */
  async stopAllSimulations(): Promise<void> {
    this.logger.log(`Stopping ${this.activeTestScenarios.size} active test scenarios`);

    for (const [scenarioId, scenario] of this.activeTestScenarios) {
      await this.completeScenario(scenario);
    }

    this.activeTestScenarios.clear();
    this.isSimulationActive = false;
  }

  /**
   * Get status of all active test scenarios
   */
  getActiveScenarios(): TestScenario[] {
    return Array.from(this.activeTestScenarios.values());
  }

  /**
   * Get detailed status of a specific scenario
   */
  async getScenarioStatus(scenarioId: string): Promise<{
    scenario: TestScenario;
    currentStep: MovementStep | null;
    nextStep: MovementStep | null;
    assignmentStatus: any;
  } | null> {
    const scenario = this.activeTestScenarios.get(scenarioId);
    if (!scenario) {
      return null;
    }

    const movementSteps = this.getMovementSteps(scenario);
    const currentStep = movementSteps[scenario.currentStep] || null;
    const nextStep = movementSteps[scenario.currentStep + 1] || null;

    // Get current assignment status
    const assignment = await this.prisma.eMSAssignment.findUnique({
      where: { id: scenario.assignmentId },
      include: {
        ticket: true
      }
    });

    return {
      scenario,
      currentStep,
      nextStep,
      assignmentStatus: assignment
    };
  }

  /**
   * Utility function to check if a point is in a zone
   */
  private isPointInZone(latitude: number, longitude: number, zone: any): boolean {
    const bbox = zone.bounding_box;
    return (
      latitude >= bbox.min_lat &&
      latitude <= bbox.max_lat &&
      longitude >= bbox.min_lng &&
      longitude <= bbox.max_lng
    );
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate bearing between two coordinates
   */
  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = this.toRadians(lon2 - lon1);
    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    let bearing = Math.atan2(y, x);
    bearing = this.toDegrees(bearing);
    bearing = (bearing + 360) % 360;

    return bearing;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert radians to degrees
   */
  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}

