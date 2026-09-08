import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePregnancyKpiDailyAggregateDto } from './dto/create-pregnancy-kpi-daily-aggregate.dto';
import { UpdatePregnancyKpiDailyAggregateDto } from './dto/update-pregnancy-kpi-daily-aggregate.dto';

@Injectable()
export class PregnancyKpiDailyAggregatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePregnancyKpiDailyAggregateDto) {
    const dateOnly = dto.date.split('T')[0];
    const existing = await this.prisma.pregnancyKpiDailyAggregate.findUnique({
      where: {
        date_region: { date: new Date(dateOnly), region: dto.region },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Aggregate already exists for date ${dateOnly} and region ${dto.region}`,
      );
    }

    return this.prisma.pregnancyKpiDailyAggregate.create({
      data: {
        date: new Date(dateOnly),
        region: dto.region,
        totalCases: dto.totalCases ?? 0,
        maternalRedCount: dto.maternalRedCount ?? 0,
        maternalOrangeCount: dto.maternalOrangeCount ?? 0,
        avgActivationToOb: dto.avgActivationToOb ?? null,
        avgActivationToDispatch: dto.avgActivationToDispatch ?? null,
        avgDispatchToArrival: dto.avgDispatchToArrival ?? null,
        maternalMortalityRate: dto.maternalMortalityRate ?? null,
        severeMorbidityRate: dto.severeMorbidityRate ?? null,
        perinatalMortalityRate: dto.perinatalMortalityRate ?? null,
        nicuRate: dto.nicuRate ?? null,
        vaginalPercentage: dto.vaginalPercentage ?? null,
        cesareanPercentage: dto.cesareanPercentage ?? null,
        emergencyCsPercentage: dto.emergencyCsPercentage ?? null,
        planChangePercentage: dto.planChangePercentage ?? null,
        documentationCompletenessAvg: dto.documentationCompletenessAvg ?? null,
      },
    });
  }

  async findAll(filters: {
    startDate?: string;
    endDate?: string;
    region?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }
    if (filters.region) where.region = filters.region;

    const [items, total] = await Promise.all([
      this.prisma.pregnancyKpiDailyAggregate.findMany({
        where,
        orderBy: [{ date: 'desc' }, { region: 'asc' }],
        take: filters.limit ?? 50,
        skip: filters.offset ?? 0,
      }),
      this.prisma.pregnancyKpiDailyAggregate.count({ where }),
    ]);

    return { data: items, total };
  }

  async findById(id: string) {
    const item = await this.prisma.pregnancyKpiDailyAggregate.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(`Pregnancy KPI aggregate ${id} not found`);
    }
    return item;
  }

  async upsert(dto: CreatePregnancyKpiDailyAggregateDto) {
    const dateOnly = dto.date.split('T')[0];
    return this.prisma.pregnancyKpiDailyAggregate.upsert({
      where: {
        date_region: { date: new Date(dateOnly), region: dto.region },
      },
      create: {
        date: new Date(dateOnly),
        region: dto.region,
        totalCases: dto.totalCases ?? 0,
        maternalRedCount: dto.maternalRedCount ?? 0,
        maternalOrangeCount: dto.maternalOrangeCount ?? 0,
        avgActivationToOb: dto.avgActivationToOb ?? null,
        avgActivationToDispatch: dto.avgActivationToDispatch ?? null,
        avgDispatchToArrival: dto.avgDispatchToArrival ?? null,
        maternalMortalityRate: dto.maternalMortalityRate ?? null,
        severeMorbidityRate: dto.severeMorbidityRate ?? null,
        perinatalMortalityRate: dto.perinatalMortalityRate ?? null,
        nicuRate: dto.nicuRate ?? null,
        vaginalPercentage: dto.vaginalPercentage ?? null,
        cesareanPercentage: dto.cesareanPercentage ?? null,
        emergencyCsPercentage: dto.emergencyCsPercentage ?? null,
        planChangePercentage: dto.planChangePercentage ?? null,
        documentationCompletenessAvg: dto.documentationCompletenessAvg ?? null,
      },
      update: {
        totalCases: dto.totalCases,
        maternalRedCount: dto.maternalRedCount,
        maternalOrangeCount: dto.maternalOrangeCount,
        avgActivationToOb: dto.avgActivationToOb,
        avgActivationToDispatch: dto.avgActivationToDispatch,
        avgDispatchToArrival: dto.avgDispatchToArrival,
        maternalMortalityRate: dto.maternalMortalityRate,
        severeMorbidityRate: dto.severeMorbidityRate,
        perinatalMortalityRate: dto.perinatalMortalityRate,
        nicuRate: dto.nicuRate,
        vaginalPercentage: dto.vaginalPercentage,
        cesareanPercentage: dto.cesareanPercentage,
        emergencyCsPercentage: dto.emergencyCsPercentage,
        planChangePercentage: dto.planChangePercentage,
        documentationCompletenessAvg: dto.documentationCompletenessAvg,
      },
    });
  }

  async update(id: string, dto: UpdatePregnancyKpiDailyAggregateDto) {
    await this.findById(id);

    const updateData: any = { ...dto };
    if (dto.date) updateData.date = new Date(dto.date.split('T')[0]);

    return this.prisma.pregnancyKpiDailyAggregate.update({
      where: { id },
      data: updateData,
    });
  }
}
