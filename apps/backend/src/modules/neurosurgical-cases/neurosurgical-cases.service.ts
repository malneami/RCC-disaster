import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  NeurosurgicalCaseStatus,
  NeurosurgicalSeverity,
  NeurosurgicalPupils,
  NeurosurgicalGcsTrend,
  NeurosurgicalOutcome,
  NeurosurgicalCtLocation,
  TicketPathway,
  Prisma,
} from '@prisma/client';
import {
  ActivateFromTicketDto,
  CreateNeurosurgicalCaseDto,
  UpdateNeurosurgicalCaseDto,
} from './dto/neurosurgical-case.dto';
import { NeurosurgicalKPICalculatorService } from './services/neurosurgical-kpi-calculator.service';

const CASE_INCLUDE = {
  ticket: {
    select: {
      id: true,
      ticketNumber: true,
      pathway: true,
      status: true,
      priority: true,
      createdAt: true,
      emsContactTime: true,
      originHospitalId: true,
      destinationHospitalId: true,
    },
  },
  patient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      mrn: true,
      nationalId: true,
      age: true,
      gender: true,
    },
  },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  closedBy: { select: { id: true, firstName: true, lastName: true } },
  originHospital: { select: { id: true, name: true, cluster: true } },
  destinationHospital: { select: { id: true, name: true, cluster: true } },
} as const;

@Injectable()
export class NeurosurgicalCasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kpiCalculator: NeurosurgicalKPICalculatorService,
  ) {}

  suggestSeverity(input: {
    gcs?: number | null;
    gcsTrend?: NeurosurgicalGcsTrend | null;
    pupils?: NeurosurgicalPupils | null;
  }): NeurosurgicalSeverity {
    if (
      (input.gcs != null && input.gcs <= 8) ||
      input.pupils === NeurosurgicalPupils.UNEQUAL ||
      input.pupils === NeurosurgicalPupils.FIXED ||
      input.gcsTrend === NeurosurgicalGcsTrend.DETERIORATING
    ) {
      return NeurosurgicalSeverity.RED;
    }
    return NeurosurgicalSeverity.ORANGE;
  }

  private computeReviewFlag(data: {
    neurologicalOutcome?: string | null;
    deteriorationDuringTransfer?: boolean;
    cardiacArrestDuringTransfer?: boolean;
    unplannedIntubation?: boolean;
    delayedIntervention?: boolean;
    wrongDestination?: boolean;
    repeatTransferRequired?: boolean;
  }): boolean {
    return !!(
      data.neurologicalOutcome === 'DEATH' ||
      data.neurologicalOutcome === 'DETERIORATED' ||
      data.neurologicalOutcome === 'SEVERE_DISABILITY' ||
      data.deteriorationDuringTransfer ||
      data.cardiacArrestDuringTransfer ||
      data.unplannedIntubation ||
      data.delayedIntervention ||
      data.wrongDestination ||
      data.repeatTransferRequired
    );
  }

  private resolveSeverity(
    dto: {
      severity?: NeurosurgicalSeverity;
      severityOverrideReason?: string;
      gcs?: number;
      gcsTrend?: NeurosurgicalGcsTrend;
      pupils?: NeurosurgicalPupils;
    },
    suggested: NeurosurgicalSeverity,
  ): { severity: NeurosurgicalSeverity; severityOverrideReason: string | null } {
    const severity = dto.severity ?? suggested;
    if (dto.severity && dto.severity !== suggested) {
      if (!dto.severityOverrideReason?.trim()) {
        throw new BadRequestException(
          'severityOverrideReason is required when overriding suggested severity',
        );
      }
      return { severity: dto.severity, severityOverrideReason: dto.severityOverrideReason.trim() };
    }
    return {
      severity,
      severityOverrideReason: dto.severityOverrideReason?.trim() || null,
    };
  }

  private parseDate(value?: string | null): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    return new Date(value);
  }

  private kpiPersistFields(caseLike: {
    activatedAt: Date;
    doorTime?: Date | null;
    doorOutTime?: Date | null;
    rccActivationTime?: Date | null;
    ctLocation?: NeurosurgicalCtLocation | null;
    ctScanStartTime?: Date | null;
    ctReportFinalTime?: Date | null;
    neurosurgeonConnectedAt?: Date | null;
    definitiveCareReachedAt?: Date | null;
    status: NeurosurgicalCaseStatus;
    neurologicalOutcome?: NeurosurgicalOutcome | null;
    deteriorationDuringTransfer?: boolean;
    cardiacArrestDuringTransfer?: boolean;
    unplannedIntubation?: boolean;
    delayedIntervention?: boolean;
    wrongDestination?: boolean;
  }) {
    return this.kpiCalculator.calculateKPIs({
      activatedAt: caseLike.activatedAt,
      doorTime: caseLike.doorTime ?? null,
      doorOutTime: caseLike.doorOutTime ?? null,
      rccActivationTime: caseLike.rccActivationTime ?? null,
      ctLocation: caseLike.ctLocation ?? null,
      ctScanStartTime: caseLike.ctScanStartTime ?? null,
      ctReportFinalTime: caseLike.ctReportFinalTime ?? null,
      neurosurgeonConnectedAt: caseLike.neurosurgeonConnectedAt ?? null,
      definitiveCareReachedAt: caseLike.definitiveCareReachedAt ?? null,
      status: caseLike.status,
      neurologicalOutcome: caseLike.neurologicalOutcome ?? null,
      deteriorationDuringTransfer: caseLike.deteriorationDuringTransfer ?? false,
      cardiacArrestDuringTransfer: caseLike.cardiacArrestDuringTransfer ?? false,
      unplannedIntubation: caseLike.unplannedIntubation ?? false,
      delayedIntervention: caseLike.delayedIntervention ?? false,
      wrongDestination: caseLike.wrongDestination ?? false,
    });
  }

  async create(dto: CreateNeurosurgicalCaseDto, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: dto.ticketId },
      select: {
        id: true,
        patientId: true,
        originHospitalId: true,
        destinationHospitalId: true,
        pathway: true,
        neurosurgicalCases: { select: { id: true } },
      },
    });
    if (!ticket) throw new NotFoundException(`Ticket ${dto.ticketId} not found`);
    if (ticket.neurosurgicalCases.length > 0) {
      throw new ConflictException('Neurosurgical pathway already activated for this ticket');
    }

    const patientId = dto.patientId || ticket.patientId;
    const originHospitalId = dto.originHospitalId || ticket.originHospitalId;
    if (!patientId) throw new BadRequestException('Patient is required');
    if (!originHospitalId) throw new BadRequestException('Origin hospital is required');

    const suggested = this.suggestSeverity(dto);
    const { severity, severityOverrideReason } = this.resolveSeverity(dto, suggested);

    const activatedAt = new Date();
    const doorTime = this.parseDate(dto.doorTime) ?? null;
    const doorOutTime = this.parseDate(dto.doorOutTime) ?? null;
    const rccActivationTime = this.parseDate(dto.rccActivationTime) ?? activatedAt;
    const ctLocation = dto.ctLocation ?? null;
    const ctScanStartTime = this.parseDate(dto.ctScanStartTime) ?? null;
    const ctReportFinalTime = this.parseDate(dto.ctReportFinalTime) ?? null;
    const neurosurgeonNotifiedAt = this.parseDate(dto.neurosurgeonNotifiedAt) ?? null;
    const neurosurgeonConnectedAt = this.parseDate(dto.neurosurgeonConnectedAt) ?? null;

    const kpi = this.kpiPersistFields({
      activatedAt,
      doorTime,
      doorOutTime,
      rccActivationTime,
      ctLocation,
      ctScanStartTime,
      ctReportFinalTime,
      neurosurgeonConnectedAt,
      definitiveCareReachedAt: null,
      status: NeurosurgicalCaseStatus.ACTIVE,
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const neuroCase = await tx.neurosurgicalCase.create({
        data: {
          ticketId: dto.ticketId,
          patientId,
          createdById: userId,
          originHospitalId,
          destinationHospitalId: dto.destinationHospitalId ?? ticket.destinationHospitalId ?? null,
          triggerReason: dto.triggerReason,
          triggerReasonOther: dto.triggerReasonOther ?? null,
          gcs: dto.gcs ?? null,
          gcsTrend: dto.gcsTrend ?? null,
          pupils: dto.pupils ?? null,
          newFocalDeficit: dto.newFocalDeficit ?? false,
          seizure: dto.seizure ?? false,
          intubated: dto.intubated ?? false,
          hemodynamicInstability: dto.hemodynamicInstability ?? false,
          anticoagulantUse: dto.anticoagulantUse ?? false,
          mechanismOfInjury: dto.mechanismOfInjury ?? null,
          severity,
          severityOverrideReason,
          doorTime,
          doorOutTime,
          rccActivationTime,
          ctLocation,
          ctScanStartTime,
          ctReportFinalTime,
          neurosurgeonNotifiedAt,
          neurosurgeonConnectedAt,
          notes: dto.notes ?? null,
          activatedAt,
          ...kpi,
        },
        include: CASE_INCLUDE,
      });

      if (ticket.pathway === TicketPathway.GENERAL) {
        await tx.ticket.update({
          where: { id: ticket.id },
          data: { pathway: TicketPathway.NEUROSURGICAL },
        });
      }

      return neuroCase;
    });

    return created;
  }

  async activateFromTicket(ticketId: string, dto: ActivateFromTicketDto, userId: string) {
    return this.create(
      {
        ticketId,
        triggerReason: dto.triggerReason,
        triggerReasonOther: dto.triggerReasonOther,
        gcs: dto.gcs,
        gcsTrend: dto.gcsTrend,
        pupils: dto.pupils,
        newFocalDeficit: dto.newFocalDeficit,
        seizure: dto.seizure,
        intubated: dto.intubated,
        hemodynamicInstability: dto.hemodynamicInstability,
        anticoagulantUse: dto.anticoagulantUse,
        mechanismOfInjury: dto.mechanismOfInjury,
        severity: dto.severity,
        severityOverrideReason: dto.severityOverrideReason,
        doorTime: dto.doorTime,
        doorOutTime: dto.doorOutTime,
        rccActivationTime: dto.rccActivationTime,
        ctLocation: dto.ctLocation,
        ctScanStartTime: dto.ctScanStartTime,
        ctReportFinalTime: dto.ctReportFinalTime,
        neurosurgeonNotifiedAt: dto.neurosurgeonNotifiedAt,
        neurosurgeonConnectedAt: dto.neurosurgeonConnectedAt,
        notes: dto.notes,
      },
      userId,
    );
  }

  async findAll(filters: {
    ticketId?: string;
    patientId?: string;
    status?: NeurosurgicalCaseStatus;
    severity?: NeurosurgicalSeverity;
    originHospitalId?: string;
    destinationHospitalId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.NeurosurgicalCaseWhereInput = {};
    if (filters.ticketId) where.ticketId = filters.ticketId;
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;
    if (filters.originHospitalId) where.originHospitalId = filters.originHospitalId;
    if (filters.destinationHospitalId) where.destinationHospitalId = filters.destinationHospitalId;

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    const [items, total] = await Promise.all([
      this.prisma.neurosurgicalCase.findMany({
        where,
        include: CASE_INCLUDE,
        orderBy: { activatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.neurosurgicalCase.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async findById(id: string) {
    const neuroCase = await this.prisma.neurosurgicalCase.findUnique({
      where: { id },
      include: CASE_INCLUDE,
    });
    if (!neuroCase) throw new NotFoundException(`Neurosurgical case ${id} not found`);
    return neuroCase;
  }

  async update(id: string, dto: UpdateNeurosurgicalCaseDto) {
    const existing = await this.prisma.neurosurgicalCase.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Neurosurgical case ${id} not found`);
    if (existing.status === NeurosurgicalCaseStatus.CLOSED) {
      throw new ForbiddenException('Cannot update a closed neurosurgical case');
    }

    const nextGcs = dto.gcs !== undefined ? dto.gcs : existing.gcs;
    const nextTrend = dto.gcsTrend !== undefined ? dto.gcsTrend : existing.gcsTrend;
    const nextPupils = dto.pupils !== undefined ? dto.pupils : existing.pupils;
    const suggested = this.suggestSeverity({
      gcs: nextGcs,
      gcsTrend: nextTrend,
      pupils: nextPupils,
    });

    let severity = existing.severity;
    let severityOverrideReason = existing.severityOverrideReason;
    if (dto.severity !== undefined || dto.gcs !== undefined || dto.pupils !== undefined || dto.gcsTrend !== undefined) {
      const resolved = this.resolveSeverity(
        {
          severity: dto.severity,
          severityOverrideReason: dto.severityOverrideReason ?? existing.severityOverrideReason ?? undefined,
          gcs: nextGcs ?? undefined,
          gcsTrend: nextTrend ?? undefined,
          pupils: nextPupils ?? undefined,
        },
        suggested,
      );
      severity = resolved.severity;
      severityOverrideReason = resolved.severityOverrideReason;
    }

    const definitiveDisposition =
      dto.definitiveDisposition !== undefined
        ? dto.definitiveDisposition
        : existing.definitiveDisposition;

    const doorTime =
      dto.doorTime !== undefined ? this.parseDate(dto.doorTime) ?? null : existing.doorTime;
    const doorOutTime =
      dto.doorOutTime !== undefined
        ? this.parseDate(dto.doorOutTime) ?? null
        : existing.doorOutTime;
    const rccActivationTime =
      dto.rccActivationTime !== undefined
        ? this.parseDate(dto.rccActivationTime) ?? null
        : existing.rccActivationTime;
    const ctLocation =
      dto.ctLocation !== undefined ? dto.ctLocation : existing.ctLocation;
    const ctScanStartTime =
      dto.ctScanStartTime !== undefined
        ? this.parseDate(dto.ctScanStartTime) ?? null
        : existing.ctScanStartTime;
    const ctReportFinalTime =
      dto.ctReportFinalTime !== undefined
        ? this.parseDate(dto.ctReportFinalTime) ?? null
        : existing.ctReportFinalTime;
    const neurosurgeonNotifiedAt =
      dto.neurosurgeonNotifiedAt !== undefined
        ? this.parseDate(dto.neurosurgeonNotifiedAt) ?? null
        : existing.neurosurgeonNotifiedAt;
    const neurosurgeonConnectedAt =
      dto.neurosurgeonConnectedAt !== undefined
        ? this.parseDate(dto.neurosurgeonConnectedAt) ?? null
        : existing.neurosurgeonConnectedAt;

    let definitiveCareReachedAt = existing.definitiveCareReachedAt;
    let status = existing.status;

    if (dto.definitiveCareReachedAt !== undefined) {
      definitiveCareReachedAt = this.parseDate(dto.definitiveCareReachedAt) ?? null;
    }

    if (definitiveDisposition && !definitiveCareReachedAt) {
      definitiveCareReachedAt = new Date();
      status = NeurosurgicalCaseStatus.DEFINITIVE_CARE_REACHED;
    } else if (definitiveDisposition && existing.status === NeurosurgicalCaseStatus.ACTIVE) {
      status = NeurosurgicalCaseStatus.DEFINITIVE_CARE_REACHED;
      if (!definitiveCareReachedAt) {
        definitiveCareReachedAt = new Date();
      }
    }

    const mergedForReview = {
      neurologicalOutcome: dto.neurologicalOutcome ?? existing.neurologicalOutcome,
      deteriorationDuringTransfer:
        dto.deteriorationDuringTransfer ?? existing.deteriorationDuringTransfer,
      cardiacArrestDuringTransfer:
        dto.cardiacArrestDuringTransfer ?? existing.cardiacArrestDuringTransfer,
      unplannedIntubation: dto.unplannedIntubation ?? existing.unplannedIntubation,
      delayedIntervention: dto.delayedIntervention ?? existing.delayedIntervention,
      wrongDestination: dto.wrongDestination ?? existing.wrongDestination,
      repeatTransferRequired: dto.repeatTransferRequired ?? existing.repeatTransferRequired,
    };

    const kpi = this.kpiPersistFields({
      activatedAt: existing.activatedAt,
      doorTime,
      doorOutTime,
      rccActivationTime,
      ctLocation,
      ctScanStartTime,
      ctReportFinalTime,
      neurosurgeonConnectedAt,
      definitiveCareReachedAt,
      status,
      ...mergedForReview,
    });

    const data: Prisma.NeurosurgicalCaseUpdateInput = {
      ...(dto.destinationHospitalId !== undefined
        ? dto.destinationHospitalId
          ? { destinationHospital: { connect: { id: dto.destinationHospitalId } } }
          : { destinationHospital: { disconnect: true } }
        : {}),
      triggerReason: dto.triggerReason,
      triggerReasonOther: dto.triggerReasonOther,
      gcs: dto.gcs,
      gcsTrend: dto.gcsTrend,
      pupils: dto.pupils,
      newFocalDeficit: dto.newFocalDeficit,
      seizure: dto.seizure,
      intubated: dto.intubated,
      hemodynamicInstability: dto.hemodynamicInstability,
      anticoagulantUse: dto.anticoagulantUse,
      mechanismOfInjury: dto.mechanismOfInjury,
      severity,
      severityOverrideReason,
      doorTime,
      doorOutTime,
      rccActivationTime,
      ctLocation,
      ctScanStartTime,
      ctReportFinalTime,
      neurosurgeonNotifiedAt,
      neurosurgeonConnectedAt,
      definitiveDisposition: dto.definitiveDisposition,
      dispositionDetail:
        dto.dispositionDetail !== undefined
          ? (dto.dispositionDetail as Prisma.InputJsonValue)
          : undefined,
      definitiveCareReachedAt,
      status,
      neurologicalOutcome: dto.neurologicalOutcome,
      definitiveTreatment: dto.definitiveTreatment,
      deteriorationDuringTransfer: dto.deteriorationDuringTransfer,
      cardiacArrestDuringTransfer: dto.cardiacArrestDuringTransfer,
      unplannedIntubation: dto.unplannedIntubation,
      delayedIntervention: dto.delayedIntervention,
      wrongDestination: dto.wrongDestination,
      repeatTransferRequired: dto.repeatTransferRequired,
      notes: dto.notes,
      reviewFlag: this.computeReviewFlag(mergedForReview),
      ...kpi,
    };

    return this.prisma.neurosurgicalCase.update({
      where: { id },
      data,
      include: CASE_INCLUDE,
    });
  }

  async close(id: string, userId: string) {
    const existing = await this.prisma.neurosurgicalCase.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Neurosurgical case ${id} not found`);
    if (existing.status === NeurosurgicalCaseStatus.CLOSED) {
      throw new BadRequestException('Case is already closed');
    }
    if (!existing.definitiveDisposition) {
      throw new BadRequestException('definitiveDisposition is required before closing');
    }
    if (!existing.neurologicalOutcome) {
      throw new BadRequestException('neurologicalOutcome is required before closing');
    }

    const definitiveCareReachedAt = existing.definitiveCareReachedAt ?? new Date();
    const kpi = this.kpiPersistFields({
      ...existing,
      status: NeurosurgicalCaseStatus.CLOSED,
      definitiveCareReachedAt,
    });

    return this.prisma.neurosurgicalCase.update({
      where: { id },
      data: {
        status: NeurosurgicalCaseStatus.CLOSED,
        closedAt: new Date(),
        closedById: userId,
        definitiveCareReachedAt,
        reviewFlag: this.computeReviewFlag(existing),
        ...kpi,
      },
      include: CASE_INCLUDE,
    });
  }

  async getKpiSummary(filters: {
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Prisma.NeurosurgicalCaseWhereInput = {};
    if (filters.hospitalId) {
      where.OR = [
        { originHospitalId: filters.hospitalId },
        { destinationHospitalId: filters.hospitalId },
      ];
    }
    if (filters.startDate || filters.endDate) {
      where.activatedAt = {};
      if (filters.startDate) where.activatedAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.activatedAt.lte = new Date(filters.endDate);
    }

    const cases = await this.prisma.neurosurgicalCase.findMany({
      where,
      select: {
        severity: true,
        status: true,
        activatedAt: true,
        neurologicalOutcome: true,
        doorToCtMinutes: true,
        doorToCtReportMinutes: true,
        activationToNeurosurgeonMinutes: true,
        doorOutToDefinitiveCareMinutes: true,
        activationToDefinitiveCareMinutes: true,
        metKpi1: true,
        metKpi2: true,
        metKpi3: true,
        metKpi4: true,
        metKpi5: true,
        metKpi6: true,
        brainPreserved: true,
      },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const casesThisMonth = cases.filter((c) => c.activatedAt >= startOfMonth).length;
    const casesThisWeek = cases.filter((c) => c.activatedAt >= startOfWeek).length;

    const kpiPerf = (key: 'metKpi1' | 'metKpi2' | 'metKpi3' | 'metKpi4' | 'metKpi5' | 'metKpi6') => {
      const valid = cases.filter((c) => c[key] !== null && c[key] !== undefined);
      const met = valid.filter((c) => c[key] === true).length;
      const total = valid.length;
      return {
        met,
        total,
        percentage: total > 0 ? Math.round((met / total) * 1000) / 10 : 0,
      };
    };

    const avg = (values: (number | null)[]) => {
      const nums = values.filter((v): v is number => v !== null && v !== undefined);
      if (!nums.length) return 0;
      return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
    };

    const closed = cases.filter((c) => c.status === NeurosurgicalCaseStatus.CLOSED);
    const kpi5 = kpiPerf('metKpi5');

    return {
      totalCases: cases.length,
      casesThisMonth,
      casesThisWeek,
      severityBreakdown: {
        red: cases.filter((c) => c.severity === NeurosurgicalSeverity.RED).length,
        orange: cases.filter((c) => c.severity === NeurosurgicalSeverity.ORANGE).length,
      },
      kpiPerformance: {
        kpi1: kpiPerf('metKpi1'),
        kpi2: kpiPerf('metKpi2'),
        kpi3: kpiPerf('metKpi3'),
        kpi4: kpiPerf('metKpi4'),
        kpi5,
        kpi6: kpiPerf('metKpi6'),
      },
      averageTimings: {
        doorToCt: avg(cases.map((c) => c.doorToCtMinutes)),
        doorToCtReport: avg(cases.map((c) => c.doorToCtReportMinutes)),
        activationToNeurosurgeon: avg(cases.map((c) => c.activationToNeurosurgeonMinutes)),
        doorOutToDefinitiveCare: avg(
          cases.map((c) => c.doorOutToDefinitiveCareMinutes ?? c.activationToDefinitiveCareMinutes),
        ),
        activationToDefinitiveCare: avg(
          cases.map((c) => c.doorOutToDefinitiveCareMinutes ?? c.activationToDefinitiveCareMinutes),
        ),
      },
      brainPreservationRate: kpi5.percentage,
      outcomes: {
        improved: closed.filter((c) => c.neurologicalOutcome === NeurosurgicalOutcome.IMPROVED)
          .length,
        stable: closed.filter((c) => c.neurologicalOutcome === NeurosurgicalOutcome.STABLE).length,
        deteriorated: closed.filter(
          (c) => c.neurologicalOutcome === NeurosurgicalOutcome.DETERIORATED,
        ).length,
        severeDisability: closed.filter(
          (c) => c.neurologicalOutcome === NeurosurgicalOutcome.SEVERE_DISABILITY,
        ).length,
        death: closed.filter((c) => c.neurologicalOutcome === NeurosurgicalOutcome.DEATH).length,
      },
    };
  }
}
