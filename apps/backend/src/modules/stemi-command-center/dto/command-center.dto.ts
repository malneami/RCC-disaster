import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

export enum TimePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class CommandCenterFiltersDto {
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

export class KPIMetricDto {
  @ApiProperty({ description: 'KPI identifier' })
  id!: string;

  @ApiProperty({ description: 'KPI name' })
  name!: string;

  @ApiProperty({ description: 'Current value' })
  value!: number;

  @ApiProperty({ description: 'Target value' })
  target!: number;

  @ApiProperty({ description: 'Unit of measurement' })
  unit!: string;

  @ApiProperty({ description: 'Status: met, missed, or warning' })
  status!: 'met' | 'missed' | 'warning';

  @ApiProperty({ description: 'Trend direction' })
  trend!: 'up' | 'down' | 'stable';

  @ApiProperty({ description: 'Percentage of target achieved' })
  percentage!: number;
}

export class HospitalPerformanceDto {
  @ApiProperty({ description: 'Hospital ID' })
  id!: string;

  @ApiProperty({ description: 'Hospital name' })
  name!: string;

  @ApiProperty({ description: 'Hospital zone' })
  zone!: string;

  @ApiProperty({ description: 'Hospital performance metrics' })
  metrics!: {
    d2b: KPIMetricDto;
    d2n: KPIMetricDto;
    dido: KPIMetricDto;
    pciSuccess: KPIMetricDto;
    mortality: KPIMetricDto;
  };
}

export class ChartDataDto {
  @ApiProperty({ description: 'Chart labels' })
  labels!: string[];

  @ApiProperty({ description: 'Chart datasets' })
  datasets!: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

export class CommandCenterSummaryDto {
  @ApiProperty({ description: 'Total STEMI cases' })
  totalCases!: number;

  @ApiProperty({ description: 'Total PCI procedures' })
  totalPCI!: number;

  @ApiProperty({ description: 'Mortality rate percentage' })
  mortalityRate!: number;

  @ApiProperty({ description: 'Overall compliance rate percentage' })
  complianceRate!: number;
}

export class RecentCaseDto {
  @ApiProperty({ description: 'Case ID' })
  id!: string;

  @ApiProperty({ description: 'Patient name' })
  patientName!: string;

  @ApiProperty({ description: 'Hospital name' })
  hospital!: string;

  @ApiProperty({ description: 'Current status' })
  status!: string;

  @ApiProperty({ description: 'Timestamp' })
  timestamp!: string;
}

export class HospitalPerformanceHeatmapDto {
  @ApiProperty({ description: 'Hospital ID' })
  hospitalId!: string;

  @ApiProperty({ description: 'Hospital name' })
  hospitalName!: string;

  @ApiProperty({ description: 'Total STEMI cases' })
  totalCases!: number;

  @ApiProperty({ description: 'Door-to-ECG compliance percentage' })
  doorToEcgCompliance!: number;

  @ApiProperty({ description: 'Door-to-ECG valid cases count' })
  doorToEcgValid!: number;

  @ApiProperty({ description: 'Door-to-ECG compliant cases count' })
  doorToEcgCompliant!: number;

  @ApiProperty({ description: 'Door-to-Needle compliance percentage' })
  doorToNeedleCompliance!: number;

  @ApiProperty({ description: 'Door-to-Needle valid cases count' })
  doorToNeedleValid!: number;

  @ApiProperty({ description: 'Door-to-Needle compliant cases count' })
  doorToNeedleCompliant!: number;

  @ApiProperty({ description: 'Door-to-Balloon compliance percentage' })
  doorToBalloonCompliance!: number;

  @ApiProperty({ description: 'Door-to-Balloon valid cases count' })
  doorToBalloonValid!: number;

  @ApiProperty({ description: 'Door-to-Balloon compliant cases count' })
  doorToBalloonCompliant!: number;

  @ApiProperty({ description: 'Activation-to-Door-Out compliance percentage' })
  activationDoorOutCompliance!: number;

  @ApiProperty({ description: 'Activation-to-Door-Out valid cases count' })
  activationDoorOutValid!: number;

  @ApiProperty({ description: 'Activation-to-Door-Out compliant cases count' })
  activationDoorOutCompliant!: number;

  @ApiProperty({ description: 'Door-In-Door-Out compliance percentage' })
  doorInDoorOutCompliance!: number;

  @ApiProperty({ description: 'Door-In-Door-Out valid cases count' })
  doorInDoorOutValid!: number;

  @ApiProperty({ description: 'Door-In-Door-Out compliant cases count' })
  doorInDoorOutCompliant!: number;

  @ApiProperty({ description: 'Data quality score' })
  dataQualityScore!: number;

  @ApiProperty({ description: 'Data completeness score' })
  dataCompletenessScore!: number;
}

export class CommandCenterDataDto {
  @ApiProperty({ description: 'Summary statistics' })
  summary!: CommandCenterSummaryDto;

  @ApiProperty({ description: 'KPI metrics array' })
  kpis!: KPIMetricDto[];

  @ApiProperty({ description: 'Hospital performance data' })
  hospitals!: HospitalPerformanceDto[];

  @ApiProperty({ description: 'Hospital performance heatmap data' })
  hospitalPerformanceHeatmap!: HospitalPerformanceHeatmapDto[];

  @ApiProperty({ description: 'Chart data for visualizations' })
  charts!: {
    referralSource: ChartDataDto;
    pciBreakdown: ChartDataDto;
    didoCompliance: ChartDataDto;
    treatmentDistribution: ChartDataDto;
    outcomes: ChartDataDto;
    hospitalPerformance: ChartDataDto;
    trends: ChartDataDto;
    heatmap: ChartDataDto;
  };

  @ApiProperty({ description: 'Recent cases' })
  recentCases!: RecentCaseDto[];
}
