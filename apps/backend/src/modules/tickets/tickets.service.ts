import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TicketStatus, UserRole, ActivityType, AssignmentStatus, BedStatus, CaseType } from '@prisma/client';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto, UpdateTicketStatusDto, AssignTicketDto } from './dto/update-ticket.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { TicketsGateway } from './tickets.gateway';
import { EmsAssignmentsService } from '../ems-assignments/ems-assignments.service';
import { StatusMappingService } from '../../common/services/status-mapping.service';
import { AmbulanceRecommendation, ScoreFactor, ZoneVisitSummary } from './types/recommendation.types';
import { AccessLogService, EntityType } from '../../common/services/access-log.service';
import { EMSETAService } from '../../common/services/ems-eta.service';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { CriticalTimeMonitorService } from '../../modules/notifications/services/critical-time-monitor.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private prisma: PrismaService,
    private ticketsGateway: TicketsGateway,
    private configService: ConfigService,
    private accessLogService: AccessLogService,
    private emsEtaService: EMSETAService,
    private emsAssignmentsService: EmsAssignmentsService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => CriticalTimeMonitorService))
    private criticalTimeMonitorService?: CriticalTimeMonitorService,
  ) {
    this.logger = new Logger(TicketsService.name);
  }

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
      [UserRole.ED_NURSE]: [TicketStatus.ASSIGNED, TicketStatus.IN_TRANSPORT, TicketStatus.COMPLETED],
      [UserRole.UNIT_NURSE]: [TicketStatus.ASSIGNED, TicketStatus.IN_TRANSPORT, TicketStatus.COMPLETED],
      [UserRole.BED_COORDINATOR]: [TicketStatus.ASSIGNED, TicketStatus.IN_TRANSPORT, TicketStatus.COMPLETED],
      [UserRole.SUPPORT]: [], // Support role doesn't manage transfer tickets
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

    // Fetch patient and hospital names for ticket number
    const [patient, originHospital, destinationHospital] = await Promise.all([
      this.prisma.patient.findUnique({
        where: { id: createTicketDto.patientId },
        select: { firstName: true, lastName: true },
      }),
      this.prisma.hospital.findUnique({
        where: { id: createTicketDto.originHospitalId },
        select: { name: true },
      }),
      createTicketDto.destinationHospitalId
        ? this.prisma.hospital.findUnique({
          where: { id: createTicketDto.destinationHospitalId },
          select: { name: true },
        })
        : Promise.resolve(null),
    ]);

    // Generate ticket number with format: pathway | patientFullName | origin → destination
    const patientFullName = patient
      ? `${patient.firstName} ${patient.lastName}`.trim()
      : 'Unknown Patient';
    const pathway = createTicketDto.pathway || 'GENERAL';
    const originName = originHospital?.name || 'Unknown Origin';
    const destinationName = destinationHospital?.name ?? 'TBD';
    const ticketNumber = `${pathway} | ${patientFullName} | ${originName} → ${destinationName}`;

    // Create ticket with audit trail
    const { requiredResources, triageTime, symptomOnsetTime, bedAssignment, ...ticketData } = createTicketDto;

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

    // Explicitly log the access for ticket creation
    try {
      await this.accessLogService.logAccess({
        entityType: EntityType.TICKET,
        entityId: ticket.id,
        userId,
        accessType: 'CREATE',
        accessMethod: 'API',
        reason: `Ticket ${ticketNumber} created via create endpoint`,
      });
    } catch (error) {
      // Don't fail the creation if logging fails
      console.error('Failed to log ticket creation access:', error);
    }

    // Emit WebSocket notification
    this.ticketsGateway.emitTicketCreated(ticket);

    // Emit emergency alert if needed
    if (ticket.isEmergency || ticket.priority === 'EMERGENCY') {
      this.ticketsGateway.emitEmergencyTicket(ticket);
    }

    // Create ticket assignment notification for all tickets with destination hospital
    if (ticket.destinationHospitalId) {
      try {
        this.logger.log(
          `Attempting to create ticket assignment notification for ticket ${ticket.id}, destination hospital ${ticket.destinationHospitalId}`,
        );
        const notification = await this.notificationsService.createTicketAssignmentNotification(
          ticket.id,
          ticket.destinationHospitalId,
        );
        if (notification) {
          this.logger.log(
            `Successfully created ticket assignment notification ${notification.id} for ticket ${ticket.id} - destination hospital users notified`,
          );
        } else {
          this.logger.warn(
            `Ticket assignment notification returned null for ticket ${ticket.id} (likely no hospital users found)`,
          );
        }
      } catch (error) {
        this.logger.error(
          `=== Failed to create ticket assignment notification for ticket ${ticket.id} ===`,
        );
        this.logger.error(`Error: ${(error as Error).message}`);
        this.logger.error(`Stack: ${(error as Error).stack}`);
        // Don't fail ticket creation if notification fails
      }
    } else {
      this.logger.debug(`Ticket ${ticket.id} has no destination hospital, skipping assignment notification`);
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
    filters?: TicketFilterDto,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const skip = (page - 1) * limit;

    let where: any = { deletedAt: null };
    const isSearch = filters?.search;

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
      if (filters.status) {
        if (typeof filters.status === 'string' && filters.status.includes(',')) {
          where.status = { in: filters.status.split(',') };
        } else {
          where.status = filters.status;
        }
      }
      if (filters.priority) where.priority = filters.priority;
      if (filters.pathway) {
        if (typeof filters.pathway === 'string' && filters.pathway.includes(',')) {
          where.pathway = { in: filters.pathway.split(',') };
        } else {
          where.pathway = filters.pathway;
        }
      }
      if (filters.originHospitalId) where.originHospitalId = filters.originHospitalId;
      if (filters.destinationHospitalId) where.destinationHospitalId = filters.destinationHospitalId;
      if (filters.patientId) where.patientId = filters.patientId;
      if (filters.assignedToId) where.assignedToId = filters.assignedToId;
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = endDate;
        }
      }

      if (filters.emsStatus && filters.emsStatus !== '') {
        if (filters.emsStatus === 'ASSIGNED') {
          where.emsAssignments = {
            some: {
              status: {
                in: [AssignmentStatus.EMS_CONTACT, AssignmentStatus.EMS_ARRIVAL],
              },
            },
          };
        } else {
          where.emsAssignments = {
            some: {
              status: filters.emsStatus as AssignmentStatus,
            },
          };
        }
      }

      if (filters.search) {
        const searchCondition = {
          OR: [
            { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
            {
              patient: {
                OR: [
                  { firstName: { contains: filters.search, mode: 'insensitive' } },
                  { lastName: { contains: filters.search, mode: 'insensitive' } },
                  { mrn: { contains: filters.search, mode: 'insensitive' } },
                  { nationalId: { contains: filters.search, mode: 'insensitive' } },
                ]
              }
            },
            // Search in related cases
            {
              traumaCases: {
                some: {
                  chiefComplaint: { contains: filters.search, mode: 'insensitive' }
                }
              }
            },
            {
              strokeCases: {
                some: {
                  chiefComplaint: { contains: filters.search, mode: 'insensitive' }
                }
              }
            },
            {
              stemiCases: {
                some: {
                  presentingSymptoms: { contains: filters.search, mode: 'insensitive' }
                }
              }
            }
          ],
        };

        const hasOtherFilters = Object.keys(where).filter(k => k !== 'deletedAt' && k !== 'emsAssignments' && k !== 'OR').length > 0;

        // If we have an existing OR condition (e.g. from hospital filter), we need to handle it carefully
        if (where.OR && Array.isArray(where.OR)) {
          if (!where.AND) {
            where.AND = [];
          }
          // Wrap the search condition in an AND with the existing constraints
          where.AND.push(searchCondition);
        } else if (hasOtherFilters || where.emsAssignments) {
          if (!where.AND) {
            where.AND = [];
          }
          where.AND.push(searchCondition);
        } else {
          where.OR = searchCondition.OR;
        }
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
          stemiCases: {
            select: {
              triageTime: true,
              symptomOnset: true,
            },
          },
          strokeCases: {
            select: {
              timeOfTriage: true,
              timeOfSymptomOnset: true,
              symptomOnset: true,
            },
          },
        },
        orderBy: this.buildOrderBy(filters?.sortBy, filters?.sortOrder),
      }),
      this.prisma.ticket.count({ where }),
    ]);

    // Log search operations for HIPAA compliance
    if (isSearch && userId && tickets.length > 0) {
      // Log access for each ticket returned in search results
      const logPromises = tickets.map((ticket) =>
        this.accessLogService.logAccess({
          entityType: EntityType.TICKET,
          entityId: ticket.id,
          userId,
          accessType: 'SEARCH',
          accessMethod: 'API',
          ipAddress,
          userAgent,
          reason: `Searched tickets with query: "${filters.search}"`,
        }).catch((err) => {
          // Don't fail the request if logging fails
          console.error('Failed to log search access:', err);
        })
      );
      // Log asynchronously without blocking the response
      Promise.all(logPromises).catch(() => {
        // Ignore errors
      });
    }

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
        emsAssignments: {
          include: {
            ambulance: {
              select: {
                id: true,
                status: true,
                callSign: true,
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
        strokeCases: {
          where: { deletedAt: null },
          select: {
            id: true,
            patientId: true,
            originHospitalId: true,
            destinationHospitalId: true,
            strokeType: true,
            ticketId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        stemiCases: {
          where: { deletedAt: null },
          select: {
            id: true,
            patientId: true,
            originHospitalId: true,
            destinationHospitalId: true,
            ticketId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        traumaCases: {
          where: { deletedAt: null },
          select: {
            id: true,
            patientId: true,
            originHospitalId: true,
            destinationHospitalId: true,
            ticketId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    }) as any;

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const allCaseIds: string[] = [];

    (ticket.traumaCases || []).forEach((case_: any) => {
      allCaseIds.push(case_.id);
    });
    (ticket.strokeCases || []).forEach((case_: any) => {
      allCaseIds.push(case_.id);
    });
    (ticket.stemiCases || []).forEach((case_: any) => {
      allCaseIds.push(case_.id);
    });

    const caseBeds = allCaseIds.length > 0 ? await this.prisma.bed.findMany({
      where: {
        caseId: { in: allCaseIds },
        caseType: { in: ['TRAUMA', 'STROKE', 'STEMI'] },
        deletedAt: null,
      },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            bedType: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        currentPatient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            dateOfBirth: true,
            gender: true,
            mrn: true,
          },
        },
      },
    }) : [];

    const patientBeds = await this.prisma.bed.findMany({
      where: {
        currentPatientId: ticket.patientId,
        caseId: null, // Beds assigned to patient but not to a case
        deletedAt: null,
      },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            bedType: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        currentPatient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            dateOfBirth: true,
            gender: true,
            mrn: true,
          },
        },
      },
    });

    const caseBedMap = new Map(caseBeds.map(bed => [bed.caseId!, bed]));

    const calculateAge = (dob: Date | null) => {
      if (!dob) return undefined;
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const enrichedTraumaCases = (ticket.traumaCases || []).map((case_: any) => {
      const assignedBed = caseBedMap.get(case_.id);
      return {
        ...case_,
        assignedBed: assignedBed ? {
          id: assignedBed.id,
          bedNumber: assignedBed.bedNumber,
          status: assignedBed.status,
          location: assignedBed.location || undefined,
          isOperational: assignedBed.isOperational,
          unit: {
            id: assignedBed.unit.id,
            name: assignedBed.unit.name,
            bedType: assignedBed.unit.bedType,
          },
          hospital: {
            id: assignedBed.hospital.id,
            name: assignedBed.hospital.name,
          },
          currentPatient: assignedBed.currentPatient ? {
            id: assignedBed.currentPatient.id,
            name: `${assignedBed.currentPatient.firstName} ${assignedBed.currentPatient.lastName}`,
            nationalId: assignedBed.currentPatient.nationalId || undefined,
            age: calculateAge(assignedBed.currentPatient.dateOfBirth),
            gender: assignedBed.currentPatient.gender || undefined,
            mrn: assignedBed.currentPatient.mrn || undefined,
          } : undefined,
        } : null,
      } as any;
    }) || [];

    const enrichedStrokeCases = (ticket.strokeCases || []).map((case_: any) => {
      const assignedBed = caseBedMap.get(case_.id);
      return {
        ...case_,
        assignedBed: assignedBed ? {
          id: assignedBed.id,
          bedNumber: assignedBed.bedNumber,
          status: assignedBed.status,
          location: assignedBed.location || undefined,
          isOperational: assignedBed.isOperational,
          unit: {
            id: assignedBed.unit.id,
            name: assignedBed.unit.name,
            bedType: assignedBed.unit.bedType,
          },
          hospital: {
            id: assignedBed.hospital.id,
            name: assignedBed.hospital.name,
          },
          currentPatient: assignedBed.currentPatient ? {
            id: assignedBed.currentPatient.id,
            name: `${assignedBed.currentPatient.firstName} ${assignedBed.currentPatient.lastName}`,
            nationalId: assignedBed.currentPatient.nationalId || undefined,
            age: calculateAge(assignedBed.currentPatient.dateOfBirth),
            gender: assignedBed.currentPatient.gender || undefined,
            mrn: assignedBed.currentPatient.mrn || undefined,
          } : undefined,
        } : null,
      } as any;
    }) || [];

    const enrichedStemiCases = (ticket.stemiCases || []).map((case_: any) => {
      const assignedBed = caseBedMap.get(case_.id);
      return {
        ...case_,
        assignedBed: assignedBed ? {
          id: assignedBed.id,
          bedNumber: assignedBed.bedNumber,
          status: assignedBed.status,
          location: assignedBed.location || undefined,
          isOperational: assignedBed.isOperational,
          unit: {
            id: assignedBed.unit.id,
            name: assignedBed.unit.name,
            bedType: assignedBed.unit.bedType,
          },
          hospital: {
            id: assignedBed.hospital.id,
            name: assignedBed.hospital.name,
          },
          currentPatient: assignedBed.currentPatient ? {
            id: assignedBed.currentPatient.id,
            name: `${assignedBed.currentPatient.firstName} ${assignedBed.currentPatient.lastName}`,
            nationalId: assignedBed.currentPatient.nationalId || undefined,
            age: calculateAge(assignedBed.currentPatient.dateOfBirth),
            gender: assignedBed.currentPatient.gender || undefined,
            mrn: assignedBed.currentPatient.mrn || undefined,
          } : undefined,
        } : null,
      } as any;
    }) || [];

    const formattedPatientBeds = patientBeds.map(bed => ({
      id: bed.id,
      bedNumber: bed.bedNumber,
      status: bed.status,
      location: bed.location || undefined,
      isOperational: bed.isOperational,
      unit: {
        id: bed.unit.id,
        name: bed.unit.name,
        bedType: bed.unit.bedType,
      },
      hospital: {
        id: bed.hospital.id,
        name: bed.hospital.name,
      },
      currentPatient: bed.currentPatient ? {
        id: bed.currentPatient.id,
        name: `${bed.currentPatient.firstName} ${bed.currentPatient.lastName}`,
        nationalId: bed.currentPatient.nationalId || undefined,
        age: calculateAge(bed.currentPatient.dateOfBirth),
        gender: bed.currentPatient.gender || undefined,
        mrn: bed.currentPatient.mrn || undefined,
      } : undefined,
    }));

    return {
      ...ticket,
      traumaCases: enrichedTraumaCases,
      strokeCases: enrichedStrokeCases,
      stemiCases: enrichedStemiCases,
      patientBeds: formattedPatientBeds,
    };
  }

  // Update ticket with status transition validation
  async update(id: string, updateTicketDto: UpdateTicketDto, userId: string, userRole: UserRole) {
    const ticket = await this.findById(id);

    // Validate user permissions for updates
    if (userRole === UserRole.EMS && ticket.assignedToId !== userId) {
      throw new ForbiddenException('Only assigned EMS can update this ticket');
    }

    const { assignedToId, requiredResources, originHospitalId, destinationHospitalId, bedAssignment, ...updateData } = updateTicketDto;

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
        // Include hospital IDs if provided
        ...(originHospitalId && { originHospitalId }),
        ...(destinationHospitalId && { destinationHospitalId }),
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

    // Explicitly log the access for ticket update
    try {
      await this.accessLogService.logAccess({
        entityType: EntityType.TICKET,
        entityId: id,
        userId,
        accessType: 'UPDATE',
        accessMethod: 'API',
        reason: `Ticket ${ticket.ticketNumber} updated via update endpoint`,
      });
    } catch (error) {
      // Don't fail the update if logging fails
      console.error('Failed to log ticket update access:', error);
    }

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

    // Explicitly log the access for ticket status update
    try {
      await this.accessLogService.logAccess({
        entityType: EntityType.TICKET,
        entityId: id,
        userId,
        accessType: 'UPDATE',
        accessMethod: 'API',
        reason: `Ticket ${ticket.ticketNumber} status changed from ${ticket.status} to ${updateStatusDto.status}`,
      });
    } catch (error) {
      // Don't fail the update if logging fails
      console.error('Failed to log ticket status update access:', error);
    }

    // Emit WebSocket notification
    this.ticketsGateway.emitTicketStatusChanged(updatedTicket, ticket.status);

    // Schedule critical time check if transfer is completed
    if (updateStatusDto.status === TicketStatus.COMPLETED && this.criticalTimeMonitorService) {
      this.criticalTimeMonitorService.scheduleCriticalTimeCheck(id).catch((error: any) => {
        this.logger.error(`Error scheduling critical time check after transfer completion:`, error);
      });
    }

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
  async getStatistics(userRole?: UserRole, hospitalId?: string, filters?: TicketFilterDto) {
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

    // Apply filters (same logic as findAll)
    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.priority) where.priority = filters.priority;
      if (filters.pathway) where.pathway = filters.pathway;
      if (filters.originHospitalId) where.originHospitalId = filters.originHospitalId;
      if (filters.destinationHospitalId) where.destinationHospitalId = filters.destinationHospitalId;
      if (filters.patientId) where.patientId = filters.patientId;
      if (filters.assignedToId) where.assignedToId = filters.assignedToId;

      // Apply date filters
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = endDate;
        }
      }

      if (filters.emsStatus && filters.emsStatus !== '') {
        if (filters.emsStatus === 'ASSIGNED') {
          where.emsAssignments = {
            some: {
              status: {
                in: [AssignmentStatus.EMS_CONTACT, AssignmentStatus.EMS_ARRIVAL],
              },
            },
          };
        } else {
          where.emsAssignments = {
            some: {
              status: filters.emsStatus as AssignmentStatus,
            },
          };
        }
      }
    }

    const [total, pending, assigned, inTransport, completed, cancelled] = await Promise.all([
      this.prisma.ticket.count({ where }),
      // Pending
      this.prisma.ticket.count({
        where: {
          ...where,
          status: TicketStatus.PENDING
        }
      }),
      // Assigned
      this.prisma.ticket.count({
        where: {
          ...where,
          status: TicketStatus.ASSIGNED
        }
      }),
      // In Transport
      this.prisma.ticket.count({
        where: {
          ...where,
          status: TicketStatus.IN_TRANSPORT
        }
      }),
      // Completed
      this.prisma.ticket.count({
        where: {
          ...where,
          status: TicketStatus.COMPLETED
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

    // Schedule critical time check after acknowledgment
    if (this.criticalTimeMonitorService) {
      this.criticalTimeMonitorService.scheduleCriticalTimeCheck(ticketId).catch((error: any) => {
        this.logger.error(`Error scheduling critical time check after acknowledgment:`, error);
      });
    }

    return updatedTicket;
  }

  /**
   * Get incoming critical cases for RCC
   * Returns critical cases (STEMI/STROKE) that are incoming to hospitals
   * This is a list view for RCC, not notifications
   */
  async getRCCIncomingCases() {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const criticalCases = await this.prisma.ticket.findMany({
        where: {
          deletedAt: null,
          status: {
            not: 'COMPLETED',
          },
          destinationHospitalId: {
            not: null,
          },
          pathway: {
            in: ['STEMI', 'STROKE'],
          },
          OR: [
            { priority: 'CRITICAL' },
            { priority: 'EMERGENCY' },
            { isEmergency: true },
          ],
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true,
              dateOfBirth: true,
              gender: true,
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
            },
          },
          acknowledgedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          emsAssignments: {
            where: {
              deletedAt: null,
            },
            include: {
              ambulance: {
                select: {
                  id: true,
                  callSign: true,
                  plateNumber: true,
                },
              },
              driver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              assignedAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return criticalCases;
    } catch (error) {
      this.logger.error(`Error fetching RCC incoming critical cases: ${(error as Error).message}`);
      throw error;
    }
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

        // VIRTUAL ZONE LOG INJECTION
        // If the ambulance is physically in the zone (< 2.5km) but has no OPEN log (all logs have exitTime),
        // we inject a "Virtual" log so the frontend correctly identifies it as "At Hospital".
        // This handles cases where the entry log was missed or the exit log was premature.
        let patchedZoneLogs = [...amb.zoneLogs];

        // Check physical presence (using the distance calculated in scoreAmbulance or re-calculating)
        // score.distanceKm is the distance to Origin from calculateMissionEstimates
        if (score.distanceKm !== null && score.distanceKm < 2.5) {
          // Check if there is an active log for the origin hospital
          const hasActiveLog = patchedZoneLogs.some(l =>
            l.hospitalId === ticket.originHospitalId && !l.exitTime
          );

          if (!hasActiveLog) {
            console.log(`[DEBUG] Injecting VIRTUAL Zone Log for ${amb.callSign} at ${ticket.originHospital.name}`);
            const virtualLog: any = {
              id: 'virtual-' + Date.now(),
              ambulanceId: amb.id,
              hospitalId: ticket.originHospitalId!,
              hospital: ticket.originHospital,
              entryTime: new Date(), // "Just Arrived" (or maintain 'now' to show current)
              exitTime: null,
              durationMinutes: 0,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            // Add to top of logs
            patchedZoneLogs.unshift(virtualLog);
          }
        }

        return {
          ...score,
          zoneLogs: patchedZoneLogs, // Return patched logs
        };
      })
    );

    // Sort by score (highest first), but prioritize ETA to origin
    return recommendations.sort((a, b) => {
      // Primary sort: Availability (Active assignments get lower priority)
      const aIsFree = a.ambulance.status === 'IDLE';
      const bIsFree = b.ambulance.status === 'IDLE';
      if (aIsFree && !bIsFree) return -1;
      if (!aIsFree && bIsFree) return 1;

      // Secondary sort: ETA to Origin (if available) - Ascending (Lower is better)
      if (a.etaToOrigin !== null && b.etaToOrigin !== null) {
        // If difference is significant (> 5 mins), prioritize faster one
        const etaDiff = a.etaToOrigin - b.etaToOrigin;
        if (Math.abs(etaDiff) > 5) {
          return etaDiff; // Lower ETA comes first
        }
      }

      // Tertiary sort: Overall Score - Descending (Higher is better)
      return b.score - a.score;
    });
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

    // Calculate mission value estimates (ETA to Origin and Destination)
    const estimates = await this.calculateMissionEstimates(
      ambulance,
      ticket.originHospital,
      ticket.destinationHospital
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
      estimatedArrivalMinutes: estimates.etaToOrigin, // Legacy mapping
      etaToOrigin: estimates.etaToOrigin,
      etaToDestination: estimates.etaToDestination,
      distanceKm: estimates.distanceToOrigin, // Use distance to origin
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
   * Calculate mission estimates (ETA to Origin, ETA to Destination)
   */
  private async calculateMissionEstimates(
    ambulance: any,
    originHospital: any,
    destinationHospital: any
  ): Promise<{
    etaToOrigin: number | null;
    etaToDestination: number | null;
    distanceToOrigin: number | null
  }> {
    const result: {
      etaToOrigin: number | null;
      etaToDestination: number | null;
      distanceToOrigin: number | null
    } = {
      etaToOrigin: null,
      etaToDestination: null,
      distanceToOrigin: null
    };

    if (!ambulance.currentLocationLat || !ambulance.currentLocationLng) {
      return result;
    }

    if (!originHospital || !originHospital.latitude || !originHospital.longitude) {
      return result;
    }

    // 1. Calculate ETA: Ambulance -> Origin (Pickup)
    try {
      // Optimization: Check straight-line distance first. 
      // If ambulance is very close (< 1km), assume 0-1 min ETA to avoid OSRM routing weirdness (U-turns, etc.)
      const straightDist = this.calculateHaversineDistance(
        ambulance.currentLocationLat,
        ambulance.currentLocationLng,
        originHospital.latitude,
        originHospital.longitude
      );

      if (straightDist < 1.0) {
        result.etaToOrigin = 1; // "Less than 1 min"
        result.distanceToOrigin = straightDist;
      } else {
        const originRoute = await this.emsEtaService.calculateETAWithRouting(
          { lat: ambulance.currentLocationLat, lng: ambulance.currentLocationLng },
          { lat: originHospital.latitude, lng: originHospital.longitude }
        );
        result.etaToOrigin = originRoute.durationMinutes;
        result.distanceToOrigin = originRoute.distanceKm;
      }
    } catch (error) {
      this.logger.warn(`Failed to calculate ETA to Origin: ${(error as Error).message}`);
      // Fallback for Origin
      const dist = this.calculateHaversineDistance(
        ambulance.currentLocationLat,
        ambulance.currentLocationLng,
        originHospital.latitude,
        originHospital.longitude
      );
      result.etaToOrigin = Math.round((dist / 40) * 60);
      result.distanceToOrigin = dist;
    }

    // 2. Calculate ETA: Origin -> Destination (Dropoff)
    // NOTE: This assumes straight drive from Origin to Destination. 
    // Ideally we add Ambulance -> Origin -> Destination, but this is a good estimate for the second leg.
    if (destinationHospital && destinationHospital.latitude && destinationHospital.longitude) {
      try {
        const destRoute = await this.emsEtaService.calculateETAWithRouting(
          { lat: originHospital.latitude, lng: originHospital.longitude },
          { lat: destinationHospital.latitude, lng: destinationHospital.longitude }
        );
        result.etaToDestination = destRoute.durationMinutes;
      } catch (error) {
        // Fallback for Destination
        const dist = this.calculateHaversineDistance(
          originHospital.latitude,
          originHospital.longitude,
          destinationHospital.latitude,
          destinationHospital.longitude
        );
        result.etaToDestination = Math.round((dist / 40) * 60);
      }
    }

    return result;
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

  async getAccessLogs(filters: {
    page?: number;
    limit?: number;
    ticketId?: string;
    userId?: string;
    accessType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (filters.ticketId) {
      whereClause.ticketId = filters.ticketId;
    }

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters.accessType) {
      whereClause.accessType = filters.accessType;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.timestamp = {};
      if (filters.startDate) {
        whereClause.timestamp.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.timestamp.lte = new Date(filters.endDate + 'T23:59:59.999Z');
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.ticketAccessLog.findMany({
        where: whereClause,
        skip,
        take: limit,
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
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              patientId: true,
              priority: true,
              status: true,
              pathway: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.ticketAccessLog.count({ where: whereClause }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}
