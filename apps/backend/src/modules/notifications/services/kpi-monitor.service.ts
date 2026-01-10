import { Injectable, Logger, Inject, forwardRef, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { KpiStatusTrackerService, CaseType } from './kpi-status-tracker.service';
import { NotificationsService } from '../notifications.service';
import { StrokeKPICalculatorService } from '../../stroke-cases/services/stroke-kpi-calculator.service';
import { NotificationType, NotificationPriority, NotificationCategory, UserRole, CaseType as PrismaCaseType } from '@prisma/client';

interface KpiThresholdConfig {
  id: string;
  name: string;
  targetMinutes: number;
  thresholdPercentage: number; // 85% = 0.85
}

@Injectable()
export class KpiMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KpiMonitorService.name);
  private timers = new Map<string, NodeJS.Timeout>(); // Key: `${caseId}:${kpiId}`
  private readonly THRESHOLD_PERCENTAGE = 0.85; // 85% threshold

  constructor(
    private readonly prisma: PrismaService,
    private readonly kpiStatusTracker: KpiStatusTrackerService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => StrokeKPICalculatorService))
    private readonly strokeKpiCalculator: StrokeKPICalculatorService,
  ) {}

  /**
   * Initialize timers on module startup - recover from active cases in database
   */
  async onModuleInit() {
    try {
      await this.recoverTimersFromActiveCases();
      this.logger.log(`KPI Monitor Service initialized. Active timers: ${this.timers.size}`);
    } catch (error) {
      this.logger.error('Error initializing KPI Monitor Service:', error);
    }
  }

  /**
   * Cleanup timers on module shutdown
   */
  async onModuleDestroy() {
    try {
      // Clear all timers
      for (const [key, timer] of this.timers.entries()) {
        clearTimeout(timer);
      }
      this.timers.clear();
      
    } catch (error) {
      this.logger.error('Error destroying KPI Monitor Service:', error);
    }
  }

  /**
   * KPI threshold configurations for each case type
   */
  private getKpiThresholds(caseType: CaseType): KpiThresholdConfig[] {
    switch (caseType) {
      case 'STEMI':
        return [
          { id: 'kpi1', name: 'Door to ECG', targetMinutes: 10, thresholdPercentage: this.THRESHOLD_PERCENTAGE },
          { id: 'kpi2', name: 'Door to Balloon (Direct)', targetMinutes: 90, thresholdPercentage: this.THRESHOLD_PERCENTAGE },
          { id: 'kpi2_transfer', name: 'Door to Balloon (Transfer)', targetMinutes: 120, thresholdPercentage: this.THRESHOLD_PERCENTAGE },
          { id: 'kpi3', name: 'Door to Needle', targetMinutes: 30, thresholdPercentage: this.THRESHOLD_PERCENTAGE },
          { id: 'kpi4', name: 'RCC Activation', targetMinutes: 15, thresholdPercentage: this.THRESHOLD_PERCENTAGE },
          { id: 'kpi5', name: 'Door In Door Out', targetMinutes: 30, thresholdPercentage: this.THRESHOLD_PERCENTAGE },
        ];
      
      case 'STROKE':
        return [
          { id: 'kpi1', name: 'Door to Physician', targetMinutes: 15, thresholdPercentage: this.THRESHOLD_PERCENTAGE },
          { id: 'kpi3', name: 'Door to CT Scan', targetMinutes: 20, thresholdPercentage: this.THRESHOLD_PERCENTAGE },
          { id: 'kpi4', name: 'Registration to IV Thrombolysis', targetMinutes: 60, thresholdPercentage: this.THRESHOLD_PERCENTAGE },
          { id: 'kpi8', name: 'Registration to Mechanical Thrombectomy', targetMinutes: 120, thresholdPercentage: this.THRESHOLD_PERCENTAGE },
          { id: 'kpi9', name: 'SRCA Call to Arrival', targetMinutes: 60, thresholdPercentage: this.THRESHOLD_PERCENTAGE },
        ];
      
      case 'TRAUMA':
        return [
          { id: 'responseTime', name: 'Response Time', targetMinutes: 15, thresholdPercentage: this.THRESHOLD_PERCENTAGE },
          { id: 'transferTime', name: 'Transfer Time', targetMinutes: 60, thresholdPercentage: this.THRESHOLD_PERCENTAGE },
        ];
      
      default:
        return [];
    }
  }

  /**
   * Schedule KPI threshold checks for a newly created case
   * Called when a case is created
   */
  async scheduleKpiThresholdChecks(
    caseId: string,
    caseType: CaseType,
    pathwayStarted: Date,
    caseData?: any, 
  ): Promise<void> {
    try {

      const thresholds = this.getKpiThresholds(caseType);
      const now = Date.now();
      const pathwayStartTime = new Date(pathwayStarted).getTime();

      for (const threshold of thresholds) {
        if (!this.shouldScheduleKpi(caseType, threshold.id, caseData)) {
          continue;
        }

        const thresholdMinutes = threshold.targetMinutes * threshold.thresholdPercentage;
        const thresholdMs = thresholdMinutes * 60 * 1000;
        const thresholdTime = new Date(pathwayStartTime + thresholdMs);
        const delayMs = thresholdTime.getTime() - now;

        if (delayMs > 0) {
          const timerKey = `${caseId}:${threshold.id}`;
          
          this.cancelTimer(timerKey);

          const timer = setTimeout(async () => {
            await this.checkKpiThreshold(caseId, caseType, threshold.id, threshold);
            this.timers.delete(timerKey);
          }, delayMs);

          this.timers.set(timerKey, timer);
        }
      }
    } catch (error) {
      this.logger.error(`Error scheduling KPI threshold checks for case ${caseId}:`, error);
    }
  }

  /**
   * Check if a KPI should be scheduled based on case data
   */
  private shouldScheduleKpi(caseType: CaseType, kpiId: string, caseData?: any): boolean {
    if (!caseData) return true;

      switch (caseType) {
      case 'STEMI':
        // KPI 2: Door to Balloon - only schedule if PCI path is determined
        if (kpiId === 'kpi2' || kpiId === 'kpi2_transfer') {
          if (caseData.thrombolyticAdminTime || caseData.thrombolyticGiven === true) {
            return false;
          }
          if (caseData.eligibleForPrimaryPci !== true) {
            return false; // Treatment path not yet determined - don't schedule yet
          }
          if (kpiId === 'kpi2' && caseData.caseType === 'TRANSFER') {
            return false; // Will use kpi2_transfer instead
          }
          if (kpiId === 'kpi2_transfer' && caseData.caseType !== 'TRANSFER') {
            return false; // Only for transfer cases
          }
        }
        // KPI 3: Door to Needle - only schedule if thrombolysis path is determined
        if (kpiId === 'kpi3') {
          if (caseData.balloonInflationTime) {
            return false;
          }
          if (caseData.thrombolyticGiven !== true) {
            return false; // Treatment path not yet determined - don't schedule yet
          }
          // Also check transfer case
          if (caseData.caseType !== 'TRANSFER') {
            return false; 
          }
        }
        // KPI 4: RCC Activation - only for transfer cases with PCI eligibility and ticket
        if (kpiId === 'kpi4' && (caseData.caseType !== 'TRANSFER' || !caseData.eligibleForPrimaryPci || !caseData.ticketId)) {
          return false; // Only for transfer cases eligible for PCI with ticket
        }
        // KPI 5: Door In Door Out - only for transfer cases with PCI eligibility
        if (kpiId === 'kpi5' && (caseData.caseType !== 'TRANSFER' || !caseData.eligibleForPrimaryPci)) {
          return false; // Only for transfer cases eligible for PCI
        }
        break;

        case 'STROKE':
        // KPI 4: Only for thrombolysis candidates
        if (kpiId === 'kpi4' && caseData.candidateForIVThrombolysis !== 'YES') {
          return false;
        }
        // KPI 8: Only for thrombectomy cases
        if (kpiId === 'kpi8' && !caseData.lvoDetected) {
          return false;
        }
        // KPI 9: Only if SRCA call time exists
        if (kpiId === 'kpi9' && !caseData.srcaCallTime) {
          return false;
        }
          break;

        case 'TRAUMA':
        // Transfer time only for transfer cases
        if (kpiId === 'transferTime' && !caseData.transferRequestDateTime) {
          return false;
        }
        break;
    }

    return true;
  }

  /**
   * Check KPI threshold when timer fires
   */
  private async checkKpiThreshold(
    caseId: string,
    caseType: CaseType,
    kpiId: string,
    threshold: KpiThresholdConfig,
  ): Promise<void> {
    try {
      let caseData: any;
      let hospitalId: string;
      let hospitalName: string;

      switch (caseType) {
        case 'STEMI': {
          const stemiCase = await this.prisma.stemiCase.findUnique({
            where: { id: caseId, deletedAt: null },
            include: {
              originHospital: { select: { id: true, name: true } },
              destinationHospital: { select: { id: true, name: true } },
              ticket: { select: { emsContactTime: true } },
              patient: { select: { id: true, firstName: true, lastName: true, nationalId: true } },
            },
          });

          if (!stemiCase) {
            this.logger.warn(`STEMI case ${caseId} not found`);
            return;
          }

          if (stemiCase.outcomeFormCompleted) {
            this.logger.log(`Case ${caseId} already completed, skipping KPI check`);
            return;
          }

          // Validate that pathwayStarted (admission time) exists
          if (!stemiCase.pathwayStarted) {
            this.logger.warn(`STEMI case ${caseId} has no pathwayStarted (admission time), cannot check KPI ${kpiId}`);
            return;
          }

          hospitalId = stemiCase.destinationHospitalId || stemiCase.originHospitalId || '';
          hospitalName = stemiCase.destinationHospital?.name || stemiCase.originHospital?.name || 'Unknown';
          caseData = stemiCase;
          break;
        }

        case 'STROKE': {
          const strokeCase = await this.prisma.strokeCase.findUnique({
            where: { id: caseId },
            include: {
              originHospital: { select: { id: true, name: true } },
              destinationHospital: { select: { id: true, name: true } },
              patient: { select: { id: true, firstName: true, lastName: true, nationalId: true } },
            },
          });

          if (!strokeCase) {
            this.logger.warn(`Stroke case ${caseId} not found`);
            return;
          }

          if (strokeCase.outcomeFormCompleted) {
            this.logger.log(`Case ${caseId} already completed, skipping KPI check`);
            return;
          }

          if (!strokeCase.dateOfAdmission) {
            this.logger.warn(`STROKE case ${caseId} has no dateOfAdmission (admission time), cannot check KPI ${kpiId}`);
            return;
          }

          hospitalId = strokeCase.destinationHospitalId || strokeCase.originHospitalId || '';
          hospitalName = strokeCase.destinationHospital?.name || strokeCase.originHospital?.name || 'Unknown';
          caseData = strokeCase;
          break;
        }

        case 'TRAUMA': {
          const traumaCase = await this.prisma.traumaCase.findUnique({
            where: { id: caseId },
            include: {
              originHospital: { select: { id: true, name: true } },
              destinationHospital: { select: { id: true, name: true } },
              patient: { select: { id: true, firstName: true, lastName: true, nationalId: true } },
            },
          });

          if (!traumaCase) {
            this.logger.warn(`Trauma case ${caseId} not found`);
            return;
          }

          hospitalId = traumaCase.destinationHospitalId || traumaCase.originHospitalId || '';
          hospitalName = traumaCase.destinationHospital?.name || traumaCase.originHospital?.name || 'Unknown';
          caseData = traumaCase;
          break;
        }
        default:
          this.logger.warn(`Unknown case type: ${caseType}`);
          return;
      }

      const isKpiMet = this.isKpiMet(caseType, kpiId, caseData, threshold);

      if (isKpiMet) {
        this.logger.log(`KPI ${kpiId} is met for case ${caseId}, no notification needed`);
        return;
      }
      
      const hasNotification = await this.kpiStatusTracker.hasCaseNotification(caseId, caseType, kpiId);
      
      if (hasNotification) {
        return;
      }
      
      const systemUserId = await this.notificationsService.getSystemUserId();
      
      let elapsedMinutes: number;
      if (caseType === 'STROKE') {
        if (!caseData.dateOfAdmission) {
          this.logger.warn(`STROKE case ${caseId} has no dateOfAdmission, cannot calculate elapsed time`);
          return;
        }
        elapsedMinutes = this.calculateElapsedMinutes(caseData.dateOfAdmission);
      } else if (caseType === 'TRAUMA') {
        if (kpiId === 'responseTime' && caseData.arrivalDateTime) {
          elapsedMinutes = this.calculateElapsedMinutes(caseData.arrivalDateTime);
        } else if (kpiId === 'transferTime' && caseData.transferRequestDateTime) {
          elapsedMinutes = this.calculateElapsedMinutes(caseData.transferRequestDateTime);
        } else {
          this.logger.warn(`TRAUMA case ${caseId} missing required time field for KPI ${kpiId}`);
          return;
        }
      } else {
        if (!caseData.pathwayStarted) {
          this.logger.warn(`STEMI case ${caseId} has no pathwayStarted, cannot calculate elapsed time`);
          return;
        }
        elapsedMinutes = this.calculateElapsedMinutes(caseData.pathwayStarted);
      }
      
      const dependentKpisStatus = this.checkDependentKpisStatus(caseType, kpiId, caseData);
      const failingDependentKpis = dependentKpisStatus.filter(dep => dep.isFailing);
      
      if (failingDependentKpis.length > 0) {
        this.logger.log(`KPI ${kpiId} failure affects ${failingDependentKpis.length} dependent KPIs: ${failingDependentKpis.map(dep => dep.name).join(', ')}`);
      }
      
      let patientName = 'Unknown Patient';
      let patientNationalId = 'N/A';
      
      if (caseData.patient) {
        patientName = `${caseData.patient.firstName || ''} ${caseData.patient.lastName || ''}`.trim() || 'Unknown Patient';
        patientNationalId = caseData.patient.nationalId || 'N/A';
      }
      
      await this.createKpiThresholdNotification(
        caseId,
        hospitalId,
        hospitalName,
        caseType,
        threshold.name,
        kpiId,
        elapsedMinutes,
        threshold.targetMinutes,
        systemUserId,
        failingDependentKpis,
        patientName,
        patientNationalId,
      );
    } catch (error) {
      this.logger.error(`Error checking KPI threshold for case ${caseId}, KPI ${kpiId}:`, error);
    }
  }

  /**
   * Check if a KPI is met based on case data
   */
  private isKpiMet(caseType: CaseType, kpiId: string, caseData: any, threshold: KpiThresholdConfig): boolean {
    switch (caseType) {
      case 'STEMI':
        switch (kpiId) {
          case 'kpi1': // Door to ECG
            if (!caseData.firstEcgTime || !caseData.pathwayStarted) return false;
            const doorToEcg = this.calculateTimeDifference(caseData.pathwayStarted, caseData.firstEcgTime);
            return doorToEcg > 0 && doorToEcg <= threshold.targetMinutes;

          case 'kpi2': // Door to Balloon (Direct)
          case 'kpi2_transfer': // Door to Balloon (Transfer)
            if (caseData.thrombolyticAdminTime || caseData.thrombolyticGiven) {
              return false;
            }
            if (!caseData.balloonInflationTime || !caseData.pathwayStarted) return false;
            const doorToBalloon = this.calculateTimeDifference(caseData.pathwayStarted, caseData.balloonInflationTime);
            return doorToBalloon > 0 && doorToBalloon <= threshold.targetMinutes;

          case 'kpi3': // Door to Needle
            if (caseData.balloonInflationTime) {
              return false;
            }
            if (!caseData.thrombolyticAdminTime || !caseData.pathwayStarted) return false;
            const doorToNeedle = this.calculateTimeDifference(caseData.pathwayStarted, caseData.thrombolyticAdminTime);
            return doorToNeedle > 0 && doorToNeedle <= threshold.targetMinutes;

          case 'kpi4': // RCC Activation (EMS contact to door out ≤15min)
            if (!caseData.ticket?.emsContactTime || !caseData.doorOutTime) return false;
            const rccActivation = this.calculateTimeDifference(caseData.ticket.emsContactTime, caseData.doorOutTime);
            return rccActivation > 0 && rccActivation <= threshold.targetMinutes;

          case 'kpi5': // Door In Door Out (Admission to door out ≤30min)
            if (!caseData.pathwayStarted || !caseData.doorOutTime) return false;
            const doorInDoorOut = this.calculateTimeDifference(caseData.pathwayStarted, caseData.doorOutTime);
            return doorInDoorOut > 0 && doorInDoorOut <= threshold.targetMinutes;
        }
        break;

      case 'STROKE':
        const kpiCalculations = this.strokeKpiCalculator.calculateKPIs(caseData);
        switch (kpiId) {
          case 'kpi1': // Door to Physician
            return kpiCalculations.metKpi1 || false;
          case 'kpi3': // Door to CT Scan
            return kpiCalculations.doorToCtScanMinutes !== undefined && kpiCalculations.doorToCtScanMinutes <= threshold.targetMinutes;
          case 'kpi4': // Registration to IV Thrombolysis
            return kpiCalculations.metKpi4 || false;
          case 'kpi8': // Registration to Mechanical Thrombectomy
            return kpiCalculations.metKpi8 || false;
          case 'kpi9': // SRCA Call to Arrival
            return kpiCalculations.metKpi9 || false;
        }
        break;

      case 'TRAUMA':
        switch (kpiId) {
          case 'responseTime':
            if (!caseData.arrivalDateTime || !caseData.incidentDateTime) return false;
            const responseTime = this.calculateTimeDifference(caseData.incidentDateTime, caseData.arrivalDateTime);
            return responseTime > 0 && responseTime <= threshold.targetMinutes;
          case 'transferTime':
            if (!caseData.transferArrivalDateTime || !caseData.transferRequestDateTime) return false;
            const transferTime = this.calculateTimeDifference(caseData.transferRequestDateTime, caseData.transferArrivalDateTime);
            return transferTime > 0 && transferTime <= threshold.targetMinutes;
        }
        break;
    }

    return false;
  }

  /**
   * Calculate elapsed minutes from pathway start
   */
  private calculateElapsedMinutes(pathwayStart: Date | string): number {
    if (!pathwayStart) {
      this.logger.warn('calculateElapsedMinutes called with null/undefined pathwayStart');
      return 0;
    }
    
    const start = new Date(pathwayStart).getTime();
    const now = Date.now();
    
    if (isNaN(start)) {
      this.logger.warn(`Invalid date provided to calculateElapsedMinutes: ${pathwayStart}`);
      return 0;
    }
    
    if (start > now + 60 * 60 * 1000) {
      this.logger.warn(`Pathway start time is in the future: ${pathwayStart}, current time: ${new Date(now)}`);
      return 0;
    }
    
    const elapsed = Math.floor((now - start) / (1000 * 60));
    
    if (elapsed > 7 * 24 * 60) {
      this.logger.warn(`Unusually large elapsed time calculated: ${elapsed} minutes from ${pathwayStart}`);
      return 0;
    }
    
    return elapsed;
  }

  /**
   * Get dependent KPIs that are affected by a failing KPI
   * Returns all potential dependent KPIs - filtering by applicability happens in checkDependentKpisStatus
   */
  private getDependentKpis(caseType: CaseType, kpiId: string): Array<{ id: string; name: string }> {
    const dependencies: Record<string, Array<{ id: string; name: string }>> = {
      // STEMI dependencies
      'STEMI:kpi1': [ // Door to ECG failure affects Door to Balloon and Door to Needle
        { id: 'kpi2', name: 'Door to Balloon' },
        { id: 'kpi2_transfer', name: 'Door to Balloon (Transfer)' },
        { id: 'kpi3', name: 'Door to Needle' },
      ],
      'STEMI:kpi2': [], // Door to Balloon has no downstream dependencies
      'STEMI:kpi2_transfer': [], // Door to Balloon (Transfer) has no downstream dependencies
      'STEMI:kpi3': [], // Door to Needle has no downstream dependencies
      'STEMI:kpi4': [], // RCC Activation has no downstream dependencies
      'STEMI:kpi5': [], // Door In Door Out has no downstream dependencies

      // STROKE dependencies
      'STROKE:kpi1': [ // Door to Physician failure affects CT Scan
        { id: 'kpi3', name: 'Door to CT Scan' },
      ],
      'STROKE:kpi3': [ // Door to CT Scan failure affects treatment KPIs
        { id: 'kpi4', name: 'Registration to IV Thrombolysis' },
        { id: 'kpi8', name: 'Registration to Mechanical Thrombectomy' },
      ],
      'STROKE:kpi4': [], // IV Thrombolysis has no downstream dependencies
      'STROKE:kpi8': [], // Mechanical Thrombectomy has no downstream dependencies
      'STROKE:kpi9': [], // SRCA Call to Arrival has no downstream dependencies

      // TRAUMA dependencies
      'TRAUMA:responseTime': [], // Response Time has no downstream dependencies
      'TRAUMA:transferTime': [], // Transfer Time has no downstream dependencies
    };

    const key = `${caseType}:${kpiId}`;
    return dependencies[key] || [];
  }

  /**
   * Check if dependent KPIs are also failing or at risk
   * Reports KPIs that are:
   * 1. Actually failing (have timestamps and exceed target)
   * 2. At risk (upstream KPI failure will cause them to fail, even if not started yet)
   * When an upstream KPI fails, all applicable dependent KPIs are reported as affected
   */
  private checkDependentKpisStatus(
    caseType: CaseType,
    failingKpiId: string,
    caseData: any,
  ): Array<{ id: string; name: string; isFailing: boolean }> {
    const dependentKpis = this.getDependentKpis(caseType, failingKpiId);
    const thresholds = this.getKpiThresholds(caseType);

    this.logger.debug(`Checking dependent KPIs for ${caseType}:${failingKpiId}, found ${dependentKpis.length} potential dependencies`);

    const results = dependentKpis
      .map(depKpi => {
        const threshold = thresholds.find(t => t.id === depKpi.id);
        if (!threshold) {
          this.logger.debug(`Dependent KPI ${depKpi.id} not configured for ${caseType}`);
          return null; // KPI not configured for this case type
        }

        const isApplicable = this.isDependentKpiApplicable(caseType, depKpi.id, caseData);
        if (!isApplicable) {
          this.logger.debug(`Dependent KPI ${depKpi.id} not applicable to this case`);
          return null; // KPI not applicable to this case
        }

        const hasRequiredTimestamps = this.hasRequiredTimestampsForKpi(caseType, depKpi.id, caseData);
        
        if (hasRequiredTimestamps) {
          const isMet = this.isKpiMet(caseType, depKpi.id, caseData, threshold);
          this.logger.debug(`Dependent KPI ${depKpi.id} has timestamps, isMet: ${isMet}, isFailing: ${!isMet}`);
          return { ...depKpi, isFailing: !isMet };
        } else {
          this.logger.debug(`Dependent KPI ${depKpi.id} hasn't started yet, marking as at risk`);
          return { ...depKpi, isFailing: true }; 
        }
      })
      .filter((result): result is { id: string; name: string; isFailing: boolean } => result !== null);
    
    this.logger.debug(`Found ${results.length} affected dependent KPIs: ${results.map(r => r.name).join(', ')}`);
    return results;
  }

  /**
   * Check if a dependent KPI is applicable to the case (more lenient than shouldScheduleKpi)
   * This is used for dependency checking - we want to show KPIs that could be affected
   */
  private isDependentKpiApplicable(caseType: CaseType, kpiId: string, caseData: any): boolean {
    switch (caseType) {
      case 'STEMI':
        if (kpiId === 'kpi2') {
          if (caseData.thrombolyticAdminTime || caseData.thrombolyticGiven) {
            return false;
          }
          return caseData.caseType === 'DIRECT';
        }
        if (kpiId === 'kpi2_transfer') {
          if (caseData.thrombolyticAdminTime || caseData.thrombolyticGiven) {
            return false;
          }
          return caseData.caseType === 'TRANSFER';
        }
        if (kpiId === 'kpi3') {
          if (caseData.balloonInflationTime) {
            return false;
          }
          return caseData.caseType === 'TRANSFER';
        }
        return this.shouldScheduleKpi(caseType, kpiId, caseData);

      case 'STROKE':
        if (kpiId === 'kpi3') {
          return true;
        }
        if (kpiId === 'kpi4') {
          if (caseData.candidateForIVThrombolysis === 'NO') {
            return false;
          }
          return true;
        }
        if (kpiId === 'kpi8') {
          if (caseData.lvoDetected === false) {
            return false;
          }
          return true;
        }
        return this.shouldScheduleKpi(caseType, kpiId, caseData);

      case 'TRAUMA':
        return this.shouldScheduleKpi(caseType, kpiId, caseData);

      default:
        return false;
    }
  }

  /**
   * Check if case has required timestamps for a KPI to be evaluated
   */
  private hasRequiredTimestampsForKpi(caseType: CaseType, kpiId: string, caseData: any): boolean {
    switch (caseType) {
      case 'STEMI':
        switch (kpiId) {
          case 'kpi1': // Door to ECG
            return !!(caseData.pathwayStarted && caseData.firstEcgTime);
          case 'kpi2': // Door to Balloon (Direct)
          case 'kpi2_transfer': // Door to Balloon (Transfer)
            return !!(caseData.pathwayStarted && caseData.balloonInflationTime);
          case 'kpi3': // Door to Needle
            return !!(caseData.pathwayStarted && caseData.thrombolyticAdminTime);
          case 'kpi4': // RCC Activation
            return !!(caseData.ticket?.emsContactTime && caseData.doorOutTime);
          case 'kpi5': // Door In Door Out
            return !!(caseData.pathwayStarted && caseData.doorOutTime);
          default:
            return false;
        }

      case 'STROKE':
        switch (kpiId) {
          case 'kpi1': // Door to Physician
            return !!(caseData.dateOfAdmission && caseData.timeOfPhysicianAssessment);
          case 'kpi3': // Door to CT Scan
            return !!(caseData.dateOfAdmission && caseData.timeOfCtScanStart);
          case 'kpi4': // Registration to IV Thrombolysis
            return !!(caseData.dateOfAdmission && caseData.ivThrombolysisAdministrationTime);
          case 'kpi8': // Registration to Mechanical Thrombectomy
            return !!(caseData.dateOfAdmission && caseData.timeOfMechanicalThrombectomyPuncture);
          case 'kpi9': // SRCA Call to Arrival
            return !!(caseData.srcaCallTime && caseData.dateOfAdmission);
          default:
            return false;
        }

      case 'TRAUMA':
        switch (kpiId) {
          case 'responseTime':
            return !!(caseData.incidentDateTime && caseData.arrivalDateTime);
          case 'transferTime':
            return !!(caseData.transferRequestDateTime && caseData.transferArrivalDateTime);
          default:
            return false;
        }

      default:
        return false;
    }
  }

  /**
   * Create notification for KPI threshold breach
   */
  private async createKpiThresholdNotification(
    caseId: string,
    hospitalId: string,
    hospitalName: string,
    caseType: CaseType,
    kpiName: string,
    kpiId: string,
    elapsedMinutes: number,
    targetMinutes: number,
    createdById: string,
    failingDependentKpis: Array<{ id: string; name: string; isFailing: boolean }> = [],
    patientName: string = 'Unknown Patient',
    patientNationalId: string = 'N/A',
  ): Promise<void> {
    try {
      const title = `KPI Threshold Approaching - ${hospitalName} - ${kpiName}`;
      
      let message = `Patient ${patientName} (ID: ${patientNationalId}) at ${hospitalName} has reached 85% of ${caseType} KPI '${kpiName}' threshold. ${elapsedMinutes} minutes elapsed, target is ${targetMinutes} minutes.`;
      
      // Add impact information if dependent KPIs are also failing
      if (failingDependentKpis.length > 0) {
        const affectedKpiNames = failingDependentKpis.map(dep => dep.name).join(', ');
        message += ` This failure is affecting the following KPIs: ${affectedKpiNames}.`;
      }

      const rccUserIds = await this.notificationsService.getUsersByRole(UserRole.RCC);

      if (rccUserIds.length === 0) {
        this.logger.warn(`No active RCC users found for KPI threshold notification (case: ${caseId}, KPI: ${kpiId})`);
        return;
      }

      const metadata = JSON.stringify({
        caseId,
        hospitalId,
        hospitalName,
        caseType,
        kpiId,
        kpiName,
        elapsedMinutes,
        targetMinutes,
        thresholdPercentage: this.THRESHOLD_PERCENTAGE,
        source: 'kpi_threshold_timer',
        affectedKpis: failingDependentKpis.map(dep => ({ id: dep.id, name: dep.name })),
      });

      const systemPatientId = await this.notificationsService['getSystemPatientId']();

      const notification = await this.notificationsService.createNotification(
        {
          type: NotificationType.KPI_THRESHOLD_BREACH,
          priority: NotificationPriority.HIGH,
          title,
          message,
          caseType: caseType === 'STEMI' ? PrismaCaseType.STEMI : caseType === 'STROKE' ? PrismaCaseType.STROKE : PrismaCaseType.TRAUMA,
          caseId: caseId,
          patientId: systemPatientId.id,
          patientName: patientName,
          category: NotificationCategory.HOSPITALS,
          recipientUserIds: rccUserIds,
          metadata,
        },
        createdById,
      );

      if (notification) {
        this.notificationsService['notificationsGateway'].emitNotificationCreated(notification);
        this.notificationsService['notificationsGateway'].emitNotificationByCategory(
          notification,
          NotificationCategory.HOSPITALS,
        );
        this.notificationsService['notificationsGateway'].emitNotificationByRole(notification, [UserRole.RCC]);
      }

      this.logger.log(`Created KPI threshold notification for case ${caseId}, KPI ${kpiName}`);
    } catch (error) {
      this.logger.error(`Error creating KPI threshold notification for case ${caseId}, KPI ${kpiId}:`, error);
    }
  }

  /**
   * Cancel timers for a case (when case is updated or completed)
   */
  cancelCaseTimers(caseId: string): void {
    try {
      const keysToCancel: string[] = [];
      
      for (const [key, timer] of this.timers.entries()) {
        if (key.startsWith(`${caseId}:`)) {
          clearTimeout(timer);
          keysToCancel.push(key);
        }
      }

      for (const key of keysToCancel) {
        this.timers.delete(key);
      }

      if (keysToCancel.length > 0) {
        this.logger.log(`Cancelled ${keysToCancel.length} timers for case ${caseId}`);
      }
    } catch (error) {
      this.logger.error(`Error cancelling timers for case ${caseId}:`, error);
    }
  }

  /**
   * Cancel a specific timer
   */
  private cancelTimer(timerKey: string): void {
    const timer = this.timers.get(timerKey);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(timerKey);
    }
  }

  /**
   * Recover timers from active cases in database on startup
   * Queries all non-completed cases and reschedules their KPI threshold checks
   */
  private async recoverTimersFromActiveCases(): Promise<void> {
    try {
      let recoveredCount = 0;

      const activeStemiCases = await this.prisma.stemiCase.findMany({
        where: {
          deletedAt: null,
          outcomeFormCompleted: false,
        },
        select: {
          id: true,
          pathwayStarted: true,
          createdAt: true,
          caseType: true,
          triageTime: true,
          firstEcgTime: true,
          balloonInflationTime: true,
          thrombolyticAdminTime: true,
          eligibleForPrimaryPci: true,
          thrombolyticGiven: true,
          doorOutTime: true,
          ticketId: true,
          ticket: {
            select: {
              emsContactTime: true,
            },
          },
        },
      });

      for (const case_ of activeStemiCases) {
        if (!case_.pathwayStarted) {
          this.logger.warn(`STEMI case ${case_.id} has no pathwayStarted, skipping timer recovery`);
          continue;
        }
        await this.scheduleKpiThresholdChecks(
          case_.id,
          'STEMI',
          new Date(case_.pathwayStarted),
          {
            caseType: case_.caseType,
            triageTime: case_.triageTime,
            firstEcgTime: case_.firstEcgTime,
            balloonInflationTime: case_.balloonInflationTime,
            thrombolyticAdminTime: case_.thrombolyticAdminTime,
            eligibleForPrimaryPci: case_.eligibleForPrimaryPci,
            thrombolyticGiven: case_.thrombolyticGiven,
            doorOutTime: case_.doorOutTime,
            ticketId: case_.ticketId,
            ticket: case_.ticket,
          },
        );
        recoveredCount += this.getKpiThresholds('STEMI').filter(t => 
          this.shouldScheduleKpi('STEMI', t.id, {
            caseType: case_.caseType,
            triageTime: case_.triageTime,
            firstEcgTime: case_.firstEcgTime,
            balloonInflationTime: case_.balloonInflationTime,
            thrombolyticAdminTime: case_.thrombolyticAdminTime,
            eligibleForPrimaryPci: case_.eligibleForPrimaryPci,
            thrombolyticGiven: case_.thrombolyticGiven,
            doorOutTime: case_.doorOutTime,
            ticketId: case_.ticketId,
            ticket: case_.ticket,
          })
        ).length;
      }

      const activeStrokeCases = await this.prisma.strokeCase.findMany({
        where: {
          outcomeFormCompleted: false,
        },
        select: {
          id: true,
          dateOfAdmission: true,
          createdAt: true,
          candidateForIVThrombolysis: true,
          lvoDetected: true,
          srcaCallTime: true,
        },
      });

      for (const case_ of activeStrokeCases) {
        const pathwayStarted = case_.dateOfAdmission || case_.createdAt;
        await this.scheduleKpiThresholdChecks(
          case_.id,
          'STROKE',
          new Date(pathwayStarted),
          {
            candidateForIVThrombolysis: case_.candidateForIVThrombolysis,
            lvoDetected: case_.lvoDetected,
            srcaCallTime: case_.srcaCallTime,
          },
        );
        recoveredCount += this.getKpiThresholds('STROKE').filter(t => 
          this.shouldScheduleKpi('STROKE', t.id, {
            candidateForIVThrombolysis: case_.candidateForIVThrombolysis,
            lvoDetected: case_.lvoDetected,
            srcaCallTime: case_.srcaCallTime,
          })
        ).length;
      }

      const activeTraumaCases = await this.prisma.traumaCase.findMany({
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          arrivalDateTime: true,
          createdAt: true,
          transferRequestDateTime: true,
          incidentDateTime: true,
        },
      });

      for (const case_ of activeTraumaCases) {
        const pathwayStarted = case_.arrivalDateTime || case_.createdAt;
        await this.scheduleKpiThresholdChecks(
          case_.id,
          'TRAUMA',
          new Date(pathwayStarted),
          {
            transferRequestDateTime: case_.transferRequestDateTime,
            incidentDateTime: case_.incidentDateTime,
            arrivalDateTime: case_.arrivalDateTime,
          },
        );
        recoveredCount += this.getKpiThresholds('TRAUMA').filter(t => 
          this.shouldScheduleKpi('TRAUMA', t.id, {
            transferRequestDateTime: case_.transferRequestDateTime,
            incidentDateTime: case_.incidentDateTime,
            arrivalDateTime: case_.arrivalDateTime,
          })
        ).length;
      }

      this.logger.log(`Recovered ${recoveredCount} KPI threshold timers from ${activeStemiCases.length + activeStrokeCases.length + activeTraumaCases.length} active cases`);
    } catch (error) {
      this.logger.error('Error recovering timers from active cases:', error);
    }
  }

  /**
   * Check KPIs for a single case based on completeness
   * Called when outcome form completeness is updated
   * 
   * Note: This calculates individual case KPIs, not hospital-level aggregate KPIs.
   * The KPI summary services (getKpiSummary) calculate aggregate hospital KPIs,
   * but for individual case completeness checking, we need to evaluate each case's KPIs.
   */
  async checkCaseKpisOnCompleteness(
    caseId: string,
    caseType: CaseType,
    previousCompleteness?: number,
    currentCompleteness?: number,
  ): Promise<void> {
    try {
      // Only check KPIs when completeness reaches 100% or significant threshold
      // This prevents excessive notifications during incremental updates
      if (currentCompleteness !== undefined && currentCompleteness < 100) {
        if (previousCompleteness === undefined || previousCompleteness < 100) {
          // Not at 100% yet, skip notification
          return;
        }
      }

      let caseData: any;
      let hospitalId: string;
      let hospitalName: string;

      switch (caseType) {
        case 'STEMI': {
          const stemiCase = await this.prisma.stemiCase.findUnique({
            where: { id: caseId, deletedAt: null },
            include: {
              originHospital: { select: { id: true, name: true } },
              destinationHospital: { select: { id: true, name: true } },
              ticket: { select: { emsContactTime: true } },
            },
          });

          if (!stemiCase) {
            this.logger.warn(`STEMI case ${caseId} not found`);
            return;
          }

          hospitalId = stemiCase.destinationHospitalId || stemiCase.originHospitalId || '';
          hospitalName = stemiCase.destinationHospital?.name || stemiCase.originHospital?.name || 'Unknown';

          const kpiResults = this.calculateStemiCaseKpis(stemiCase);
          await this.processCaseKpiResults(caseId, hospitalId, hospitalName, caseType, kpiResults);
          break;
        }

        case 'STROKE': {
          const strokeCase = await this.prisma.strokeCase.findUnique({
            where: { id: caseId },
            include: {
              originHospital: { select: { id: true, name: true } },
              destinationHospital: { select: { id: true, name: true } },
            },
          });

          if (!strokeCase) {
            this.logger.warn(`Stroke case ${caseId} not found`);
            return;
          }

          // Use destination hospital if available, otherwise origin
          hospitalId = strokeCase.destinationHospitalId || strokeCase.originHospitalId || '';
          hospitalName = strokeCase.destinationHospital?.name || strokeCase.originHospital?.name || 'Unknown';

          // Calculate KPIs for this case
          const kpiResults = this.calculateStrokeCaseKpis(strokeCase);
          await this.processCaseKpiResults(caseId, hospitalId, hospitalName, caseType, kpiResults);
          break;
        }

        case 'TRAUMA': {
          // Trauma cases don't have outcome forms yet, skip for now
          this.logger.log(`Trauma case KPI checking not implemented yet`);
          return;
        }

        default:
          this.logger.warn(`Unknown case type: ${caseType}`);
          return;
      }
    } catch (error) {
      this.logger.error(`Error checking KPIs for case ${caseId}, caseType ${caseType}:`, error);
    }
  }

  /**
   * Calculate KPIs for a STEMI case
   * Uses the same calculation logic as StemiKpiService (which calculates aggregate hospital KPIs)
   * but applies it to a single case for completeness checking
   */
  private calculateStemiCaseKpis(stemiCase: any): Array<{
    id: string;
    name: string;
    status: 'GREEN' | 'YELLOW' | 'RED';
    met: boolean;
    value?: number;
    target: string;
  }> {
    const kpis: Array<{
      id: string;
      name: string;
      status: 'GREEN' | 'YELLOW' | 'RED';
      met: boolean;
      value?: number;
      target: string;
    }> = [];

    // KPI 1: Door to ECG ≤10min
    if (stemiCase.pathwayStarted && stemiCase.firstEcgTime) {
      const doorToEcgMinutes = this.calculateTimeDifference(stemiCase.pathwayStarted, stemiCase.firstEcgTime);
      const met = doorToEcgMinutes > 0 && doorToEcgMinutes <= 10;
      kpis.push({
        id: 'kpi1',
        name: 'Door to ECG',
        status: met ? 'GREEN' : 'RED',
        met,
        value: doorToEcgMinutes,
        target: '≤10 minutes',
      });
    }

    // KPI 2: Door to Balloon (Direct ≤90min, Transfer ≤120min)
    if (stemiCase.pathwayStarted && stemiCase.balloonInflationTime && !stemiCase.thrombolyticAdminTime) {
      const doorToBalloonMinutes = this.calculateTimeDifference(stemiCase.pathwayStarted, stemiCase.balloonInflationTime);
      const target = stemiCase.caseType === 'DIRECT' ? 90 : 120;
      const met = doorToBalloonMinutes > 0 && doorToBalloonMinutes <= target;
      kpis.push({
        id: 'kpi2',
        name: 'Door to Balloon',
        status: met ? 'GREEN' : 'RED',
        met,
        value: doorToBalloonMinutes,
        target: `≤${target} minutes`,
      });
    }

    // KPI 3: Door to Needle ≤30min (for transfer cases with thrombolysis)
    if (stemiCase.caseType === 'TRANSFER' && 
        stemiCase.pathwayStarted && 
        stemiCase.thrombolyticAdminTime && 
        !stemiCase.balloonInflationTime) {
      const doorToNeedleMinutes = this.calculateTimeDifference(stemiCase.pathwayStarted, stemiCase.thrombolyticAdminTime);
      const met = doorToNeedleMinutes > 0 && doorToNeedleMinutes <= 30;
      kpis.push({
        id: 'kpi3',
        name: 'Door to Needle',
        status: met ? 'GREEN' : 'RED',
        met,
        value: doorToNeedleMinutes,
        target: '≤30 minutes',
      });
    }

    // KPI 4: RCC Activation ≤15min (EMS contact to door out, transfer cases with PCI eligibility)
    if (stemiCase.caseType === 'TRANSFER' && stemiCase.eligibleForPrimaryPci && stemiCase.ticket?.emsContactTime && stemiCase.doorOutTime) {
      const rccActivationMinutes = this.calculateTimeDifference(stemiCase.ticket.emsContactTime, stemiCase.doorOutTime);
      const met = rccActivationMinutes > 0 && rccActivationMinutes <= 15;
      kpis.push({
        id: 'kpi4',
        name: 'RCC Activation',
        status: met ? 'GREEN' : 'RED',
        met,
        value: rccActivationMinutes,
        target: '≤15 minutes',
      });
    }

    if (stemiCase.caseType === 'TRANSFER' && stemiCase.eligibleForPrimaryPci && stemiCase.pathwayStarted && stemiCase.doorOutTime) {
      const doorInDoorOutMinutes = this.calculateTimeDifference(stemiCase.pathwayStarted, stemiCase.doorOutTime);
      const met = doorInDoorOutMinutes > 0 && doorInDoorOutMinutes <= 30;
      kpis.push({
        id: 'kpi5',
        name: 'Door In Door Out',
        status: met ? 'GREEN' : 'RED',
        met,
        value: doorInDoorOutMinutes,
        target: '≤30 minutes',
      });
    }

    return kpis;
  }

  /**
   * Calculate KPIs for a Stroke case
   * Uses StrokeKPICalculatorService which is designed for individual case KPI calculation
   */
  private calculateStrokeCaseKpis(strokeCase: any): Array<{
    id: string;
    name: string;
    status: 'GREEN' | 'YELLOW' | 'RED';
    met: boolean;
    value?: number;
    target: string;
  }> {
    const kpis: Array<{
      id: string;
      name: string;
      status: 'GREEN' | 'YELLOW' | 'RED';
      met: boolean;
      value?: number;
      target: string;
    }> = [];

    const kpiCalculations = this.strokeKpiCalculator.calculateKPIs(strokeCase);

    // KPI 1: Door to Physician ≤15min
    if (kpiCalculations.doorToPhysicianMinutes !== undefined) {
            kpis.push({
        id: 'kpi1',
        name: 'Door to Physician',
        status: kpiCalculations.metKpi1 ? 'GREEN' : 'RED',
        met: kpiCalculations.metKpi1 || false,
        value: kpiCalculations.doorToPhysicianMinutes,
        target: '≤15 minutes',
      });
    }

    // KPI 2: Pre-hospital notification ≥90%
    if (kpiCalculations.metKpi2 !== undefined) {
            kpis.push({
        id: 'kpi2',
        name: 'Pre-hospital Notification',
        status: kpiCalculations.metKpi2 ? 'GREEN' : 'RED',
        met: kpiCalculations.metKpi2,
        target: '≥90%',
      });
    }

    // KPI 3: Door to CT Scan ≤20min
    if (kpiCalculations.doorToCtScanMinutes !== undefined) {
      kpis.push({
        id: 'kpi3',
        name: 'Door to CT Scan',
        status: kpiCalculations.doorToCtScanMinutes <= 20 ? 'GREEN' : 'RED',
        met: kpiCalculations.doorToCtScanMinutes <= 20,
        value: kpiCalculations.doorToCtScanMinutes,
        target: '≤20 minutes',
      });
    }

    // KPI 4: Registration to IV Thrombolysis ≤60min
    if (kpiCalculations.registrationToThrombolysisMinutes !== undefined) {
      kpis.push({
        id: 'kpi4',
        name: 'Registration to IV Thrombolysis',
        status: kpiCalculations.metKpi4 ? 'GREEN' : 'RED',
        met: kpiCalculations.metKpi4 || false,
        value: kpiCalculations.registrationToThrombolysisMinutes,
        target: '≤60 minutes',
      });
    }

    // KPI 5: IV Thrombolysis Rate
    if (kpiCalculations.metKpi5 !== undefined) {
      kpis.push({
        id: 'kpi5',
        name: 'IV Thrombolysis Rate',
        status: kpiCalculations.metKpi5 ? 'GREEN' : 'RED',
        met: kpiCalculations.metKpi5,
        target: '≥5%',
      });
    }

    // KPI 6: Direct Stroke Unit Admission
    if (kpiCalculations.metKpi6 !== undefined) {
          kpis.push({
        id: 'kpi6',
        name: 'Admitted to Stroke Unit',
        status: kpiCalculations.metKpi6 ? 'GREEN' : 'RED',
        met: kpiCalculations.metKpi6,
        target: '≥80%',
      });
    }

    // KPI 8: Registration to Mechanical Thrombectomy ≤120min
    if (kpiCalculations.registrationToMechanicalThrombectomyMinutes !== undefined) {
      kpis.push({
        id: 'kpi8',
        name: 'Registration to Mechanical Thrombectomy',
        status: kpiCalculations.metKpi8 ? 'GREEN' : 'RED',
        met: kpiCalculations.metKpi8 || false,
        value: kpiCalculations.registrationToMechanicalThrombectomyMinutes,
        target: '≤120 minutes',
      });
    }

    // KPI 9: SRCA Call to Arrival ≤60min
    if (kpiCalculations.srcaCallToArrivalMinutes !== undefined) {
      kpis.push({
        id: 'kpi9',
        name: 'SRCA Call to Arrival',
        status: kpiCalculations.metKpi9 ? 'GREEN' : 'RED',
        met: kpiCalculations.metKpi9 || false,
        value: kpiCalculations.srcaCallToArrivalMinutes,
        target: '≤60 minutes',
      });
    }

    // KPI 10: Swallowing Screening Within 4 Hours
    if (kpiCalculations.swallowingScreeningWithin4Hours !== undefined) {
          kpis.push({
        id: 'kpi10',
        name: 'Swallowing Screening Within 4 Hours',
        status: kpiCalculations.metKpi10 ? 'GREEN' : 'RED',
        met: kpiCalculations.metKpi10 || false,
        target: '≥85%',
      });
    }

    // KPI 11: 3-Month Follow-up
    if (kpiCalculations.metKpi11 !== undefined) {
      kpis.push({
        id: 'kpi11',
        name: '3-Month Follow-up',
        status: kpiCalculations.metKpi11 ? 'GREEN' : 'RED',
        met: kpiCalculations.metKpi11,
        target: '≥80%',
      });
    }

    return kpis;
  }

  /**
   * Process KPI results for a single case and send notifications
   */
  private async processCaseKpiResults(
    caseId: string,
    hospitalId: string,
    hospitalName: string,
    caseType: CaseType,
    kpiResults: Array<{
      id: string;
      name: string;
      status: 'GREEN' | 'YELLOW' | 'RED';
      met: boolean;
      value?: number;
      target: string;
    }>,
  ): Promise<void> {
    try {
      const failingKpis = kpiResults.filter(kpi => !kpi.met && kpi.status === 'RED');

      if (failingKpis.length === 0) {
        this.logger.log(`All KPIs met for case ${caseId}`);
        return;
      }

      this.logger.log(`Found ${failingKpis.length} failing KPIs for case ${caseId}`);



      const systemUserId = await this.notificationsService.getSystemUserId();

      let caseData: any;
      let patientName = 'Unknown Patient';
      let patientNationalId = 'N/A';
      
      try {
        switch (caseType) {
          case 'STEMI': {
            const stemiCase = await this.prisma.stemiCase.findUnique({
              where: { id: caseId, deletedAt: null },
              include: {
                ticket: { select: { emsContactTime: true } },
                patient: { select: { id: true, firstName: true, lastName: true, nationalId: true } },
              },
            });
            caseData = stemiCase;
            if (stemiCase?.patient) {
              patientName = `${stemiCase.patient.firstName || ''} ${stemiCase.patient.lastName || ''}`.trim() || 'Unknown Patient';
              patientNationalId = stemiCase.patient.nationalId || 'N/A';
            }
            break;
          }
          case 'STROKE': {
            const strokeCase = await this.prisma.strokeCase.findUnique({
              where: { id: caseId },
              include: {
                patient: { select: { id: true, firstName: true, lastName: true, nationalId: true } },
              },
            });
            caseData = strokeCase;
            if (strokeCase?.patient) {
              patientName = `${strokeCase.patient.firstName || ''} ${strokeCase.patient.lastName || ''}`.trim() || 'Unknown Patient';
              patientNationalId = strokeCase.patient.nationalId || 'N/A';
            }
            break;
          }
          case 'TRAUMA': {
            const traumaCase = await this.prisma.traumaCase.findUnique({
              where: { id: caseId },
              include: {
                patient: { select: { id: true, firstName: true, lastName: true, nationalId: true } },
              },
            });
            caseData = traumaCase;
            if (traumaCase?.patient) {
              patientName = `${traumaCase.patient.firstName || ''} ${traumaCase.patient.lastName || ''}`.trim() || 'Unknown Patient';
              patientNationalId = traumaCase.patient.nationalId || 'N/A';
            }
            break;
          }
        }
      } catch (error) {
        this.logger.error(`Error fetching case data for dependency check: ${error}`);
        caseData = null;
      }

      // Create individual notifications for each failing KPI
      for (const kpi of failingKpis) {
        const hasNotification = await this.kpiStatusTracker.hasCaseNotification(caseId, caseType, kpi.id);
        if (hasNotification) {
          continue;
        }

        const percentage = kpi.value !== undefined ? 0 : 0; // For individual cases, percentage is not applicable
        
        let failingDependentKpis: Array<{ id: string; name: string; isFailing: boolean }> = [];
        if (caseData) {
          const dependentKpisStatus = this.checkDependentKpisStatus(caseType, kpi.id, caseData);
          failingDependentKpis = dependentKpisStatus.filter(dep => dep.isFailing);
        }
        
        await this.createCaseKpiNotification(
          caseId,
          hospitalId,
          hospitalName,
          caseType,
          kpi.name,
          kpi.id,
          'RED',
          percentage,
          kpi.target,
          systemUserId,
          failingDependentKpis,
          patientName,
          patientNationalId,
        );
      }

      // Also create a summary notification if multiple KPIs failed
      if (failingKpis.length > 1) {
        const summaryKpis = failingKpis.map(kpi => ({
          id: kpi.id,
          name: kpi.name,
          status: 'RED' as 'YELLOW' | 'RED',
          percentage: 0,
          target: kpi.target,
          previousStatus: 'GREEN' as 'GREEN' | 'YELLOW' | 'RED',
        }));

        await this.notificationsService.createKpiBreachSummaryNotification(
          hospitalId,
          hospitalName,
          caseType,
          summaryKpis,
          systemUserId,
        );
      }
    } catch (error) {
      this.logger.error(`Error processing case KPI results for case ${caseId}:`, error);
    }
  }

  /**
   * Create a KPI breach notification for an individual case
   */
  private async createCaseKpiNotification(
    caseId: string,
    hospitalId: string,
    hospitalName: string,
    caseType: CaseType,
    kpiName: string,
    kpiId: string,
    status: 'RED',
    percentage: number,
    target: string,
    createdById: string,
    failingDependentKpis: Array<{ id: string; name: string; isFailing: boolean }> = [],
    patientName: string = 'Unknown Patient',
    patientNationalId: string = 'N/A',
  ): Promise<void> {
    try {
      const priority = NotificationPriority.HIGH; // Individual case failures are always HIGH priority

      const title = `KPI Failed - ${hospitalName} - ${kpiName} - ${patientName}`;
      
      let message = `Patient ${patientName} (ID: ${patientNationalId}) at ${hospitalName} failed ${caseType} KPI '${kpiName}' (Target: ${target}). Immediate attention required.`;
      
      if (failingDependentKpis.length > 0) {
        const affectedKpiNames = failingDependentKpis.map(dep => dep.name).join(', ');
        message += ` This failure is affecting the following KPIs: ${affectedKpiNames}.`;
      }

      const rccUserIds = await this.notificationsService.getUsersByRole(UserRole.RCC);

      if (rccUserIds.length === 0) {
        this.logger.warn(`No active RCC users found for case KPI breach notification (case: ${caseId}, KPI: ${kpiId})`);
        return;
      }

      const metadata = JSON.stringify({
        caseId,
        hospitalId,
        hospitalName,
        caseType,
        kpiId,
        kpiName,
        status,
        percentage,
        target,
        source: 'case_completeness',
        affectedKpis: failingDependentKpis.map(dep => ({ id: dep.id, name: dep.name })),
      });

      const systemPatientId = await this.notificationsService['getSystemPatientId']();

      const notification = await this.notificationsService.createNotification(
        {
          type: NotificationType.KPI_THRESHOLD_BREACH,
          priority,
          title,
          message,
          caseType: caseType === 'STEMI' ? PrismaCaseType.STEMI : caseType === 'STROKE' ? PrismaCaseType.STROKE : PrismaCaseType.TRAUMA,
          caseId: caseId,
          patientId: systemPatientId.id,
          patientName: hospitalName,
          category: NotificationCategory.HOSPITALS,
          recipientUserIds: rccUserIds,
          metadata,
        },
        createdById,
      );

      if (notification) {
        this.notificationsService['notificationsGateway'].emitNotificationCreated(notification);
        this.notificationsService['notificationsGateway'].emitNotificationByCategory(
          notification,
          NotificationCategory.HOSPITALS,
        );
        this.notificationsService['notificationsGateway'].emitNotificationByRole(notification, [UserRole.RCC]);
      }

      this.logger.log(
        `Successfully created case KPI breach notification ${notification?.id} for case ${caseId}, KPI ${kpiName}`,
      );
    } catch (error) {
      this.logger.error(`Error creating case KPI notification for case ${caseId}, KPI ${kpiId}:`, error);
    }
  }

  /**
   * Calculate time difference in minutes between two dates
   */
  private calculateTimeDifference(startTime: string | Date | null, endTime: string | Date | null): number {
    if (!startTime || !endTime) return 0;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    if (diffMinutes < 0 || diffMinutes > 1440) return 0; // Max 24 hours

    return Math.floor(diffMinutes);
  }

}

