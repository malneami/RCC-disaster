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
   * Calculate door-to-ECG time in minutes
   */
  private calculateDoorToEcgTime(triageTime: string | Date | null, ecgTime: string | Date | null): number {
    if (!triageTime || !ecgTime) return 0;
    
    const triage = new Date(triageTime);
    const ecg = new Date(ecgTime);
    
    if (isNaN(triage.getTime()) || isNaN(ecg.getTime())) return 0;
    
    const diffMinutes = (ecg.getTime() - triage.getTime()) / (1000 * 60);
    
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
        firstEcgTime: true,
        doorOutTime: true,
        pathwayStarted: true,
        rccActivated: true,
        dischargeStatus: true,
        successful: true,
        thirtyDayReadmission: true,
        followUpCallCompleted: true,
        selectedTreatment: true,
        thrombolyticGiven: true,
        eligibleForPrimaryPci: true,
        caseType: true,
        ticketId: true,
        createdAt: true,
        updatedAt: true,
        ticket: {
          select: {
            emsContactTime: true,
          },
        },
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

    // Calculate door-to-needle times (only for transfer cases)
    const doorToNeedleTimes = allCases
      .filter(c => c.caseType === 'TRANSFER') // Only transfer cases
      .map(c => this.calculateDoorToNeedleTime(c.triageTime, c.thrombolyticAdminTime))
      .filter(time => time > 0);

    const averageDoorToNeedleTime = doorToNeedleTimes.length > 0 
      ? doorToNeedleTimes.reduce((sum, time) => sum + time, 0) / doorToNeedleTimes.length 
      : 0;

    // Calculate door-to-ECG times
    const doorToEcgTimes = allCases
      .map(c => this.calculateDoorToEcgTime(c.triageTime, c.firstEcgTime))
      .filter(time => time > 0);

    const averageDoorToEcgTime = doorToEcgTimes.length > 0 
      ? doorToEcgTimes.reduce((sum, time) => sum + time, 0) / doorToEcgTimes.length 
      : 0;

    // Calculate KPI performance dynamically
    const kpi1Cases = allCases.filter(c => {
      const doorToEcg = this.calculateDoorToEcgTime(c.triageTime, c.firstEcgTime);
      return doorToEcg > 0 && doorToEcg <= 10;
    }).length;

    // KPI 2: Door to Balloon - Only for cases eligible for primary PCI
    const kpi2DirectCases = allCases.filter(c => {
      if (!c.eligibleForPrimaryPci) return false; // Only PCI-eligible cases
      const doorToBalloon = this.calculateDoorToBalloonTime(c.triageTime, c.balloonInflationTime);
      return doorToBalloon > 0 && doorToBalloon <= 90 && c.caseType === 'DIRECT';
    }).length;

    const kpi2TransferCases = allCases.filter(c => {
      if (!c.eligibleForPrimaryPci) return false; // Only PCI-eligible cases
      const doorToBalloon = this.calculateDoorToBalloonTime(c.triageTime, c.balloonInflationTime);
      return doorToBalloon > 0 && doorToBalloon <= 120 && c.caseType === 'TRANSFER';
    }).length;

    const kpi2Cases = kpi2DirectCases + kpi2TransferCases;

    // KPI 3: Door to Needle - Only for cases where thrombolytic was given
    const kpi3Cases = allCases.filter(c => {
      if (!c.thrombolyticGiven) return false; // Only thrombolytic cases
      // Only calculate for transfer cases
      if (c.caseType !== 'TRANSFER') return false;
      const doorToNeedle = this.calculateDoorToNeedleTime(c.triageTime, c.thrombolyticAdminTime);
      return doorToNeedle > 0 && doorToNeedle <= 30;
    }).length;

    // Debug logging
    console.log('KPI Debug Info:');
    console.log(`Total cases: ${totalCases}`);
    console.log(`KPI2 Direct cases: ${kpi2DirectCases}`);
    console.log(`KPI2 Transfer cases: ${kpi2TransferCases}`);
    console.log(`KPI2 Total cases: ${kpi2Cases}`);
    console.log(`KPI3 Cases: ${kpi3Cases}`);
    
    // Count cases by eligibility
    const pciEligibleCases = allCases.filter(c => c.eligibleForPrimaryPci).length;
    const thrombolyticCases = allCases.filter(c => c.thrombolyticGiven).length;
    const transferCases = allCases.filter(c => c.caseType === 'TRANSFER').length;
    
    console.log(`PCI eligible cases: ${pciEligibleCases}`);
    console.log(`Thrombolytic cases: ${thrombolyticCases}`);
    console.log(`Transfer cases: ${transferCases}`);

    // RCC Activation - only for transfer cases: EMS contact to door out ≤15 minutes
    const kpi4Cases = allCases.filter(c => {
      // Only calculate for transfer cases
      if (c.caseType === 'TRANSFER' && c.ticketId && c.eligibleForPrimaryPci) {
        if (!c.ticket?.emsContactTime || !c.doorOutTime) return false;
        const emsContact = new Date(c.ticket.emsContactTime);
        const doorOut = new Date(c.doorOutTime);
        const diffMinutes = (doorOut.getTime() - emsContact.getTime()) / (1000 * 60);
        return diffMinutes > 0 && diffMinutes <= 15;
      }

      // Exclude direct cases from RCC Activation KPI
      return false;
    }).length;

    // Door In Door Out - cases where door out time is within 30 minutes of triage
    // Only include transfer cases
    const kpi5Cases = allCases.filter(c => {
      if (!c.triageTime) return false;
      if (!c.doorOutTime) return false;
      if (c.caseType !== 'TRANSFER') return false;
      if (c.eligibleForPrimaryPci !== true) return false;
      
      const triage = new Date(c.triageTime);
      const doorOut = new Date(c.doorOutTime);
      const diffMinutes = (doorOut.getTime() - triage.getTime()) / (1000 * 60);
      return diffMinutes > 0 && diffMinutes <= 30;
    }).length;

    // Primary PCI Success - cases where PCI was successful
    const kpi6Cases = allCases.filter(c => 
      c.selectedTreatment === 'PRIMARY_PCI' && c.successful === true
    ).length;

    // Calculate mortality rate (cases that are not successful)
    const deceasedCases = allCases.filter(c => c.dischargeStatus=== 'DECEASED').length;
    const mortalityRate = totalCases > 0 ? (deceasedCases / totalCases) * 100 : 0;

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
        name: 'Door to Balloon (Combined)',
        target: '≤90min (Direct) / ≤120min (Transfer)',
        totalCases,
        withinTarget: kpi2Cases,
        percentage: totalCases > 0 ? Math.round((kpi2Cases / totalCases) * 100 * 10) / 10 : 0,
        status: totalCases > 0 && (kpi2Cases / totalCases) >= 0.9 ? 'GREEN' : 
                totalCases > 0 && (kpi2Cases / totalCases) >= 0.75 ? 'YELLOW' : 'RED',
      },
      kpi2Direct: {
        name: 'Door to Balloon (Direct)',
        target: '≤90 minutes',
        totalCases: allCases.filter(c => c.caseType === 'DIRECT' && c.eligibleForPrimaryPci).length,
        withinTarget: kpi2DirectCases,
        percentage: allCases.filter(c => c.caseType === 'DIRECT' && c.eligibleForPrimaryPci).length > 0 ? 
                   Math.round((kpi2DirectCases / allCases.filter(c => c.caseType === 'DIRECT' && c.eligibleForPrimaryPci).length) * 100 * 10) / 10 : 0,
        status: allCases.filter(c => c.caseType === 'DIRECT' && c.eligibleForPrimaryPci).length > 0 && 
                (kpi2DirectCases / allCases.filter(c => c.caseType === 'DIRECT' && c.eligibleForPrimaryPci).length) >= 0.9 ? 'GREEN' : 
                allCases.filter(c => c.caseType === 'DIRECT' && c.eligibleForPrimaryPci).length > 0 && 
                (kpi2DirectCases / allCases.filter(c => c.caseType === 'DIRECT' && c.eligibleForPrimaryPci).length) >= 0.75 ? 'YELLOW' : 'RED',
      },
      kpi2Transfer: {
        name: 'Door to Balloon (Transfer)',
        target: '≤120 minutes',
        totalCases: allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci).length,
        withinTarget: kpi2TransferCases,
        percentage: allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci).length > 0 ? 
                   Math.round((kpi2TransferCases / allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci).length) * 100 * 10) / 10 : 0,
        status: allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci).length > 0 && 
                (kpi2TransferCases / allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci).length) >= 0.9 ? 'GREEN' : 
                allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci).length > 0 && 
                (kpi2TransferCases / allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci).length) >= 0.75 ? 'YELLOW' : 'RED',
      },
      kpi3: {
        name: 'Door to Needle ≤30min (Transfer Cases Only)',
        target: '≤30 minutes',
        totalCases: allCases.filter(c => c.caseType === 'TRANSFER' && c.thrombolyticGiven).length,
        withinTarget: kpi3Cases,
        percentage: allCases.filter(c => c.caseType === 'TRANSFER' && c.thrombolyticGiven).length > 0 ? 
                   Math.round((kpi3Cases / allCases.filter(c => c.caseType === 'TRANSFER' && c.thrombolyticGiven).length) * 100 * 10) / 10 : 0,
        status: allCases.filter(c => c.caseType === 'TRANSFER' && c.thrombolyticGiven).length > 0 && 
                (kpi3Cases / allCases.filter(c => c.caseType === 'TRANSFER' && c.thrombolyticGiven).length) >= 0.9 ? 'GREEN' : 
                allCases.filter(c => c.caseType === 'TRANSFER' && c.thrombolyticGiven).length > 0 && 
                (kpi3Cases / allCases.filter(c => c.caseType === 'TRANSFER' && c.thrombolyticGiven).length) >= 0.75 ? 'YELLOW' : 'RED',
      },
      kpi4: {
        name: 'RCC Activation ≤15min',
        target: '≤15 minutes',
        totalCases: allCases.filter(c => c.caseType === 'TRANSFER' && c.ticketId && c.eligibleForPrimaryPci ).length,
        withinTarget: kpi4Cases,
        percentage: allCases.filter(c => c.caseType === 'TRANSFER' && c.ticketId && c.eligibleForPrimaryPci).length > 0 ? 
                   Math.round((kpi4Cases / allCases.filter(c => c.caseType === 'TRANSFER' && c.ticketId && c.eligibleForPrimaryPci).length) * 100 * 10) / 10 : 0,
        status: allCases.filter(c => c.caseType === 'TRANSFER' && c.ticketId && c.eligibleForPrimaryPci).length > 0 && 
                (kpi4Cases / allCases.filter(c => c.caseType === 'TRANSFER' && c.ticketId && c.eligibleForPrimaryPci).length) >= 0.9 ? 'GREEN' : 
                allCases.filter(c => c.caseType === 'TRANSFER' && c.ticketId && c.eligibleForPrimaryPci).length > 0 && 
                (kpi4Cases / allCases.filter(c => c.caseType === 'TRANSFER' && c.ticketId).length) >= 0.75 ? 'YELLOW' : 'RED',
      },
      kpi5: {
        name: 'Door In Door Out ≤30min (Transfer Cases Only)',
        target: '≤30 minutes',
        totalCases: allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci).length,
        withinTarget: kpi5Cases,
        percentage: allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci).length > 0 ? 
                   Math.round((kpi5Cases / allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci).length) * 100 * 10) / 10 : 0,
        status: allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci).length > 0 && 
                (kpi5Cases / allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci).length) >= 0.9 ? 'GREEN' : 
                allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci).length > 0 && 
                (kpi5Cases / allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci).length) >= 0.75 ? 'YELLOW' : 'RED',
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
        postFibrinolysis: allCases.filter(c => c.thrombolyticGiven === true).length,
        percentage: totalCases > 0 ? Math.round((allCases.filter(c => c.thrombolyticGiven === true).length / totalCases) * 100 * 10) / 10 : 0,
        status: totalCases > 0 && (allCases.filter(c => c.thrombolyticGiven === true).length / totalCases) >= 0.8 ? 'GREEN' : 'RED',
      },
      kpi8: {
        name: 'Primary PCI Rate',
        target: '≥70%',
        totalTransfers: allCases.length,
        primaryPci: allCases.filter(c => c.selectedTreatment === 'PRIMARY_PCI').length,
        percentage: totalCases > 0 ? Math.round((allCases.filter(c => c.selectedTreatment === 'PRIMARY_PCI').length / totalCases) * 100 * 10) / 10 : 0,
        status: totalCases > 0 && (allCases.filter(c => c.selectedTreatment === 'PRIMARY_PCI').length / totalCases) >= 0.7 ? 'GREEN' : 'RED',
      },
      kpi9: {
        name: 'Mortality Rate',
        target: '≤5%',
        totalAdmissions: totalCases,
        deaths: deceasedCases,
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
