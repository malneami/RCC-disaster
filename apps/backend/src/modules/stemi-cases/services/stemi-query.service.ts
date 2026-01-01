import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StemiFilterDto } from '../dto/stemi-filter.dto';

@Injectable()
export class StemiQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getStemiCases(filters: StemiFilterDto) {
    const {
      patientId,
      originHospitalId,
      destinationHospitalId,
      currentStatus,
      startDate,
      endDate,
      limit = 20,
      offset = 0,
      search,
    } = filters;

    const where: any = {};

    // Apply filters
    if (patientId) where.patientId = patientId;
    if (originHospitalId) where.originHospitalId = originHospitalId;
    if (destinationHospitalId) where.destinationHospitalId = destinationHospitalId;
    if (currentStatus) where.currentStatus = currentStatus;

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // Search filter
    if (search) {
      where.OR = [
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { patient: { nationalId: { contains: search, mode: 'insensitive' } } },
        { presentingSymptoms: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const total = await this.prisma.stemiCase.count({ where });

      // Use select instead of include to avoid timeout issues
      const cases = await this.prisma.stemiCase.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          currentStatus: true,
          caseType: true,
          modeOfArrival: true,
          pathwayStarted: true,
          createdAt: true,
          updatedAt: true,
          patientId: true,
          originHospitalId: true,
          destinationHospitalId: true,
          ticketId: true,
          
          // ECG and Treatment
          ecgResult: true,
          ecgFindings: true,
          selectedTreatment: true,
          
          // Critical Timestamps
          triageTime: true,
          firstEcgTime: true,
          
          // Transfer timestamps
          transferRequestDateTime: true,
          transferArrivalDateTime: true,
          
          // Interventions and Treatments
          eligibleForPrimaryPci: true,
          pciType: true,
          pciLocation: true,
          doorOutTime: true,
          balloonInflationTime: true,
          thrombolyticGiven: true,
          thrombolyticAdminTime: true,
          fibrinolyticAbsoluteContraindications: true,
          fibrinolyticRelativeContraindications: true,
          
          // Clinical Assessment
          heartScore: true,
          clinicalRiskLevel: true,
          presentingSymptoms: true,
          symptomOnset: true,
          symptomDuration: true,
          miType: true,
          outcome: true,
          
          // Lab Results
          isTroponinPositive: true,
          troponinValue: true,
          
          // Quality Metrics
          doorToEcgMinutes: true,
          doorToBalloonMinutes: true,
          doorToNeedleMinutes: true,
          doorInDoorOutMinutes: true,
          rccActivationToDoorOutMinutes: true,
          metKpi1: true,
          metKpi2: true,
          metKpi2Direct: true,
          metKpi2Transfer: true,
          metKpi3: true,
          metKpi4: true,
          metKpi5: true,
          metKpi6: true,
          
          // Outcome Form fields
          cathLabActivationTime: true,
          cathLabArrivalTime: true,
          pciProcedureStartTime: true,
          pciProcedureCompleteTime: true,
          postPciComplications: true,
          dischargeStatus: true,
          dischargeMedications: true,
          followUpAppointmentDate: true,
          followUpAppointmentProvider: true,
          followUpCallCompleted: true,
          followUpCallDate: true,
          outcomeFormCompleted: true,
          outcomeFormCompletionDate: true,
          outcomePercentageCompleteness: true,
          
          // Additional notes
          additionalNotes: true,
          
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true,
              dateOfBirth: true,
              gender: true,
              phoneNumber: true,
              address: true,
              emergencyContact: true,
              emergencyPhone: true,
              medicalHistory: true,
              allergies: true,
              medications: true,
            }
          },
          originHospital: {
            select: { id: true, name: true, cluster: true }
          },
          destinationHospital: {
            select: { id: true, name: true, cluster: true }
          },
        },
      });

      return {
        cases,
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      console.error('[StemiQueryService] ERROR:', error.message);
      throw error;
    }
  }
}


