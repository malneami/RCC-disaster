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
}
