import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class TraumaKpiService {
  constructor(private prisma: PrismaService) {}

  async getKPISummary(hospitalId?: string, startDate?: string, endDate?: string): Promise<any> {
    const where: any = {};

    if (hospitalId) {
      where.originHospitalId = hospitalId;
    }

    if (startDate || endDate) {
      where.arrivalDateTime = {};
      if (startDate) {
        where.arrivalDateTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.arrivalDateTime.lte = new Date(endDate);
      }
    }

    const [
      totalCases,
      criticalCases,
      transferCases,
      averageResponseTime,
      averageGlasgowScore,
      mortalityRate,
    ] = await Promise.all([
      this.prisma.traumaCase.count({ where }),
      this.prisma.traumaCase.count({ where: { ...where, criticalCase: true } }),
      this.prisma.traumaCase.count({ where: { ...where, transferCase: true } }),
      this.prisma.traumaCase.aggregate({
        where: { ...where, responseTimeMinutes: { not: null } },
        _avg: { responseTimeMinutes: true },
      }),
      this.prisma.traumaCase.aggregate({
        where: { ...where, glasgowComaScale: { not: null } },
        _avg: { glasgowComaScale: true },
      }),
      this.prisma.traumaCase.aggregate({
        where: { ...where, edDisposition: 'DEATH' },
        _count: { id: true },
      }),
    ]);

    const totalCasesForMortality = await this.prisma.traumaCase.count({ where });

    return {
      totalCases,
      criticalCases,
      transferCases,
      averageResponseTime: averageResponseTime._avg.responseTimeMinutes || 0,
      averageGlasgowScore: averageGlasgowScore._avg.glasgowComaScale || 0,
      mortalityRate: totalCasesForMortality > 0 ? (mortalityRate._count.id / totalCasesForMortality) * 100 : 0,
      criticalCaseRate: totalCases > 0 ? (criticalCases / totalCases) * 100 : 0,
      transferRate: totalCases > 0 ? (transferCases / totalCases) * 100 : 0,
    };
  }
}
