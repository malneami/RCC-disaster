import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class TraumaKpiService {
  constructor(private prisma: PrismaService) {}

  async getKPISummary(hospitalId?: string, startDate?: string, endDate?: string): Promise<any> {
    const where: any = {
      deletedAt: null, // Only include non-deleted records
    };

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

    // Get all cases for detailed calculations
    const allCases = await this.prisma.traumaCase.findMany({
      where,
      select: {
        id: true,
        arrivalDateTime: true,
        incidentDateTime: true,
        responseTimeMinutes: true,
        glasgowComaScale: true,
        criticalCase: true,
        transferCase: true,
        edDisposition: true,
        createdAt: true,
      },
    });

    const totalCases = allCases.length;
    const criticalCases = allCases.filter(c => c.criticalCase).length;
    const transferCases = allCases.filter(c => c.transferCase).length;
    const deathCases = allCases.filter(c => c.edDisposition === 'DEATH').length;

    // Calculate response time properly (from incident to arrival)
    const responseTimes = allCases
      .filter(c => c.arrivalDateTime && c.incidentDateTime)
      .map(c => {
        const arrival = new Date(c.arrivalDateTime!);
        const incident = new Date(c.incidentDateTime!);
        const diffMinutes = (arrival.getTime() - incident.getTime()) / (1000 * 60);
        return diffMinutes;
      })
      .filter(time => time >= 0 && time <= 1440); // Filter out negative times and times > 24 hours

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Calculate Glasgow Coma Scale average (filter out invalid values)
    const glasgowScores = allCases
      .filter(c => c.glasgowComaScale && c.glasgowComaScale >= 3 && c.glasgowComaScale <= 15)
      .map(c => c.glasgowComaScale)
      .filter(score => score !== null && score !== undefined);

    const averageGlasgowScore = glasgowScores.length > 0 
      ? glasgowScores.reduce((sum, score) => (sum || 0) + (score || 0), 0) / glasgowScores.length 
      : 0;

    // Calculate rates
    const mortalityRate = totalCases > 0 ? (deathCases / totalCases) * 100 : 0;
    const criticalCaseRate = totalCases > 0 ? (criticalCases / totalCases) * 100 : 0;
    const transferRate = totalCases > 0 ? (transferCases / totalCases) * 100 : 0;

    return {
      totalCases,
      criticalCases,
      transferCases,
      averageResponseTime: Math.round(averageResponseTime * 10) / 10, // Round to 1 decimal
      averageGlasgowScore: Math.round(averageGlasgowScore * 10) / 10, // Round to 1 decimal
      mortalityRate: Math.round(mortalityRate * 10) / 10, // Round to 1 decimal
      criticalCaseRate: Math.round(criticalCaseRate * 10) / 10, // Round to 1 decimal
      transferRate: Math.round(transferRate * 10) / 10, // Round to 1 decimal
    };
  }
}
