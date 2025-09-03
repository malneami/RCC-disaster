import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TicketStatus, UserRole, ActivityType } from '@prisma/client';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto, UpdateTicketStatusDto, AssignTicketDto } from './dto/update-ticket.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { TicketsGateway } from './tickets.gateway';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private ticketsGateway: TicketsGateway,
  ) {}

  // Priority calculation algorithm
  private calculatePriority(
    pathway: string,
    isEmergency: boolean,
    requiresSpecialist: boolean,
    vitals?: any
  ): string {
    if (isEmergency) return 'EMERGENCY';
    
    // Check critical vitals
    if (vitals) {
      if (vitals.heartRate > 120 || vitals.heartRate < 50) return 'CRITICAL';
      if (vitals.oxygenSaturation < 90) return 'CRITICAL';
      if (vitals.bloodPressure < 90) return 'CRITICAL';
    }

    // Pathway-based priority
    switch (pathway.toUpperCase()) {
      case 'STEMI':
      case 'STROKE':
        return 'CRITICAL';
      case 'TRAUMA':
        return requiresSpecialist ? 'CRITICAL' : 'HIGH';
      default:
        return requiresSpecialist ? 'HIGH' : 'MEDIUM';
    }
  }

  // Status transition validation
  private validateStatusTransition(
    currentStatus: TicketStatus,
    newStatus: TicketStatus,
    userRole: UserRole
  ): boolean {
    const allowedTransitions: Record<UserRole, TicketStatus[]> = {
      [UserRole.ADMIN]: [TicketStatus.PENDING, TicketStatus.ASSIGNED, TicketStatus.IN_TRANSPORT, TicketStatus.COMPLETED, TicketStatus.CANCELLED],
      [UserRole.RCC]: [TicketStatus.PENDING, TicketStatus.ASSIGNED, TicketStatus.IN_TRANSPORT, TicketStatus.COMPLETED, TicketStatus.CANCELLED],
      [UserRole.EMS]: [TicketStatus.ASSIGNED, TicketStatus.IN_TRANSPORT, TicketStatus.COMPLETED],
      [UserRole.DATA_COLLECTOR]: [TicketStatus.PENDING, TicketStatus.ASSIGNED],
      [UserRole.CATH_LAB_USER]: [TicketStatus.PENDING, TicketStatus.ASSIGNED, TicketStatus.IN_TRANSPORT, TicketStatus.COMPLETED],
    };

    return allowedTransitions[userRole]?.includes(newStatus) || false;
  }

  // Create ticket with workflow validation
  async create(createTicketDto: CreateTicketDto, userId: string, userRole: UserRole) {
    // Validate user permissions
    if (![UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER].includes(userRole as any)) {
      throw new ForbiddenException('Insufficient permissions to create tickets');
    }

    // Auto-calculate priority if not provided
    if (!createTicketDto.priority) {
      createTicketDto.priority = this.calculatePriority(
        createTicketDto.pathway,
        createTicketDto.isEmergency || false,
        createTicketDto.requiresSpecialist || false,
        createTicketDto.vitals
      ) as any;
    }

    // Generate ticket number
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create ticket with audit trail
    const { requiredResources, ...ticketData } = createTicketDto;
    
    // Convert estimatedArrival string to Date object if provided
    const processedData = {
      ...ticketData,
      estimatedArrival: ticketData.estimatedArrival ? new Date(ticketData.estimatedArrival) : undefined,
    };
    
    const ticket = await this.prisma.ticket.create({
      data: {
        ...processedData,
        ticketNumber,
        symptoms: createTicketDto.symptoms ? JSON.stringify(createTicketDto.symptoms) : null,
        vitals: createTicketDto.vitals ? JSON.stringify(createTicketDto.vitals) : null,
        diagnostics: createTicketDto.diagnostics ? JSON.stringify(createTicketDto.diagnostics) : null,
        requiredResources: requiredResources ? JSON.stringify(requiredResources) : null,
        createdById: userId,
      },
      include: {
        patient: true,
        originHospital: true,
        destinationHospital: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create activity log
    await this.prisma.activity.create({
      data: {
        type: ActivityType.TICKET_CREATED,
        description: `Ticket ${ticketNumber} created`,
        userId,
        ticketId: ticket.id,
        metadata: JSON.stringify({
          pathway: ticket.pathway,
          priority: ticket.priority,
          isEmergency: ticket.isEmergency,
        }),
      },
    });

    // Emit WebSocket notification
    this.ticketsGateway.emitTicketCreated(ticket);

    // Emit emergency alert if needed
    if (ticket.isEmergency || ticket.priority === 'EMERGENCY') {
      this.ticketsGateway.emitEmergencyTicket(ticket);
    }

    return ticket;
  }

  // Enhanced find all with filtering
  async findAll(
    page = 1,
    limit = 10,
    userRole?: UserRole,
    hospitalId?: string,
    filters?: TicketFilterDto
  ) {
    const skip = (page - 1) * limit;

    let where: any = { deletedAt: null };

    // Role-based filtering
    if (userRole === UserRole.CATH_LAB_USER) {
      where.pathway = 'STEMI';
    }

    if (hospitalId && userRole !== UserRole.ADMIN && userRole !== UserRole.RCC) {
      where.OR = [
        { originHospitalId: hospitalId },
        { destinationHospitalId: hospitalId },
      ];
    }

    // Apply filters
    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.priority) where.priority = filters.priority;
      if (filters.pathway) where.pathway = filters.pathway;
      if (filters.originHospitalId) where.originHospitalId = filters.originHospitalId;
      if (filters.destinationHospitalId) where.destinationHospitalId = filters.destinationHospitalId;
      if (filters.patientId) where.patientId = filters.patientId;
      if (filters.assignedToId) where.assignedToId = filters.assignedToId;
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
        if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
      }
      if (filters.search) {
        where.OR = [
          { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
          { chiefComplaint: { contains: filters.search, mode: 'insensitive' } },
          { patient: { 
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
              { mrn: { contains: filters.search, mode: 'insensitive' } },
            ]
          }},
        ];
      }
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              mrn: true,
            },
          },
          originHospital: {
            select: {
              name: true,
              status: true,
            },
          },
          destinationHospital: {
            select: {
              name: true,
              status: true,
            },
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        patient: true,
        originHospital: true,
        destinationHospital: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        activities: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  // Update ticket with status transition validation
  async update(id: string, updateTicketDto: UpdateTicketDto, userId: string, userRole: UserRole) {
    const ticket = await this.findById(id);
    
    // Validate user permissions for updates
    if (userRole === UserRole.EMS && ticket.assignedToId !== userId) {
      throw new ForbiddenException('Only assigned EMS can update this ticket');
    }

    const { assignedToId, requiredResources, destinationHospitalId, ...updateData } = updateTicketDto;
    
    // Convert DateTime fields from strings to Date objects
    const processedUpdateData = {
      ...updateData,
      estimatedArrival: updateData.estimatedArrival ? new Date(updateData.estimatedArrival) : undefined,
      actualArrival: updateData.actualArrival ? new Date(updateData.actualArrival) : undefined,
    };
    
    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: {
        ...processedUpdateData,
        symptoms: updateTicketDto.symptoms ? JSON.stringify(updateTicketDto.symptoms) : undefined,
        vitals: updateTicketDto.vitals ? JSON.stringify(updateTicketDto.vitals) : undefined,
        diagnostics: updateTicketDto.diagnostics ? JSON.stringify(updateTicketDto.diagnostics) : undefined,
        requiredResources: requiredResources ? JSON.stringify(requiredResources) : undefined,
      },
      include: {
        patient: true,
        originHospital: true,
        destinationHospital: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create activity log
    await this.prisma.activity.create({
      data: {
        type: ActivityType.TICKET_UPDATED,
        description: `Ticket ${ticket.ticketNumber} updated`,
        userId,
        ticketId: ticket.id,
        metadata: JSON.stringify({
          updatedFields: Object.keys(updateTicketDto),
        }),
      },
    });

    // Emit WebSocket notification
    this.ticketsGateway.emitTicketUpdate(updatedTicket, 'updated');

    return updatedTicket;
  }

  // Update ticket status with workflow validation
  async updateStatus(id: string, updateStatusDto: UpdateTicketStatusDto, userId: string, userRole: UserRole) {
    const ticket = await this.findById(id);

    // Validate status transition
    if (!this.validateStatusTransition(ticket.status, updateStatusDto.status, userRole)) {
      throw new BadRequestException(`Invalid status transition from ${ticket.status} to ${updateStatusDto.status} for role ${userRole}`);
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
        ...(updateStatusDto.status === TicketStatus.COMPLETED && { actualArrival: new Date() }),
      },
      include: {
        patient: true,
        originHospital: true,
        destinationHospital: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create activity log
    await this.prisma.activity.create({
      data: {
        type: ActivityType.TICKET_UPDATED,
        description: `Ticket ${ticket.ticketNumber} status changed from ${ticket.status} to ${updateStatusDto.status}`,
        userId,
        ticketId: ticket.id,
        metadata: JSON.stringify({
          previousStatus: ticket.status,
          newStatus: updateStatusDto.status,
          notes: updateStatusDto.notes,
        }),
      },
    });

    // Emit WebSocket notification
    this.ticketsGateway.emitTicketStatusChanged(updatedTicket, ticket.status);

    return updatedTicket;
  }

  // Assign ticket to user
  async assign(id: string, assignTicketDto: AssignTicketDto, userId: string, userRole: UserRole) {
    const ticket = await this.findById(id);

    // Validate assignment permissions
    if (![UserRole.ADMIN, UserRole.RCC].includes(userRole as any)) {
      throw new ForbiddenException('Only ADMIN and RCC can assign tickets');
    }

    // Verify assigned user exists and has appropriate role
    const assignedUser = await this.prisma.user.findUnique({
      where: { id: assignTicketDto.assignedToId },
    });

    if (!assignedUser) {
      throw new NotFoundException('Assigned user not found');
    }

    if (![UserRole.EMS, UserRole.CATH_LAB_USER].includes(assignedUser.role as any)) {
      throw new BadRequestException('Can only assign tickets to EMS or CATH_LAB_USER');
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: {
        assignedToId: assignTicketDto.assignedToId,
        status: TicketStatus.ASSIGNED,
      },
      include: {
        patient: true,
        originHospital: true,
        destinationHospital: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create activity log
    await this.prisma.activity.create({
      data: {
        type: ActivityType.TICKET_ASSIGNED,
        description: `Ticket ${ticket.ticketNumber} assigned to ${assignedUser.firstName} ${assignedUser.lastName}`,
        userId,
        ticketId: ticket.id,
        metadata: JSON.stringify({
          assignedToId: assignTicketDto.assignedToId,
          assignedToName: `${assignedUser.firstName} ${assignedUser.lastName}`,
          notes: assignTicketDto.notes,
        }),
      },
    });

    // Emit WebSocket notification
    this.ticketsGateway.emitTicketAssigned(updatedTicket, assignedUser);

    return updatedTicket;
  }

  // Get ticket statistics
  async getStatistics(userRole?: UserRole, hospitalId?: string) {
    let where: any = { deletedAt: null };

    if (hospitalId && userRole !== UserRole.ADMIN && userRole !== UserRole.RCC) {
      where.OR = [
        { originHospitalId: hospitalId },
        { destinationHospitalId: hospitalId },
      ];
    }

    const [total, pending, assigned, inTransport, completed, cancelled] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.PENDING } }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.ASSIGNED } }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.IN_TRANSPORT } }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.COMPLETED } }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.CANCELLED } }),
    ]);

    return {
      total,
      pending,
      assigned,
      inTransport,
      completed,
      cancelled,
    };
  }

  // Get tickets by priority
  async getTicketsByPriority(userRole?: UserRole, hospitalId?: string) {
    let where: any = { deletedAt: null };

    if (hospitalId && userRole !== UserRole.ADMIN && userRole !== UserRole.RCC) {
      where.OR = [
        { originHospitalId: hospitalId },
        { destinationHospitalId: hospitalId },
      ];
    }

    const priorities = await this.prisma.ticket.groupBy({
      by: ['priority'],
      where,
      _count: {
        priority: true,
      },
    });

    return priorities;
  }

  // Get tickets by pathway
  async getTicketsByPathway(userRole?: UserRole, hospitalId?: string) {
    let where: any = { deletedAt: null };

    if (hospitalId && userRole !== UserRole.ADMIN && userRole !== UserRole.RCC) {
      where.OR = [
        { originHospitalId: hospitalId },
        { destinationHospitalId: hospitalId },
      ];
    }

    const pathways = await this.prisma.ticket.groupBy({
      by: ['pathway'],
      where,
      _count: {
        pathway: true,
      },
    });

    return pathways;
  }
}