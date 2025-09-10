import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class StemiKpiService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate door-to-balloon time in minutes
   */
  private calculateDoorToBalloonTime(triageTime: string | Date | null, balloonTime: string | Date | null): number {
    if (!triageTime || !balloonTime) return 0;
    
    const triage = new Date(triageTime);
    const balloon = new Date(balloonTime);
    
    if (isNaN(triage.getTime()) || isNaN(balloon.getTime())) return 0;
    
    const diffMinutes = (balloon.getTime() - triage.getTime()) / (1000 * 60);
    
    // Return 0 for invalid times (negative, too large, etc.)
    if (diffMinutes < 0 || diffMinutes > 1440) return 0; // Max 24 hours
    
    return Math.floor(diffMinutes);
  }

  /**
   * Calculate door-to-needle time in minutes
   */
  private calculateDoorToNeedleTime(triageTime: string | Date | null, needleTime: string | Date | null): number {
    if (!triageTime || !needleTime) return 0;
    
    const triage = new Date(triageTime);
    const needle = new Date(needleTime);
    
    if (isNaN(triage.getTime()) || isNaN(needle.getTime())) return 0;
    
    const diffMinutes = (needle.getTime() - triage.getTime()) / (1000 * 60);
    
    // Return 0 for invalid times (negative, too large, etc.)
    if (diffMinutes < 0 || diffMinutes > 1440) return 0; // Max 24 hours
    
    return Math.floor(diffMinutes);
  }

  async getKpiSummary(hospitalId?: string, startDate?: string, endDate?: string): Promise<any> {
    const where: any = {};

    if (hospitalId) {
      where.originHospitalId = hospitalId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get all cases for detailed calculations
    const allCases = await this.prisma.stemiCase.findMany({
      where,
      select: {
        id: true,
        triageTime: true,
        balloonInflationTime: true,
        thrombolyticAdminTime: true,
        doorToBalloonMinutes: true,
        doorToNeedleMinutes: true,
        doorToEcgMinutes: true,
        rccActivationToDoorOutMinutes: true,
        doorInDoorOutMinutes: true,
        successful: true,
        thirtyDayReadmission: true,
        followUpCallCompleted: true,
        metKpi1: true,
        metKpi2: true,
        metKpi3: true,
        metKpi4: true,
        metKpi5: true,
        metKpi6: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalCases = allCases.length;

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

    // Calculate door-to-balloon times
    const doorToBalloonTimes = allCases
      .map(c => this.calculateDoorToBalloonTime(c.triageTime, c.balloonInflationTime))
      .filter(time => time > 0);

    const averageDoorToBalloonTime = doorToBalloonTimes.length > 0 
      ? doorToBalloonTimes.reduce((sum, time) => sum + time, 0) / doorToBalloonTimes.length 
      : 0;

    // Calculate door-to-needle times
    const doorToNeedleTimes = allCases
      .map(c => this.calculateDoorToNeedleTime(c.triageTime, c.thrombolyticAdminTime))
      .filter(time => time > 0);

    const averageDoorToNeedleTime = doorToNeedleTimes.length > 0 
      ? doorToNeedleTimes.reduce((sum, time) => sum + time, 0) / doorToNeedleTimes.length 
      : 0;

    // Calculate KPI performance
    const kpi1Cases = allCases.filter(c => c.metKpi1 === true).length;
    const kpi2Cases = allCases.filter(c => c.metKpi2 === true).length;
    const kpi3Cases = allCases.filter(c => c.metKpi3 === true).length;
    const kpi4Cases = allCases.filter(c => c.metKpi4 === true).length;
    const kpi5Cases = allCases.filter(c => c.metKpi5 === true).length;
    const kpi6Cases = allCases.filter(c => c.metKpi6 === true).length;

    // Calculate mortality rate (cases that are not successful)
    const successfulCases = allCases.filter(c => c.successful === true).length;
    const mortalityCases = totalCases - successfulCases;
    const mortalityRate = totalCases > 0 ? (mortalityCases / totalCases) * 100 : 0;

    // Calculate readmission rate
    const readmissionCases = allCases.filter(c => c.thirtyDayReadmission === true).length;
    const readmissionRate = totalCases > 0 ? (readmissionCases / totalCases) * 100 : 0;

    // Calculate follow-up completion rate
    const followUpCompletedCases = allCases.filter(c => c.followUpCallCompleted === true).length;
    const followUpRate = totalCases > 0 ? (followUpCompletedCases / totalCases) * 100 : 0;

    return {
      totalCases,
      casesThisMonth,
      casesThisWeek,
      averageDoorToBalloonTime: Math.round(averageDoorToBalloonTime * 10) / 10,
      averageDoorToNeedleTime: Math.round(averageDoorToNeedleTime * 10) / 10,
      kpi1: {
        name: 'Door to ECG ≤10min',
        target: '≤10 minutes',
        totalCases,
        withinTarget: kpi1Cases,
        percentage: totalCases > 0 ? Math.round((kpi1Cases / totalCases) * 100 * 10) / 10 : 0,
        status: totalCases > 0 && (kpi1Cases / totalCases) >= 0.9 ? 'GREEN' : 
                totalCases > 0 && (kpi1Cases / totalCases) >= 0.75 ? 'YELLOW' : 'RED',
      },
      kpi2: {
        name: 'Door to Balloon ≤90min',
        target: '≤90 minutes',
        totalCases,
        withinTarget: kpi2Cases,
        percentage: totalCases > 0 ? Math.round((kpi2Cases / totalCases) * 100 * 10) / 10 : 0,
        status: totalCases > 0 && (kpi2Cases / totalCases) >= 0.9 ? 'GREEN' : 
                totalCases > 0 && (kpi2Cases / totalCases) >= 0.75 ? 'YELLOW' : 'RED',
      },
      kpi3: {
        name: 'Door to Needle ≤30min',
        target: '≤30 minutes',
        totalCases,
        withinTarget: kpi3Cases,
        percentage: totalCases > 0 ? Math.round((kpi3Cases / totalCases) * 100 * 10) / 10 : 0,
        status: totalCases > 0 && (kpi3Cases / totalCases) >= 0.9 ? 'GREEN' : 
                totalCases > 0 && (kpi3Cases / totalCases) >= 0.75 ? 'YELLOW' : 'RED',
      },
      kpi4: {
        name: 'RCC Activation ≤15min',
        target: '≤15 minutes',
        totalCases,
        withinTarget: kpi4Cases,
        percentage: totalCases > 0 ? Math.round((kpi4Cases / totalCases) * 100 * 10) / 10 : 0,
        status: totalCases > 0 && (kpi4Cases / totalCases) >= 0.9 ? 'GREEN' : 
                totalCases > 0 && (kpi4Cases / totalCases) >= 0.75 ? 'YELLOW' : 'RED',
      },
      kpi5: {
        name: 'Door In Door Out ≤30min',
        target: '≤30 minutes',
        totalCases,
        withinTarget: kpi5Cases,
        percentage: totalCases > 0 ? Math.round((kpi5Cases / totalCases) * 100 * 10) / 10 : 0,
        status: totalCases > 0 && (kpi5Cases / totalCases) >= 0.9 ? 'GREEN' : 
                totalCases > 0 && (kpi5Cases / totalCases) >= 0.75 ? 'YELLOW' : 'RED',
      },
      kpi6: {
        name: 'Primary PCI Success',
        target: '≥95%',
        totalCases,
        withinTarget: kpi6Cases,
        percentage: totalCases > 0 ? Math.round((kpi6Cases / totalCases) * 100 * 10) / 10 : 0,
        status: totalCases > 0 && (kpi6Cases / totalCases) >= 0.95 ? 'GREEN' : 
                totalCases > 0 && (kpi6Cases / totalCases) >= 0.85 ? 'YELLOW' : 'RED',
      },
      kpi7: {
        name: 'Post-Fibrinolysis Transfer',
        target: '≥80%',
        totalTransfers: allCases.length,
        postFibrinolysis: kpi3Cases, // Assuming thrombolysis cases
        percentage: totalCases > 0 ? Math.round((kpi3Cases / totalCases) * 100 * 10) / 10 : 0,
        status: totalCases > 0 && (kpi3Cases / totalCases) >= 0.8 ? 'GREEN' : 'RED',
      },
      kpi8: {
        name: 'Primary PCI Rate',
        target: '≥70%',
        totalTransfers: allCases.length,
        primaryPci: kpi2Cases, // Assuming PCI cases
        percentage: totalCases > 0 ? Math.round((kpi2Cases / totalCases) * 100 * 10) / 10 : 0,
        status: totalCases > 0 && (kpi2Cases / totalCases) >= 0.7 ? 'GREEN' : 'RED',
      },
      kpi9: {
        name: 'Mortality Rate',
        target: '≤5%',
        totalAdmissions: totalCases,
        deaths: mortalityCases,
        percentage: Math.round(mortalityRate * 10) / 10,
        status: mortalityRate <= 5 ? 'GREEN' : mortalityRate <= 10 ? 'YELLOW' : 'RED',
      },
      kpi10: {
        name: '30-Day Readmission Rate',
        target: '≤10%',
        totalDischarges: totalCases,
        readmissions: readmissionCases,
        percentage: Math.round(readmissionRate * 10) / 10,
        status: readmissionRate <= 10 ? 'GREEN' : readmissionRate <= 15 ? 'YELLOW' : 'RED',
      },
      kpi11: {
        name: 'Follow-up Call Completion',
        target: '≥90%',
        totalDischarges: totalCases,
        followupCallsCompleted: followUpCompletedCases,
        percentage: Math.round(followUpRate * 10) / 10,
        status: followUpRate >= 90 ? 'GREEN' : followUpRate >= 75 ? 'YELLOW' : 'RED',
      },
    };
  }
}
