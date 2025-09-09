import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class TraumaKpiService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate response time in minutes between incident and arrival
   * Uses the same logic as the frontend helper function
   */
  private calculateResponseTime(incidentTime: string | Date | null, arrivalTime: string | Date | null): number {
    if (!incidentTime || !arrivalTime) return 0;
    
    const incident = new Date(incidentTime);
    const arrival = new Date(arrivalTime);
    
    if (isNaN(incident.getTime()) || isNaN(arrival.getTime())) return 0;
    
    const diffMinutes = (arrival.getTime() - incident.getTime()) / (1000 * 60);
    
    // Return 0 for invalid times (negative, too large, etc.)
    if (diffMinutes < 0 || diffMinutes > 1440) return 0; // Max 24 hours
    
    return Math.floor(diffMinutes);
  }

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

    // Calculate response time properly using helper function
    const responseTimes = allCases
      .map(c => this.calculateResponseTime(c.incidentDateTime, c.arrivalDateTime))
      .filter(time => time > 0); // Only include valid response times

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

    // Calculate cases this month and week
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const casesThisMonth = allCases.filter(c => 
      c.createdAt && new Date(c.createdAt) >= startOfMonth
    ).length;

    const casesThisWeek = allCases.filter(c => 
      c.createdAt && new Date(c.createdAt) >= startOfWeek
    ).length;

    // Calculate average length of stay (placeholder - would need discharge data)
    const averageLengthOfStay = 0; // TODO: Implement when discharge data is available

    return {
      totalCases,
      criticalCases,
      transferCases,
      averageResponseTime: Math.round(averageResponseTime * 10) / 10, // Round to 1 decimal
      averageGlasgowScore: Math.round(averageGlasgowScore * 10) / 10, // Round to 1 decimal
      mortalityRate: Math.round(mortalityRate * 10) / 10, // Round to 1 decimal
      criticalCaseRate: Math.round(criticalCaseRate * 10) / 10, // Round to 1 decimal
      transferRate: Math.round(transferRate * 10) / 10, // Round to 1 decimal
      averageLengthOfStay,
      casesThisMonth,
      casesThisWeek,
    };
  }
}
