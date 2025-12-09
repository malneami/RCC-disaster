import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEmsAssignmentDto } from './dto/create-ems-assignment.dto';
import { UpdateEmsAssignmentDto } from './dto/update-ems-assignment.dto';
import { AssignmentFilterDto } from './dto/assignment-filter.dto';
import { EMSAssignment, Prisma, AssignmentStatus } from '@prisma/client';
import { TimelineEventsService } from '../timeline-events/timeline-events.service';
import { EmsLocationWorkflowService } from '../../common/services/ems-location-workflow.service';

interface AssignmentFilters {
  status?: AssignmentStatus;
  ticketId?: string;
  ambulanceId?: string;
  driverId?: string;
  assignedFrom?: string;
  assignedTo?: string;
}

@Injectable()
export class EmsAssignmentsService {
  private readonly logger = new Logger(EmsAssignmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly timelineEventsService: TimelineEventsService,
    private readonly emsLocationWorkflowService: EmsLocationWorkflowService
  ) {}

  async create(createAssignmentDto: CreateEmsAssignmentDto, createdBy: string): Promise<EMSAssignment> {
    await this.validateAssignmentEntities(createAssignmentDto);
    
    // Only check availability if ambulance and driver are provided
    if (createAssignmentDto.ambulanceId) {
      await this.checkAmbulanceAvailability(createAssignmentDto.ambulanceId);
    }
    if (createAssignmentDto.driverId) {
      await this.checkDriverAvailability(createAssignmentDto.driverId);
    }

    const assignment = await this.prisma.eMSAssignment.create({
      data: {
        ...createAssignmentDto,
        assignedAt: new Date(createAssignmentDto.assignedAt),
        emsContactTime: createAssignmentDto.emsContactTime 
          ? new Date(createAssignmentDto.emsContactTime) 
          : null,
        actualArrivalTime: createAssignmentDto.actualArrivalTime 
          ? new Date(createAssignmentDto.actualArrivalTime) 
          : null,
        journeyStartTime: createAssignmentDto.journeyStartTime 
          ? new Date(createAssignmentDto.journeyStartTime) 
          : null,
        journeyEndTime: createAssignmentDto.journeyEndTime 
          ? new Date(createAssignmentDto.journeyEndTime) 
          : null,
        createdBy,
      },
      include: this.getAssignmentInclude(),
    });

    // Only update ambulance status if ambulance is assigned
    if (createAssignmentDto.ambulanceId) {
      await this.prisma.ambulance.update({
        where: { id: createAssignmentDto.ambulanceId },
        data: { status: 'IN_USE' },
      });
    }

    // Create timeline event for ambulance dispatch
    await this.timelineEventsService.createEMSEvent(
      'AMBULANCE_DISPATCHED',
      `EMS assignment created for ticket ${createAssignmentDto.ticketId}`,
      createdBy,
      {
        ticketId: createAssignmentDto.ticketId,
        ambulanceId: createAssignmentDto.ambulanceId,
        driverId: createAssignmentDto.driverId,
        eventLocation: 'Dispatch Center',
        metadata: {
          assignmentId: assignment.id,
          emsContactTime: createAssignmentDto.emsContactTime,
          manualAssignmentRequired: !createAssignmentDto.ambulanceId || !createAssignmentDto.driverId,
        },
      }
    );

    // Update Ticket's EMS status
    await this.prisma.ticket.update({
      where: { id: createAssignmentDto.ticketId },
      data: { 
        emsAssignmentStatus: assignment.status,
        emsStatusUpdatedAt: new Date(),
        emsStatusUpdatedBy: createdBy
      }
    });

    this.logger.log(`EMS assignment created: ${assignment.id}`);
    return assignment;
  }

  async findAll(filters: AssignmentFilters = {}): Promise<EMSAssignment[]> {
    const where = this.buildWhereClause(filters);

    return this.prisma.eMSAssignment.findMany({
      where,
      include: this.getAssignmentInclude(),
      orderBy: { assignedAt: 'desc' },
    });
  }

  async findById(id: string): Promise<EMSAssignment> {
    const assignment = await this.prisma.eMSAssignment.findFirst({
      where: { id, deletedAt: null },
      include: this.getAssignmentInclude(),
    });

    if (!assignment) {
      throw new NotFoundException(`EMS assignment with ID ${id} not found`);
    }

    return assignment;
  }

  async update(id: string, updateAssignmentDto: UpdateEmsAssignmentDto, updatedBy?: string): Promise<EMSAssignment> {
    const existingAssignment = await this.findById(id);

    // Validate ambulance and driver if being assigned
    if (updateAssignmentDto.ambulanceId) {
      await this.checkAmbulanceAvailability(updateAssignmentDto.ambulanceId);
    }
    if (updateAssignmentDto.driverId) {
      await this.checkDriverAvailability(updateAssignmentDto.driverId);
    }

    const updateData = this.buildUpdateData(updateAssignmentDto);

    const assignment = await this.prisma.eMSAssignment.update({
      where: { id },
      data: updateData,
      include: this.getAssignmentInclude(),
    });

    // Update Ticket's EMS status if status changed
    if (updateAssignmentDto.status) {
      await this.prisma.ticket.update({
        where: { id: assignment.ticketId },
        data: { 
          emsAssignmentStatus: assignment.status,
          emsStatusUpdatedAt: new Date(),
          emsStatusUpdatedBy: updatedBy
        }
      });
    }

    // Update ambulance status if ambulance is being assigned or status is changing
    if (updateAssignmentDto.ambulanceId && updateAssignmentDto.status) {
      await this.updateAmbulanceStatus(updateAssignmentDto.ambulanceId, updateAssignmentDto.status);
    } else if (updateAssignmentDto.status && existingAssignment.ambulanceId) {
      await this.updateAmbulanceStatus(existingAssignment.ambulanceId, updateAssignmentDto.status);
    } else if (updateAssignmentDto.ambulanceId) {
      // If only ambulance is being assigned, set it to IN_USE
      await this.prisma.ambulance.update({
        where: { id: updateAssignmentDto.ambulanceId },
        data: { status: 'IN_USE' },
      });
    }
    
    // Create timeline event for status change or assignment
    if (updateAssignmentDto.status) {
      await this.createStatusChangeEvent(
        existingAssignment.status,
        updateAssignmentDto.status,
        assignment,
        updatedBy || 'system'
      );
    } else if (updateAssignmentDto.ambulanceId || updateAssignmentDto.driverId) {
      // Create timeline event for ambulance/driver assignment
      await this.timelineEventsService.createEMSEvent(
        'AMBULANCE_DISPATCHED',
        `Ambulance and driver assigned to assignment ${assignment.id}`,
        updatedBy || 'system',
        {
          ticketId: assignment.ticketId,
          ambulanceId: updateAssignmentDto.ambulanceId || existingAssignment.ambulanceId || undefined,
          driverId: updateAssignmentDto.driverId || existingAssignment.driverId || undefined,
          metadata: {
            assignmentId: assignment.id,
            assignedAmbulance: updateAssignmentDto.ambulanceId,
            assignedDriver: updateAssignmentDto.driverId,
            timestamp: new Date().toISOString(),
          },
        }
      );
    }

    // Start location monitoring if ambulance is assigned and assignment is active
    if (updateAssignmentDto.ambulanceId && assignment.status !== 'ARRIVED' && assignment.status !== 'CANCELLED') {
      try {
        await this.startLocationMonitoring(assignment.id);
        
        // Trigger immediate location check to update status if already in zone
        // Run in background to not block response
        this.emsLocationWorkflowService.processLocationUpdate(assignment.id)
          .catch(err => this.logger.error(`Failed to process immediate location update: ${err.message}`));
          
      } catch (error) {
        this.logger.error(`Failed to start location monitoring for assignment ${assignment.id}: ${(error as Error).message}`);
        // Don't throw error to prevent failing the update
      }
    }

    this.logger.log(`EMS assignment updated: ${assignment.id}`);
    return assignment;
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.findById(id);

    await this.prisma.eMSAssignment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    if (assignment.ambulanceId) {
      await this.prisma.ambulance.update({
        where: { id: assignment.ambulanceId },
        data: { status: 'AVAILABLE' },
      });
    }

    this.logger.log(`EMS assignment soft deleted: ${id}`);
  }

  async getActiveAssignments(): Promise<EMSAssignment[]> {
    return this.prisma.eMSAssignment.findMany({
      where: {
        status: {
          in: ['EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED'],
        },
        deletedAt: null,
      },
      include: this.getActiveAssignmentInclude(),
      orderBy: { assignedAt: 'desc' },
    });
  }

  async getAssignmentsByAmbulance(ambulanceId: string): Promise<EMSAssignment[]> {
    return this.prisma.eMSAssignment.findMany({
      where: { ambulanceId, deletedAt: null },
      include: this.getAssignmentInclude(),
      orderBy: { assignedAt: 'desc' },
    });
  }

  async getAssignmentsByDriver(driverId: string): Promise<EMSAssignment[]> {
    return this.prisma.eMSAssignment.findMany({
      where: { driverId, deletedAt: null },
      include: this.getAssignmentInclude(),
      orderBy: { assignedAt: 'desc' },
    });
  }

  private getAssignmentInclude() {
    return {
      ticket: {
        select: {
          id: true,
          ticketNumber: true,
          priority: true,
          status: true,
          pathway: true,
          createdAt: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          originHospital: {
            select: {
              id: true,
              name: true,
            },
          },
          destinationHospital: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      ambulance: {
        select: {
          id: true,
          callSign: true,
          plateNumber: true,
          type: true,
          status: true,
        },
      },
      driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
        },
      },
    };
  }

  private getActiveAssignmentInclude() {
    return {
      ticket: {
        select: {
          id: true,
          ticketNumber: true,
          priority: true,
          status: true,
          pathway: true,
          createdAt: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          originHospital: {
            select: {
              id: true,
              name: true,
            },
          },
          destinationHospital: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      ambulance: {
        select: {
          id: true,
          callSign: true,
          plateNumber: true,
          type: true,
          status: true,
          currentLocationLat: true,
          currentLocationLng: true,
        },
      },
      driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
        },
      },
    };
  }

  private buildWhereClause(filters: AssignmentFilters): Prisma.EMSAssignmentWhereInput {
    const where: Prisma.EMSAssignmentWhereInput = { deletedAt: null };

    if (filters.status) where.status = filters.status;
    if (filters.ticketId) where.ticketId = filters.ticketId;
    if (filters.ambulanceId) where.ambulanceId = filters.ambulanceId;
    if (filters.driverId) where.driverId = filters.driverId;

    if (filters.assignedFrom || filters.assignedTo) {
      where.assignedAt = {};
      if (filters.assignedFrom) where.assignedAt.gte = new Date(filters.assignedFrom);
      if (filters.assignedTo) where.assignedAt.lte = new Date(filters.assignedTo);
    }

    return where;
  }

  private buildUpdateData(updateAssignmentDto: UpdateEmsAssignmentDto): Prisma.EMSAssignmentUpdateInput {
    const updateData: Prisma.EMSAssignmentUpdateInput = {};

    if (updateAssignmentDto.ambulanceId !== undefined) {
      (updateData as any).ambulanceId = updateAssignmentDto.ambulanceId;
    }

    if (updateAssignmentDto.driverId !== undefined) {
      (updateData as any).driverId = updateAssignmentDto.driverId;
    }

    if (updateAssignmentDto.status !== undefined) {
      updateData.status = updateAssignmentDto.status;
    }

    if (updateAssignmentDto.emsContactTime !== undefined) {
      updateData.emsContactTime = updateAssignmentDto.emsContactTime 
        ? new Date(updateAssignmentDto.emsContactTime) 
        : null;
    }

    if (updateAssignmentDto.actualArrivalTime !== undefined) {
      updateData.actualArrivalTime = updateAssignmentDto.actualArrivalTime 
        ? new Date(updateAssignmentDto.actualArrivalTime) 
        : null;
    }

    if (updateAssignmentDto.journeyStartTime !== undefined) {
      updateData.journeyStartTime = updateAssignmentDto.journeyStartTime 
        ? new Date(updateAssignmentDto.journeyStartTime) 
        : null;
    }

    if (updateAssignmentDto.journeyEndTime !== undefined) {
      updateData.journeyEndTime = updateAssignmentDto.journeyEndTime 
        ? new Date(updateAssignmentDto.journeyEndTime) 
        : null;
    }

    if (updateAssignmentDto.distanceKm !== undefined) {
      updateData.distanceKm = updateAssignmentDto.distanceKm;
    }

    if (updateAssignmentDto.notes !== undefined) {
      updateData.notes = updateAssignmentDto.notes;
    }

    return updateData;
  }

  private async validateAssignmentEntities(dto: CreateEmsAssignmentDto): Promise<void> {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: dto.ticketId } });
    if (!ticket) throw new NotFoundException(`Ticket with ID ${dto.ticketId} not found`);

    // Only validate ambulance if provided
    if (dto.ambulanceId) {
      const ambulance = await this.prisma.ambulance.findUnique({ where: { id: dto.ambulanceId } });
      if (!ambulance) throw new NotFoundException(`Ambulance with ID ${dto.ambulanceId} not found`);
    }

    // Only validate driver if provided
    if (dto.driverId) {
      const driver = await this.prisma.user.findUnique({ where: { id: dto.driverId } });
      if (!driver) throw new NotFoundException(`Driver with ID ${dto.driverId} not found`);
    }
  }

  private async checkAmbulanceAvailability(ambulanceId: string): Promise<void> {
    const ambulance = await this.prisma.ambulance.findUnique({ where: { id: ambulanceId } });

    if (!ambulance) throw new NotFoundException(`Ambulance with ID ${ambulanceId} not found`);
    if (ambulance.status !== 'AVAILABLE') {
      throw new BadRequestException(`Ambulance ${ambulance.callSign} is not available (Status: ${ambulance.status})`);
    }
    if (!ambulance.isActive) {
      throw new BadRequestException(`Ambulance ${ambulance.callSign} is not active`);
    }
  }

  private async checkDriverAvailability(driverId: string): Promise<void> {
    const driver = await this.prisma.user.findUnique({ where: { id: driverId } });

    if (!driver) throw new NotFoundException(`Driver with ID ${driverId} not found`);
    if (driver.status !== 'ACTIVE') {
      throw new BadRequestException(`Driver ${driver.firstName} ${driver.lastName} is not active`);
    }

    const activeAssignment = await this.prisma.eMSAssignment.findFirst({
      where: {
        driverId,
        status: { in: ['EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED'] },
        deletedAt: null,
      },
    });

    if (activeAssignment) {
      throw new BadRequestException(`Driver ${driver.firstName} ${driver.lastName} already has an active assignment`);
    }
  }

  private async updateAmbulanceStatus(ambulanceId: string, status: AssignmentStatus): Promise<void> {
    let ambulanceStatus: string;

    switch (status) {
      case 'EMS_CONTACT':
      case 'EMS_ARRIVAL':
      case 'DEPARTED':
        ambulanceStatus = 'IN_USE';
        break;
      case 'ARRIVED':
      case 'CANCELLED':
        ambulanceStatus = 'AVAILABLE';
        break;
      default:
        return;
    }

    await this.prisma.ambulance.update({
      where: { id: ambulanceId },
      data: { status: ambulanceStatus as any },
    });
  }

  private async createStatusChangeEvent(
    fromStatus: AssignmentStatus,
    toStatus: AssignmentStatus,
    assignment: EMSAssignment,
    triggeredBy: string
  ): Promise<void> {
    const eventType = this.getEventTypeForStatus(toStatus);
    const description = this.getStatusChangeDescription(fromStatus, toStatus, assignment);

    await this.timelineEventsService.createEMSEvent(
      eventType,
      description,
      triggeredBy,
      {
        ticketId: assignment.ticketId,
        ambulanceId: assignment.ambulanceId || undefined,
        driverId: assignment.driverId || undefined,
        metadata: {
          assignmentId: assignment.id,
          previousStatus: fromStatus,
          newStatus: toStatus,
          timestamp: new Date().toISOString(),
        },
      }
    );
  }

  private getEventTypeForStatus(status: AssignmentStatus): string {
    switch (status) {
      case 'EMS_ARRIVAL':
        return 'AMBULANCE_DISPATCHED';
      case 'DEPARTED':
        return 'AMBULANCE_ARRIVED';
      case 'ARRIVED':
        return 'AMBULANCE_RETURNED';
      default:
        return 'AMBULANCE_DISPATCHED';
    }
  }

  private getStatusChangeDescription(
    fromStatus: AssignmentStatus,
    toStatus: AssignmentStatus,
    assignment: EMSAssignment
  ): string {
    const ticketNumber = 'Unknown'; // We'll need to fetch this separately if needed
    const ambulanceCallSign = 'Unknown'; // We'll need to fetch this separately if needed
    
    switch (toStatus) {
      case 'EMS_ARRIVAL':
        return `EMS arrived at pickup location for assignment ${assignment.id}`;
      case 'DEPARTED':
        return `EMS departed from pickup location for assignment ${assignment.id}`;
      case 'ARRIVED':
        return `Patient delivery completed for assignment ${assignment.id}`;
      case 'CANCELLED':
        return `Assignment cancelled for assignment ${assignment.id}`;
      default:
        return `Assignment status changed from ${fromStatus} to ${toStatus} for assignment ${assignment.id}`;
    }
  }

  /**
   * Start automatic location monitoring for an EMS assignment
   * This will check the ambulance location every 5 minutes and update status accordingly
   */
  async startLocationMonitoring(assignmentId: string): Promise<void> {
    try {
      const assignment = await this.prisma.eMSAssignment.findUnique({
        where: { id: assignmentId },
        include: { ambulance: true }
      });

      if (!assignment || !assignment.ambulance?.vehicleImei) {
        this.logger.warn(`Cannot start monitoring for assignment ${assignmentId}: No ambulance or IMEI`);
        return;
      }

      this.logger.log(`Triggering immediate location check for assignment ${assignmentId}`);
      
      // Perform an immediate check
      // We no longer use per-assignment intervals. A global Cron job handles periodic checks.
      await this.checkAndUpdateLocation(assignmentId);

    } catch (error) {
      this.logger.error(`Failed to trigger location check for assignment ${assignmentId}: ${(error as Error).message}`);
      // Don't throw, just log
    }
  }

  /**
   * Check locations for all active assignments
   * Called by the global Cron job
   */
  async checkAllLocations(): Promise<void> {
    try {
      const activeAssignments = await this.getActiveAssignmentsForMonitoring();
      if (activeAssignments.length === 0) return;

      this.logger.debug(`Running periodic location check for ${activeAssignments.length} active assignments`);

      for (const assignment of activeAssignments) {
        const assignmentWithAmbulance = assignment as any;
        if (assignmentWithAmbulance.ambulance?.vehicleImei) {
          // Run checks in parallel or sequence? Sequence is safer for DB load.
          await this.checkAndUpdateLocation(assignment.id);
        }
      }
    } catch (error) {
      this.logger.error(`Error in global location check: ${(error as Error).message}`);
    }
  }

  /**
   * Check and update location for a specific assignment
   */
  private async checkAndUpdateLocation(assignmentId: string): Promise<void> {
    try {
      // First check if assignment is still active
      const assignment = await this.prisma.eMSAssignment.findFirst({
        where: {
          id: assignmentId,
          deletedAt: null
        },
        include: {
          ambulance: true
        }
      });

      if (!assignment) {
        this.logger.log(`Assignment ${assignmentId} no longer exists, stopping location monitoring`);
        return;
      }

      if (assignment.status === 'ARRIVED' || assignment.status === 'CANCELLED') {
        this.logger.log(`Assignment ${assignmentId} is finished (${assignment.status}), stopping location monitoring`);
        return;
      }

      if (!assignment.ambulanceId || !assignment.ambulance?.vehicleImei) {
        this.logger.log(`No ambulance assigned to assignment ${assignmentId}, stopping location monitoring`);
        return;
      }

      this.logger.log(`Checking location for assignment ${assignmentId} (status: ${assignment.status})`);

      // Call the EMS location workflow service to process the location update
      const result = await this.emsLocationWorkflowService.processLocationUpdate(assignmentId);

      if (result) {
        this.logger.log(`Location update processed for assignment ${assignmentId}: ${result.previousStatus} → ${result.newStatus}`);
      } else {
        this.logger.log(`No status change needed for assignment ${assignmentId}`);
      }
    } catch (error) {
      this.logger.error(`Error checking location for assignment ${assignmentId}: ${(error as Error).message}`);
      // Don't throw error to prevent stopping the monitoring interval
    }
  }

  /**
   * Get all active EMS assignments that should be monitored
   */
  async getActiveAssignmentsForMonitoring(): Promise<EMSAssignment[]> {
    return await this.prisma.eMSAssignment.findMany({
      where: {
        deletedAt: null,
        status: {
          notIn: ['ARRIVED', 'CANCELLED']
        },
        ambulanceId: {
          not: null
        }
      },
      include: {
        ambulance: true,
        ticket: {
          include: {
            originHospital: true,
            destinationHospital: true
          }
        }
      }
    });
  }

  /**
   * Start location monitoring for all active assignments
   * This can be called on application startup
   */
  async startLocationMonitoringForAllActiveAssignments(): Promise<void> {
    try {
      const activeAssignments = await this.getActiveAssignmentsForMonitoring();
      
      this.logger.log(`Found ${activeAssignments.length} active assignments to monitor`);

      for (const assignment of activeAssignments) {
        const assignmentWithAmbulance = assignment as any; // Type assertion for included ambulance
        if (assignmentWithAmbulance.ambulance?.vehicleImei) {
          await this.startLocationMonitoring(assignment.id);
        } else {
          this.logger.warn(`Assignment ${assignment.id} has no ambulance IMEI, skipping monitoring`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to start location monitoring for active assignments: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Cleanup stuck ambulances and sync ticket EMS status
   * This method checks for ambulances marked as IN_USE but have no active assignments
   * and syncs ticket EMS status with assignment status
   */
  async cleanupStuckAmbulances(): Promise<void> {
    try {
      // Find all ambulances with IN_USE status
      const inUseAmbulances = await this.prisma.ambulance.findMany({
        where: {
          status: 'IN_USE',
          isActive: true,
          deletedAt: null
        },
        include: {
          assignments: {
            where: {
              deletedAt: null
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1,
            include: {
              ticket: {
                select: {
                  id: true,
                  emsAssignmentStatus: true
                }
              }
            }
          }
        }
      });

      if (inUseAmbulances.length === 0) {
        return;
      }

      this.logger.log(`Found ${inUseAmbulances.length} ambulance(s) with IN_USE status to check`);

      let fixedCount = 0;
      let syncedCount = 0;

      for (const ambulance of inUseAmbulances) {
        const latestAssignment = ambulance.assignments[0];

        if (!latestAssignment) {
          // No assignment at all - should be AVAILABLE
          this.logger.warn(`Ambulance ${ambulance.callSign} has no assignments, setting to AVAILABLE`);
          await this.prisma.ambulance.update({
            where: { id: ambulance.id },
            data: { status: 'AVAILABLE' }
          });
          fixedCount++;
          continue;
        }

        const assignmentStatus = latestAssignment.status;
        const ticketEmsStatus = latestAssignment.ticket.emsAssignmentStatus;

        // Check if assignment is in terminal state
        if (assignmentStatus === 'ARRIVED' || assignmentStatus === 'CANCELLED') {
          this.logger.log(`Ambulance ${ambulance.callSign} has terminal assignment (${assignmentStatus}), setting to AVAILABLE`);
          
          await this.prisma.ambulance.update({
            where: { id: ambulance.id },
            data: { status: 'AVAILABLE' }
          });
          
          fixedCount++;
        }

        // Check if ticket EMS status needs sync
        if (ticketEmsStatus !== assignmentStatus) {
          this.logger.log(`Syncing ticket EMS status for ambulance ${ambulance.callSign}: ${ticketEmsStatus} → ${assignmentStatus}`);
          
          await this.prisma.ticket.update({
            where: { id: latestAssignment.ticket.id },
            data: { 
              emsAssignmentStatus: assignmentStatus,
              emsStatusUpdatedAt: new Date()
            }
          });
          
          syncedCount++;
        }
      }

      if (fixedCount > 0 || syncedCount > 0) {
        this.logger.log(`Cleanup completed: Fixed ${fixedCount} ambulance(s), Synced ${syncedCount} ticket(s)`);
      }
    } catch (error) {
      this.logger.error(`Error in cleanupStuckAmbulances: ${(error as Error).message}`);
      // Don't throw error to prevent stopping periodic cleanup
    }
  }
}