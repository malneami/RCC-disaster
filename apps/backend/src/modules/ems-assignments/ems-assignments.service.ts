import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEmsAssignmentDto } from './dto/create-ems-assignment.dto';
import { UpdateEmsAssignmentDto } from './dto/update-ems-assignment.dto';
import { AssignmentFilterDto } from './dto/assignment-filter.dto';
import { EMSAssignment, Prisma, AssignmentStatus } from '@prisma/client';
import { TimelineEventsService } from '../timeline-events/timeline-events.service';
import { EmsLocationWorkflowService } from '../../common/services/ems-location-workflow.service';
import { StatusMappingService } from '../../common/services/status-mapping.service';

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
      // Use updateAmbulanceStatus to handle all statuses correctly (including EN_ROUTE)
      if (createAssignmentDto.status) {
        await this.updateAmbulanceStatus(createAssignmentDto.ambulanceId, createAssignmentDto.status);
      } else {
        // Default to IN_USE if no status specified
        await this.prisma.ambulance.update({
          where: { id: createAssignmentDto.ambulanceId },
          data: { status: 'IN_USE' },
        });
      }
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

    const assignments = await this.prisma.eMSAssignment.findMany({
      where,
      include: this.getAssignmentInclude(),
      orderBy: { assignedAt: 'desc' },
    });

    // Auto-check and fix status for assignments that might need it (run in background)
    // Trigger location workflow checks for DEPARTED assignments without journeyEndTime
    assignments
      .filter(a => a.status === 'DEPARTED' && !a.journeyEndTime && a.ambulanceId)
      .forEach(assignment => {
        // Use location workflow service to check for missed arrivals
        this.emsLocationWorkflowService.processLocationUpdate(assignment.id).catch(err =>
          this.logger.error(`Failed to process location update for assignment ${assignment.id}: ${err.message}`)
        );
      });

    // Also check for status mismatches based on timestamps
    assignments
      .filter(a => {
        // Check if status doesn't match timestamps
        if (a.journeyEndTime && a.status !== 'ARRIVED') return true;
        if (a.journeyStartTime && !a.journeyEndTime && a.status !== 'DEPARTED') return true;
        if (a.actualArrivalTime && !a.journeyStartTime && a.status !== 'EMS_ARRIVAL') return true;
        return false;
      })
      .forEach(assignment => {
        this.checkAndFixAssignmentStatus(assignment.id).catch(err =>
          this.logger.error(`Failed to auto-fix assignment ${assignment.id}: ${err.message}`)
        );
      });

    // Sync ambulance statuses based on active assignments (run in background)
    this.syncAmbulanceStatusesFromAssignments(assignments).catch(err =>
      this.logger.error(`Failed to sync ambulance statuses: ${err.message}`)
    );

    return assignments;
  }

  async findById(id: string): Promise<EMSAssignment> {
    const assignment = await this.prisma.eMSAssignment.findFirst({
      where: { id, deletedAt: null },
      include: this.getAssignmentInclude(),
    });

    if (!assignment) {
      throw new NotFoundException(`EMS assignment with ID ${id} not found`);
    }

    // Sync ambulance status if assignment is active (run in background)
    if (assignment.ambulanceId) {
      const activeStatuses: AssignmentStatus[] = ['EMS_CONTACT', 'EN_ROUTE', 'EMS_ARRIVAL', 'DEPARTED'];
      if (activeStatuses.includes(assignment.status)) {
        this.syncAmbulanceStatusesFromAssignments([assignment]).catch(err =>
          this.logger.error(`Failed to sync ambulance status for assignment ${id}: ${err.message}`)
        );
      }
    }

    // Auto-check and fix status if needed (run in background to not block response)
    // Also trigger location workflow check for DEPARTED assignments without journeyEndTime
    if (assignment.status === 'DEPARTED' && !assignment.journeyEndTime && assignment.ambulanceId) {
      // Trigger location workflow check to detect missed arrivals
      this.emsLocationWorkflowService.processLocationUpdate(id).catch(err =>
        this.logger.error(`Failed to process location update for assignment ${id}: ${err.message}`)
      );
    } else {
      // For other cases, run the check and fix
      this.checkAndFixAssignmentStatus(id).catch(err => 
        this.logger.error(`Failed to auto-fix assignment ${id}: ${err.message}`)
      );
    }

    return assignment;
  }

  /**
   * Background check to fix assignment status based on zone logs and timestamps
   */
  private async checkAndFixAssignmentStatus(assignmentId: string): Promise<void> {
    try {
      const assignment = await this.prisma.eMSAssignment.findFirst({
        where: { id: assignmentId, deletedAt: null },
        include: {
          ticket: {
            include: {
              destinationHospital: true,
            },
          },
        },
      });

      if (!assignment || assignment.status === 'ARRIVED' || assignment.status === 'CANCELLED') {
        return; // Already completed or cancelled
      }

      // Check for destination zone log if status is DEPARTED and journeyEndTime is missing
      if (
        assignment.status === 'DEPARTED' &&
        !assignment.journeyEndTime &&
        assignment.ambulanceId &&
        assignment.ticket.destinationHospital
      ) {
        const referenceTime = assignment.emsContactTime || assignment.assignedAt || assignment.ticket.createdAt;
        
        const destinationZoneLog = await this.prisma.ambulanceZoneLog.findFirst({
          where: {
            ambulanceId: assignment.ambulanceId,
            hospitalId: assignment.ticket.destinationHospital.id,
            entryTime: {
              gt: referenceTime,
            },
          },
          orderBy: {
            entryTime: 'asc',
          },
        });

        if (destinationZoneLog) {
          this.logger.log(`Auto-fixing assignment ${assignmentId}: Found destination zone log, setting journeyEndTime and status to ARRIVED`);
          await this.prisma.eMSAssignment.update({
            where: { id: assignmentId },
            data: {
              status: 'ARRIVED',
              journeyEndTime: destinationZoneLog.entryTime,
            },
          });

          // Update ticket status
          await this.prisma.ticket.update({
            where: { id: assignment.ticketId },
            data: {
              emsAssignmentStatus: 'ARRIVED',
              emsStatusUpdatedAt: new Date(),
              emsStatusUpdatedBy: 'system',
            },
          });
        }
      }

      // Also check if status doesn't match timestamps
      let inferredStatus: AssignmentStatus = assignment.status;
      if (assignment.journeyEndTime) {
        inferredStatus = 'ARRIVED';
      } else if (assignment.journeyStartTime) {
        inferredStatus = 'DEPARTED';
      } else if (assignment.actualArrivalTime) {
        inferredStatus = 'EMS_ARRIVAL';
      } else if (assignment.emsContactTime) {
        inferredStatus = 'EMS_CONTACT';
      }

      if (assignment.status !== inferredStatus) {
        this.logger.log(`Auto-fixing assignment ${assignmentId}: Status mismatch (${assignment.status} -> ${inferredStatus})`);
        await this.prisma.eMSAssignment.update({
          where: { id: assignmentId },
          data: {
            status: inferredStatus,
          },
        });

        // Update ticket status
        await this.prisma.ticket.update({
          where: { id: assignment.ticketId },
          data: {
            emsAssignmentStatus: inferredStatus as any,
            emsStatusUpdatedAt: new Date(),
            emsStatusUpdatedBy: 'system',
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error in checkAndFixAssignmentStatus for ${assignmentId}: ${(error as Error).message}`);
      // Don't throw - this is a background check
    }
  }

  async update(id: string, updateAssignmentDto: UpdateEmsAssignmentDto, updatedBy?: string): Promise<EMSAssignment> {
    const existingAssignment = await this.findById(id);

    // Calculate assignment time period for timeline conflict checking
    // Use updated values if provided, otherwise use existing values
    const assignmentStart = updateAssignmentDto.emsContactTime 
      ? new Date(updateAssignmentDto.emsContactTime)
      : existingAssignment.emsContactTime
        ? new Date(existingAssignment.emsContactTime)
        : existingAssignment.assignedAt
          ? new Date(existingAssignment.assignedAt)
          : null;
    
    const assignmentEnd = updateAssignmentDto.journeyEndTime 
      ? new Date(updateAssignmentDto.journeyEndTime)
      : existingAssignment.journeyEndTime
        ? new Date(existingAssignment.journeyEndTime)
        : null;

    // Check timeline conflicts if:
    // 1. Ambulance/driver is being changed, OR
    // 2. Assignment times are being changed (could create conflicts with existing assignments)
    const ambulanceIdToCheck = updateAssignmentDto.ambulanceId || existingAssignment.ambulanceId;
    const driverIdToCheck = updateAssignmentDto.driverId || existingAssignment.driverId;
    const timesAreChanging = !!(
      updateAssignmentDto.emsContactTime || 
      updateAssignmentDto.journeyEndTime ||
      updateAssignmentDto.journeyStartTime ||
      updateAssignmentDto.actualArrivalTime
    );

    // Check conflicts if ambulance/driver is being changed OR if times are being updated
    if (ambulanceIdToCheck && (updateAssignmentDto.ambulanceId || timesAreChanging)) {
      await this.checkAmbulanceAvailability(
        ambulanceIdToCheck,
        assignmentStart,
        assignmentEnd,
        id // Exclude current assignment
      );
    }
    if (driverIdToCheck && (updateAssignmentDto.driverId || timesAreChanging)) {
      await this.checkDriverAvailability(
        driverIdToCheck,
        assignmentStart,
        assignmentEnd,
        id // Exclude current assignment
      );
    }

    const updateData = this.buildUpdateData(updateAssignmentDto);
    
    // Auto-infer status from timestamps if status is not explicitly set but timestamps are
    // This ensures status matches the timestamps when they're set from zone logs
    if (!updateAssignmentDto.status) {
      const finalTimestamps = {
        journeyEndTime: updateAssignmentDto.journeyEndTime 
          ? new Date(updateAssignmentDto.journeyEndTime) 
          : existingAssignment.journeyEndTime,
        journeyStartTime: updateAssignmentDto.journeyStartTime 
          ? new Date(updateAssignmentDto.journeyStartTime) 
          : existingAssignment.journeyStartTime,
        actualArrivalTime: updateAssignmentDto.actualArrivalTime 
          ? new Date(updateAssignmentDto.actualArrivalTime) 
          : existingAssignment.actualArrivalTime,
        emsContactTime: updateAssignmentDto.emsContactTime 
          ? new Date(updateAssignmentDto.emsContactTime) 
          : existingAssignment.emsContactTime,
      };
      
      // Infer status from the latest timestamp
      if (finalTimestamps.journeyEndTime) {
        (updateData as any).status = 'ARRIVED';
      } else if (finalTimestamps.journeyStartTime) {
        (updateData as any).status = 'DEPARTED';
      } else if (finalTimestamps.actualArrivalTime) {
        (updateData as any).status = 'EMS_ARRIVAL';
      } else if (finalTimestamps.emsContactTime) {
        (updateData as any).status = 'EMS_CONTACT';
      }
    }

    const assignment = await this.prisma.eMSAssignment.update({
      where: { id },
      data: updateData,
      include: this.getAssignmentInclude(),
    });

    // Update Ticket's EMS status and main status if status changed
    if (updateAssignmentDto.status) {
      // Map EMS status to ticket status using StatusMappingService
      const newTicketStatus = StatusMappingService.mapEMSToTicket(assignment.status);
      
      await this.prisma.ticket.update({
        where: { id: assignment.ticketId },
        data: { 
          emsAssignmentStatus: assignment.status,
          status: newTicketStatus, // Update the main ticket status field
          emsStatusUpdatedAt: new Date(),
          emsStatusUpdatedBy: updatedBy
        }
      });
      
      this.logger.log(
        `Ticket ${assignment.ticketId} status updated: EMS status -> ${assignment.status}, Ticket status -> ${newTicketStatus}`
      );
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

  /**
   * Diagnostic function to investigate assignment status and zone logs
   * Helps debug why status isn't updating correctly
   */
  async diagnoseAssignment(assignmentId: string): Promise<any> {
    const assignment = await this.prisma.eMSAssignment.findFirst({
      where: { id: assignmentId, deletedAt: null },
      include: {
        ticket: {
          include: {
            originHospital: true,
            destinationHospital: true,
          },
        },
        ambulance: {
          select: {
            id: true,
            callSign: true,
            vehicleImei: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(`EMS assignment with ID ${assignmentId} not found`);
    }

    // Get all zone logs for this ambulance
    let zoneLogs: any[] = [];
    if (assignment.ambulanceId) {
      zoneLogs = await this.prisma.ambulanceZoneLog.findMany({
        where: {
          ambulanceId: assignment.ambulanceId,
        },
        include: {
          hospital: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          entryTime: 'asc',
        },
      });
    }

    // Filter zone logs relevant to this assignment
    const referenceTime = assignment.emsContactTime || assignment.assignedAt || assignment.ticket.createdAt;
    const relevantZoneLogs = zoneLogs.filter(log => {
      return new Date(log.entryTime) >= new Date(referenceTime);
    });

    // Check for destination zone entry
    const destinationZoneLog = assignment.ticket.destinationHospital
      ? relevantZoneLogs.find(
          log => log.hospitalId === assignment.ticket.destinationHospital!.id && !log.exitTime
        )
      : null;

    // Check for origin zone entries/exits
    const originZoneLogs = assignment.ticket.originHospital
      ? relevantZoneLogs.filter(log => log.hospitalId === assignment.ticket.originHospital!.id)
      : [];

    // Infer what status should be based on timestamps
    let inferredStatus: AssignmentStatus = assignment.status;
    if (assignment.journeyEndTime) {
      inferredStatus = 'ARRIVED';
    } else if (assignment.journeyStartTime) {
      inferredStatus = 'DEPARTED';
    } else if (assignment.actualArrivalTime) {
      inferredStatus = 'EMS_ARRIVAL';
    } else if (assignment.emsContactTime) {
      inferredStatus = 'EMS_CONTACT';
    }

    // Check if status needs to be updated
    const statusMismatch = assignment.status !== inferredStatus;

    return {
      assignment: {
        id: assignment.id,
        status: assignment.status,
        inferredStatus,
        statusMismatch,
        timestamps: {
          assignedAt: assignment.assignedAt,
          emsContactTime: assignment.emsContactTime,
          actualArrivalTime: assignment.actualArrivalTime,
          journeyStartTime: assignment.journeyStartTime,
          journeyEndTime: assignment.journeyEndTime,
        },
        ambulance: assignment.ambulance,
        ticket: {
          id: assignment.ticket.id,
          ticketNumber: assignment.ticket.ticketNumber,
          originHospital: assignment.ticket.originHospital
            ? {
                id: assignment.ticket.originHospital.id,
                name: assignment.ticket.originHospital.name,
                latitude: assignment.ticket.originHospital.latitude,
                longitude: assignment.ticket.originHospital.longitude,
              }
            : null,
          destinationHospital: assignment.ticket.destinationHospital
            ? {
                id: assignment.ticket.destinationHospital.id,
                name: assignment.ticket.destinationHospital.name,
                latitude: assignment.ticket.destinationHospital.latitude,
                longitude: assignment.ticket.destinationHospital.longitude,
              }
            : null,
        },
      },
      zoneLogs: {
        total: zoneLogs.length,
        relevant: relevantZoneLogs.length,
        all: zoneLogs.map(log => ({
          id: log.id,
          hospitalId: log.hospitalId,
          hospitalName: log.hospital.name,
          entryTime: log.entryTime,
          exitTime: log.exitTime,
          zoneType: log.zoneType,
        })),
        origin: originZoneLogs.map(log => ({
          id: log.id,
          entryTime: log.entryTime,
          exitTime: log.exitTime,
        })),
        destination: destinationZoneLog
          ? {
              id: destinationZoneLog.id,
              entryTime: destinationZoneLog.entryTime,
              exitTime: destinationZoneLog.exitTime,
            }
          : null,
      },
      analysis: {
        hasJourneyEndTime: !!assignment.journeyEndTime,
        hasDestinationZoneLog: !!destinationZoneLog,
        shouldBeArrived: !!assignment.journeyEndTime || !!destinationZoneLog,
        currentStatus: assignment.status,
        expectedStatus: inferredStatus,
        recommendation: statusMismatch
          ? `Status should be updated from '${assignment.status}' to '${inferredStatus}' based on timestamps`
          : destinationZoneLog && !assignment.journeyEndTime
          ? `Destination zone log exists but journeyEndTime is not set. Should set journeyEndTime to ${destinationZoneLog.entryTime}`
          : !destinationZoneLog && assignment.status === 'DEPARTED'
          ? `No destination zone log found. Check if ambulance entered destination hospital zone.`
          : 'Status appears correct',
      },
    };
  }

  /**
   * Auto-fix assignment status based on timestamps and zone logs
   * This can be called to correct status mismatches
   */
  async autoFixAssignmentStatus(assignmentId: string): Promise<EMSAssignment> {
    const diagnostic = await this.diagnoseAssignment(assignmentId);
    
    if (!diagnostic.analysis.statusMismatch && !diagnostic.analysis.hasDestinationZoneLog) {
      // No fix needed
      return await this.findById(assignmentId);
    }

    const updateData: UpdateEmsAssignmentDto = {};

    // Fix status based on inferred status
    if (diagnostic.analysis.statusMismatch) {
      updateData.status = diagnostic.assignment.inferredStatus as any;
    }

    // Set journeyEndTime from destination zone log if it exists but journeyEndTime is missing
    if (diagnostic.zoneLogs.destination && !diagnostic.assignment.timestamps.journeyEndTime) {
      updateData.journeyEndTime = diagnostic.zoneLogs.destination.entryTime.toISOString();
      updateData.status = 'ARRIVED';
    }

    if (Object.keys(updateData).length > 0) {
      this.logger.log(`Auto-fixing assignment ${assignmentId}: ${JSON.stringify(updateData)}`);
      return await this.update(assignmentId, updateData, 'system');
    }

    return await this.findById(assignmentId);
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

  /**
   * Check if two time periods overlap
   * Returns true if periods overlap, false otherwise
   * Two periods overlap if they share any common time point
   */
  private doTimePeriodsOverlap(
    start1: Date | null,
    end1: Date | null,
    start2: Date | null,
    end2: Date | null
  ): boolean {
    // If either period has no start time, we can't determine overlap
    if (!start1 || !start2) return false;
    
    // Convert to timestamps for easier comparison
    const s1 = start1.getTime();
    const s2 = start2.getTime();
    const e1 = end1 ? end1.getTime() : null;
    const e2 = end2 ? end2.getTime() : null;
    
    // If both periods are ongoing (no end time), they overlap if they started at the same time
    // Actually, if both are ongoing, they always overlap since they're both active now
    if (!e1 && !e2) {
      return true; // Both ongoing - they overlap
    }
    
    // If period 1 is ongoing (no end), it overlaps with period 2 if:
    // - period 2 hasn't ended yet (e2 is null or e2 >= s1)
    if (!e1) {
      return !e2 || e2 >= s1;
    }
    
    // If period 2 is ongoing (no end), it overlaps with period 1 if:
    // - period 1 hasn't ended yet (e1 >= s2)
    if (!e2) {
      return e1 >= s2;
    }
    
    // Both have end times - check for overlap
    // Overlap occurs if: start1 < end2 AND start2 < end1
    // This means the periods share at least one point in time
    return s1 < e2 && s2 < e1;
  }

  /**
   * Get the effective time period for an assignment
   * Returns [startTime, endTime] where:
   * - startTime: assignedAt or emsContactTime (whichever is earlier)
   * - endTime: journeyEndTime if completed, or null if still active
   */
  private getAssignmentTimePeriod(assignment: any): [Date | null, Date | null] {
    const startTime = assignment.emsContactTime 
      ? new Date(assignment.emsContactTime)
      : assignment.assignedAt 
        ? new Date(assignment.assignedAt)
        : null;
    
    const endTime = assignment.journeyEndTime 
      ? new Date(assignment.journeyEndTime)
      : null;
    
    return [startTime, endTime];
  }

  /**
   * Check for timeline conflicts for ambulance or driver
   * @param resourceId - The ambulance ID or driver ID
   * @param resourceType - 'ambulance' or 'driver'
   * @param newAssignmentStart - Start time of the new assignment
   * @param newAssignmentEnd - End time of the new assignment (null if ongoing)
   * @param excludeAssignmentId - Assignment ID to exclude from conflict check (for updates)
   */
  private async checkTimelineConflict(
    resourceId: string,
    resourceType: 'ambulance' | 'driver',
    newAssignmentStart: Date | null,
    newAssignmentEnd: Date | null,
    excludeAssignmentId?: string
  ): Promise<void> {
    if (!resourceId || !newAssignmentStart) {
      return; // Can't check conflicts without resource ID or start time
    }

    // Find all assignments for this resource (ambulance or driver)
    const whereClause: any = {
      deletedAt: null,
      [resourceType === 'ambulance' ? 'ambulanceId' : 'driverId']: resourceId,
    };

    // Exclude the current assignment if updating
    if (excludeAssignmentId) {
      whereClause.id = { not: excludeAssignmentId };
    }

    const existingAssignments = await this.prisma.eMSAssignment.findMany({
      where: whereClause,
      select: {
        id: true,
        assignedAt: true,
        emsContactTime: true,
        journeyEndTime: true,
        status: true,
        ticket: {
          select: {
            ticketNumber: true,
          },
        },
      },
    });

    // Get resource name once for error messages
    let resourceName: string;
    if (resourceType === 'ambulance') {
      const ambulance = await this.prisma.ambulance.findUnique({ 
        where: { id: resourceId }, 
        select: { callSign: true } 
      });
      resourceName = ambulance?.callSign || 'ambulance';
    } else {
      const driver = await this.prisma.user.findUnique({ 
        where: { id: resourceId }, 
        select: { firstName: true, lastName: true } 
      });
      resourceName = driver ? `${driver.firstName} ${driver.lastName}` : 'driver';
    }

    // Check for timeline conflicts
    for (const existing of existingAssignments) {
      const [existingStart, existingEnd] = this.getAssignmentTimePeriod(existing);
      
      if (this.doTimePeriodsOverlap(newAssignmentStart, newAssignmentEnd, existingStart, existingEnd)) {
        const existingPeriod = existingEnd 
          ? `${existingStart?.toLocaleString()} to ${existingEnd.toLocaleString()}`
          : `from ${existingStart?.toLocaleString()} (ongoing)`;
        
        const newPeriod = newAssignmentEnd 
          ? `${newAssignmentStart?.toLocaleString()} to ${newAssignmentEnd.toLocaleString()}`
          : `from ${newAssignmentStart?.toLocaleString()} (ongoing)`;
        
        throw new BadRequestException(
          `${resourceType === 'ambulance' ? 'Ambulance' : 'Driver'} ${resourceName} has a timeline conflict. ` +
          `Already assigned to ticket ${existing.ticket.ticketNumber} ${existingPeriod}. ` +
          `Cannot assign during overlapping time period (${newPeriod}).`
        );
      }
    }
  }

  private async checkAmbulanceAvailability(
    ambulanceId: string, 
    assignmentStart?: Date | null,
    assignmentEnd?: Date | null,
    excludeAssignmentId?: string
  ): Promise<void> {
    const ambulance = await this.prisma.ambulance.findUnique({ where: { id: ambulanceId } });

    if (!ambulance) throw new NotFoundException(`Ambulance with ID ${ambulanceId} not found`);
    if (!ambulance.isActive) {
      throw new BadRequestException(`Ambulance ${ambulance.callSign} is not active`);
    }

    // Check timeline conflicts if assignment times are provided
    if (assignmentStart) {
      await this.checkTimelineConflict(
        ambulanceId,
        'ambulance',
        assignmentStart,
        assignmentEnd || null,
        excludeAssignmentId
      );
    } else {
      // Fallback: Check if ambulance is currently available (no active assignments)
      if (ambulance.status !== 'AVAILABLE') {
        throw new BadRequestException(`Ambulance ${ambulance.callSign} is not available (Status: ${ambulance.status})`);
      }
    }
  }

  private async checkDriverAvailability(
    driverId: string,
    assignmentStart?: Date | null,
    assignmentEnd?: Date | null,
    excludeAssignmentId?: string
  ): Promise<void> {
    const driver = await this.prisma.user.findUnique({ where: { id: driverId } });

    if (!driver) throw new NotFoundException(`Driver with ID ${driverId} not found`);
    if (driver.status !== 'ACTIVE') {
      throw new BadRequestException(`Driver ${driver.firstName} ${driver.lastName} is not active`);
    }

    // Check timeline conflicts if assignment times are provided
    if (assignmentStart) {
      await this.checkTimelineConflict(
        driverId,
        'driver',
        assignmentStart,
        assignmentEnd || null,
        excludeAssignmentId
      );
    } else {
      // Fallback: Check if driver has active assignments
      const activeAssignment = await this.prisma.eMSAssignment.findFirst({
        where: {
          driverId,
          status: { in: ['EMS_CONTACT', 'EN_ROUTE', 'EMS_ARRIVAL', 'DEPARTED'] },
          deletedAt: null,
        },
      });

      if (activeAssignment) {
        throw new BadRequestException(`Driver ${driver.firstName} ${driver.lastName} already has an active assignment`);
      }
    }
  }

  private async updateAmbulanceStatus(ambulanceId: string, status: AssignmentStatus): Promise<void> {
    let ambulanceStatus: string;

    switch (status) {
      case 'EMS_CONTACT':
      case 'EN_ROUTE':
      case 'EMS_ARRIVAL':
      case 'DEPARTED':
        ambulanceStatus = 'IN_USE';
        break;
      case 'ARRIVED':
      case 'CANCELLED':
        ambulanceStatus = 'AVAILABLE';
        break;
      default:
        // For any other status, check if it's an active status that should be IN_USE
        // This handles any future statuses that indicate active assignment
        this.logger.warn(`Unknown assignment status ${status} for ambulance ${ambulanceId}, not updating ambulance status`);
        return;
    }

    await this.prisma.ambulance.update({
      where: { id: ambulanceId },
      data: { status: ambulanceStatus as any },
    });
    
    this.logger.log(`Updated ambulance ${ambulanceId} status to ${ambulanceStatus} based on assignment status ${status}`);
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
   * Sync ambulance statuses based on active assignments
   * Ensures ambulances with active assignments (EN_ROUTE, EMS_CONTACT, EMS_ARRIVAL, DEPARTED) are marked IN_USE
   */
  private async syncAmbulanceStatusesFromAssignments(assignments: EMSAssignment[]): Promise<void> {
    try {
      // Get all ambulances with active assignments
      const activeStatuses: AssignmentStatus[] = ['EMS_CONTACT', 'EN_ROUTE', 'EMS_ARRIVAL', 'DEPARTED'];
      const activeAssignments = assignments.filter(a => 
        a.ambulanceId && activeStatuses.includes(a.status)
      );

      // Group by ambulance ID
      const ambulanceIds = new Set(activeAssignments.map(a => a.ambulanceId!));
      
      // Update each ambulance to IN_USE if it has an active assignment
      for (const ambulanceId of ambulanceIds) {
        const ambulance = await this.prisma.ambulance.findUnique({
          where: { id: ambulanceId },
          select: { id: true, callSign: true, status: true }
        });

        if (ambulance && ambulance.status !== 'IN_USE') {
          this.logger.log(`Syncing ambulance ${ambulance.callSign} status to IN_USE (has active assignment)`);
          await this.prisma.ambulance.update({
            where: { id: ambulanceId },
            data: { status: 'IN_USE' }
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error syncing ambulance statuses from assignments: ${(error as Error).message}`);
      // Don't throw - this is a background sync
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