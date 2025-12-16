import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

export enum TimePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class StrokeCommandCenterFiltersDto {
  @ApiProperty({ 
    description: 'Hospital ID filter (use "all" for all hospitals)',
    example: 'all',
    required: false 
  })
  @IsOptional()
  @IsString()
  hospitalId?: string = 'all';

  @ApiProperty({ 
    description: 'Start date for data filtering',
    example: '2024-01-01',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ 
    description: 'End date for data filtering',
    example: '2024-01-31',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ 
    description: 'Time period for trend analysis',
    enum: TimePeriod,
    required: false 
  })
  @IsOptional()
  @IsEnum(TimePeriod)
  timePeriod?: TimePeriod = TimePeriod.MONTHLY;
}

export class StrokeKPIMetricDto {
  @ApiProperty({ description: 'KPI identifier' })
  id!: string;

  @ApiProperty({ description: 'KPI name' })
  name!: string;

  @ApiProperty({ description: 'Target description' })
  target!: string;

  @ApiProperty({ description: 'Current value' })
  currentValue!: number;

  @ApiProperty({ description: 'Target value' })
  targetValue!: number;

  @ApiProperty({ description: 'Percentage of target achieved' })
  percentage!: number;

  @ApiProperty({ description: 'Status: GREEN, YELLOW, or RED' })
  status!: 'GREEN' | 'YELLOW' | 'RED';

  @ApiProperty({ description: 'Trend direction' })
  trend!: 'up' | 'down' | 'stable';

  @ApiProperty({ description: 'Number of valid cases for this KPI', required: false })
  validCases?: number;

  @ApiProperty({ description: 'Number of compliant cases for this KPI', required: false })
  compliantCases?: number;
}

export class StrokeKPIDataDto {
  @ApiProperty({ description: 'Total stroke cases' })
  totalCases!: number;

  @ApiProperty({ description: 'Cases this month' })
  casesThisMonth!: number;

  @ApiProperty({ description: 'Coverage rate percentage' })
  coverageRate!: number;

  @ApiProperty({ description: 'Stroke performance percentage' })
  strokePerformance!: number;
}

export class StrokeDistributionDataDto {
  @ApiProperty({ description: 'Age distribution data' })
  ageDistribution!: Array<{
    ageGroup: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Gender distribution data' })
  genderDistribution!: Array<{
    gender: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Mode of arrival distribution data' })
  modeOfArrival!: Array<{
    mode: string;
    count: number;
    percentage: number;
  }>;
}

export class TherapyPerformanceDataDto {
  @ApiProperty({ description: 'Thrombolytic therapy performance' })
  thrombolyticTherapy!: {
    successRate: number;
    treated: number;
    total: number;
    target: number;
  };

  @ApiProperty({ description: 'Swallowing screening performance' })
  swallowingScreening!: {
    successRate: number;
    screened: number;
    total: number;
    target: number;
  };
}

export class AdmissionFollowupDataDto {
  @ApiProperty({ description: 'Stroke unit admission performance' })
  strokeUnitAdmission!: {
    successRate: number;
    admitted: number;
    total: number;
    target: number;
  };

  @ApiProperty({ description: 'Follow-up outcomes performance' })
  followUpOutcomes!: {
    successRate: number;
    completed: number;
    total: number;
    target: number;
  };
}

export class StrokeTypeDistributionDataDto {
  @ApiProperty({ description: 'Stroke type distribution data' })
  strokeTypes!: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export class PerformanceTrendDataDto {
  @ApiProperty({ description: 'Daily performance data' })
  daily!: Array<{
    date: string;
    performance: number;
  }>;

  @ApiProperty({ description: 'Weekly performance data' })
  weekly!: Array<{
    week: string;
    performance: number;
  }>;

  @ApiProperty({ description: 'Monthly performance data' })
  monthly!: Array<{
    month: string;
    performance: number;
  }>;
}

export class StrokeHospitalPerformanceHeatmapDto {
  @ApiProperty({ description: 'Hospital ID' })
  hospitalId!: string;

  @ApiProperty({ description: 'Hospital name' })
  hospitalName!: string;

  @ApiProperty({ description: 'Total stroke cases' })
  totalCases!: number;

  @ApiProperty({ description: 'Door-to-Physician compliance percentage' })
  doorToPhysicianCompliance!: number;

  @ApiProperty({ description: 'Door-to-Physician valid cases count' })
  doorToPhysicianValid!: number;

  @ApiProperty({ description: 'Door-to-Physician compliant cases count' })
  doorToPhysicianCompliant!: number;

  @ApiProperty({ description: 'Door-to-CT compliance percentage' })
  doorToCtCompliance!: number;

  @ApiProperty({ description: 'Door-to-CT valid cases count' })
  doorToCtValid!: number;

  @ApiProperty({ description: 'Door-to-CT compliant cases count' })
  doorToCtCompliant!: number;

  @ApiProperty({ description: 'Door-to-CT Report compliance percentage' })
  doorToCtReportCompliance!: number;

  @ApiProperty({ description: 'Door-to-CT Report valid cases count' })
  doorToCtReportValid!: number;

  @ApiProperty({ description: 'Door-to-CT Report compliant cases count' })
  doorToCtReportCompliant!: number;

  @ApiProperty({ description: 'Door-to-Needle compliance percentage' })
  doorToNeedleCompliance!: number;

  @ApiProperty({ description: 'Door-to-Needle valid cases count' })
  doorToNeedleValid!: number;

  @ApiProperty({ description: 'Door-to-Needle compliant cases count' })
  doorToNeedleCompliant!: number;

  @ApiProperty({ description: 'Door-to-Mechanical Thrombectomy compliance percentage' })
  doorToMechanicalThrombectomyCompliance!: number;

  @ApiProperty({ description: 'Door-to-Mechanical Thrombectomy valid cases count' })
  doorToMechanicalThrombectomyValid!: number;

  @ApiProperty({ description: 'Door-to-Mechanical Thrombectomy compliant cases count' })
  doorToMechanicalThrombectomyCompliant!: number;

  @ApiProperty({ description: 'Stroke Unit Admission compliance percentage' })
  strokeUnitAdmissionCompliance!: number;

  @ApiProperty({ description: 'Stroke Unit Admission valid cases count' })
  strokeUnitAdmissionValid!: number;

  @ApiProperty({ description: 'Stroke Unit Admission compliant cases count' })
  strokeUnitAdmissionCompliant!: number;

  @ApiProperty({ description: 'Swallowing Screening compliance percentage' })
  swallowingScreeningCompliance!: number;

  @ApiProperty({ description: 'Swallowing Screening valid cases count' })
  swallowingScreeningValid!: number;

  @ApiProperty({ description: 'Swallowing Screening compliant cases count' })
  swallowingScreeningCompliant!: number;

  @ApiProperty({ description: 'Data quality score' })
  dataQualityScore!: number;

  @ApiProperty({ description: 'Data completeness score' })
  dataCompletenessScore!: number;
}

export class StrokeCommandCenterDataDto {
  @ApiProperty({ description: 'KPI summary data' })
  kpiData!: StrokeKPIDataDto;

  @ApiProperty({ description: 'Distribution data for charts' })
  distributionData!: StrokeDistributionDataDto;

  @ApiProperty({ description: 'Therapy performance data' })
  therapyPerformance!: TherapyPerformanceDataDto;

  @ApiProperty({ description: 'Admission and follow-up data' })
  admissionFollowup!: AdmissionFollowupDataDto;

  @ApiProperty({ description: 'Stroke type distribution data' })
  strokeTypeDistribution!: StrokeTypeDistributionDataDto;

  @ApiProperty({ description: 'Performance trend data' })
  performanceTrend!: PerformanceTrendDataDto;

  @ApiProperty({ description: 'KPI metrics array' })
  kpis!: StrokeKPIMetricDto[];

  @ApiProperty({ description: 'Hospitals list' })
  hospitals!: Array<{ id: string; name: string }>;

  @ApiProperty({ description: 'Hospital performance data' })
  hospitalPerformance!: Array<{
    hospitalName: string;
    status: 'ACTIVE' | 'INACTIVE';
    cases: number;
    physicianMin: number;
    ctMin: number;
    ctReportMin: number;
    orderMin: number;
    needleMin: number;
    mtMin: number;
    physicianPct: number;
    ctPct: number;
    ctReportPct: number;
    mtPct: number;
    swallowingPct: number;
    strokeUnitPct: number;
    followUpPct: number;
  }>;

  @ApiProperty({ description: 'Hospital performance heatmap data' })
  hospitalPerformanceHeatmap!: StrokeHospitalPerformanceHeatmapDto[];
}
