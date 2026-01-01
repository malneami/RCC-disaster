import { Controller, Get, Query, Param, UseGuards, ParseEnumPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { DataQualityService } from './data-quality.service';
import { AuditKPIFiltersDto, KPIType, FailedRecordsResponseDto } from './dto/audit-kpi.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('Data Quality')
@ApiBearerAuth('JWT-auth')
@Controller('data-quality')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataQualityController {
  constructor(private readonly dataQualityService: DataQualityService) {}

  @Get('audit/kpis')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'Get all data quality audit KPIs' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date for filtering (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date for filtering (YYYY-MM-DD)' })
  @ApiQuery({ name: 'hospitalId', required: false, type: String, description: 'Filter by hospital ID' })
  @ApiQuery({ name: 'recordType', required: false, enum: ['all', 'stemi', 'stroke', 'trauma', 'ticket'], description: 'Filter by record type' })
  @ApiQuery({ name: 'patientId', required: false, type: String, description: 'Filter by patient ID' })
  @ApiResponse({ status: 200, description: 'Audit KPIs retrieved successfully' })
  async getAuditKPIs(@Query() filters: AuditKPIFiltersDto) {
    return this.dataQualityService.getAuditKPIs(filters);
  }

  @Get('audit/kpis/:kpiType')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'Get specific data quality audit KPI' })
  @ApiParam({ name: 'kpiType', enum: KPIType, description: 'KPI type' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date for filtering (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date for filtering (YYYY-MM-DD)' })
  @ApiQuery({ name: 'hospitalId', required: false, type: String, description: 'Filter by hospital ID' })
  @ApiQuery({ name: 'recordType', required: false, enum: ['all', 'stemi', 'stroke', 'trauma', 'ticket'], description: 'Filter by record type' })
  @ApiQuery({ name: 'patientId', required: false, type: String, description: 'Filter by patient ID' })
  @ApiResponse({ status: 200, description: 'KPI retrieved successfully' })
  async getSpecificKPI(
    @Param('kpiType', new ParseEnumPipe(KPIType)) kpiType: KPIType,
    @Query() filters: AuditKPIFiltersDto,
  ) {
    const allKPIs = await this.dataQualityService.getAuditKPIs(filters);
    const kpi = allKPIs.kpis.find((k) => k.kpiType === kpiType);
    return kpi || { error: 'KPI not found' };
  }

  @Get('audit/failed-records')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'Get failed records for a specific KPI' })
  @ApiQuery({ name: 'kpiType', required: true, enum: KPIType, description: 'KPI type to get failed records for' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date for filtering (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date for filtering (YYYY-MM-DD)' })
  @ApiQuery({ name: 'hospitalId', required: false, type: String, description: 'Filter by hospital ID' })
  @ApiQuery({ name: 'recordType', required: false, enum: ['all', 'stemi', 'stroke', 'trauma', 'ticket'], description: 'Filter by record type' })
  @ApiQuery({ name: 'patientId', required: false, type: String, description: 'Filter by patient ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Number of records per page (default: 50)' })
  @ApiResponse({ status: 200, description: 'Failed records retrieved successfully' })
  async getFailedRecords(
    @Query('kpiType') kpiType: KPIType,
    @Query() filters: AuditKPIFiltersDto & { page?: number; pageSize?: number },
  ): Promise<FailedRecordsResponseDto> {
    const page = filters.page ? parseInt(String(filters.page)) : 1;
    const pageSize = filters.pageSize ? parseInt(String(filters.pageSize)) : 50;

    const { page: _, pageSize: __, ...filterParams } = filters;
    return this.dataQualityService.getFailedRecords(kpiType, filterParams, page, pageSize);
  }
}

