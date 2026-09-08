import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateObMaternalTransferDto } from './dto/create-ob-maternal-transfer.dto';
import { UpdateObMaternalTransferDto } from './dto/update-ob-maternal-transfer.dto';
import { ObMaternalTransfer } from '@prisma/client';

@Injectable()
export class ObMaternalTransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateObMaternalTransferDto, userId: string): Promise<ObMaternalTransfer> {
    await this.validatePatientExists(dto.patientId);
    await this.validateTicketExists(dto.ticketId);
    await this.validateHospitalExists(dto.referringFacilityId);
    if (dto.destinationHospitalId) {
      await this.validateHospitalExists(dto.destinationHospitalId);
    }

    return this.prisma.obMaternalTransfer.create({
      data: {
        ticketId: dto.ticketId,
        patientId: dto.patientId,
        pregnancyCaseId: dto.pregnancyCaseId ?? null,
        createdById: userId,
        gestationalAgeWeeks: dto.gestationalAgeWeeks,
        gravida: dto.gravida ?? null,
        para: dto.para ?? null,
        sbp: dto.sbp ?? null,
        dbp: dto.dbp ?? null,
        hr: dto.hr ?? null,
        rr: dto.rr ?? null,
        temp: dto.temp ?? null,
        spo2: dto.spo2 ?? null,
        consciousness: dto.consciousness ?? null,
        bleeding: dto.bleeding ?? null,
        seizure: dto.seizure ?? null,
        suspectedConditions: dto.suspectedConditions ? (dto.suspectedConditions as any) : null,
        fetalStatus: dto.fetalStatus ?? null,
        fetalHeartRate: dto.fetalHeartRate ?? null,
        hb: dto.hb ?? null,
        platelets: dto.platelets ?? null,
        glucose: dto.glucose ?? null,
        urineProtein: dto.urineProtein ?? null,
        labsOther: dto.labsOther ? (dto.labsOther as any) : null,
        stabilizationDone: dto.stabilizationDone ? (dto.stabilizationDone as any) : null,
        referringFacilityId: dto.referringFacilityId,
        referringContactName: dto.referringContactName ?? null,
        referringContactPhone: dto.referringContactPhone ?? null,
        activationLevel: dto.activationLevel,
        expectedDeliveryMode: dto.expectedDeliveryMode,
        systemSuggestedDeliveryMode: dto.systemSuggestedDeliveryMode ?? null,
        physicianConfirmedDeliveryMode: dto.physicianConfirmedDeliveryMode ?? null,
        destinationHospitalId: dto.destinationHospitalId ?? null,
        acceptanceStatus: dto.acceptanceStatus ?? 'PENDING',
        ambulanceType: dto.ambulanceType,
      },
      include: {
        ticket: true,
        patient: true,
        pregnancyCase: { select: { id: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        referringFacility: { select: { id: true, name: true } },
        destinationHospital: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(filters: {
    ticketId?: string;
    patientId?: string;
    status?: string;
    referringFacilityId?: string;
    destinationHospitalId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.ticketId) where.ticketId = filters.ticketId;
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.status) where.status = filters.status;
    if (filters.referringFacilityId) where.referringFacilityId = filters.referringFacilityId;
    if (filters.destinationHospitalId) where.destinationHospitalId = filters.destinationHospitalId;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.obMaternalTransfer.findMany({
        where,
        include: {
        ticket: { select: { id: true, ticketNumber: true } },
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true, nationalId: true, age: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        referringFacility: { select: { id: true, name: true } },
        destinationHospital: { select: { id: true, name: true } },
        pregnancyCase: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit ?? 50,
        skip: filters.offset ?? 0,
      }),
      this.prisma.obMaternalTransfer.count({ where }),
    ]);

    return { data: items, total };
  }

  async findById(id: string) {
    const transfer = await this.prisma.obMaternalTransfer.findUnique({
      where: { id },
      include: {
        ticket: true,
        patient: true,
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        referringFacility: true,
        destinationHospital: true,
      },
    });
    if (!transfer) {
      throw new NotFoundException(`OB maternal transfer with ID ${id} not found`);
    }
    return transfer;
  }

  async update(id: string, dto: UpdateObMaternalTransferDto): Promise<ObMaternalTransfer> {
    await this.findById(id);

    if (dto.patientId) await this.validatePatientExists(dto.patientId);
    if (dto.ticketId) await this.validateTicketExists(dto.ticketId);
    if (dto.referringFacilityId) await this.validateHospitalExists(dto.referringFacilityId);
    if (dto.destinationHospitalId) await this.validateHospitalExists(dto.destinationHospitalId);

    const updateData: any = { ...dto };
    if (dto.gravida !== undefined) updateData.gravida = dto.gravida;
    if (dto.para !== undefined) updateData.para = dto.para;
    if (dto.referringContactName !== undefined) updateData.referringContactName = dto.referringContactName;
    if (dto.referringContactPhone !== undefined) updateData.referringContactPhone = dto.referringContactPhone;
    if (dto.systemSuggestedDeliveryMode !== undefined) updateData.systemSuggestedDeliveryMode = dto.systemSuggestedDeliveryMode;
    if (dto.physicianConfirmedDeliveryMode !== undefined) updateData.physicianConfirmedDeliveryMode = dto.physicianConfirmedDeliveryMode;
    if (dto.suspectedConditions !== undefined) updateData.suspectedConditions = dto.suspectedConditions;
    if (dto.stabilizationDone !== undefined) updateData.stabilizationDone = dto.stabilizationDone;
    if (dto.labsOther !== undefined) updateData.labsOther = dto.labsOther;

    return this.prisma.obMaternalTransfer.update({
      where: { id },
      data: updateData,
      include: {
        ticket: true,
        patient: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        referringFacility: { select: { id: true, name: true } },
        destinationHospital: { select: { id: true, name: true } },
      },
    });
  }

  private async validatePatientExists(patientId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { id: patientId } });
    if (!patient) {
      throw new BadRequestException(`Patient with ID ${patientId} not found`);
    }
  }

  private async validateTicketExists(ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId } });
    if (!ticket) {
      throw new BadRequestException(`Ticket with ID ${ticketId} not found`);
    }
  }

  private async validateHospitalExists(hospitalId: string) {
    const hospital = await this.prisma.hospital.findFirst({ where: { id: hospitalId, deletedAt: null } });
    if (!hospital) {
      throw new BadRequestException(`Hospital with ID ${hospitalId} not found`);
    }
  }

  /**
   * Get KPI summary for OB Maternal dashboard (hospital-based, like Stroke/STEMI)
   */
  async getKPISummary(filters: {
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters.hospitalId) {
      where.OR = [
        { referringFacilityId: filters.hospitalId },
        { destinationHospitalId: filters.hospitalId },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        where.createdAt.gte = start;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const transfers = await this.prisma.obMaternalTransfer.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        referringFacilityId: true,
        destinationHospitalId: true,
        activationLevel: true,
        pregnancyCaseId: true,
        expectedDeliveryMode: true,
        physicianConfirmedDeliveryMode: true,
        referringFacility: { select: { id: true, name: true } },
        destinationHospital: { select: { id: true, name: true } },
        pregnancyCase: {
          select: {
            id: true,
            pregnancyOutcomes: {
              take: 1,
              select: {
                maternalStatus: true,
                perinatalStatus: true,
                nicuAdmission: true,
              },
            },
          },
        },
      },
    });

    const totalCases = transfers.length;
    const maternalRedCount = transfers.filter((t) => t.activationLevel === 'MATERNAL_RED').length;
    const maternalOrangeCount = transfers.filter((t) => t.activationLevel === 'MATERNAL_ORANGE').length;

    // Outcome-based rates from PregnancyOutcome
    const withOutcome = transfers.filter(
      (t) => t.pregnancyCase?.pregnancyOutcomes?.length,
    );
    const outcomeCount = withOutcome.length;
    const maternalDeaths = withOutcome.filter(
      (t) => t.pregnancyCase?.pregnancyOutcomes?.[0]?.maternalStatus === 'DECEASED',
    ).length;
    const nicuAdmissions = withOutcome.filter(
      (t) => t.pregnancyCase?.pregnancyOutcomes?.[0]?.nicuAdmission === true,
    ).length;
    const vaginalCount = withOutcome.filter(
      (t) =>
        t.physicianConfirmedDeliveryMode === 'VAGINAL' ||
        (t.physicianConfirmedDeliveryMode === null && t.expectedDeliveryMode === 'VAGINAL'),
    ).length;
    const cesareanCount = withOutcome.filter(
      (t) =>
        t.physicianConfirmedDeliveryMode === 'CESAREAN' ||
        (t.physicianConfirmedDeliveryMode === null && t.expectedDeliveryMode === 'CESAREAN'),
    ).length;

    const maternalMortalityRate = outcomeCount > 0 ? maternalDeaths / outcomeCount : null;
    const nicuRate = outcomeCount > 0 ? nicuAdmissions / outcomeCount : null;
    const vaginalPercentage = outcomeCount > 0 ? vaginalCount / outcomeCount : null;
    const cesareanPercentage = outcomeCount > 0 ? cesareanCount / outcomeCount : null;

    // Documentation completeness: % with pregnancyCaseId and outcome
    const withCaseAndOutcome = transfers.filter(
      (t) => t.pregnancyCaseId && t.pregnancyCase?.pregnancyOutcomes?.length,
    ).length;
    const documentationCompleteness =
      totalCases > 0 ? withCaseAndOutcome / totalCases : null;

    // KPI performance for traffic lights (targets: doc >= 90%, MMR < 2%, NICU < 15%)
    const docPct = documentationCompleteness != null ? documentationCompleteness * 100 : 0;
    const mmrPct = maternalMortalityRate != null ? maternalMortalityRate * 100 : 0;
    const nicuPct = nicuRate != null ? nicuRate * 100 : 0;

    // Compliance scores: higher = better (for traffic lights)
    const mmrCompliance = Math.max(0, 100 - mmrPct * 50); // 0% MMR = 100, 2% MMR = 0
    const nicuCompliance = Math.max(0, 100 - nicuPct * (100 / 15)); // 0% NICU = 100, 15% NICU = 0

    const kpiPerformance: Record<
      string,
      { met: number; total: number; percentage: number }
    > = {
      documentation: {
        met: Math.round((docPct / 100) * totalCases),
        total: totalCases,
        percentage: docPct,
      },
      maternalMortality: {
        met: Math.round((mmrCompliance / 100) * outcomeCount),
        total: outcomeCount,
        percentage: mmrCompliance,
      },
      nicuRate: {
        met: Math.round((nicuCompliance / 100) * outcomeCount),
        total: outcomeCount,
        percentage: nicuCompliance,
      },
    };

    // byHospital: when no hospital filter, aggregate by referring facility
    let byHospital: Array<{
      hospitalId: string;
      hospitalName: string;
      totalCases: number;
      maternalRed: number;
      maternalOrange: number;
      maternalMortalityRate?: number;
      nicuRate?: number;
    }> = [];

    if (!filters.hospitalId) {
      const byRef = new Map<
        string,
        {
          hospitalId: string;
          hospitalName: string;
          totalCases: number;
          maternalRed: number;
          maternalOrange: number;
          withOutcome: number;
          maternalDeaths: number;
          nicuAdmissions: number;
        }
      >();
      for (const t of transfers) {
        const hid = t.referringFacilityId;
        const name = t.referringFacility?.name ?? 'Unknown';
        if (!byRef.has(hid)) {
          byRef.set(hid, {
            hospitalId: hid,
            hospitalName: name,
            totalCases: 0,
            maternalRed: 0,
            maternalOrange: 0,
            withOutcome: 0,
            maternalDeaths: 0,
            nicuAdmissions: 0,
          });
        }
        const row = byRef.get(hid)!;
        row.totalCases++;
        if (t.activationLevel === 'MATERNAL_RED') row.maternalRed++;
        if (t.activationLevel === 'MATERNAL_ORANGE') row.maternalOrange++;
        if (t.pregnancyCase?.pregnancyOutcomes?.length) {
          row.withOutcome++;
          if (t.pregnancyCase.pregnancyOutcomes[0].maternalStatus === 'DECEASED')
            row.maternalDeaths++;
          if (t.pregnancyCase.pregnancyOutcomes[0].nicuAdmission) row.nicuAdmissions++;
        }
      }
      byHospital = Array.from(byRef.values()).map((r) => ({
        hospitalId: r.hospitalId,
        hospitalName: r.hospitalName,
        totalCases: r.totalCases,
        maternalRed: r.maternalRed,
        maternalOrange: r.maternalOrange,
        maternalMortalityRate:
          r.withOutcome > 0 ? r.maternalDeaths / r.withOutcome : undefined,
        nicuRate: r.withOutcome > 0 ? r.nicuAdmissions / r.withOutcome : undefined,
      }));
    }

    // Daily trend: aggregate by date from transfers
    const dailyMap = new Map<
      string,
      { total: number; red: number; orange: number }
    >();
    for (const t of transfers) {
      const key = new Date(t.createdAt).toISOString().split('T')[0];
      if (!dailyMap.has(key)) {
        dailyMap.set(key, { total: 0, red: 0, orange: 0 });
      }
      const row = dailyMap.get(key)!;
      row.total++;
      if (t.activationLevel === 'MATERNAL_RED') row.red++;
      if (t.activationLevel === 'MATERNAL_ORANGE') row.orange++;
    }
    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalCases,
      maternalRedCount,
      maternalOrangeCount,
      maternalMortalityRate,
      nicuRate,
      vaginalPercentage,
      cesareanPercentage,
      documentationCompleteness,
      kpiPerformance,
      byHospital,
      dailyTrend,
    };
  }
}
