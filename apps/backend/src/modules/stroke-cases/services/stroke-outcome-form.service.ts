import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StrokeOutcomeFormDto, UpdateStrokeOutcomeFormDto } from '../dto/stroke-outcome-form.dto';

@Injectable()
export class StrokeOutcomeFormService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update stroke case with outcome form data
   */
  async updateOutcomeForm(
    strokeCaseId: string,
    outcomeFormDto: StrokeOutcomeFormDto,
    userId: string,
  ) {
    // Check if stroke case exists
    const existingCase = await this.prisma.strokeCase.findUnique({
      where: { id: strokeCaseId },
      include: {
        patient: true,
        originHospital: true,
        destinationHospital: true,
      },
    });

    if (!existingCase) {
      throw new NotFoundException('Stroke case not found');
    }

    // Calculate completeness percentage (use provided value or calculate)
    const completenessPercentage = outcomeFormDto.outcomePercentageCompleteness ?? 
      this.calculateCompleteness(outcomeFormDto);

    // Prepare update data
    const updateData = {
      ...outcomeFormDto,
      outcomeFormCompleted: outcomeFormDto.outcomeFormCompleted ?? true,
      outcomeFormCompletionDate: outcomeFormDto.outcomeFormCompletionDate 
        ? new Date(outcomeFormDto.outcomeFormCompletionDate)
        : new Date(),
      outcomePercentageCompleteness: completenessPercentage,
      updatedAt: new Date(),
    };

    // Update the stroke case
    const updatedCase = await this.prisma.strokeCase.update({
      where: { id: strokeCaseId },
      data: updateData,
      include: {
        patient: true,
        originHospital: true,
        destinationHospital: true,
        createdBy: true,
      },
    });

    return updatedCase;
  }

  /**
   * Get stroke case outcome form data
   */
  async getOutcomeForm(strokeCaseId: string) {
    const strokeCase = await this.prisma.strokeCase.findUnique({
      where: { id: strokeCaseId },
      select: {
        id: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
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
        // Outcome form fields
        dischargeType: true,
        followUpNotCompletedReason: true,
        followUpSpecify: true,
        followUpType: true,
        dischargeModifiedRankinScale: true,
        followUpModifiedRankinScale: true,
        closureReport: true,
        functionalStatus: true,
        mortality: true,
        outcomeFormCompleted: true,
        outcomeFormCompletionDate: true,
        outcomePercentageCompleteness: true,
        // Existing discharge fields
        dischargeDestination: true,
        dischargeDate: true,
        lengthOfStayDays: true,
        complications: true,
        followUpCallCompleted: true,
        followUpCallDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!strokeCase) {
      throw new NotFoundException('Stroke case not found');
    }

    return strokeCase;
  }

  /**
   * Calculate outcome form completeness percentage
   */
  calculateCompleteness(strokeCase: any): number {
    const outcomeFields = [
      'dischargeType',
      'followUpNotCompletedReason',
      'followUpSpecify',
      'followUpType',
      'dischargeModifiedRankinScale',
      'followUpModifiedRankinScale',
      'closureReport',
      'functionalStatus',
      'mortality',
    ];

    const completedFields = outcomeFields.filter(field => {
      const value = strokeCase[field];
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((completedFields.length / outcomeFields.length) * 100);
  }

  /**
   * Get stroke cases with outcome form completeness status
   */
  async getCasesWithCompleteness(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const cases = await this.prisma.strokeCase.findMany({
      skip,
      take: limit,
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
            nationalId: true,
          },
        },
        originHospital: {
          select: {
            name: true,
          },
        },
        destinationHospital: {
          select: {
            name: true,
          },
        },
        currentStatus: true,
        strokeType: true,
        createdAt: true,
        updatedAt: true,
        // Outcome form fields
        dischargeType: true,
        followUpNotCompletedReason: true,
        followUpSpecify: true,
        followUpType: true,
        dischargeModifiedRankinScale: true,
        followUpModifiedRankinScale: true,
        closureReport: true,
        functionalStatus: true,
        mortality: true,
        outcomeFormCompleted: true,
        outcomeFormCompletionDate: true,
        outcomePercentageCompleteness: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Use stored completeness percentage
    const casesWithCompleteness = cases.map(case_ => ({
      ...case_,
      outcomeFormCompleteness: case_.outcomePercentageCompleteness,
    }));

    const total = await this.prisma.strokeCase.count({
      where: {
        deletedAt: null,
      },
    });

    return {
      data: casesWithCompleteness,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get outcome form statistics
   */
  async getOutcomeFormStats() {
    const totalCases = await this.prisma.strokeCase.count({
      where: { deletedAt: null },
    });

    const completedForms = await this.prisma.strokeCase.count({
      where: {
        deletedAt: null,
        outcomeFormCompleted: true,
      },
    });

    const incompleteForms = totalCases - completedForms;

    // Get cases by completeness ranges
    const cases = await this.prisma.strokeCase.findMany({
      where: { deletedAt: null },
      select: {
        outcomePercentageCompleteness: true,
      },
    });

    const highCompleteness = cases.filter(c => c.outcomePercentageCompleteness >= 80).length;
    const mediumCompleteness = cases.filter(c => c.outcomePercentageCompleteness >= 50 && c.outcomePercentageCompleteness < 80).length;
    const lowCompleteness = cases.filter(c => c.outcomePercentageCompleteness < 50).length;

    return {
      totalCases,
      completedForms,
      incompleteForms,
      completionRate: totalCases > 0 ? Math.round((completedForms / totalCases) * 100) : 0,
      completenessDistribution: {
        high: highCompleteness,
        medium: mediumCompleteness,
        low: lowCompleteness,
      },
    };
  }
}
