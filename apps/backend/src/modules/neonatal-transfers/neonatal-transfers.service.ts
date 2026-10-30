import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateNeonatalTransferDto } from './dto/create-neonatal-transfer.dto';
import { UpdateNeonatalTransferDto } from './dto/update-neonatal-transfer.dto';
import { NeonatalTransfer } from '@prisma/client';

const INCLUDE_LIST = {
  ticket: { select: { id: true, ticketNumber: true } },
  patient: {
    select: { id: true, firstName: true, lastName: true, mrn: true, nationalId: true, age: true },
  },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  referringFacility: { select: { id: true, name: true } },
  destinationHospital: { select: { id: true, name: true } },
  assignedBed: { select: { id: true, bedNumber: true, nicuCotType: true, nicuLevel: true } },
};

@Injectable()
export class NeonatalTransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNeonatalTransferDto, userId: string): Promise<NeonatalTransfer> {
    await this.validatePatientExists(dto.patientId);
    await this.validateTicketExists(dto.ticketId);
    await this.validateHospitalExists(dto.referringFacilityId);
    if (dto.destinationHospitalId) {
      await this.validateHospitalExists(dto.destinationHospitalId);
    }

    return this.prisma.neonatalTransfer.create({
      data: {
        ticketId: dto.ticketId,
        patientId: dto.patientId,
        obMaternalTransferId: dto.obMaternalTransferId ?? null,
        createdById: userId,
        gestationalAgeWeeks: dto.gestationalAgeWeeks,
        gestationalAgeDays: dto.gestationalAgeDays ?? null,
        birthWeightGrams: dto.birthWeightGrams ?? null,
        ageHours: dto.ageHours ?? null,
        apgar1: dto.apgar1 ?? null,
        apgar5: dto.apgar5 ?? null,
        apgar10: dto.apgar10 ?? null,
        antenatalSteroids: dto.antenatalSteroids ?? null,
        hr: dto.hr ?? null,
        rr: dto.rr ?? null,
        temp: dto.temp ?? null,
        spo2: dto.spo2 ?? null,
        preDuctalSpo2: dto.preDuctalSpo2 ?? null,
        postDuctalSpo2: dto.postDuctalSpo2 ?? null,
        bloodGlucose: dto.bloodGlucose ?? null,
        respiratorySupport: dto.respiratorySupport ?? null,
        fiO2: dto.fiO2 ?? null,
        surfactantGiven: dto.surfactantGiven ?? null,
        inotropes: dto.inotropes ?? null,
        therapeuticHypothermia: dto.therapeuticHypothermia ?? null,
        seizure: dto.seizure ?? null,
        suspectedConditions: dto.suspectedConditions ? (dto.suspectedConditions as any) : null,
        stabilizationDone: dto.stabilizationDone ? (dto.stabilizationDone as any) : null,
        acuityLevel: dto.acuityLevel,
        tripsScore: dto.tripsScore ?? null,
        cribIIScore: dto.cribIIScore ?? null,
        requiredNicuLevel: dto.requiredNicuLevel,
        requiredCotType: dto.requiredCotType,
        referringFacilityId: dto.referringFacilityId,
        referringContactName: dto.referringContactName ?? null,
        referringContactPhone: dto.referringContactPhone ?? null,
        destinationHospitalId: dto.destinationHospitalId ?? null,
        assignedBedId: dto.assignedBedId ?? null,
        acceptanceStatus: dto.acceptanceStatus ?? 'PENDING',
        transportTeam: dto.transportTeam,
        transportIncubator: dto.transportIncubator ?? null,
      },
      include: INCLUDE_LIST,
    });
  }

  async findAll(filters: {
    ticketId?: string;
    patientId?: string;
    status?: string;
    acuityLevel?: string;
    requiredNicuLevel?: string;
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
    if (filters.acuityLevel) where.acuityLevel = filters.acuityLevel;
    if (filters.requiredNicuLevel) where.requiredNicuLevel = filters.requiredNicuLevel;
    if (filters.referringFacilityId) where.referringFacilityId = filters.referringFacilityId;
    if (filters.destinationHospitalId) where.destinationHospitalId = filters.destinationHospitalId;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.neonatalTransfer.findMany({
        where,
        include: INCLUDE_LIST,
        orderBy: { createdAt: 'desc' },
        take: filters.limit ?? 50,
        skip: filters.offset ?? 0,
      }),
      this.prisma.neonatalTransfer.count({ where }),
    ]);

    return { data: items, total };
  }

  async findById(id: string) {
    const transfer = await this.prisma.neonatalTransfer.findUnique({
      where: { id },
      include: {
        ticket: true,
        patient: true,
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        referringFacility: true,
        destinationHospital: true,
        assignedBed: true,
        obMaternalTransfer: { select: { id: true, status: true, activationLevel: true } },
      },
    });
    if (!transfer) {
      throw new NotFoundException(`Neonatal transfer with ID ${id} not found`);
    }
    return transfer;
  }

  async update(id: string, dto: UpdateNeonatalTransferDto): Promise<NeonatalTransfer> {
    await this.findById(id);

    if (dto.patientId) await this.validatePatientExists(dto.patientId);
    if (dto.ticketId) await this.validateTicketExists(dto.ticketId);
    if (dto.referringFacilityId) await this.validateHospitalExists(dto.referringFacilityId);
    if (dto.destinationHospitalId) await this.validateHospitalExists(dto.destinationHospitalId);

    const updateData: any = { ...dto };
    // Coerce JSON arrays
    if (dto.suspectedConditions !== undefined) updateData.suspectedConditions = dto.suspectedConditions;
    if (dto.stabilizationDone !== undefined) updateData.stabilizationDone = dto.stabilizationDone;
    // Coerce timeline ISO strings → Date
    for (const key of [
      'activatedAt',
      'neonatologistConnectedAt',
      'decisionAt',
      'dispatchedAt',
      'departedAt',
      'arrivedAt',
      'closedAt',
    ] as const) {
      if (dto[key] !== undefined) updateData[key] = dto[key] ? new Date(dto[key] as string) : null;
    }

    return this.prisma.neonatalTransfer.update({
      where: { id },
      data: updateData,
      include: INCLUDE_LIST,
    });
  }

  private async validatePatientExists(patientId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { id: patientId } });
    if (!patient) throw new BadRequestException(`Patient with ID ${patientId} not found`);
  }

  private async validateTicketExists(ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId } });
    if (!ticket) throw new BadRequestException(`Ticket with ID ${ticketId} not found`);
  }

  private async validateHospitalExists(hospitalId: string) {
    const hospital = await this.prisma.hospital.findFirst({
      where: { id: hospitalId, deletedAt: null },
    });
    if (!hospital) throw new BadRequestException(`Hospital with ID ${hospitalId} not found`);
  }

  /**
   * Live KPI summary for the NICU dashboard (mirrors OB getKPISummary shape).
   * Computed directly from transfer records and their timeline timestamps.
   */
  async getKPISummary(filters: { hospitalId?: string; startDate?: string; endDate?: string }) {
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

    const transfers = await this.prisma.neonatalTransfer.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        acuityLevel: true,
        temp: true,
        surfactantGiven: true,
        acceptanceStatus: true,
        requiredNicuLevel: true,
        obMaternalTransferId: true,
        destinationHospitalId: true,
        referringFacilityId: true,
        referringFacility: { select: { id: true, name: true } },
        activatedAt: true,
        neonatologistConnectedAt: true,
        dispatchedAt: true,
        arrivedAt: true,
        destinationHospital: { select: { id: true, nicuLevel: true } },
      },
    });

    const totalTransfers = transfers.length;
    const redCount = transfers.filter((t) => t.acuityLevel === 'RED').length;
    const orangeCount = transfers.filter((t) => t.acuityLevel === 'ORANGE').length;
    const yellowCount = transfers.filter((t) => t.acuityLevel === 'YELLOW').length;

    const minsBetween = (a?: Date | null, b?: Date | null) =>
      a && b ? (new Date(b).getTime() - new Date(a).getTime()) / 60000 : null;
    const avg = (xs: (number | null)[]) => {
      const v = xs.filter((x): x is number => x != null && isFinite(x) && x >= 0);
      return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
    };

    const avgActivationToNeonatologist = avg(
      transfers.map((t) => minsBetween(t.activatedAt, t.neonatologistConnectedAt)),
    );
    const avgActivationToDispatch = avg(
      transfers.map((t) => minsBetween(t.activatedAt, t.dispatchedAt)),
    );
    const avgDispatchToArrival = avg(
      transfers.map((t) => minsBetween(t.dispatchedAt, t.arrivedAt)),
    );

    // Cot match rate: placed at a destination whose level >= required level
    const levelRank: Record<string, number> = { LEVEL_I: 1, LEVEL_II: 2, LEVEL_III: 3 };
    const placed = transfers.filter((t) => t.destinationHospitalId && t.destinationHospital?.nicuLevel);
    const matched = placed.filter(
      (t) =>
        levelRank[t.destinationHospital!.nicuLevel as string] >=
        levelRank[t.requiredNicuLevel as string],
    );
    const cotMatchRate = placed.length ? matched.length / placed.length : null;

    // Normothermia on arrival (36.5–37.5 °C) among arrived cases with a temp
    const arrivedWithTemp = transfers.filter((t) => t.arrivedAt && t.temp != null);
    const normothermic = arrivedWithTemp.filter((t) => t.temp! >= 36.5 && t.temp! <= 37.5);
    const normothermiaOnArrival = arrivedWithTemp.length
      ? normothermic.length / arrivedWithTemp.length
      : null;

    const declined = transfers.filter((t) => t.acceptanceStatus === 'DECLINED').length;
    const declinedForCapacityRate = totalTransfers ? declined / totalTransfers : null;

    const inUtero = transfers.filter((t) => t.obMaternalTransferId).length;
    const exUtero = totalTransfers - inUtero;
    const inUteroVsExUteroRatio = exUtero ? inUtero / exUtero : null;

    // byHospital (referring) when no hospital filter
    let byHospital: Array<{
      hospitalId: string;
      hospitalName: string;
      totalTransfers: number;
      red: number;
      orange: number;
      yellow: number;
    }> = [];
    if (!filters.hospitalId) {
      const map = new Map<string, any>();
      for (const t of transfers) {
        const hid = t.referringFacilityId;
        const name = t.referringFacility?.name ?? 'Unknown';
        if (!map.has(hid))
          map.set(hid, { hospitalId: hid, hospitalName: name, totalTransfers: 0, red: 0, orange: 0, yellow: 0 });
        const row = map.get(hid);
        row.totalTransfers++;
        if (t.acuityLevel === 'RED') row.red++;
        if (t.acuityLevel === 'ORANGE') row.orange++;
        if (t.acuityLevel === 'YELLOW') row.yellow++;
      }
      byHospital = Array.from(map.values());
    }

    // Daily trend
    const dailyMap = new Map<string, { total: number; red: number; orange: number; yellow: number }>();
    for (const t of transfers) {
      const key = new Date(t.createdAt).toISOString().split('T')[0];
      if (!dailyMap.has(key)) dailyMap.set(key, { total: 0, red: 0, orange: 0, yellow: 0 });
      const row = dailyMap.get(key)!;
      row.total++;
      if (t.acuityLevel === 'RED') row.red++;
      if (t.acuityLevel === 'ORANGE') row.orange++;
      if (t.acuityLevel === 'YELLOW') row.yellow++;
    }
    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalTransfers,
      redCount,
      orangeCount,
      yellowCount,
      avgActivationToNeonatologist,
      avgActivationToDispatch,
      avgDispatchToArrival,
      cotMatchRate,
      normothermiaOnArrival,
      declinedForCapacityRate,
      inUteroVsExUteroRatio,
      byHospital,
      dailyTrend,
    };
  }
}
