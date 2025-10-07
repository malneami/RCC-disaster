import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { 
  StrokeCommandCenterDataDto, 
  StrokeKPIMetricDto, 
  StrokeKPIDataDto,
  StrokeDistributionDataDto,
  TherapyPerformanceDataDto,
  AdmissionFollowupDataDto,
  StrokeTypeDistributionDataDto,
  PerformanceTrendDataDto
} from './dto/stroke-command-center.dto';

@Injectable()
export class StrokeCommandCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(filters: {
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<StrokeCommandCenterDataDto> {
    const { hospitalId, startDate, endDate } = filters;
    
    // Build where clause for filtering
    const whereClause: any = {};
    
    // Temporarily disable date filtering to show all data
    // TODO: Implement proper date filtering logic later

    if (hospitalId && hospitalId !== 'all') {
      whereClause.OR = [
        { originHospitalId: hospitalId },
        { destinationHospitalId: hospitalId },
      ];
    }

    // Debug logging
    console.log('Stroke Command Center - Filters:', { hospitalId, startDate, endDate });
    console.log('Stroke Command Center - Where clause:', whereClause);

    // Get stroke cases data
    const cases = await this.prisma.strokeCase.findMany({
      where: whereClause,
      select: {
        id: true,
        strokeType: true,
        candidateForIVThrombolysis: true,
        modeOfArrival: true,
        dateOfAdmission: true,
        timeOfTriage: true,
        timeOfSymptomOnset: true,
        timeOfPhysicianAssessment: true,
        timeOfCtScanStart: true,
        timeOfCtReportFinal: true,
        ivThrombolysisAdministrationTime: true,
        ivThrombolysisGiven: true,
        timeOfMechanicalThrombectomyPuncture: true,
        strokeUnitAdmissionTime: true,
        dischargeDate: true,
        dischargeDestination: true,
        timeOfSwallowingScreening: true,
        followUpCallCompleted: true,
        // Add the actual timing data for proper KPI calculations
        doorToPhysicianMinutes: true,
        doorToCtScanMinutes: true,
        doorToNeedleMinutes: true,
        // Keep the stored KPI flags for backward compatibility
        metKpi1: true,
        metKpi2: true,
        metKpi3: true,
        metKpi4: true,
        metKpi5: true,
        metKpi6: true,
        metKpi10: true,
        metKpi11: true,
        createdAt: true,
        updatedAt: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
            age: true,
            gender: true,
          },
        },
        originHospital: {
          select: {
            id: true,
            name: true,
            cluster: true,
          },
        },
        destinationHospital: {
          select: {
            id: true,
            name: true,
            cluster: true,
          },
        },
        ticket: {
          select: {
            transportMode: true,
            createdAt: true,
          },
        },
      },
    });

    console.log('Stroke Command Center - Found cases:', cases.length);

    // Calculate KPI data
    const kpiData = this.calculateKPIData(cases);
    
    // Calculate distribution data
    const distributionData = this.calculateDistributionData(cases);
    
    // Calculate therapy performance data
    const therapyPerformance = this.calculateTherapyPerformance(cases);
    
    // Calculate admission and follow-up data
    const admissionFollowup = this.calculateAdmissionFollowup(cases);
    
    // Calculate stroke type distribution
    const strokeTypeDistribution = this.calculateStrokeTypeDistribution(cases);
    
    // Calculate performance trend data
    const performanceTrend = this.calculatePerformanceTrend(cases);
    
    // Calculate KPI metrics
    const kpis = this.calculateKPIMetrics(cases);
    
    // Get hospitals list
    const hospitals = await this.getHospitalsList(hospitalId);
    
    // Get hospital performance data
    const hospitalPerformance = await this.getHospitalPerformanceData(cases);

    return {
      kpiData,
      distributionData,
      therapyPerformance,
      admissionFollowup,
      strokeTypeDistribution,
      performanceTrend,
      kpis,
      hospitals,
      hospitalPerformance,
    };
  }

  private calculateKPIData(cases: any[]): StrokeKPIDataDto {
    const totalCases = cases.length;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const casesThisMonth = cases.filter(c => new Date(c.createdAt) >= startOfMonth).length;
    
    // Calculate coverage rate (percentage of cases with complete KPI data)
    // Use KPI1 and KPI2 as indicators of complete data
    const completeDataCases = cases.filter(c => 
      c.metKpi1 !== null && c.metKpi2 !== null
    ).length;
    const coverageRate = totalCases > 0 ? (completeDataCases / totalCases) * 100 : 0;
    
    // Calculate stroke performance (based on KPI compliance)
    // Use KPI1 (Door to Physician) as the main performance indicator
    const performanceCases = cases.filter(c => c.metKpi1).length;
    const strokePerformance = totalCases > 0 ? (performanceCases / totalCases) * 100 : 0;

    return {
      totalCases,
      casesThisMonth,
      coverageRate: Math.round(coverageRate * 10) / 10,
      strokePerformance: Math.round(strokePerformance * 10) / 10,
    };
  }

  private calculateDistributionData(cases: any[]): StrokeDistributionDataDto {
    // Age distribution
    const ageGroups = {
      '18-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81+': 0,
    };

    cases.forEach(c => {
      if (c.patient?.age) {
        const age = c.patient.age;
        if (age >= 18 && age <= 40) ageGroups['18-40']++;
        else if (age >= 41 && age <= 60) ageGroups['41-60']++;
        else if (age >= 61 && age <= 80) ageGroups['61-80']++;
        else if (age >= 81) ageGroups['81+']++;
      }
    });

    const totalAgeCases = Object.values(ageGroups).reduce((sum, count) => sum + count, 0);
    const ageDistribution = Object.entries(ageGroups).map(([ageGroup, count]) => ({
      ageGroup,
      count,
      percentage: totalAgeCases > 0 ? Math.round((count / totalAgeCases) * 100 * 10) / 10 : 0,
    }));

    // Gender distribution
    const genderGroups = {
      'Male': 0,
      'Female': 0,
    };

    cases.forEach(c => {
      if (c.patient?.gender) {
        if (c.patient.gender === 'MALE') genderGroups['Male']++;
        else if (c.patient.gender === 'FEMALE') genderGroups['Female']++;
      }
    });

    const totalGenderCases = Object.values(genderGroups).reduce((sum, count) => sum + count, 0);
    const genderDistribution = Object.entries(genderGroups).map(([gender, count]) => ({
      gender,
      count,
      percentage: totalGenderCases > 0 ? Math.round((count / totalGenderCases) * 100 * 10) / 10 : 0,
    }));

    // Mode of arrival distribution
    const modeGroups = {
      'Red Crescent': 0,
      'Private Car': 0,
      'Hospital Transfer': 0,
    };

    cases.forEach(c => {
      if (c.modeOfArrival) {
        switch (c.modeOfArrival) {
          case 'AMBULANCE_RED_CRESCENT':
            modeGroups['Red Crescent']++;
            break;
          case 'PRIVATE_CAR':
            modeGroups['Private Car']++;
            break;
          case 'TRANSFERRED_FROM_ANOTHER_HOSPITAL':
            modeGroups['Hospital Transfer']++;
            break;
        }
      }
    });

    const totalModeCases = Object.values(modeGroups).reduce((sum, count) => sum + count, 0);
    const modeOfArrival = Object.entries(modeGroups).map(([mode, count]) => ({
      mode,
      count,
      percentage: totalModeCases > 0 ? Math.round((count / totalModeCases) * 100 * 10) / 10 : 0,
    }));

    return {
      ageDistribution,
      genderDistribution,
      modeOfArrival,
    };
  }

  private calculateTherapyPerformance(cases: any[]): TherapyPerformanceDataDto {
    console.log('🔄 Starting fresh thrombolytic therapy calculation...');
    
    // STEP 1: Filter for eligible candidates (ischemic stroke patients who are candidates for thrombolysis)
    const eligibleCandidates = cases.filter(case_ => 
      case_.strokeType === 'ISCHEMIC' && 
      case_.candidateForIVThrombolysis === 'YES'
    );
    
    console.log(`📊 Step 1 - Eligible candidates: ${eligibleCandidates.length}`);
    console.log('Eligible cases:', eligibleCandidates.map(c => ({ id: c.id, thrombolysisGiven: c.ivThrombolysisGiven })));
    
    // STEP 2: Count how many eligible candidates actually received thrombolysis within 4.5 hours
    const treatedCases = eligibleCandidates.filter(case_ => {
      if (!case_ || case_.ivThrombolysisGiven !== 'YES') {
        return false;
      }
      
      // Check if thrombolysis was given within 4.5 hours (270 minutes) of symptom onset
      if (!case_.timeOfSymptomOnset || !case_.ivThrombolysisAdministrationTime) {
        return false; // Cannot calculate time if either field is missing
      }
      
      const symptomOnset = new Date(case_.timeOfSymptomOnset);
      const thrombolysisTime = new Date(case_.ivThrombolysisAdministrationTime);
      
      // Calculate time difference in minutes
      const timeDiffMinutes = (thrombolysisTime.getTime() - symptomOnset.getTime()) / (1000 * 60);
      
      // Only count as treated if within 4.5 hours (270 minutes)
      return timeDiffMinutes >= 0 && timeDiffMinutes <= 270;
    });
    
    console.log(`✅ Step 2 - Treated cases: ${treatedCases.length}`);
    console.log('Treated cases:', treatedCases.map(c => ({ id: c.id, thrombolysisGiven: c.ivThrombolysisGiven })));
    
    // STEP 3: Calculate success rate
    const successRate = eligibleCandidates.length > 0 
      ? (treatedCases.length / eligibleCandidates.length) * 100 
      : 0;
    
    console.log(`📈 Step 3 - Success rate: ${successRate.toFixed(1)}%`);
    
    // STEP 4: Calculate swallowing screening (unchanged)
    const swallowingMet = cases.filter(c => c.metKpi10).length;
    const swallowingSuccessRate = cases.length > 0 
      ? (swallowingMet / cases.length) * 100 
      : 0;
    
    // STEP 5: Build response with validated data
    const response = {
      thrombolyticTherapy: {
        successRate: Math.round(successRate * 10) / 10,
        treated: Math.max(0, treatedCases.length),
        total: Math.max(0, eligibleCandidates.length),
        target: 5,
      },
      swallowingScreening: {
        successRate: Math.round(swallowingSuccessRate * 10) / 10,
        screened: Math.max(0, swallowingMet),
        total: Math.max(0, cases.length),
        target: 85,
      },
    };
    
    console.log('🎯 FINAL RESPONSE:', JSON.stringify(response, null, 2));
    return response;
  }

  private calculateAdmissionFollowup(cases: any[]): AdmissionFollowupDataDto {
    // Stroke unit admission performance - use KPI5 from stroke portal dashboard
    const strokeUnitMet = cases.filter(c => c.metKpi5).length;
    const strokeUnitSuccessRate = cases.length > 0 
      ? (strokeUnitMet / cases.length) * 100 
      : 0;

    // Follow-up outcomes performance - use KPI11 from stroke portal dashboard  
    const followUpMet = cases.filter(c => c.metKpi11).length;
    const followUpSuccessRate = cases.length > 0 
      ? (followUpMet / cases.length) * 100 
      : 0;

    return {
      strokeUnitAdmission: {
        successRate: Math.round(strokeUnitSuccessRate * 10) / 10,
        admitted: strokeUnitMet,
        total: cases.length,
        target: 80, // >=80%
      },
      followUpOutcomes: {
        successRate: Math.round(followUpSuccessRate * 10) / 10,
        completed: followUpMet,
        total: cases.length,
        target: 80, // >=80%
      },
    };
  }

  private calculateStrokeTypeDistribution(cases: any[]): StrokeTypeDistributionDataDto {
    const strokeTypes = {
      'Ischemic': 0,
      'Hemorrhagic': 0,
      'TIA': 0,
      'Cryptogenic': 0,
      'Other': 0,
    };

    cases.forEach(c => {
      switch (c.strokeType) {
        case 'ISCHEMIC':
          strokeTypes['Ischemic']++;
          break;
        case 'HEMORRHAGIC':
          strokeTypes['Hemorrhagic']++;
          break;
        case 'TIA':
          strokeTypes['TIA']++;
          break;
        case 'CRYPTOGENIC':
          strokeTypes['Cryptogenic']++;
          break;
        default:
          strokeTypes['Other']++;
      }
    });

    const totalCases = cases.length;
    const strokeTypeData = Object.entries(strokeTypes).map(([type, count]) => ({
      type,
      count,
      percentage: totalCases > 0 ? Math.round((count / totalCases) * 100 * 10) / 10 : 0,
    }));

    return { strokeTypes: strokeTypeData };
  }

  private calculatePerformanceTrend(cases: any[]): PerformanceTrendDataDto {
    // Daily performance (last 7 days) - calculate actual performance per day
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayCases = cases.filter(c => {
        if (!c.timeOfTriage) return false;
        const caseDate = new Date(c.timeOfTriage);
        return caseDate >= dayStart && caseDate <= dayEnd;
      });
      
      const kpi1Met = dayCases.filter(c => c.metKpi1).length;
      const performance = dayCases.length > 0 ? (kpi1Met / dayCases.length) * 100 : 0;
      
      dailyData.push({
        date: date.toISOString().split('T')[0],
        performance: Math.round(performance * 10) / 10,
      });
    }

    // Weekly performance (last 4 weeks) - calculate actual performance per week
    const weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      
      const weekCases = cases.filter(c => {
        if (!c.timeOfTriage) return false;
        const caseDate = new Date(c.timeOfTriage);
        return caseDate >= weekStart && caseDate < weekEnd;
      });
      
      const kpi1Met = weekCases.filter(c => c.metKpi1).length;
      const performance = weekCases.length > 0 ? (kpi1Met / weekCases.length) * 100 : 0;
      
      weeklyData.push({
        week: `Week ${4 - i}`,
        performance: Math.round(performance * 10) / 10,
      });
    }

    // Monthly performance (last 6 months) - calculate actual performance per month
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const monthCases = cases.filter(c => {
        if (!c.timeOfTriage) return false;
        const caseDate = new Date(c.timeOfTriage);
        return caseDate >= monthStart && caseDate < monthEnd;
      });
      
      const kpi1Met = monthCases.filter(c => c.metKpi1).length;
      const performance = monthCases.length > 0 ? (kpi1Met / monthCases.length) * 100 : 0;
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        performance: Math.round(performance * 10) / 10,
      });
    }

    return {
      daily: dailyData,
      weekly: weeklyData,
      monthly: monthlyData,
    };
  }

  private calculateKPIMetrics(cases: any[]): StrokeKPIMetricDto[] {
    const totalCases = cases.length;
    
    // Calculate KPI metrics based on actual timing data from patients (same as stroke portal)
    // KPI 1: Door to Physician ≤ 15 minutes
    const doorToPhysicianCases = cases.filter(c => c.doorToPhysicianMinutes !== null && c.doorToPhysicianMinutes !== undefined);
    const kpi1Met = doorToPhysicianCases.filter(c => c.doorToPhysicianMinutes <= 15).length;
    const kpi1Total = doorToPhysicianCases.length;

    // KPI 2: Door to CT Scan ≤ 20 minutes (should be based on doorToCtScanMinutes)
    const doorToCtCases = cases.filter(c => c.doorToCtScanMinutes !== null && c.doorToCtScanMinutes !== undefined);
    const kpi2Met = doorToCtCases.filter(c => c.doorToCtScanMinutes <= 20).length;
    const kpi2Total = doorToCtCases.length;

    // KPI 3: Door to Needle ≤ 60 minutes (should be based on doorToNeedleMinutes for ischemic thrombolysis candidates)
    const doorToNeedleCases = cases.filter(c => 
      c.strokeType === 'ISCHEMIC' && 
      c.candidateForIVThrombolysis === 'YES' && 
      c.doorToNeedleMinutes !== null && 
      c.doorToNeedleMinutes !== undefined
    );
    const kpi3Met = doorToNeedleCases.filter(c => c.doorToNeedleMinutes <= 60).length;
    const kpi3Total = doorToNeedleCases.length;

    // Keep other KPIs as they were (using stored flags for now)
    const kpi4Met = cases.filter(c => c.metKpi4).length;
    const kpi5Met = cases.filter(c => c.metKpi5).length;
    const kpi6Met = cases.filter(c => c.metKpi6).length;
    const kpi10Met = cases.filter(c => c.metKpi10).length;

    // Calculate percentages using the corrected calculations
    const kpi1Percentage = kpi1Total > 0 ? (kpi1Met / kpi1Total) * 100 : 0;
    const kpi2Percentage = kpi2Total > 0 ? (kpi2Met / kpi2Total) * 100 : 0;
    const kpi3Percentage = kpi3Total > 0 ? (kpi3Met / kpi3Total) * 100 : 0;
    const kpi4Percentage = totalCases > 0 ? (kpi4Met / totalCases) * 100 : 0;
    const kpi5Percentage = totalCases > 0 ? (kpi5Met / totalCases) * 100 : 0;
    const kpi6Percentage = totalCases > 0 ? (kpi6Met / totalCases) * 100 : 0;
    const kpi10Percentage = totalCases > 0 ? (kpi10Met / totalCases) * 100 : 0;

    return [
      {
        id: 'doorToPhysician',
        name: 'Door to Physician',
        target: '≤15 min',
        currentValue: 0, // Not used in traffic light system
        targetValue: 15,
        percentage: Math.round(kpi1Percentage * 10) / 10,
        status: this.getKpiStatus(kpi1Percentage, 80),
        trend: 'stable',
      },
      {
        id: 'doorToCT',
        name: 'Door to CT',
        target: '≤20 min',
        currentValue: 0, // Not used in traffic light system
        targetValue: 20,
        percentage: Math.round(kpi2Percentage * 10) / 10,
        status: this.getKpiStatus(kpi2Percentage, 80),
        trend: 'stable',
      },
      {
        id: 'doorToNeedle',
        name: 'Door to Needle',
        target: '≤60 min',
        currentValue: 0, // Not used in traffic light system
        targetValue: 60,
        percentage: Math.round(kpi3Percentage * 10) / 10,
        status: this.getKpiStatus(kpi3Percentage, 80),
        trend: 'stable',
      },
      {
        id: 'doorToMechanicalThrombectomy',
        name: 'Door to Mechanical Thrombectomy',
        target: '≤120 min',
        currentValue: 0, // Not used in traffic light system
        targetValue: 120,
        percentage: Math.round(kpi4Percentage * 10) / 10,
        status: this.getKpiStatus(kpi4Percentage, 80),
        trend: 'stable',
      }
    ];
  }

  private async getHospitalsList(hospitalId?: string): Promise<Array<{ id: string; name: string }>> {
    const whereClause: any = {
      hasStrokeService: true,
      deletedAt: null,
    };

    if (hospitalId && hospitalId !== 'all') {
      whereClause.id = hospitalId;
    }

    const hospitals = await this.prisma.hospital.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return hospitals;
  }

  // Helper methods
  private calculateTimeDifference(startTime: string | Date | null, endTime: string | Date | null): number {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    // Return 0 for invalid times (negative, too large, etc.)
    if (diffMinutes < 0 || diffMinutes > 1440) return 0; // Max 24 hours
    
    return Math.floor(diffMinutes);
  }

  private calculateAverageTime(cases: any[], startField: string, endField: string): number {
    if (cases.length === 0) return 0;
    
    const totalMinutes = cases.reduce((sum, c) => {
      const time = this.calculateTimeDifference(c[startField], c[endField]);
      return sum + time;
    }, 0);
    
    return Math.round((totalMinutes / cases.length) * 10) / 10;
  }

  private calculateAge(dateOfBirth: string | Date): number {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  private getKpiStatus(percentage: number, target: number): 'GREEN' | 'YELLOW' | 'RED' {
    if (percentage >= target) return 'GREEN';
    if (percentage >= target * 0.8) return 'YELLOW';
    return 'RED';
  }

  private async getHospitalPerformanceData(cases: any[]): Promise<any[]> {
    // Get all hospitals with stroke service
    const hospitals = await this.prisma.hospital.findMany({
      where: {
        hasStrokeService: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Group cases by hospital
    const hospitalCases = cases.reduce((acc, case_) => {
      const hospitalId = case_.originHospital?.id || case_.destinationHospital?.id;
      if (hospitalId) {
        if (!acc[hospitalId]) {
          acc[hospitalId] = [];
        }
        acc[hospitalId].push(case_);
      }
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate performance for each hospital
    return hospitals.map(hospital => {
      const hospitalCaseList = hospitalCases[hospital.id] || [];
      const hospitalCaseCount = hospitalCaseList.length;

      if (hospitalCaseCount === 0) {
        return {
          hospitalName: hospital.name,
          status: 'ACTIVE' as const,
          cases: 0,
          physicianMin: 0,
          ctMin: 0,
          ctReportMin: 0,
          orderMin: 0,
          needleMin: 0,
          mtMin: 0,
          physicianPct: 0,
          ctPct: 0,
          ctReportPct: 0,
          mtPct: 0,
          swallowingPct: 0,
          strokeUnitPct: 0,
          followUpPct: 0,
        };
      }

      // Calculate average times
      const validPhysicianTimes = hospitalCaseList.filter((c: any) => c.timeOfPhysicianAssessment && c.timeOfTriage);
      const validCtTimes = hospitalCaseList.filter((c: any) => c.timeOfCtScanStart && c.timeOfTriage);
      const validCtReportTimes = hospitalCaseList.filter((c: any) => c.timeOfCtReportFinal && c.timeOfTriage);
      const validNeedleTimes = hospitalCaseList.filter((c: any) => c.ivThrombolysisAdministrationTime && c.timeOfTriage && c.strokeType === 'ISCHEMIC' && c.candidateForIVThrombolysis === 'YES');
      const validMtTimes = hospitalCaseList.filter((c: any) => c.timeOfMechanicalThrombectomyPuncture && c.timeOfTriage);

      const avgPhysicianTime = validPhysicianTimes.length > 0 
        ? validPhysicianTimes.reduce((sum: number, c: any) => sum + this.calculateTimeDifference(c.timeOfTriage, c.timeOfPhysicianAssessment), 0) / validPhysicianTimes.length
        : 0;

      const avgCtTime = validCtTimes.length > 0 
        ? validCtTimes.reduce((sum: number, c: any) => sum + this.calculateTimeDifference(c.timeOfTriage, c.timeOfCtScanStart), 0) / validCtTimes.length
        : 0;

      const avgCtReportTime = validCtReportTimes.length > 0 
        ? validCtReportTimes.reduce((sum: number, c: any) => sum + this.calculateTimeDifference(c.timeOfTriage, c.timeOfCtReportFinal), 0) / validCtReportTimes.length
        : 0;

      const avgNeedleTime = validNeedleTimes.length > 0 
        ? validNeedleTimes.reduce((sum: number, c: any) => sum + this.calculateTimeDifference(c.timeOfTriage, c.ivThrombolysisAdministrationTime), 0) / validNeedleTimes.length
        : 0;

      const avgMtTime = validMtTimes.length > 0 
        ? validMtTimes.reduce((sum: number, c: any) => sum + this.calculateTimeDifference(c.timeOfTriage, c.timeOfMechanicalThrombectomyPuncture), 0) / validMtTimes.length
        : 0;

      // Calculate percentages using KPI boolean fields for consistency
      const kpi1Met = hospitalCaseList.filter((c: any) => c.metKpi1).length;
      const kpi2Met = hospitalCaseList.filter((c: any) => c.metKpi2).length;
      const kpi3Met = hospitalCaseList.filter((c: any) => c.metKpi3).length;
      const kpi4Met = hospitalCaseList.filter((c: any) => c.metKpi4).length;
      const kpi5Met = hospitalCaseList.filter((c: any) => c.metKpi5).length;
      const kpi6Met = hospitalCaseList.filter((c: any) => c.metKpi6).length;
      const kpi10Met = hospitalCaseList.filter((c: any) => c.metKpi10).length;
      const kpi11Met = hospitalCaseList.filter((c: any) => c.metKpi11).length;

      const physicianPct = hospitalCaseCount > 0 ? (kpi1Met / hospitalCaseCount) * 100 : 0;
      const ctPct = hospitalCaseCount > 0 ? (kpi2Met / hospitalCaseCount) * 100 : 0;
      const ctReportPct = hospitalCaseCount > 0 ? (kpi6Met / hospitalCaseCount) * 100 : 0;
      // KPI3 (door to needle) should only consider ischemic cases that are candidates for IV thrombolysis
      const hospitalIschemicThrombolysisCandidates = hospitalCaseList.filter((c: any) => c.strokeType === 'ISCHEMIC' && c.candidateForIVThrombolysis === 'YES').length;
      const needlePct = hospitalIschemicThrombolysisCandidates > 0 ? (kpi3Met / hospitalIschemicThrombolysisCandidates) * 100 : 0;
      const mtPct = hospitalCaseCount > 0 ? (kpi4Met / hospitalCaseCount) * 100 : 0;

      const swallowingPct = hospitalCaseCount > 0 ? (kpi10Met / hospitalCaseCount) * 100 : 0;
      const strokeUnitPct = hospitalCaseCount > 0 ? (kpi5Met / hospitalCaseCount) * 100 : 0;
      const followUpPct = hospitalCaseCount > 0 ? (kpi11Met / hospitalCaseCount) * 100 : 0;

      return {
        hospitalName: hospital.name,
        status: 'ACTIVE' as const,
        cases: hospitalCaseCount,
        physicianMin: Math.round(avgPhysicianTime),
        ctMin: Math.round(avgCtTime),
        ctReportMin: Math.round(avgCtReportTime),
        orderMin: Math.round(avgCtTime + 5), // Assuming order time is CT time + 5 minutes
        needleMin: Math.round(avgNeedleTime),
        mtMin: Math.round(avgMtTime),
        physicianPct: Math.round(physicianPct),
        ctPct: Math.round(ctPct),
        ctReportPct: Math.round(ctReportPct),
        needlePct: Math.round(needlePct),
        mtPct: Math.round(mtPct),
        swallowingPct: Math.round(swallowingPct),
        strokeUnitPct: Math.round(strokeUnitPct),
        followUpPct: Math.round(followUpPct),
      };
    }).sort((a, b) => b.cases - a.cases); // Sort by case count descending
  }

  async getPerformanceComparisonData(filters: {
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
  }, period: 'daily' | 'weekly' | 'monthly') {
    // Build where clause for filtering
    const whereClause: any = {};
    
    if (filters.hospitalId && filters.hospitalId !== 'all') {
      whereClause.OR = [
        { originHospitalId: filters.hospitalId },
        { destinationHospitalId: filters.hospitalId }
      ];
    }
    
    if (filters.startDate || filters.endDate) {
      whereClause.dateOfAdmission = {};
      if (filters.startDate) {
        whereClause.dateOfAdmission.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.dateOfAdmission.lte = new Date(filters.endDate);
      }
    }

    // Get all case types with admission times
    const [strokeCases, stemiCases, traumaCases] = await Promise.all([
      // Stroke cases
      this.prisma.strokeCase.findMany({
        where: whereClause,
        select: {
          id: true,
          strokeType: true,
          dateOfAdmission: true,
          timeOfTriage: true,
          timeOfPhysicianAssessment: true,
          timeOfCtScanStart: true,
          timeOfCtReportFinal: true,
          ivThrombolysisAdministrationTime: true,
          ivThrombolysisGiven: true,
          timeOfMechanicalThrombectomyPuncture: true,
          strokeUnitAdmissionTime: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { dateOfAdmission: 'asc' },
      }),
      // STEMI cases - use createdAt as admission time
      this.prisma.stemiCase.findMany({
        where: {
          ...whereClause,
          // Map dateOfAdmission filter to createdAt for STEMI cases
          ...(whereClause.dateOfAdmission && {
            createdAt: whereClause.dateOfAdmission
          })
        },
        select: {
          id: true,
          createdAt: true, // Use createdAt as admission time
          triageTime: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      // Trauma cases - use arrivalDateTime as admission time
      this.prisma.traumaCase.findMany({
        where: {
          ...whereClause,
          // Map dateOfAdmission filter to arrivalDateTime for trauma cases
          ...(whereClause.dateOfAdmission && {
            arrivalDateTime: whereClause.dateOfAdmission
          })
        },
        select: {
          id: true,
          arrivalDateTime: true, // Use arrivalDateTime as admission time
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { arrivalDateTime: 'asc' },
      }),
    ]);

    // Combine all cases with proper categorization and normalize admission times
    const cases = [
      ...strokeCases.map(c => ({ ...c, caseType: 'STROKE', admissionTime: c.dateOfAdmission })),
      ...stemiCases.map(c => ({ ...c, caseType: 'STEMI', strokeType: 'STEMI', admissionTime: c.createdAt })),
      ...traumaCases.map(c => ({ ...c, caseType: 'TRAUMA', strokeType: 'TRAUMA', admissionTime: c.arrivalDateTime })),
    ];

    // Generate chart data based on admission time
    const chartData = this.generateChartDataByAdmissionTime(cases, period);
    
    // Calculate global metrics
    const globalMetrics = this.calculateGlobalMetrics(cases, period);
    
    // Calculate daily summary
    const dailySummary = this.calculateDailySummary(cases, period);
    
    // Calculate change analysis
    const changeAnalysis = this.calculateChangeAnalysis(cases, period);

    // Validate data consistency
    this.validateDataConsistency(globalMetrics, dailySummary, changeAnalysis, chartData);

    return {
      globalMetrics,
      dailySummary,
      changeAnalysis,
      chartData: {
        data: chartData,
      },
    };
  }

  // Add validation method to ensure data consistency
  private validateDataConsistency(globalMetrics: any, dailySummary: any, changeAnalysis: any, chartData: any[]) {
    console.log('=== Data Validation ===');
    console.log('Global Metrics:', globalMetrics);
    console.log('Daily Summary:', dailySummary);
    console.log('Change Analysis:', changeAnalysis);
    console.log('Chart Data Points:', chartData.length);
    
    // Validate that current period matches
    if (globalMetrics.current !== dailySummary.currentPeriod) {
      console.warn('Mismatch: Global current vs Daily Summary current period');
    }
    
    // Validate percentage calculations
    const expectedPreviousChange = dailySummary.previousPeriod > 0 
      ? ((dailySummary.currentPeriod - dailySummary.previousPeriod) / dailySummary.previousPeriod) * 100 
      : 0;
    
    if (Math.abs(globalMetrics.previousChange - expectedPreviousChange) > 0.01) {
      console.warn('Mismatch: Previous change calculation');
    }
    
    console.log('=== End Validation ===');
  }

  private generateChartDataByAdmissionTime(cases: any[], period: 'daily' | 'weekly' | 'monthly') {
    const now = new Date();
    
    // Group cases by time period based on admission time
    const groupedCases = new Map<string, any[]>();
    
    cases.forEach(case_ => {
      if (!case_.admissionTime) return;
      
      const admissionDate = new Date(case_.admissionTime);
      let timeKey: string;
      
      if (period === 'daily') {
        // Group by hour for daily view
        timeKey = admissionDate.toISOString().slice(0, 13) + ':00:00.000Z';
      } else if (period === 'weekly') {
        // Group by day for weekly view
        timeKey = admissionDate.toISOString().slice(0, 10);
      } else {
        // Group by week for monthly view
        const weekStart = new Date(admissionDate);
        weekStart.setDate(admissionDate.getDate() - admissionDate.getDay());
        timeKey = weekStart.toISOString().slice(0, 10);
      }
      
      if (!groupedCases.has(timeKey)) {
        groupedCases.set(timeKey, []);
      }
      groupedCases.get(timeKey)!.push(case_);
    });

    // Generate data points for the selected period
    const dataPoints: any[] = [];
    const endDate = new Date();
    let startDate: Date;
    let timeSlotSize: number;
    
    if (period === 'daily') {
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
      timeSlotSize = 60 * 60 * 1000; // 1 hour
    } else if (period === 'weekly') {
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      timeSlotSize = 24 * 60 * 60 * 1000; // 1 day
    } else {
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      timeSlotSize = 7 * 24 * 60 * 60 * 1000; // 1 week
    }

    // Generate time slots
    const timeSlots: string[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      let timeKey: string;
      
      if (period === 'daily') {
        timeKey = current.toISOString().slice(0, 13) + ':00:00.000Z';
      } else if (period === 'weekly') {
        timeKey = current.toISOString().slice(0, 10);
      } else {
        const weekStart = new Date(current);
        weekStart.setDate(current.getDate() - current.getDay());
        timeKey = weekStart.toISOString().slice(0, 10);
      }
      
      timeSlots.push(timeKey);
      
      // Move to next time slot
      current.setTime(current.getTime() + timeSlotSize);
    }

    // Create data points
    timeSlots.forEach(timeKey => {
      const casesForPeriod = groupedCases.get(timeKey) || [];
      
      // Count cases by type - use caseType for proper categorization
      const stemi = casesForPeriod.filter(c => c.caseType === 'STEMI').length;
      const stroke = casesForPeriod.filter(c => c.caseType === 'STROKE').length;
      const trauma = casesForPeriod.filter(c => c.caseType === 'TRAUMA').length;
      const other = casesForPeriod.filter(c => !['STEMI', 'STROKE', 'TRAUMA'].includes(c.caseType)).length;
      
      // Format date for display
      let displayDate: string;
      const date = new Date(timeKey);
      
      if (period === 'daily') {
        displayDate = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (period === 'weekly') {
        displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      dataPoints.push({
        date: displayDate,
        stemi,
        stroke,
        trauma,
        other,
      });
    });

    return dataPoints;
  }

  private calculateGlobalMetrics(cases: any[], period: 'daily' | 'weekly' | 'monthly') {
    const currentPeriodCases = this.getCasesForCurrentPeriod(cases, period);
    const previousPeriodCases = this.getCasesForPreviousPeriod(cases, period);
    
    const current = currentPeriodCases.length;
    const previous = previousPeriodCases.length;
    
    const previousChange = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    const averageChange = this.calculateAverageChange(cases, period);
    
    return {
      current,
      previousChange: Math.round(previousChange * 100) / 100,
      averageChange: Math.round(averageChange * 100) / 100,
    };
  }

  private calculateDailySummary(cases: any[], period: 'daily' | 'weekly' | 'monthly') {
    const currentPeriodCases = this.getCasesForCurrentPeriod(cases, period);
    const previousPeriodCases = this.getCasesForPreviousPeriod(cases, period);
    
    const currentPeriod = currentPeriodCases.length;
    const previousPeriod = previousPeriodCases.length;
    const average = this.calculateAverageCases(cases, period);
    
    return {
      currentPeriod,
      previousPeriod,
      average: Math.round(average),
    };
  }

  private calculateChangeAnalysis(cases: any[], period: 'daily' | 'weekly' | 'monthly') {
    const currentPeriodCases = this.getCasesForCurrentPeriod(cases, period);
    const previousPeriodCases = this.getCasesForPreviousPeriod(cases, period);
    
    const current = currentPeriodCases.length;
    const previous = previousPeriodCases.length;
    
    const vsPreviousPeriod = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    const vsAverage = this.calculateAverageChange(cases, period);
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (vsPreviousPeriod > 5) trend = 'up';
    else if (vsPreviousPeriod < -5) trend = 'down';
    
    return {
      vsPreviousPeriod: Math.round(vsPreviousPeriod * 100) / 100,
      vsAverage: Math.round(vsAverage * 100) / 100,
      trend,
    };
  }

  private getCasesForCurrentPeriod(cases: any[], period: 'daily' | 'weekly' | 'monthly') {
    const now = new Date();
    let startDate: Date;
    
    if (period === 'daily') {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (period === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return cases.filter(case_ => 
      case_.admissionTime && new Date(case_.admissionTime) >= startDate
    );
  }

  private getCasesForPreviousPeriod(cases: any[], period: 'daily' | 'weekly' | 'monthly') {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    if (period === 'daily') {
      endDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      startDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    } else if (period === 'weekly') {
      endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    } else {
      endDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    }
    
    return cases.filter(case_ => 
      case_.admissionTime && 
      new Date(case_.admissionTime) >= startDate && 
      new Date(case_.admissionTime) < endDate
    );
  }

  private calculateAverageCases(cases: any[], period: 'daily' | 'weekly' | 'monthly') {
    const now = new Date();
    let periodsBack: number;
    
    if (period === 'daily') {
      periodsBack = 7; // Average over last 7 days
    } else if (period === 'weekly') {
      periodsBack = 4; // Average over last 4 weeks
    } else {
      periodsBack = 3; // Average over last 3 months
    }
    
    // Calculate the start date based on the period
    let startDate: Date;
    if (period === 'daily') {
      startDate = new Date(now.getTime() - periodsBack * 24 * 60 * 60 * 1000);
    } else if (period === 'weekly') {
      startDate = new Date(now.getTime() - periodsBack * 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - periodsBack * 30 * 24 * 60 * 60 * 1000);
    }
    
    const recentCases = cases.filter(case_ => 
      case_.admissionTime && new Date(case_.admissionTime) >= startDate
    );
    
    return recentCases.length / periodsBack;
  }

  private calculateAverageChange(cases: any[], period: 'daily' | 'weekly' | 'monthly') {
    const currentPeriodCases = this.getCasesForCurrentPeriod(cases, period);
    const average = this.calculateAverageCases(cases, period);
    
    return average > 0 ? ((currentPeriodCases.length - average) / average) * 100 : 0;
  }
}
