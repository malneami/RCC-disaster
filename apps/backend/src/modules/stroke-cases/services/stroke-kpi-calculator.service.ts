import { Injectable } from '@nestjs/common';
import { StrokeCase } from '@prisma/client';

export interface StrokeKPICalculations {
  // KPI 1: Median time interval from door to physician ≤15min
  doorToPhysicianMinutes?: number;
  metKpi1?: boolean;

  // KPI 2: Proportion of transferred patients with pre-hospital notification ≥90%
  metKpi2?: boolean;

  // KPI 3: Median time interval from registration to CT scan ≤20min
  registrationToCtMinutes?: number;
  metKpi3?: boolean;

  // Additional timing calculations for table display
  doorToCtScanMinutes?: number;
  doorToCtReportMinutes?: number;
  doorToThrombolysisOrderMinutes?: number;
  doorToNeedleMinutes?: number;
  doorToMechanicalThrombectomyMinutes?: number;

  // KPI 4: Median time interval from registration to IV thrombolysis ≤60min
  registrationToThrombolysisMinutes?: number;
  metKpi4?: boolean;

  // KPI 5: Proportion of acute ischemic stroke patients who received IV thrombolysis ≥5%
  metKpi5?: boolean;

  // KPI 6: Proportion of acute stroke patients admitted directly to stroke unit ≥80%
  metKpi6?: boolean;

  // KPI 7: Median transfer time (door-in to door-out) ≤20min (no CT), ≤40min (with CT)
  transferActivationToDepartureMinutes?: number;
  metKpi7?: boolean;

  // KPI 8: Median time interval from registration to mechanical thrombectomy puncture ≤120min
  registrationToMechanicalThrombectomyMinutes?: number;
  metKpi8?: boolean;

  // KPI 9: Median time interval from SRCA call to hospital arrival ≤60min
  srcaCallToArrivalMinutes?: number;
  metKpi9?: boolean;

  // KPI 10: Percentage of acute stroke patients who passed swallowing screening ≥85%
  swallowingScreeningWithin4Hours?: boolean;
  metKpi10?: boolean;

  // KPI 11: Percentage of patients with 3-month follow-up using modified Rankin Scale ≥80%
  metKpi11?: boolean;
}

@Injectable()
export class StrokeKPICalculatorService {
  
  /**
   * Calculate all KPIs for a stroke case
   */
  calculateKPIs(strokeCase: StrokeCase): StrokeKPICalculations {
    const calculations: StrokeKPICalculations = {};

    // KPI 1: Door to physician ≤15min
    calculations.doorToPhysicianMinutes = this.calculateDoorToPhysicianMinutes(strokeCase);
    calculations.metKpi1 = calculations.doorToPhysicianMinutes !== undefined && calculations.doorToPhysicianMinutes <= 15;

    // KPI 2: Pre-hospital notification ≥90%
    calculations.metKpi2 = this.calculatePrehospitalNotification(strokeCase);

    // KPI 3: Registration to CT scan ≤20min
    calculations.registrationToCtMinutes = this.calculateRegistrationToCtMinutes(strokeCase);
    calculations.metKpi3 = calculations.registrationToCtMinutes !== undefined && calculations.registrationToCtMinutes <= 20;

    // Additional timing calculations for table display
    calculations.doorToCtScanMinutes = this.calculateDoorToCtScanMinutes(strokeCase);
    calculations.doorToCtReportMinutes = this.calculateDoorToCtReportMinutes(strokeCase);
    calculations.doorToThrombolysisOrderMinutes = this.calculateDoorToThrombolysisOrderMinutes(strokeCase);
    calculations.doorToNeedleMinutes = this.calculateDoorToNeedleMinutes(strokeCase);
    calculations.doorToMechanicalThrombectomyMinutes = this.calculateDoorToMechanicalThrombectomyMinutes(strokeCase);

    // KPI 4: Registration to IV thrombolysis ≤60min
    calculations.registrationToThrombolysisMinutes = this.calculateRegistrationToThrombolysisMinutes(strokeCase);
    calculations.metKpi4 = calculations.registrationToThrombolysisMinutes !== undefined && calculations.registrationToThrombolysisMinutes <= 60;

    // KPI 5: IV thrombolysis rate ≥5%
    calculations.metKpi5 = this.calculateIVThrombolysisRate(strokeCase);

    // KPI 6: Direct stroke unit admission ≥80%
    calculations.metKpi6 = this.calculateDirectStrokeUnitAdmission(strokeCase);

    // // KPI 7: Transfer time ≤20min (no CT), ≤40min (with CT)
    // calculations.transferActivationToDepartureMinutes = this.calculateTransferTime(strokeCase);
    // calculations.metKpi7 = this.calculateTransferTimeKPI(strokeCase, calculations.transferActivationToDepartureMinutes);

    // KPI 8: Registration to mechanical thrombectomy puncture ≤120min
    calculations.registrationToMechanicalThrombectomyMinutes = this.calculateRegistrationToMechanicalThrombectomyMinutes(strokeCase);
    calculations.metKpi8 = calculations.registrationToMechanicalThrombectomyMinutes !== undefined && calculations.registrationToMechanicalThrombectomyMinutes <= 120;

    // KPI 9: SRCA call to arrival ≤60min
    calculations.srcaCallToArrivalMinutes = this.calculateSrcaCallToArrivalMinutes(strokeCase);
    calculations.metKpi9 = calculations.srcaCallToArrivalMinutes !== undefined && calculations.srcaCallToArrivalMinutes <= 60;

    // KPI 10: Swallowing screening pass rate ≥85%
    calculations.swallowingScreeningWithin4Hours = this.calculateSwallowingScreeningWithin4Hours(strokeCase);
    calculations.metKpi10 = calculations.swallowingScreeningWithin4Hours;

    // KPI 11: 3-month follow-up with mRS ≥80%
    calculations.metKpi11 = this.calculateFollowUpKPI(strokeCase);

    return calculations;
  }

  /**
   * KPI 1: Calculate door to physician time in minutes
   */
  private calculateDoorToPhysicianMinutes(strokeCase: StrokeCase): number | undefined {
    if (!strokeCase.dateOfAdmission || !strokeCase.timeOfPhysicianAssessment) {
      return undefined;
    }

    const registrationTime = new Date(strokeCase.dateOfAdmission);
    const physicianTime = new Date(strokeCase.timeOfPhysicianAssessment);
    
    return Math.round((physicianTime.getTime() - registrationTime.getTime()) / (1000 * 60));
  }

  /**
   * KPI 2: Check if pre-hospital notification was given
   */
  private calculatePrehospitalNotification(strokeCase: StrokeCase): boolean {
    // For transferred patients, check if notification was given
    if (strokeCase.transferToAnotherHospital) {
      return strokeCase.prehospitalNotificationBySrca || strokeCase.prehospitalNotificationByUccPhc || false;
    }
    return true; // Non-transferred patients automatically meet this KPI
  }

  /**
   * KPI 3: Calculate registration to CT scan time in minutes
   */
  private calculateRegistrationToCtMinutes(strokeCase: StrokeCase): number | undefined {
    if (!strokeCase.dateOfAdmission || !strokeCase.timeOfCtScanStart) {
      return undefined;
    }

    const registrationTime = new Date(strokeCase.dateOfAdmission);
    const ctTime = new Date(strokeCase.timeOfCtScanStart);
    
    return Math.round((ctTime.getTime() - registrationTime.getTime()) / (1000 * 60));
  }

  /**
   * Calculate door to CT scan time in minutes
   */
  private calculateDoorToCtScanMinutes(strokeCase: StrokeCase): number | undefined {
    if (!strokeCase.dateOfAdmission || !strokeCase.timeOfCtScanStart) {
      return undefined;
    }

    const registrationTime = new Date(strokeCase.dateOfAdmission);
    const ctScanTime = new Date(strokeCase.timeOfCtScanStart);
    
    return Math.round((ctScanTime.getTime() - registrationTime.getTime()) / (1000 * 60));
  }

  /**
   * Calculate door to CT report time in minutes
   */
  private calculateDoorToCtReportMinutes(strokeCase: StrokeCase): number | undefined {
    if (!strokeCase.dateOfAdmission || !strokeCase.timeOfCtReportFinal) {
      return undefined;
    }

    const registrationTime = new Date(strokeCase.dateOfAdmission);
    const ctReportTime = new Date(strokeCase.timeOfCtReportFinal);
    
    return Math.round((ctReportTime.getTime() - registrationTime.getTime()) / (1000 * 60));
  }

  /**
   * Calculate door to thrombolysis order time in minutes
   * Only applies to ischemic cases that are candidates for IV thrombolysis
   */
  private calculateDoorToThrombolysisOrderMinutes(strokeCase: StrokeCase): number | undefined {
    if (!strokeCase.dateOfAdmission || !strokeCase.thrombolysisOrderTime || strokeCase.strokeType !== 'ISCHEMIC' || strokeCase.candidateForIVThrombolysis !== 'YES') {
      return undefined;
    }

    const registrationTime = new Date(strokeCase.dateOfAdmission);
    const thrombolysisOrderTime = new Date(strokeCase.thrombolysisOrderTime);
    
    return Math.round((thrombolysisOrderTime.getTime() - registrationTime.getTime()) / (1000 * 60));
  }

  /**
   * Calculate door to needle time in minutes (same as registration to thrombolysis)
   */
  private calculateDoorToNeedleMinutes(strokeCase: StrokeCase): number | undefined {
    if (!strokeCase.dateOfAdmission || !strokeCase.ivThrombolysisAdministrationTime || strokeCase.strokeType !== 'ISCHEMIC' || strokeCase.candidateForIVThrombolysis !== 'YES') {
      return undefined;
    }

    const registrationTime = new Date(strokeCase.dateOfAdmission);
    const thrombolysisTime = new Date(strokeCase.ivThrombolysisAdministrationTime);
    
    return Math.round((thrombolysisTime.getTime() - registrationTime.getTime()) / (1000 * 60));
  }

  /**
   * Calculate door to mechanical thrombectomy time in minutes
   */
  private calculateDoorToMechanicalThrombectomyMinutes(strokeCase: StrokeCase): number | undefined {
    if (!strokeCase.dateOfAdmission || !strokeCase.timeOfMechanicalThrombectomyPuncture) {
      return undefined;
    }

    const registrationTime = new Date(strokeCase.dateOfAdmission);
    const mechanicalThrombectomyTime = new Date(strokeCase.timeOfMechanicalThrombectomyPuncture);
    
    return Math.round((mechanicalThrombectomyTime.getTime() - registrationTime.getTime()) / (1000 * 60));
  }

  /**
   * KPI 4: Calculate registration to IV thrombolysis time in minutes
   * Only applies to ischemic cases that are candidates for IV thrombolysis
   */
  private calculateRegistrationToThrombolysisMinutes(strokeCase: StrokeCase): number | undefined {
    if (!strokeCase.dateOfAdmission || !strokeCase.ivThrombolysisAdministrationTime || strokeCase.strokeType !== 'ISCHEMIC' || strokeCase.candidateForIVThrombolysis !== 'YES') {
      return undefined;
    }

    const registrationTime = new Date(strokeCase.dateOfAdmission);
    const thrombolysisTime = new Date(strokeCase.ivThrombolysisAdministrationTime);
    
    return Math.round((thrombolysisTime.getTime() - registrationTime.getTime()) / (1000 * 60));
  }

  /**
   * KPI 5: Check if IV thrombolysis was given for eligible patients
   */
  private calculateIVThrombolysisRate(strokeCase: StrokeCase): boolean {
    // Only applicable to ischemic stroke patients
    if (strokeCase.strokeTypeDetailed !== 'ISCHEMIC_STROKE') {
      return true; // Not applicable
    }

    // Check if patient was eligible and received thrombolysis
    if (strokeCase.candidateForIVThrombolysis === 'YES') {
      return strokeCase.ivThrombolysisGiven === 'YES';
    }

    return true; // Not eligible, so KPI is met
  }

  /**
   * KPI 6: Check if patient was admitted directly to stroke unit
   */
  private calculateDirectStrokeUnitAdmission(strokeCase: StrokeCase): boolean {
    // Check if admitted to stroke unit (auto-calculated field)
    return strokeCase.admittedToStrokeUnit || false;
  }

  /**
   * KPI 7: Calculate transfer time and check against target
   */
  // private calculateTransferTime(strokeCase: StrokeCase): number | undefined {
  //   if (!strokeCase.timeOfTransferActivation || !strokeCase.timeOfTransferDeparture) {
  //     return undefined;
  //   }

  //   const activationTime = new Date(strokeCase.timeOfTransferActivation);
  //   const departureTime = new Date(strokeCase.timeOfTransferDeparture);
    
  //   return Math.round((departureTime.getTime() - activationTime.getTime()) / (1000 * 60));
  // }

  // private calculateTransferTimeKPI(strokeCase: StrokeCase, transferMinutes?: number): boolean {
  //   if (!strokeCase.transferToAnotherHospital || transferMinutes === undefined) {
  //     return true; // Not applicable
  //   }

  //   // Target: ≤20min (no CT), ≤40min (with CT)
  //   const targetMinutes = strokeCase.facilityHasCt ? 40 : 20;
  //   return transferMinutes <= targetMinutes;
  // }

  /**
   * KPI 8: Calculate registration to mechanical thrombectomy puncture time in minutes
   */
  private calculateRegistrationToMechanicalThrombectomyMinutes(strokeCase: StrokeCase): number | undefined {
    if (!strokeCase.dateOfAdmission || !strokeCase.timeOfMechanicalThrombectomyPuncture) {
      return undefined;
    }

    const registrationTime = new Date(strokeCase.dateOfAdmission);
    const mechanicalThrombectomyTime = new Date(strokeCase.timeOfMechanicalThrombectomyPuncture);
    
    return Math.round((mechanicalThrombectomyTime.getTime() - registrationTime.getTime()) / (1000 * 60));
  }

  /**
   * KPI 9: Calculate SRCA call to arrival time in minutes
   */
  private calculateSrcaCallToArrivalMinutes(strokeCase: StrokeCase): number | undefined {
    if (!strokeCase.srcaCallTime || !strokeCase.dateOfAdmission) {
      return undefined;
    }

    const callTime = new Date(strokeCase.srcaCallTime);
    const arrivalTime = new Date(strokeCase.dateOfAdmission);
    
    return Math.round((arrivalTime.getTime() - callTime.getTime()) / (1000 * 60));
  }

  /**
   * KPI 10: Check if swallowing screening result was PASS (for cases where screening was performed)
   */
  private calculateSwallowingScreeningWithin4Hours(strokeCase: StrokeCase): boolean {
    // Only consider cases where swallowing screening was actually performed
    if (!strokeCase.swallowingScreeningPerformed || !strokeCase.swallowingScreeningResult) {
      return false;
    }

    // Check if the screening result was PASS
    return strokeCase.swallowingScreeningResult === 'PASS';
  }

  /**
   * KPI 11: Check if 3-month follow-up was completed with mRS
   * Uses threeMonthFollowupComplete checkbox from outcome form
   */
  private calculateFollowUpKPI(strokeCase: StrokeCase): boolean {
    // Use the threeMonthFollowupComplete checkbox if available, otherwise fall back to legacy check
    if ((strokeCase as any).threeMonthFollowupComplete !== undefined) {
      return !!(strokeCase as any).threeMonthFollowupComplete;
    }
    // Legacy fallback: check followUpContactAttempted and modifiedRankinScaleAt90Days
    return !!(strokeCase.followUpContactAttempted && strokeCase.modifiedRankinScaleAt90Days !== undefined);
  }

  /**
   * Calculate KPIs for multiple stroke cases (for aggregate reporting)
   */
  calculateAggregateKPIs(strokeCases: StrokeCase[]): {
    kpi1: { median: number; targetMet: number; total: number };
    kpi2: { percentage: number; targetMet: number; total: number };
    kpi3: { median: number; targetMet: number; total: number };
    kpi4: { median: number; targetMet: number; total: number };
    kpi5: { percentage: number; targetMet: number; total: number };
    kpi6: { percentage: number; targetMet: number; total: number };
    kpi7: { median: number; targetMet: number; total: number };
    kpi8: { median: number; targetMet: number; total: number };
    kpi9: { median: number; targetMet: number; total: number };
    kpi10: { percentage: number; targetMet: number; total: number };
    kpi11: { percentage: number; targetMet: number; total: number };
  } {
    const kpiCalculations = strokeCases.map(case_ => this.calculateKPIs(case_));

    return {
      kpi1: this.calculateMedianKPI(kpiCalculations.map(k => k.doorToPhysicianMinutes), 15),
      kpi2: this.calculatePercentageKPI(kpiCalculations.map(k => k.metKpi2), 90),
      kpi3: this.calculateMedianKPI(kpiCalculations.map(k => k.registrationToCtMinutes), 20),
      kpi4: this.calculateMedianKPI(kpiCalculations.map(k => k.registrationToThrombolysisMinutes), 60),
      kpi5: this.calculatePercentageKPI(kpiCalculations.map(k => k.metKpi5), 5),
      kpi6: this.calculatePercentageKPI(kpiCalculations.map(k => k.metKpi6), 80),
      kpi7: this.calculateMedianKPI(kpiCalculations.map(k => k.transferActivationToDepartureMinutes), 20),
      kpi8: this.calculateMedianKPI(kpiCalculations.map(k => k.registrationToMechanicalThrombectomyMinutes), 120),
      kpi9: this.calculateMedianKPI(kpiCalculations.map(k => k.srcaCallToArrivalMinutes), 60),
      kpi10: this.calculatePercentageKPI(kpiCalculations.map(k => k.metKpi10), 85),
      kpi11: this.calculatePercentageKPI(kpiCalculations.map(k => k.metKpi11), 80),
    };
  }

  private calculateMedianKPI(values: (number | undefined)[], target: number): { median: number; targetMet: number; total: number } {
    const validValues = values.filter(v => v !== undefined) as number[];
    const median = validValues.length > 0 ? this.calculateMedian(validValues) : 0;
    const targetMet = validValues.filter(v => v <= target).length;
    const total = validValues.length;

    return { median, targetMet, total };
  }

  private calculatePercentageKPI(values: (boolean | undefined)[], targetPercentage: number): { percentage: number; targetMet: number; total: number } {
    const validValues = values.filter(v => v !== undefined) as boolean[];
    const targetMet = validValues.filter(v => v).length;
    const total = validValues.length;
    const percentage = total > 0 ? (targetMet / total) * 100 : 0;

    return { percentage, targetMet, total };
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }
}
