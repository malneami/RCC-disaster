import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Param, 
  Body, 
  UseGuards,
  Request,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Response } from 'express';
import { McpAuditService } from './mcp-audit.service';
import { McpClientService } from './mcp-client.service';
import { PrismaService } from '../../database/prisma.service';
import {
  AuditFiltersDto,
  EventFiltersDto,
  ReportFiltersDto,
  TriggerAuditDto,
  DashboardData,
  EventListResponse,
  ReportListResponse,
} from './dto/audit.dto';

@ApiTags('MCP Audit')
@ApiBearerAuth('JWT-auth')
@Controller('mcp-audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class McpAuditController {
  constructor(
    private readonly mcpAuditService: McpAuditService,
    private readonly mcpClient: McpClientService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'Get audit dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard(@Query() filters: AuditFiltersDto): Promise<DashboardData> {
    return this.mcpAuditService.getDashboardData(filters);
  }

  @Get('reports')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'List audit reports' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'reportType', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async listReports(@Query() filters: ReportFiltersDto): Promise<ReportListResponse> {
    const page = filters.page ? parseInt(String(filters.page)) : 1;
    const pageSize = filters.pageSize ? parseInt(String(filters.pageSize)) : 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (filters.startDate || filters.endDate) {
      where.generatedAt = {};
      if (filters.startDate) {
        where.generatedAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.generatedAt.lte = endDate;
      }
    }
    if (filters.reportType) {
      where.reportType = filters.reportType;
    }

    const [reports, total] = await Promise.all([
      this.prisma.auditReport.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { generatedAt: 'desc' },
        include: {
          generatedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.auditReport.count({ where }),
    ]);

    return {
      reports: reports as any[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  @Get('reports/:id')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'Get specific audit report' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReport(@Param('id') id: string) {
    return this.prisma.auditReport.findUnique({
      where: { id },
      include: {
        generatedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  @Get('reports/:id/download')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'Download audit report (PDF/Excel)' })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'format', required: false, enum: ['pdf', 'excel'] })
  @ApiResponse({ status: 200, description: 'Report downloaded successfully' })
  async downloadReport(
    @Param('id') id: string,
    @Query('format') format: 'pdf' | 'excel' = 'pdf',
    @Res({ passthrough: true }) res: Response,
  ) {
    const report = await this.prisma.auditReport.findUnique({
      where: { id },
      include: {
        generatedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    // TODO: Implement actual PDF/Excel generation
    // For now, return JSON as placeholder
    const content = JSON.stringify(report, null, 2);
    const buffer = Buffer.from(content, 'utf-8');

    res.set({
      'Content-Type': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="audit-report-${report.reportNumber}.${format === 'pdf' ? 'pdf' : 'xlsx'}"`,
      'Content-Length': buffer.length,
    });

    return new StreamableFile(buffer);
  }

  @Post('audit/trigger')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Trigger on-demand audit' })
  @ApiResponse({ status: 200, description: 'Audit triggered successfully' })
  async triggerAudit(@Body() dto: TriggerAuditDto, @Request() req: any) {
    const result = await this.mcpAuditService.generateComprehensiveReport(
      {
        startDate: dto.startDate,
        endDate: dto.endDate,
        hospitalId: dto.hospitalId,
        dimensions: dto.dimensions,
      },
      req.user.id,
      dto.submitToMcp !== false, // Default to true
    );

    return {
      success: true,
      reportId: result.reportId,
      overallScore: result.overallScore,
      dimensionCount: result.results.length,
    };
  }

  @Get('events')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'List audit events' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'eventType', required: false, enum: ['SCHEDULED_AUDIT', 'REAL_TIME_EVENT', 'MANUAL_TRIGGER', 'SYSTEM_CHECK'] })
  @ApiQuery({ name: 'severity', required: false, enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'] })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  async listEvents(@Query() filters: EventFiltersDto): Promise<EventListResponse> {
    const page = filters.page ? parseInt(String(filters.page)) : 1;
    const pageSize = filters.pageSize ? parseInt(String(filters.pageSize)) : 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }
    if (filters.eventType) {
      where.eventType = filters.eventType;
    }
    if (filters.severity) {
      where.severity = filters.severity;
    }
    if (filters.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters.dimensions && filters.dimensions.length > 0) {
      where.dimension = { in: filters.dimensions };
    }

    const [events, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return {
      events: events as any[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  @Get('health')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Check MCP connection health' })
  @ApiResponse({ status: 200, description: 'Health check completed' })
  async checkHealth() {
    const mcpHealth = await this.mcpClient.checkConnection();
    return {
      mcpEnabled: this.mcpClient.isEnabled(),
      mcpStatus: mcpHealth.status,
      mcpMessage: mcpHealth.message,
      timestamp: new Date().toISOString(),
    };
  }
}
