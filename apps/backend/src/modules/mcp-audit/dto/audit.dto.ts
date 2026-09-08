import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, IsDateString, IsBoolean, IsArray } from 'class-validator';
import { AuditDimension, AuditEventType, AuditSeverity } from '@prisma/client';

export class AuditFiltersDto {
  @ApiPropertyOptional({ description: 'Start date for filtering (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by hospital ID' })
  @IsOptional()
  @IsUUID()
  hospitalId?: string;

  @ApiPropertyOptional({ description: 'Filter by patient ID' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ enum: AuditDimension, isArray: true, description: 'Filter by audit dimensions' })
  @IsOptional()
  @IsArray()
  @IsEnum(AuditDimension, { each: true })
  dimensions?: AuditDimension[];

  @ApiPropertyOptional({ description: 'Filter by entity type' })
  @IsOptional()
  @IsString()
  entityType?: string;
}

export class EventFiltersDto extends AuditFiltersDto {
  @ApiPropertyOptional({ enum: AuditEventType, description: 'Filter by event type' })
  @IsOptional()
  @IsEnum(AuditEventType)
  eventType?: AuditEventType;

  @ApiPropertyOptional({ enum: AuditSeverity, description: 'Filter by severity' })
  @IsOptional()
  @IsEnum(AuditSeverity)
  severity?: AuditSeverity;

  @ApiPropertyOptional({ description: 'Page number (default: 1)' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Page size (default: 50)' })
  @IsOptional()
  pageSize?: number;
}

export class ReportFiltersDto {
  @ApiPropertyOptional({ description: 'Start date for filtering (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by report type' })
  @IsOptional()
  @IsString()
  reportType?: string;

  @ApiPropertyOptional({ description: 'Page number (default: 1)' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Page size (default: 20)' })
  @IsOptional()
  pageSize?: number;
}

export class TriggerAuditDto {
  @ApiProperty({ enum: AuditDimension, isArray: true, description: 'Dimensions to audit' })
  @IsArray()
  @IsEnum(AuditDimension, { each: true })
  dimensions!: AuditDimension[];

  @ApiPropertyOptional({ description: 'Start date for audit (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for audit (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by hospital ID' })
  @IsOptional()
  @IsUUID()
  hospitalId?: string;

  @ApiPropertyOptional({ description: 'Submit to MCP server' })
  @IsOptional()
  @IsBoolean()
  submitToMcp?: boolean;
}

export interface AuditEventResponse {
  id: string;
  eventType: AuditEventType;
  dimension: AuditDimension;
  entityType: string;
  entityId: string;
  severity: AuditSeverity;
  description: string;
  details?: any;
  mcpSubmitted: boolean;
  mcpResponse?: any;
  mcpSubmittedAt?: Date;
  createdAt: Date;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AuditReportResponse {
  id: string;
  reportNumber: string;
  reportType: string;
  startDate: Date;
  endDate: Date;
  overallScore: number;
  dimensionScores: Record<string, number>;
  summary: any;
  mcpReportUrl?: string;
  generatedAt: Date;
  generatedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface DashboardData {
  overallScore: number;
  dimensionScores: Record<AuditDimension, number>;
  recentEvents: AuditEventResponse[];
  trends: {
    dimension: AuditDimension;
    trend: 'up' | 'down' | 'stable';
    change: number;
  }[];
  severityBreakdown: Record<AuditSeverity, number>;
}

export interface EventListResponse {
  events: AuditEventResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ReportListResponse {
  reports: AuditReportResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
