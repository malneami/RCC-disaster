import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePregnancyOutcomeDto } from './dto/create-pregnancy-outcome.dto';
import { UpdatePregnancyOutcomeDto } from './dto/update-pregnancy-outcome.dto';
import { MaternalStatus, PerinatalStatus } from '@prisma/client';

function computeReviewFlag(data: {
  maternalStatus?: MaternalStatus;
  perinatalStatus?: PerinatalStatus;
  maternalIcuAdmission?: boolean;
  massiveTransfusion?: boolean;
  eclampsiaEvent?: boolean;
  majorPph?: boolean;
  nicuAdmission?: boolean;
}): boolean {
  if (data.maternalStatus === 'DECEASED') return true;
  if (data.perinatalStatus === 'STILLBIRTH' || data.perinatalStatus === 'NEONATAL_DEATH') return true;
  if (data.maternalIcuAdmission || data.massiveTransfusion || data.eclampsiaEvent || data.majorPph) return true;
  if (data.nicuAdmission) return true;
  return false;
}

@Injectable()
export class PregnancyOutcomesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePregnancyOutcomeDto) {
    await this.validatePregnancyCaseExists(dto.caseId);

    const existing = await this.prisma.pregnancyOutcome.findUnique({
      where: { caseId: dto.caseId },
    });
    if (existing) {
      throw new BadRequestException(`Pregnancy outcome already exists for case ${dto.caseId}`);
    }

    const reviewFlag = computeReviewFlag({
      maternalStatus: dto.maternalStatus,
      perinatalStatus: dto.perinatalStatus,
      maternalIcuAdmission: dto.maternalIcuAdmission,
      massiveTransfusion: dto.massiveTransfusion,
      eclampsiaEvent: dto.eclampsiaEvent,
      majorPph: dto.majorPph,
      nicuAdmission: dto.nicuAdmission,
    });

    return this.prisma.pregnancyOutcome.create({
      data: {
        caseId: dto.caseId,
        maternalStatus: dto.maternalStatus,
        maternalIcuAdmission: dto.maternalIcuAdmission ?? false,
        massiveTransfusion: dto.massiveTransfusion ?? false,
        eclampsiaEvent: dto.eclampsiaEvent ?? false,
        majorPph: dto.majorPph ?? false,
        perinatalStatus: dto.perinatalStatus,
        nicuAdmission: dto.nicuAdmission ?? false,
        apgar5: dto.apgar5 ?? null,
        reviewFlag,
      },
      include: {
        pregnancyCase: { select: { id: true, patientId: true } },
      },
    });
  }

  async findAll(filters: {
    caseId?: string;
    maternalStatus?: MaternalStatus;
    perinatalStatus?: PerinatalStatus;
    reviewFlag?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.caseId) where.caseId = filters.caseId;
    if (filters.maternalStatus) where.maternalStatus = filters.maternalStatus;
    if (filters.perinatalStatus) where.perinatalStatus = filters.perinatalStatus;
    if (filters.reviewFlag !== undefined) where.reviewFlag = filters.reviewFlag;

    const [items, total] = await Promise.all([
      this.prisma.pregnancyOutcome.findMany({
        where,
        include: {
          pregnancyCase: { select: { id: true, patientId: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit ?? 50,
        skip: filters.offset ?? 0,
      }),
      this.prisma.pregnancyOutcome.count({ where }),
    ]);

    return { data: items, total };
  }

  async findByCaseId(caseId: string) {
    const outcome = await this.prisma.pregnancyOutcome.findUnique({
      where: { caseId },
      include: {
        pregnancyCase: { select: { id: true, patientId: true } },
      },
    });
    if (!outcome) {
      throw new NotFoundException(`Pregnancy outcome for case ${caseId} not found`);
    }
    return outcome;
  }

  async findById(id: string) {
    const outcome = await this.prisma.pregnancyOutcome.findUnique({
      where: { id },
      include: {
        pregnancyCase: { select: { id: true, patientId: true } },
      },
    });
    if (!outcome) {
      throw new NotFoundException(`Pregnancy outcome ${id} not found`);
    }
    return outcome;
  }

  async update(id: string, dto: UpdatePregnancyOutcomeDto) {
    const existing = await this.findById(id);

    const merged = {
      maternalStatus: dto.maternalStatus ?? existing.maternalStatus,
      maternalIcuAdmission: dto.maternalIcuAdmission ?? existing.maternalIcuAdmission,
      massiveTransfusion: dto.massiveTransfusion ?? existing.massiveTransfusion,
      eclampsiaEvent: dto.eclampsiaEvent ?? existing.eclampsiaEvent,
      majorPph: dto.majorPph ?? existing.majorPph,
      perinatalStatus: dto.perinatalStatus ?? existing.perinatalStatus,
      nicuAdmission: dto.nicuAdmission ?? existing.nicuAdmission,
      apgar5: dto.apgar5 !== undefined ? dto.apgar5 : existing.apgar5,
    };

    const reviewFlag =
      dto.reviewFlag !== undefined
        ? dto.reviewFlag
        : computeReviewFlag(merged);

    return this.prisma.pregnancyOutcome.update({
      where: { id },
      data: {
        ...dto,
        reviewFlag,
      },
      include: {
        pregnancyCase: { select: { id: true, patientId: true } },
      },
    });
  }

  private async validatePregnancyCaseExists(caseId: string) {
    const c = await this.prisma.pregnancyCase.findFirst({ where: { id: caseId } });
    if (!c) {
      throw new BadRequestException(`Pregnancy case ${caseId} not found`);
    }
  }
}
