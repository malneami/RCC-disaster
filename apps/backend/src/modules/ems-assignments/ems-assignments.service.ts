import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEmsAssignmentDto } from './dto/create-ems-assignment.dto';
import { UpdateEmsAssignmentDto } from './dto/update-ems-assignment.dto';
import { AssignmentFilterDto } from './dto/assignment-filter.dto';
import { EMSAssignment, Prisma, AssignmentStatus } from '@prisma/client';
import { TimelineEventsService } from '../timeline-events/timeline-events.service';

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
    private readonly timelineEventsService: TimelineEventsService
  ) {}

  async create(createAssignmentDto: CreateEmsAssignmentDto, createdBy: string): Promise<EMSAssignment> {
    await this.validateAssignmentEntities(createAssignmentDto);
    await this.checkAmbulanceAvailability(createAssignmentDto.ambulanceId);
    await this.checkDriverAvailability(createAssignmentDto.driverId);

    const assignment = await this.prisma.eMSAssignment.create({
      data: {
        ...createAssignmentDto,
        assignedAt: new Date(createAssignmentDto.assignedAt),
        estimatedArrivalTime: createAssignmentDto.estimatedArrivalTime 
          ? new Date(createAssignmentDto.estimatedArrivalTime) 
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

    await this.prisma.ambulance.update({
      where: { id: createAssignmentDto.ambulanceId },
      data: { status: 'IN_USE' },
    });

    // Create timeline event for ambulance dispatch
    await this.timelineEventsService.createEMSEvent(
      'AMBULANCE_DISPATCHED',
      `Ambulance dispatched for ticket ${assignment.ticket?.ticketNumber || createAssignmentDto.ticketId}`,
      createdBy,
      {
        ticketId: createAssignmentDto.ticketId,
        ambulanceId: createAssignmentDto.ambulanceId,
        driverId: createAssignmentDto.driverId,
        eventLocation: 'Dispatch Center',
        metadata: {
          assignmentId: assignment.id,
          estimatedArrivalTime: createAssignmentDto.estimatedArrivalTime,
          priority: assignment.ticket?.priority,
        },
      }
    );

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

    const updateData = this.buildUpdateData(updateAssignmentDto);

    const assignment = await this.prisma.eMSAssignment.update({
      where: { id },
      data: updateData,
      include: this.getAssignmentInclude(),
    });

    if (updateAssignmentDto.status) {
      await this.updateAmbulanceStatus(existingAssignment.ambulanceId, updateAssignmentDto.status);
      
      // Create timeline event for status change
      await this.createStatusChangeEvent(
        existingAssignment.status,
        updateAssignmentDto.status,
        assignment,
        updatedBy || 'system'
      );
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

    await this.prisma.ambulance.update({
      where: { id: assignment.ambulanceId },
      data: { status: 'AVAILABLE' },
    });

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

    if (updateAssignmentDto.status !== undefined) {
      updateData.status = updateAssignmentDto.status;
    }

    if (updateAssignmentDto.estimatedArrivalTime !== undefined) {
      updateData.estimatedArrivalTime = updateAssignmentDto.estimatedArrivalTime 
        ? new Date(updateAssignmentDto.estimatedArrivalTime) 
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
    const [ticket, ambulance, driver] = await Promise.all([
      this.prisma.ticket.findUnique({ where: { id: dto.ticketId } }),
      this.prisma.ambulance.findUnique({ where: { id: dto.ambulanceId } }),
      this.prisma.user.findUnique({ where: { id: dto.driverId } }),
    ]);

    if (!ticket) throw new NotFoundException(`Ticket with ID ${dto.ticketId} not found`);
    if (!ambulance) throw new NotFoundException(`Ambulance with ID ${dto.ambulanceId} not found`);
    if (!driver) throw new NotFoundException(`Driver with ID ${dto.driverId} not found`);
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
        ambulanceId: assignment.ambulanceId,
        driverId: assignment.driverId,
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
}