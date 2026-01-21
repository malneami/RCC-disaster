import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StemiFilterDto } from '../dto/stemi-filter.dto';

@Injectable()
export class StemiQueryService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateAge(dob: Date | null | undefined): number | undefined {
    if (!dob) return undefined;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  async getStemiCases(filters: StemiFilterDto) {
    const {
      patientId,
      originHospitalId,
      destinationHospitalId,
      modeOfArrival,
      currentStatus,
      selectedTreatment,
      ecgResult,
      eligibleForPrimaryPci,
      thrombolyticGiven,
      isTroponinPositive,
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
    if (modeOfArrival) where.modeOfArrival = modeOfArrival;
    if (currentStatus) where.currentStatus = currentStatus;
    if (selectedTreatment) where.selectedTreatment = selectedTreatment;
    if (ecgResult) where.ecgResult = ecgResult;
    if (eligibleForPrimaryPci !== undefined) where.eligibleForPrimaryPci = eligibleForPrimaryPci;
    if (thrombolyticGiven !== undefined) where.thrombolyticGiven = thrombolyticGiven;
    if (isTroponinPositive !== undefined) where.isTroponinPositive = isTroponinPositive;

    // Date range filter
    if (startDate || endDate) {
      where.pathwayStarted = {};
      if (startDate) where.pathwayStarted.gte = new Date(startDate);
      if (endDate) where.pathwayStarted.lte = new Date(endDate + 'T23:59:59.999Z');
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
    where.deletedAt = null;

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

      // Enrich cases with assignedBed information
      const caseIds = cases.map(c => c.id);
      const beds = await this.prisma.bed.findMany({
        where: {
          caseId: { in: caseIds },
          caseType: 'STEMI',
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

      const bedMap = new Map(beds.map(bed => [bed.caseId!, bed]));

      const enrichedCases = cases.map(case_ => {
        const assignedBed = bedMap.get(case_.id);
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
              age: this.calculateAge(assignedBed.currentPatient.dateOfBirth),
              gender: assignedBed.currentPatient.gender || undefined,
              mrn: assignedBed.currentPatient.mrn || undefined,
            } : undefined,
          } : null,
        } as any;
      });

      return {
        cases: enrichedCases,
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


