import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StemiOutcomeFormDto, UpdateStemiOutcomeFormDto } from '../dto/stemi-outcome-form.dto';
import { KpiMonitorService } from '../../notifications/services/kpi-monitor.service';

@Injectable()
export class StemiOutcomeFormService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => KpiMonitorService))
    private readonly kpiMonitorService: KpiMonitorService,
  ) {}

  /**
   * Update STEMI case with outcome form data
   */
  async updateOutcomeForm(
    stemiCaseId: string,
    outcomeFormDto: StemiOutcomeFormDto,
    userId: string,
  ) {
    // Check if STEMI case exists and get completion date and previous completeness
    const existingCaseCheck = await this.prisma.stemiCase.findUnique({
      where: { 
        id: stemiCaseId,
        deletedAt: null
      },
      select: {
        outcomeFormCompletionDate: true,
        outcomePercentageCompleteness: true,
      },
    });

    if (!existingCaseCheck) {
      throw new NotFoundException('STEMI case not found');
    }

    // Store previous completeness for KPI checking
    const previousCompleteness = existingCaseCheck.outcomePercentageCompleteness ?? 0;

    // Calculate completeness percentage (use provided value or calculate)
    const completenessPercentage = outcomeFormDto.outcomePercentageCompleteness ?? 
      this.calculateCompleteness(outcomeFormDto);

    // Auto-set completion date when completeness is 100% and not already set
    const shouldSetCompletionDate = completenessPercentage === 100 && 
      !existingCaseCheck?.outcomeFormCompletionDate && 
      !outcomeFormDto.outcomeFormCompletionDate;
    
    const completionDate = outcomeFormDto.outcomeFormCompletionDate
      ? new Date(outcomeFormDto.outcomeFormCompletionDate)
      : (shouldSetCompletionDate ? new Date() : existingCaseCheck?.outcomeFormCompletionDate);

    // Prepare update data with proper date conversion
    const updateData: any = {
      // Always include these fields
      outcomeFormCompleted: completionDate ? true : false,
      outcomeFormCompletionDate: completionDate,
      outcomePercentageCompleteness: completenessPercentage,
      updatedAt: new Date(),
    };

    // Convert date strings to Date objects (only if they exist and are not empty)
    if (outcomeFormDto.cathLabActivationTime && outcomeFormDto.cathLabActivationTime.trim() !== '') {
      updateData.cathLabActivationTime = new Date(outcomeFormDto.cathLabActivationTime);
    }
    if (outcomeFormDto.cathLabArrivalTime && outcomeFormDto.cathLabArrivalTime.trim() !== '') {
      updateData.cathLabArrivalTime = new Date(outcomeFormDto.cathLabArrivalTime);
    }
    if (outcomeFormDto.pciProcedureStartTime && outcomeFormDto.pciProcedureStartTime.trim() !== '') {
      updateData.pciProcedureStartTime = new Date(outcomeFormDto.pciProcedureStartTime);
    }
    if (outcomeFormDto.pciProcedureCompleteTime && outcomeFormDto.pciProcedureCompleteTime.trim() !== '') {
      updateData.pciProcedureCompleteTime = new Date(outcomeFormDto.pciProcedureCompleteTime);
    }
    if (outcomeFormDto.followUpAppointmentDate && outcomeFormDto.followUpAppointmentDate.trim() !== '') {
      updateData.followUpAppointmentDate = new Date(outcomeFormDto.followUpAppointmentDate);
    }
    if (outcomeFormDto.followUpCallDate && outcomeFormDto.followUpCallDate.trim() !== '') {
      updateData.followUpCallDate = new Date(outcomeFormDto.followUpCallDate);
    }

    // Include non-date fields from DTO (only if they are defined)
    if (outcomeFormDto.postPciComplications !== undefined) {
      updateData.postPciComplications = outcomeFormDto.postPciComplications || null;
    }
    if (outcomeFormDto.dischargeStatus !== undefined) {
      updateData.dischargeStatus = outcomeFormDto.dischargeStatus || null;
    }
    if (outcomeFormDto.dischargeMedications !== undefined) {
      updateData.dischargeMedications = outcomeFormDto.dischargeMedications || null;
    }
    if (outcomeFormDto.followUpAppointmentProvider !== undefined) {
      updateData.followUpAppointmentProvider = outcomeFormDto.followUpAppointmentProvider || null;
    }
    if (outcomeFormDto.followUpCallCompleted !== undefined) {
      updateData.followUpCallCompleted = outcomeFormDto.followUpCallCompleted;
    }

    // Update the STEMI case
    const updatedCase = await this.prisma.stemiCase.update({
      where: { 
        id: stemiCaseId,
        deletedAt: null
      },
      data: updateData,
      include: {
        patient: true,
        originHospital: true,
        destinationHospital: true,
        createdBy: true,
      },
    });

    // Cancel timers if case is completed
    if (completenessPercentage === 100 && this.kpiMonitorService) {
      this.kpiMonitorService.cancelCaseTimers(stemiCaseId);
    }

    // Check KPIs based on completeness change (fire and forget)
    this.kpiMonitorService.checkCaseKpisOnCompleteness(
      stemiCaseId,
      'STEMI',
      previousCompleteness,
      completenessPercentage,
    ).catch(error => {
      console.error('Error checking KPIs for STEMI case:', error);
    });

    return updatedCase;
  }

  /**
   * Get STEMI case outcome form data
   */
  async getOutcomeForm(stemiCaseId: string) {
    const stemiCase = await this.prisma.stemiCase.findUnique({
      where: { 
        id: stemiCaseId,
        deletedAt: null
      },
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
        // PCI Procedure Phase fields
        cathLabActivationTime: true,
        cathLabArrivalTime: true,
        pciProcedureStartTime: true,
        pciProcedureCompleteTime: true,
        // Post-PCI Management Phase fields
        postPciComplications: true,
        dischargeStatus: true,
        dischargeMedications: true,
        followUpAppointmentDate: true,
        followUpAppointmentProvider: true,
        // Outcome form management fields
        outcomeFormCompleted: true,
        outcomeFormCompletionDate: true,
        outcomePercentageCompleteness: true,
        // Existing fields
        successful: true,
        complications: true,
        dischargeDate: true,
        thirtyDayReadmission: true,
        followUpCallCompleted: true,
        followUpCallDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!stemiCase) {
      throw new NotFoundException('STEMI case not found');
    }

    return stemiCase;
  }

  /**
   * Calculate outcome form completeness percentage
   */
  calculateCompleteness(stemiCase: any): number {
    const outcomeFields = [
      'cathLabActivationTime',
      'cathLabArrivalTime',
      'pciProcedureStartTime',
      'pciProcedureCompleteTime',
      'postPciComplications',
      'dischargeStatus',
      'dischargeMedications',
      'followUpAppointmentProvider',
      'followUpCallCompleted',
    ];

    // Add followUpAppointmentDate only if followUpAppointmentProvider is YES
    if (stemiCase.followUpAppointmentProvider === 'YES') {
      outcomeFields.push('followUpAppointmentDate');
    }

    // Add followUpCallDate only if followUpCallCompleted is true
    if (stemiCase.followUpCallCompleted === true) {
      outcomeFields.push('followUpCallDate');
    }

    const completedFields = outcomeFields.filter(field => {
      const value = stemiCase[field];
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((completedFields.length / outcomeFields.length) * 100);
  }

  /**
   * Get STEMI cases with outcome form completeness status
   */
  async getCasesWithCompleteness(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const cases = await this.prisma.stemiCase.findMany({
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
        selectedTreatment: true,
        createdAt: true,
        updatedAt: true,
        // Outcome form fields
        cathLabActivationTime: true,
        cathLabArrivalTime: true,
        pciProcedureStartTime: true,
        pciProcedureCompleteTime: true,
        postPciComplications: true,
        dischargeStatus: true,
        dischargeMedications: true,
        followUpAppointmentDate: true,
        followUpAppointmentProvider: true,
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

    const total = await this.prisma.stemiCase.count({
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
    const totalCases = await this.prisma.stemiCase.count({
      where: { deletedAt: null },
    });

    const completedForms = await this.prisma.stemiCase.count({
      where: {
        deletedAt: null,
        outcomeFormCompletionDate: { not: null },
      },
    });

    const incompleteForms = totalCases - completedForms;

    // Get cases by completeness ranges
    const cases = await this.prisma.stemiCase.findMany({
      where: { deletedAt: null },
      select: {
        outcomePercentageCompleteness: true,
      },
    });

    const highCompleteness = cases.filter(c => (c.outcomePercentageCompleteness ?? 0) >= 80).length;
    const mediumCompleteness = cases.filter(c => (c.outcomePercentageCompleteness ?? 0) >= 50 && (c.outcomePercentageCompleteness ?? 0) < 80).length;
    const lowCompleteness = cases.filter(c => (c.outcomePercentageCompleteness ?? 0) < 50).length;

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
