import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCaseFeedbackDto } from './dto/create-case-feedback.dto';
import { UpdateCaseFeedbackDto } from './dto/update-case-feedback.dto';
import { CaseFeedbackFilterDto } from './dto/case-feedback-filter.dto';
import { CaseFeedbackStatus } from '@prisma/client';

@Injectable()
export class CaseFeedbackService {
  private readonly logger = new Logger(CaseFeedbackService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateCaseFeedbackDto, submittedById: string) {
    this.logger.log(`Creating feedback for ticket ${createDto.ticketId}`);

    // Get ticket details for destination and referring hospitals
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: createDto.ticketId },
      include: {
        destinationHospital: true,
        originHospital: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${createDto.ticketId} not found`);
    }

    return this.prisma.caseFeedback.create({
      data: {
        ticketId: createDto.ticketId,
        destinationHospitalId: ticket.destinationHospitalId,
        referringHospitalId: ticket.originHospitalId,
        reviewerName: createDto.reviewerName,
        reviewDate: new Date(createDto.reviewDate),
        receivingConsultant: createDto.receivingConsultant,
        submittedById,

        // Section B - Operational Performance
        activationAppropriateness: createDto.activationAppropriateness,
        activationInappropriateReason: createDto.activationInappropriateReason,
        activationOtherReason: createDto.activationOtherReason,

        conferenceCallEffectiveness: createDto.conferenceCallEffectiveness,
        conferenceCallIssue: createDto.conferenceCallIssue,
        conferenceCallIssueOther: createDto.conferenceCallIssueOther,

        destinationAppropriateness: createDto.destinationAppropriateness,
        destinationIssueReason: createDto.destinationIssueReason,
        destinationIssueOther: createDto.destinationIssueOther,

        transportSafety: createDto.transportSafety,
        transportSafetyIssue: createDto.transportSafetyIssue,
        transportSafetyIssueOther: createDto.transportSafetyIssueOther,

        teamSuitability: createDto.teamSuitability,
        teamInadequacyReason: createDto.teamInadequacyReason,
        teamInadequacyOther: createDto.teamInadequacyOther,

        documentationQuality: createDto.documentationQuality,
        documentationMissingElements: createDto.documentationMissingElements,
        documentationMissingOther: createDto.documentationMissingOther,

        // Section C - Pathway Evaluation
        pathwayEvaluation: createDto.pathwayEvaluation || undefined,

        // Section D - Outcome Assessment
        patientOutcome: createDto.patientOutcome,
        perinatalOutcome: createDto.perinatalOutcome,
        complicationPreventable: createDto.complicationPreventable,
        preventableStage: createDto.preventableStage,
        preventableStageOther: createDto.preventableStageOther,

        // Section E - Overall Evaluation
        rccCoordinationRating: createDto.rccCoordinationRating,
        additionalComments: createDto.additionalComments,

        status: CaseFeedbackStatus.SUBMITTED,
      },
      include: {
        ticket: {
          include: {
            patient: true,
            destinationHospital: true,
            originHospital: true,
          },
        },
        destinationHospital: true,
        referringHospital: true,
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getPendingForHospital(hospitalId: string) {
    this.logger.log(`Getting pending feedback for hospital ${hospitalId}`);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        destinationHospitalId: hospitalId,
        status: 'COMPLETED',
        completedAt: {
          gte: twoDaysAgo,
        },
        feedbacks: {
          none: {},
        },
      },
      include: {
        patient: true,
        originHospital: true,
        destinationHospital: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    return tickets;
  }

  async findAll(filters: CaseFeedbackFilterDto) {
    const where: any = {};

    if (filters.hospitalId) {
      where.OR = [
        { destinationHospitalId: filters.hospitalId },
        { referringHospitalId: filters.hospitalId },
      ];
    }

    if (filters.ticketId) {
      where.ticketId = filters.ticketId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate) {
      where.reviewDate = {
        ...where.reviewDate,
        gte: new Date(filters.startDate),
      };
    }

    if (filters.endDate) {
      where.reviewDate = {
        ...where.reviewDate,
        lte: new Date(filters.endDate),
      };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.caseFeedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          ticket: {
            include: {
              patient: true,
              destinationHospital: true,
              originHospital: true,
            },
          },
          destinationHospital: true,
          referringHospital: true,
          submittedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.caseFeedback.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const feedback = await this.prisma.caseFeedback.findUnique({
      where: { id },
      include: {
        ticket: {
          include: {
            patient: true,
            destinationHospital: true,
            originHospital: true,
          },
        },
        destinationHospital: true,
        referringHospital: true,
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback ${id} not found`);
    }

    return feedback;
  }

  async update(
    id: string,
    updateDto: UpdateCaseFeedbackDto,
    reviewedById: string,
  ) {
    const feedback = await this.prisma.caseFeedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback ${id} not found`);
    }

    return this.prisma.caseFeedback.update({
      where: { id },
      data: {
        ...updateDto,
        reviewedById,
        reviewedAt: new Date(),
      },
      include: {
        ticket: {
          include: {
            patient: true,
            destinationHospital: true,
            originHospital: true,
          },
        },
        destinationHospital: true,
        referringHospital: true,
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const feedback = await this.prisma.caseFeedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback ${id} not found`);
    }

    await this.prisma.caseFeedback.delete({
      where: { id },
    });

    return { message: 'Feedback deleted successfully' };
  }

  async getAnalytics(
    hospitalId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = {};

    if (hospitalId) {
      where.OR = [
        { destinationHospitalId: hospitalId },
        { referringHospitalId: hospitalId },
      ];
    }

    if (startDate) {
      where.reviewDate = {
        ...where.reviewDate,
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.reviewDate = {
        ...where.reviewDate,
        lte: new Date(endDate),
      };
    }

    const feedbacks = await this.prisma.caseFeedback.findMany({
      where,
    });

    const total = feedbacks.length;

    if (total === 0) {
      return {
        total: 0,
        averageRating: 0,
        activationAppropriateness: {},
        destinationAppropriateness: {},
        transportSafety: {},
        patientOutcome: {},
      };
    }

    const averageRating =
      feedbacks.reduce((sum, f) => sum + f.rccCoordinationRating, 0) / total;

    const countByField = (field: string) => {
      const counts: any = {};
      feedbacks.forEach((f: any) => {
        const value = f[field];
        if (value) {
          counts[value] = (counts[value] || 0) + 1;
        }
      });
      return counts;
    };

    return {
      total,
      averageRating: Number(averageRating.toFixed(2)),
      activationAppropriateness: countByField('activationAppropriateness'),
      destinationAppropriateness: countByField('destinationAppropriateness'),
      transportSafety: countByField('transportSafety'),
      patientOutcome: countByField('patientOutcome'),
    };
  }
}
