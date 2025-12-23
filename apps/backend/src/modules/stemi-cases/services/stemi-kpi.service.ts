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
    const where: any = {
      deletedAt: null, 
    };

    if (hospitalId) {
      // Include cases where hospital is either origin or destination
      where.OR = [
        { originHospitalId: hospitalId },
        { destinationHospitalId: hospitalId },
      ];
    }

    if (startDate || endDate) {
      // Use pathwayStarted (date of admission) instead of createdAt for clinical accuracy
      where.pathwayStarted = {};
      if (startDate) {
        // Set start date to beginning of day (00:00:00) in UTC to include all cases on that day
        where.pathwayStarted.gte = new Date(startDate + 'T00:00:00.000Z');
      }
      if (endDate) {
        // Set end date to end of day (23:59:59.999) in UTC to include all cases on that day
        where.pathwayStarted.lte = new Date(endDate + 'T23:59:59.999Z');
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

    // Use pathwayStarted (date of admission) for consistency with date filters
    const casesThisMonth = allCases.filter(c => {
      if (!c.pathwayStarted) return false;
      return new Date(c.pathwayStarted) >= startOfMonth;
    }).length;

    const casesThisWeek = allCases.filter(c => {
      if (!c.pathwayStarted) return false;
      return new Date(c.pathwayStarted) >= startOfWeek;
    }).length;

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
    const primaryPciCases = allCases.filter(c => c.selectedTreatment === 'PRIMARY_PCI');
    const kpi6Cases = primaryPciCases.filter(c => c.successful === true).length;
    const primaryPciCasesCount = primaryPciCases.length;

    // Calculate mortality rate - only count cases with dischargeStatus === 'DECEASED'
    const deceasedCases = allCases.filter(c => c.dischargeStatus === 'DECEASED').length;
    const mortalityRate = totalCases > 0 ? (deceasedCases / totalCases) * 100 : 0;

    // Calculate readmission rate
    const readmissionCases = allCases.filter(c => c.thirtyDayReadmission === true).length;
    const readmissionRate = totalCases > 0 ? (readmissionCases / totalCases) * 100 : 0;

    // Calculate follow-up completion rate
    const followUpCompletedCases = allCases.filter(c => c.followUpCallCompleted === true).length;
    const followUpRate = totalCases > 0 ? (followUpCompletedCases / totalCases) * 100 : 0;
    const validECGCases = allCases.filter(c => this.calculateDoorToEcgTime(c.triageTime, c.firstEcgTime) > 0).length;
    return {
      totalCases,
      casesThisMonth,
      casesThisWeek,
      averageDoorToBalloonTime: Math.round(averageDoorToBalloonTime * 10) / 10,
      averageDoorToNeedleTime: Math.round(averageDoorToNeedleTime * 10) / 10,
      kpi1: {
        name: 'Door to ECG ≤10min',
        target: '≤10 minutes',
        totalCases: validECGCases,
        withinTarget: kpi1Cases,
        validCases: allCases.filter(c => this.calculateDoorToEcgTime(c.triageTime, c.firstEcgTime) > 0).length,
        compliantCases: kpi1Cases,
        percentage: validECGCases > 0 ? Math.round((kpi1Cases / validECGCases) * 100 * 10) / 10 : 0,
        status: validECGCases > 0 && (kpi1Cases / validECGCases) >= 0.9 ? 'GREEN' : 
                validECGCases > 0 && (kpi1Cases / validECGCases) >= 0.75 ? 'YELLOW' : 'RED',
      },
      kpi2: (() => {
        // Calculate valid cases: PCI-eligible cases with positive door-to-balloon time (both direct and transfer)
        const pciEligibleCases = allCases.filter(c => c.eligibleForPrimaryPci);
        const validKpi2Cases = pciEligibleCases.filter(c => {
          const doorToBalloon = this.calculateDoorToBalloonTime(c.triageTime, c.balloonInflationTime);
          return doorToBalloon > 0;
        });
        
        // Calculate compliant cases: valid cases meeting time targets (≤90 min direct, ≤120 min transfer)
        const compliantKpi2Cases = validKpi2Cases.filter(c => {
          const doorToBalloon = this.calculateDoorToBalloonTime(c.triageTime, c.balloonInflationTime);
          if (c.caseType === 'DIRECT') {
            return doorToBalloon <= 90;
          } else if (c.caseType === 'TRANSFER') {
            return doorToBalloon <= 120;
          }
          return false;
        }).length;
        
        return {
          name: 'Door to Balloon (Combined)',
          target: '≤90min (Direct) / ≤120min (Transfer)',
          totalCases: validKpi2Cases.length,
          withinTarget: kpi2Cases,
          validCases: validKpi2Cases.length,
          compliantCases: compliantKpi2Cases,
          percentage: validKpi2Cases.length > 0 ? 
                     Math.round((compliantKpi2Cases / validKpi2Cases.length) * 100 * 10) / 10 : 0,
          status: validKpi2Cases.length > 0 && 
                  (compliantKpi2Cases / validKpi2Cases.length) >= 0.9 ? 'GREEN' : 
                  validKpi2Cases.length > 0 && 
                  (compliantKpi2Cases / validKpi2Cases.length) >= 0.75 ? 'YELLOW' : 'RED',
        };
      })(),
      kpi2Direct: (() => {
        const directPciCases = allCases.filter(c => c.caseType === 'DIRECT' && c.eligibleForPrimaryPci);
        const validDirectCases = directPciCases.filter(c => this.calculateDoorToBalloonTime(c.triageTime, c.balloonInflationTime) > 0);
        return {
          name: 'Door to Balloon (Direct)',
          target: '≤90 minutes',
          totalCases: validDirectCases.length,
          withinTarget: kpi2DirectCases,
          validCases: validDirectCases.length,
          compliantCases: kpi2DirectCases,
          percentage: validDirectCases.length > 0 ? 
                     Math.round((kpi2DirectCases / validDirectCases.length) * 100 * 10) / 10 : 0,
          status: validDirectCases.length > 0 && 
                  (kpi2DirectCases / validDirectCases.length) >= 0.9 ? 'GREEN' : 
                  validDirectCases.length > 0 && 
                  (kpi2DirectCases / validDirectCases.length) >= 0.75 ? 'YELLOW' : 'RED',
        };
      })(),
      kpi2Transfer: (() => {
        const transferPciCases = allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci);
        const validTransferCases = transferPciCases.filter(c => this.calculateDoorToBalloonTime(c.triageTime, c.balloonInflationTime) > 0);
        return {
          name: 'Door to Balloon (Transfer)',
          target: '≤120 minutes',
          totalCases: validTransferCases.length,
          withinTarget: kpi2TransferCases,
          validCases: validTransferCases.length,
          compliantCases: kpi2TransferCases,
          percentage: validTransferCases.length > 0 ? 
                     Math.round((kpi2TransferCases / validTransferCases.length) * 100 * 10) / 10 : 0,
          status: validTransferCases.length > 0 && 
                  (kpi2TransferCases / validTransferCases.length) >= 0.9 ? 'GREEN' : 
                  validTransferCases.length > 0 && 
                  (kpi2TransferCases / validTransferCases.length) >= 0.75 ? 'YELLOW' : 'RED',
        };
      })(),
      kpi3: (() => {
        const thrombolyticTransferCases = allCases.filter(c => c.caseType === 'TRANSFER' && c.thrombolyticGiven);
        const validD2nCases = thrombolyticTransferCases.filter(c => this.calculateDoorToNeedleTime(c.triageTime, c.thrombolyticAdminTime) > 0);
        return {
          name: 'Door to Needle ≤30min (Transfer Cases Only)',
          target: '≤30 minutes',
          totalCases: validD2nCases.length,
          withinTarget: kpi3Cases,
          validCases: validD2nCases.length,
          compliantCases: kpi3Cases,
          percentage: validD2nCases.length > 0 ? 
                     Math.round((kpi3Cases / validD2nCases.length) * 100 * 10) / 10 : 0,
          status: validD2nCases.length > 0 && 
                  (kpi3Cases / validD2nCases.length) >= 0.9 ? 'GREEN' : 
                  validD2nCases.length > 0 && 
                  (kpi3Cases / validD2nCases.length) >= 0.75 ? 'YELLOW' : 'RED',
        };
      })(),
      kpi4: (() => {
        const rccEligibleCases = allCases.filter(c => c.caseType === 'TRANSFER' && c.ticketId && c.eligibleForPrimaryPci);
        const validRccCases = rccEligibleCases.filter(c => c.ticket?.emsContactTime && c.doorOutTime);
        return {
          name: 'RCC Activation ≤15min',
          target: '≤15 minutes',
          totalCases: validRccCases.length,
          withinTarget: kpi4Cases,
          validCases: validRccCases.length,
          compliantCases: kpi4Cases,
          percentage: validRccCases.length > 0 ? 
                     Math.round((kpi4Cases / validRccCases.length) * 100 * 10) / 10 : 0,
          status: validRccCases.length > 0 && 
                  (kpi4Cases / validRccCases.length) >= 0.9 ? 'GREEN' : 
                  validRccCases.length > 0 && 
                  (kpi4Cases / validRccCases.length) >= 0.75 ? 'YELLOW' : 'RED',
        };
      })(),
      kpi5: (() => {
        const didoEligibleCases = allCases.filter(c => c.caseType === 'TRANSFER' && c.eligibleForPrimaryPci);
        const validDidoCases = didoEligibleCases.filter(c => {
          if (!c.triageTime || !c.doorOutTime) return false;
          const triage = new Date(c.triageTime);
          const doorOut = new Date(c.doorOutTime);
          const diffMinutes = (doorOut.getTime() - triage.getTime()) / (1000 * 60);
          return diffMinutes > 0 && diffMinutes <= 1440;
        });
        return {
          name: 'Door In Door Out ≤30min (Transfer Cases Only)',
          target: '≤30 minutes',
          totalCases: validDidoCases.length,
          withinTarget: kpi5Cases,
          validCases: validDidoCases.length,
          compliantCases: kpi5Cases,
          percentage: validDidoCases.length > 0 ? 
                     Math.round((kpi5Cases / validDidoCases.length) * 100 * 10) / 10 : 0,
          status: validDidoCases.length > 0 && 
                  (kpi5Cases / validDidoCases.length) >= 0.9 ? 'GREEN' : 
                  validDidoCases.length > 0 && 
                  (kpi5Cases / validDidoCases.length) >= 0.75 ? 'YELLOW' : 'RED',
        };
      })(),
      kpi6: {
        name: 'Primary PCI Success',
        target: '≥95%',
        totalCases: primaryPciCasesCount,
        withinTarget: kpi6Cases,
        percentage: primaryPciCasesCount > 0 ? Math.round((kpi6Cases / primaryPciCasesCount) * 100 * 10) / 10 : 0,
        status: primaryPciCasesCount > 0 && (kpi6Cases / primaryPciCasesCount) >= 0.90 ? 'GREEN' : 
                primaryPciCasesCount > 0 && (kpi6Cases / primaryPciCasesCount) >= 0.75 ? 'YELLOW' : 'RED',
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
