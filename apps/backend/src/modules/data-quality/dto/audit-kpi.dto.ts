import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';

export enum KPIType {
  ACCURACY = 'accuracy',
  TIMELINESS = 'timeliness',
  COMPLETENESS = 'completeness',
  COVERAGE = 'coverage',
  PRECISION = 'precision',
  DUPLICATION = 'duplication',
}

export enum RecordType {
  ALL = 'all',
  STEMI = 'stemi',
  STROKE = 'stroke',
  TRAUMA = 'trauma',
  TICKET = 'ticket',
}

export class AuditKPIFiltersDto {
  @ApiPropertyOptional({ description: 'Start date for filtering (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Hospital ID filter' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ enum: RecordType, description: 'Record type filter' })
  @IsOptional()
  @IsEnum(RecordType)
  recordType?: RecordType;

  @ApiPropertyOptional({ description: 'Patient ID filter' })
  @IsOptional()
  @IsString()
  patientId?: string;
}

export class KPIMetricDto {
  @ApiProperty({ description: 'KPI type' })
  kpiType!: KPIType;

  @ApiProperty({ description: 'KPI percentage score (0-100)' })
  percentage!: number;

  @ApiProperty({ description: 'Total records analyzed' })
  totalRecords!: number;

  @ApiProperty({ description: 'Number of valid/passing records' })
  validRecords!: number;

  @ApiProperty({ description: 'Number of invalid/failing records' })
  invalidRecords!: number;

  @ApiProperty({ description: 'KPI status (PASS, WARNING, FAIL)' })
  status!: 'PASS' | 'WARNING' | 'FAIL';
}

export class FailedRecordDto {
  @ApiProperty({ description: 'Record ID' })
  recordId!: string;

  @ApiProperty({ description: 'Patient ID' })
  patientId?: string;

  @ApiProperty({ enum: RecordType, description: 'Record type' })
  recordType!: RecordType;

  @ApiProperty({ description: 'Hospital ID' })
  hospitalId?: string;

  @ApiProperty({ description: 'Hospital name' })
  hospitalName?: string;

  @ApiProperty({ description: 'List of failure reasons' })
  failureReasons!: string[];

  @ApiProperty({ description: 'Record creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Additional details about the failure' })
  details?: Record<string, any>;
}

export class AuditKPIsResponseDto {
  @ApiProperty({ type: [KPIMetricDto], description: 'List of KPI metrics' })
  kpis!: KPIMetricDto[];

  @ApiProperty({ description: 'Overall data quality score' })
  overallScore!: number;

  @ApiProperty({ description: 'Total records analyzed' })
  totalRecords!: number;

  @ApiProperty({ description: 'Summary statistics' })
  summary!: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
  };
}

export class FailedRecordsResponseDto {
  @ApiProperty({ enum: KPIType, description: 'KPI type' })
  kpiType!: KPIType;

  @ApiProperty({ type: [FailedRecordDto], description: 'List of failed records' })
  records!: FailedRecordDto[];

  @ApiProperty({ description: 'Total number of failed records' })
  total!: number;

  @ApiProperty({ description: 'Current page number' })
  page!: number;

  @ApiProperty({ description: 'Number of records per page' })
  pageSize!: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages!: number;
}

