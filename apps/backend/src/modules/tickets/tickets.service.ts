import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TicketStatus, UserRole, ActivityType, AssignmentStatus } from '@prisma/client';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto, UpdateTicketStatusDto, AssignTicketDto } from './dto/update-ticket.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { TicketsGateway } from './tickets.gateway';
import { EmsAssignmentsService } from '../ems-assignments/ems-assignments.service';
import { StatusMappingService } from '../../common/services/status-mapping.service';
import { AmbulanceRecommendation, ScoreFactor, ZoneVisitSummary } from './types/recommendation.types';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private prisma: PrismaService,
    private ticketsGateway: TicketsGateway,
    private emsAssignmentsService: EmsAssignmentsService,
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
      [UserRole.HOSPITAL_USER]: [TicketStatus.ASSIGNED, TicketStatus.IN_TRANSPORT, TicketStatus.COMPLETED],
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
    const { requiredResources, triageTime, symptomOnsetTime, ...ticketData } = createTicketDto;
    
    // Convert datetime strings to Date objects if provided
    const processedData = {
      ...ticketData,
      emsContactTime: ticketData.emsContactTime ? new Date(ticketData.emsContactTime) : undefined,
    };
    
    const ticket = await this.prisma.ticket.create({
      data: {
        ...processedData,
        ticketNumber,
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

    
      try {
        const emsAssignment = await this.emsAssignmentsService.create({
          ticketId: ticket.id,
          assignedAt: new Date().toISOString(),
          status: AssignmentStatus.EMS_CONTACT,
          emsContactTime: createTicketDto.emsContactTime,
          notes: `Auto-created for ticket ${ticket.ticketNumber} - ambulance and driver to be assigned manually`,
        }, userId);

        this.logger.log(`Auto-created EMS assignment ${emsAssignment.id} for ticket ${ticket.ticketNumber} (no ambulance/driver assigned)`);
        
        // Create activity log for EMS assignment
        await this.prisma.activity.create({
          data: {
            type: ActivityType.TICKET_ASSIGNED,
            description: `EMS assignment auto-created for ticket ${ticket.ticketNumber} (ambulance and driver to be assigned manually)`,
            userId,
            ticketId: ticket.id,
            metadata: JSON.stringify({
              assignmentId: emsAssignment.id,
              autoAssigned: true,
              manualAssignmentRequired: true,
            }),
          },
        });
      } catch (error) {
        this.logger.error(`Failed to auto-create EMS assignment for ticket ${ticket.ticketNumber}:`, error);
        
        // Create activity log for error
        await this.prisma.activity.create({
          data: {
            type: ActivityType.TICKET_CREATED,
            description: `Ticket ${ticket.ticketNumber} created but EMS auto-assignment failed`,
            userId,
            ticketId: ticket.id,
            metadata: JSON.stringify({
              transportMode: 'AMBULANCE_RED_CRESCENT',
              autoAssignmentError: true,
              error: error instanceof Error ? error.message : String(error),
            }),
          },
        });
      }

    return ticket;
  }

  private buildOrderBy(sortBy?: string, sortOrder?: string): any[] {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    if (sortBy === 'priority') {
      return [{ priority: order }, { createdAt: 'desc' }];
    } else if (sortBy === 'status') {
      return [{ status: order }, { createdAt: 'desc' }];
    } else if (sortBy === 'updatedAt') {
      return [{ updatedAt: order }, { createdAt: 'desc' }];
    } else {
      // Default: sort by createdAt (newest first)
      return [{ createdAt: order }];
    }
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
          emsStatusUpdatedByUser: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          emsAssignments: {
            include: {
              ambulance: {
                select: {
                  id: true,
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
              createdByUser: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: {
              assignedAt: 'desc',
            },
          },
        },
        orderBy: this.buildOrderBy(filters?.sortBy, filters?.sortOrder),
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
        emsStatusUpdatedByUser: {
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
      emsContactTime: updateData.emsContactTime ? new Date(updateData.emsContactTime) : undefined,
      actualArrival: updateData.actualArrival ? new Date(updateData.actualArrival) : undefined,
    };
    
    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: {
        ...processedUpdateData,
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

  // Update EMS assignment status with immediate ticket status synchronization
  async updateEMSStatus(
    id: string, 
    emsStatus: AssignmentStatus, 
    userId: string, 
    userRole: UserRole,
    notes?: string
  ) {
    const ticket = await this.findById(id);

    // Validate EMS permissions
    if (userRole !== UserRole.EMS && userRole !== UserRole.ADMIN && userRole !== UserRole.RCC) {
      throw new ForbiddenException('Only EMS, ADMIN, or RCC can update EMS status');
    }

    // Validate EMS status transition
    if (!StatusMappingService.isValidEMSStatusTransition(ticket.emsAssignmentStatus, emsStatus)) {
      throw new BadRequestException(
        `Invalid EMS status transition from ${ticket.emsAssignmentStatus} to ${emsStatus}`
      );
    }

    // Map EMS status to ticket status
    const newTicketStatus = StatusMappingService.mapEMSToTicket(emsStatus);

    // Find the latest EMS assignment for this ticket
    const latestAssignment = await this.prisma.eMSAssignment.findFirst({
      where: { ticketId: id },
      orderBy: { assignedAt: 'desc' },
    });

    if (!latestAssignment) {
      // Create a new EMS assignment if none exists
      await this.prisma.eMSAssignment.create({
        data: {
          ticketId: id,
          assignedAt: new Date(),
          status: emsStatus,
          createdBy: userId,
          // Update timing fields based on status
          ...(emsStatus === AssignmentStatus.EMS_CONTACT && { emsContactTime: new Date() }),
          ...(emsStatus === AssignmentStatus.EMS_ARRIVAL && { actualArrivalTime: new Date() }),
          ...(emsStatus === AssignmentStatus.DEPARTED && { journeyStartTime: new Date() }),
          ...(emsStatus === AssignmentStatus.ARRIVED && { journeyEndTime: new Date() }),
          ...(notes && { notes }),
        },
      });
    } else {
      // Update the existing EMS assignment status
      await this.prisma.eMSAssignment.update({
        where: { id: latestAssignment.id },
        data: {
          status: emsStatus,
          // Update timing fields based on status
          ...(emsStatus === AssignmentStatus.EMS_CONTACT && { emsContactTime: new Date() }),
          ...(emsStatus === AssignmentStatus.EMS_ARRIVAL && { actualArrivalTime: new Date() }),
          ...(emsStatus === AssignmentStatus.DEPARTED && { journeyStartTime: new Date() }),
          ...(emsStatus === AssignmentStatus.ARRIVED && { journeyEndTime: new Date() }),
          ...(notes && { notes }),
        },
      });
    }

    // Update ticket status and EMS status fields
    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: {
        emsAssignmentStatus: emsStatus,
        status: newTicketStatus,
        emsStatusUpdatedAt: new Date(),
        emsStatusUpdatedBy: userId,
        // Set actual arrival time when EMS arrives at destination
        ...(emsStatus === AssignmentStatus.ARRIVED && { actualArrival: new Date() }),
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
        emsStatusUpdatedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create activity log for EMS status change
    await this.prisma.activity.create({
      data: {
        type: ActivityType.TICKET_UPDATED,
        description: `Ticket ${ticket.ticketNumber} EMS status changed from ${ticket.emsAssignmentStatus || 'NONE'} to ${emsStatus}`,
        userId,
        ticketId: ticket.id,
        metadata: JSON.stringify({
          previousEMSStatus: ticket.emsAssignmentStatus,
          newEMSStatus: emsStatus,
          previousTicketStatus: ticket.status,
          newTicketStatus: newTicketStatus,
          notes,
        }),
      },
    });

    // Emit WebSocket notification for both EMS and ticket status changes
    this.ticketsGateway.emitTicketStatusChanged(updatedTicket, ticket.status);

    this.logger.log(
      `Ticket ${ticket.ticketNumber} EMS status updated: ${ticket.emsAssignmentStatus} -> ${emsStatus}, Ticket status: ${ticket.status} -> ${newTicketStatus}`
    );

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
      this.prisma.ticket.count({ 
        where: { 
          ...where, 
          emsAssignments: {
            some: {
              status: 'EMS_CONTACT'
            }
          }
        } 
      }),
      this.prisma.ticket.count({ 
        where: { 
          ...where, 
          emsAssignments: {
            some: {
              status: 'EMS_ARRIVAL'
            }
          }
        } 
      }),
      this.prisma.ticket.count({ 
        where: { 
          ...where, 
          emsAssignments: {
            some: {
              status: 'DEPARTED'
            }
          }
        } 
      }),
      this.prisma.ticket.count({ 
        where: { 
          ...where, 
          emsAssignments: {
            some: {
              status: 'ARRIVED'
            }
          }
        } 
      }),
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

  // Get performance comparison data
  async getPerformanceComparison(
    period: 'daily' | 'weekly' | 'monthly',
    userRole?: UserRole,
    userHospitalId?: string,
    filterHospitalId?: string,
    startDate?: string,
    endDate?: string
  ) {
    
    // Build base where clause
    let where: any = { deletedAt: null };

    // Apply hospital filter
    const hospitalId = filterHospitalId || userHospitalId;
    if (hospitalId && userRole !== UserRole.ADMIN && userRole !== UserRole.RCC) {
      where.OR = [
        { originHospitalId: hospitalId },
        { destinationHospitalId: hospitalId },
      ];
    } else if (filterHospitalId) {
      where.OR = [
        { originHospitalId: filterHospitalId },
        { destinationHospitalId: filterHospitalId },
      ];
    }

    // Apply date filters
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Calculate date ranges based on period
    const now = new Date();
    let dateRange: { start: Date; end: Date };
    
    if (startDate || endDate) {
      // Use provided date range
      dateRange = {
        start: startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate) : now
      };
    } else {
      // Use default ranges based on period
      switch (period) {
        case 'daily':
          dateRange = {
            start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            end: now
          };
          break;
        case 'weekly':
          dateRange = {
            start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            end: now
          };
          break;
        case 'monthly':
          dateRange = {
            start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            end: now
          };
          break;
      }
    }


    // Get all tickets in the date range
    const tickets = await this.prisma.ticket.findMany({
      where: {
        ...where,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      select: {
        id: true,
        pathway: true,
        createdAt: true,
        status: true,
        priority: true
      }
    });


    // Generate chart data based on period
    const chartData = this.generateChartDataFromTickets(tickets, period, dateRange);
    

    // Calculate metrics
    const totalCases = tickets.length;
    const pathwayCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.pathway] = (acc[ticket.pathway] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate previous period for comparison
    const previousPeriodStart = new Date(dateRange.start.getTime() - (dateRange.end.getTime() - dateRange.start.getTime()));
    const previousTickets = await this.prisma.ticket.findMany({
      where: {
        ...where,
        createdAt: {
          gte: previousPeriodStart,
          lt: dateRange.start
        }
      }
    });

    const previousTotalCases = previousTickets.length;
    const previousChange = previousTotalCases > 0 
      ? Math.round(((totalCases - previousTotalCases) / previousTotalCases) * 100) 
      : 0;

    // Calculate average (simplified - could be more sophisticated)
    const averageCases = Math.floor((totalCases + previousTotalCases) / 2);
    const averageChange = averageCases > 0 
      ? Math.round(((totalCases - averageCases) / averageCases) * 100) 
      : 0;

    return {
      globalMetrics: {
        current: totalCases,
        previousChange: previousChange,
        averageChange: averageChange,
      },
      dailySummary: {
        currentPeriod: totalCases,
        previousPeriod: previousTotalCases,
        average: averageCases,
      },
      changeAnalysis: {
        vsPreviousPeriod: previousChange,
        vsAverage: averageChange,
        trend: previousChange > 5 ? 'up' : previousChange < -5 ? 'down' : 'stable',
      },
      chartData: {
        data: chartData,
      },
    };
  }

  private generateChartDataFromTickets(
    tickets: any[],
    period: 'daily' | 'weekly' | 'monthly',
    dateRange: { start: Date; end: Date }
  ) {
    const data = [];
    const now = new Date();

    if (period === 'daily') {
      // Generate hourly data
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now);
        hour.setHours(hour.getHours() - i);
        
        const hourStart = new Date(hour);
        hourStart.setMinutes(0, 0, 0);
        const hourEnd = new Date(hour);
        hourEnd.setMinutes(59, 59, 999);

        const hourTickets = tickets.filter(ticket => {
          const ticketDate = new Date(ticket.createdAt);
          return ticketDate >= hourStart && ticketDate <= hourEnd;
        });

        const stemi = hourTickets.filter(t => t.pathway === 'STEMI').length;
        const stroke = hourTickets.filter(t => t.pathway === 'STROKE').length;
        const trauma = hourTickets.filter(t => t.pathway === 'TRAUMA').length;
        const other = hourTickets.filter(t => !['STEMI', 'STROKE', 'TRAUMA'].includes(t.pathway)).length;

        data.push({
          date: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          stemi,
          stroke,
          trauma,
          other,
        });
      }
    } else {
      // Generate daily data for weekly/monthly
      const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const maxDays = period === 'weekly' ? 7 : Math.min(30, daysDiff);
      
      for (let i = maxDays - 1; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const dayTickets = tickets.filter(ticket => {
          const ticketDate = new Date(ticket.createdAt);
          return ticketDate >= dayStart && ticketDate <= dayEnd;
        });

        const stemi = dayTickets.filter(t => t.pathway === 'STEMI').length;
        const stroke = dayTickets.filter(t => t.pathway === 'STROKE').length;
        const trauma = dayTickets.filter(t => t.pathway === 'TRAUMA').length;
        const other = dayTickets.filter(t => !['STEMI', 'STROKE', 'TRAUMA'].includes(t.pathway)).length;
        

        data.push({
          date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          stemi,
          stroke,
          trauma,
          other,
        });
      }
    }

    return data;
  }

  // Acknowledge a critical case ticket
  async acknowledge(ticketId: string, userId: string, userRole: UserRole) {
    const ticket = await this.findById(ticketId);
    
    // Check if ticket is already acknowledged
    if (ticket.acknowledgedAt) {
      throw new BadRequestException('Ticket has already been acknowledged');
    }

    // Update ticket with acknowledgment
    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedById: userId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mrn: true,
            nationalId: true,
          },
        },
        originHospital: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        destinationHospital: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        acknowledgedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        emsStatusUpdatedByUser: {
          select: {
            id: true,
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
                id: true,
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

    // Log the acknowledgment activity
    await this.prisma.activity.create({
      data: {
        type: 'TICKET_ACKNOWLEDGED',
        description: `Ticket ${ticket.ticketNumber} acknowledged`,
        ticketId: ticketId,
        userId: userId,
        metadata: JSON.stringify({
          ticketNumber: ticket.ticketNumber,
          pathway: ticket.pathway,
          priority: ticket.priority,
        }),
      },
    });

    this.logger.log(`Ticket ${ticket.ticketNumber} acknowledged by user ${userId}`);
    
  }

  /**
   * Get recommended ambulances for a ticket with scoring
   */
  async getRecommendedAmbulances(ticketId: string): Promise<AmbulanceRecommendation[]> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        originHospital: true,
        destinationHospital: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (!ticket.originHospital) {
      throw new BadRequestException('Ticket must have an origin hospital');
    }

    // Smart filtering: Look for logs from last 7 days for origin/destination hospitals
    // This allows finding ambulances that completed origin->destination sequences
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    console.log(`[DEBUG] Ticket ${ticket.ticketNumber} EMS Contact: ${ticket.emsContactTime}`);
    console.log(`[DEBUG] Searching for zone logs in last 7 days for Origin/Destination hospitals`);

    // Get all active ambulances with zone logs for BOTH origin and destination
    const allAmbulances = await this.prisma.ambulance.findMany({
      where: {
        isActive: true,
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
        assignments: {
          where: {
            status: {
              in: ['EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED'], // Not yet arrived
            },
          },
          orderBy: {
            assignedAt: 'desc',
          },
          take: 1,
        },
        zoneLogs: {
          where: {
            // Get logs for BOTH origin and destination hospitals
            hospitalId: {
              in: [ticket.originHospitalId, ticket.destinationHospitalId].filter((id): id is string => Boolean(id)),
            },
            entryTime: {
              gte: sevenDaysAgo, // Last 7 days
            },
          },
          include: {
            hospital: true, // Include hospital info for frontend
          },
          orderBy: {
            entryTime: 'desc',
          },
          take: 100,
        },
      },
    });

    const targetAmb = allAmbulances.find(a => a.callSign.includes('4691') || a.plateNumber.includes('4691'));
    if (targetAmb) {
      console.log(`[DEBUG] Found Ambulance 4691 (ID: ${targetAmb.id}). Zone Logs: ${targetAmb.zoneLogs.length}`);
      targetAmb.zoneLogs.forEach(l => console.log(`  - Log: ${l.entryTime.toISOString()} at ${l.hospital.name}`));
    } else {
      console.log('[DEBUG] Ambulance 4691 NOT found in active list!');
    }

    if (allAmbulances.length === 0) {
      return [];
    }

    // Score each ambulance and include zone logs
    const recommendations = await Promise.all(
      allAmbulances.map(async (amb) => {
        const score = await this.scoreAmbulance(amb, ticket);
        return {
          ...score,
          zoneLogs: amb.zoneLogs, // Pass raw zone logs to frontend
        };
      })
    );

    // Sort by score (highest first)
    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Score an ambulance for a specific ticket
   */
  private async scoreAmbulance(
    ambulance: any,
    ticket: any
  ): Promise<AmbulanceRecommendation> {
    let score = 0;
    const factors: ScoreFactor[] = [];

    // 1. Distance Score (0-40 points)
    const distanceScore = await this.calculateDistanceScore(
      ambulance,
      ticket.originHospital
    );
    score += distanceScore.points;
    factors.push(distanceScore);

    // 2. Zone Familiarity Score (0-20 points)
    const familiarityScore = await this.calculateFamiliarityScore(
      ambulance.id,
      ticket.originHospitalId
    );
    score += familiarityScore.points;
    factors.push(familiarityScore);

    // 3. Current Zone Status Score (0-20 points)
    const zoneScore = await this.calculateZoneScore(
      ambulance.id,
      ticket.originHospitalId
    );
    score += zoneScore.points;
    factors.push(zoneScore);

    // 4. Recent Activity Score (0-10 points)
    const activityScore = await this.calculateActivityScore(ambulance.id);
    score += activityScore.points;
    factors.push(activityScore);

    // 5. Assignment History Score (0-10 points)
    const historyScore = await this.calculateHistoryScore(ambulance.id);
    score += historyScore.points;
    factors.push(historyScore);

    // Get additional metadata
    const zoneHistory = await this.getRecentZoneHistory(
      ambulance.id,
      ticket.originHospitalId
    );

    const estimatedArrival = await this.estimateArrival(
      ambulance,
      ticket.originHospital
    );

    const lastGPSUpdate = await this.getLastGPSUpdate(ambulance.id);

    const recentAssignments = await this.getRecentAssignmentCount(ambulance.id);

    return {
      ambulance: {
        id: ambulance.id,
        callSign: ambulance.callSign,
        plateNumber: ambulance.plateNumber,
        type: ambulance.type,
        status: ambulance.status,
        currentLocationLat: ambulance.currentLocationLat,
        currentLocationLng: ambulance.currentLocationLng,
        driver: ambulance.driver,
      },
      score,
      factors,
      estimatedArrivalMinutes: estimatedArrival,
      distanceKm: distanceScore.distance,
      zoneHistory,
      lastGPSUpdate,
      recentAssignments,
    };
  }

  /**
   * Calculate distance score (0-40 points)
   */
  private async calculateDistanceScore(
    ambulance: any,
    originHospital: any
  ): Promise<ScoreFactor & { distance: number | null }> {
    if (!ambulance.currentLocationLat || !ambulance.currentLocationLng) {
      return {
        name: 'Distance',
        points: 0,
        maxPoints: 40,
        description: 'No GPS location available',
        distance: null,
      };
    }

    if (!originHospital.latitude || !originHospital.longitude) {
      return {
        name: 'Distance',
        points: 0,
        maxPoints: 40,
        description: 'Hospital location not available',
        distance: null,
      };
    }

    const distance = this.calculateHaversineDistance(
      ambulance.currentLocationLat,
      ambulance.currentLocationLng,
      originHospital.latitude,
      originHospital.longitude
    );

    let points = 0;
    let description = '';

    if (distance < 1) {
      points = 40;
      description = `Very close (${distance.toFixed(2)} km)`;
    } else if (distance < 3) {
      points = 30;
      description = `Close (${distance.toFixed(2)} km)`;
    } else if (distance < 5) {
      points = 20;
      description = `Moderate distance (${distance.toFixed(2)} km)`;
    } else if (distance < 10) {
      points = 10;
      description = `Far (${distance.toFixed(2)} km)`;
    } else {
      points = 0;
      description = `Very far (${distance.toFixed(2)} km)`;
    }

    return {
      name: 'Distance',
      points,
      maxPoints: 40,
      description,
      distance,
    };
  }

  /**
   * Calculate zone familiarity score (0-20 points)
   */
  private async calculateFamiliarityScore(
    ambulanceId: string,
    hospitalId: string
  ): Promise<ScoreFactor> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentVisits = await this.prisma.ambulanceZoneLog.count({
      where: {
        ambulanceId,
        hospitalId,
        entryTime: { gte: sevenDaysAgo },
      },
    });

    const monthlyVisits = await this.prisma.ambulanceZoneLog.count({
      where: {
        ambulanceId,
        hospitalId,
        entryTime: { gte: thirtyDaysAgo },
      },
    });

    let points = 0;
    let description = '';

    if (recentVisits > 0) {
      points = 20;
      description = `Visited ${recentVisits} time(s) in last 7 days`;
    } else if (monthlyVisits > 0) {
      points = 10;
      description = `Visited ${monthlyVisits} time(s) in last 30 days`;
    } else {
      points = 0;
      description = 'Never visited this hospital';
    }

    return {
      name: 'Zone Familiarity',
      points,
      maxPoints: 20,
      description,
    };
  }

  /**
   * Calculate current zone status score (0-20 points)
   */
  private async calculateZoneScore(
    ambulanceId: string,
    hospitalId: string
  ): Promise<ScoreFactor> {
    // Check if currently in the zone
    const currentZone = await this.prisma.ambulanceZoneLog.findFirst({
      where: {
        ambulanceId,
        hospitalId,
        exitTime: null,
      },
    });

    if (currentZone) {
      return {
        name: 'Current Zone',
        points: 20,
        maxPoints: 20,
        description: 'Currently in origin hospital zone',
      };
    }

    // Check if in a nearby zone
    const nearbyZone = await this.prisma.ambulanceZoneLog.findFirst({
      where: {
        ambulanceId,
        exitTime: null,
      },
      include: {
        hospital: true,
      },
    });

    if (nearbyZone) {
      return {
        name: 'Current Zone',
        points: 10,
        maxPoints: 20,
        description: `Currently in ${nearbyZone.hospital.name} zone`,
      };
    }

    return {
      name: 'Current Zone',
      points: 0,
      maxPoints: 20,
      description: 'Not in any hospital zone',
    };
  }

  /**
   * Calculate activity score (0-10 points)
   */
  private async calculateActivityScore(ambulanceId: string): Promise<ScoreFactor> {
    const latestGPS = await this.prisma.gPSTrackingLog.findFirst({
      where: { ambulanceId },
      orderBy: { timestamp: 'desc' },
    });

    if (!latestGPS) {
      return {
        name: 'Recent Activity',
        points: 0,
        maxPoints: 10,
        description: 'No GPS data available',
      };
    }

    const ageMinutes = (Date.now() - latestGPS.timestamp.getTime()) / 60000;

    let points = 0;
    let description = '';

    if (ageMinutes < 5) {
      points = 10;
      description = 'Very recent GPS update (<5 mins)';
    } else if (ageMinutes < 15) {
      points = 5;
      description = 'Recent GPS update (<15 mins)';
    } else {
      points = 0;
      description = `GPS update ${Math.round(ageMinutes)} mins ago`;
    }

    return {
      name: 'Recent Activity',
      points,
      maxPoints: 10,
      description,
    };
  }

  /**
   * Calculate assignment history score (0-10 points)
   */
  private async calculateHistoryScore(ambulanceId: string): Promise<ScoreFactor> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentAssignments = await this.prisma.eMSAssignment.count({
      where: {
        ambulanceId,
        assignedAt: { gte: last24Hours },
      },
    });

    const completedAssignments = await this.prisma.eMSAssignment.count({
      where: {
        ambulanceId,
        assignedAt: { gte: last24Hours },
        status: AssignmentStatus.ARRIVED,
      },
    });

    let points = 0;
    let description = '';

    if (recentAssignments === 0) {
      points = 10;
      description = 'No recent assignments (well-rested)';
    } else if (recentAssignments <= 2) {
      points = 8;
      description = `${recentAssignments} assignment(s) in last 24h`;
    } else if (recentAssignments <= 5) {
      points = 5;
      description = `${recentAssignments} assignments in last 24h`;
    } else {
      points = 0;
      description = `${recentAssignments} assignments in last 24h (busy)`;
    }

    // Bonus for high completion rate
    if (recentAssignments > 0) {
      const completionRate = completedAssignments / recentAssignments;
      if (completionRate >= 0.8) {
        description += ' • High success rate';
      }
    }

    return {
      name: 'Assignment History',
      points,
      maxPoints: 10,
      description,
    };
  }

  /**
   * Get recent zone history for an ambulance at a specific hospital
   */
  private async getRecentZoneHistory(
    ambulanceId: string,
    hospitalId: string
  ): Promise<ZoneVisitSummary | null> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const visits = await this.prisma.ambulanceZoneLog.findMany({
      where: {
        ambulanceId,
        hospitalId,
        entryTime: { gte: thirtyDaysAgo },
      },
      include: {
        hospital: true,
      },
      orderBy: { entryTime: 'desc' },
      take: 5,
    });

    if (visits.length === 0) {
      return null;
    }

    const totalVisits = visits.length;
    const lastVisit = visits[0];
    const avgDuration =
      visits
        .filter(v => v.durationMinutes !== null)
        .reduce((sum, v) => sum + (v.durationMinutes || 0), 0) /
      Math.max(visits.filter(v => v.durationMinutes !== null).length, 1);

    return {
      hospitalId,
      hospitalName: lastVisit.hospital.name,
      totalVisits,
      lastVisitDate: lastVisit.entryTime,
      avgDurationMinutes: Math.round(avgDuration),
      recentVisits: visits.map(v => ({
        entryTime: v.entryTime,
        exitTime: v.exitTime,
        durationMinutes: v.durationMinutes,
        zoneType: v.zoneType,
      })),
    };
  }

  /**
   * Estimate arrival time in minutes
   */
  private async estimateArrival(
    ambulance: any,
    originHospital: any
  ): Promise<number | null> {
    if (!ambulance.currentLocationLat || !ambulance.currentLocationLng) {
      return null;
    }

    if (!originHospital.latitude || !originHospital.longitude) {
      return null;
    }

    const distance = this.calculateHaversineDistance(
      ambulance.currentLocationLat,
      ambulance.currentLocationLng,
      originHospital.latitude,
      originHospital.longitude
    );

    // Assume average speed of 40 km/h in city
    const avgSpeedKmh = 40;
    const estimatedMinutes = (distance / avgSpeedKmh) * 60;

    return Math.round(estimatedMinutes);
  }

  /**
   * Get last GPS update timestamp
   */
  private async getLastGPSUpdate(ambulanceId: string): Promise<Date | null> {
    const latestGPS = await this.prisma.gPSTrackingLog.findFirst({
      where: { ambulanceId },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    });

    return latestGPS?.timestamp || null;
  }

  /**
   * Get count of recent assignments
   */
  private async getRecentAssignmentCount(ambulanceId: string): Promise<number> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return await this.prisma.eMSAssignment.count({
      where: {
        ambulanceId,
        assignedAt: { gte: last24Hours },
      },
    });
  }

  /**
   * Calculate distance using Haversine formula
   */
  private calculateHaversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
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
  // End of recommendation methods
}
