import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StemiCommandCenterService } from './stemi-command-center.service';
import { CommandCenterFiltersDto, CommandCenterDataDto } from './dto/command-center.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('STEMI Command Center')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stemi-command-center')
export class StemiCommandCenterController {
  constructor(private readonly commandCenterService: StemiCommandCenterService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.CATH_LAB_USER, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'Get STEMI Command Center dashboard data' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data retrieved successfully',
    type: CommandCenterDataDto
  })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Hospital ID filter (use "all" for all hospitals)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for data filtering (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for data filtering (YYYY-MM-DD)' })
  async getDashboard(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<CommandCenterDataDto> {
    const filters: CommandCenterFiltersDto = {
      hospitalId: hospitalId || 'all',
      startDate,
      endDate,
    };

    return this.commandCenterService.getDashboardData(filters);
  }

  @Get('kpis')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.CATH_LAB_USER, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'Get KPI metrics for STEMI cases' })
  @ApiResponse({ status: 200, description: 'KPI metrics retrieved successfully' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Hospital ID filter' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for data filtering' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for data filtering' })
  async getKPIs(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      hospitalId: hospitalId || 'all',
      startDate,
      endDate,
    };

    const dashboardData = await this.commandCenterService.getDashboardData(filters);
    return {
      kpis: dashboardData.kpis,
      summary: dashboardData.summary,
    };
  }

  @Get('hospital-performance')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.CATH_LAB_USER, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'Get hospital performance metrics' })
  @ApiResponse({ status: 200, description: 'Hospital performance data retrieved successfully' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Specific hospital ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for data filtering' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for data filtering' })
  async getHospitalPerformance(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      hospitalId: hospitalId || 'all',
      startDate,
      endDate,
    };

    const dashboardData = await this.commandCenterService.getDashboardData(filters);
    return {
      hospitals: dashboardData.hospitals,
    };
  }

  @Get('charts')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.CATH_LAB_USER, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'Get chart data for visualizations' })
  @ApiResponse({ status: 200, description: 'Chart data retrieved successfully' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Hospital ID filter' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for data filtering' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for data filtering' })
  async getCharts(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      hospitalId: hospitalId || 'all',
      startDate,
      endDate,
    };

    const dashboardData = await this.commandCenterService.getDashboardData(filters);
    return {
      charts: dashboardData.charts,
    };
  }

  @Get('recent-cases')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.CATH_LAB_USER, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'Get recent STEMI cases' })
  @ApiResponse({ status: 200, description: 'Recent cases retrieved successfully' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Hospital ID filter' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of recent cases to return (default: 10)' })
  async getRecentCases(
    @Query('hospitalId') hospitalId?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      hospitalId: hospitalId || 'all',
    };

    const dashboardData = await this.commandCenterService.getDashboardData(filters);
    const recentCases = dashboardData.recentCases.slice(0, parseInt(limit || '10'));
    
    return {
      recentCases,
      total: dashboardData.recentCases.length,
    };
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.CATH_LAB_USER, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'Get summary statistics' })
  @ApiResponse({ status: 200, description: 'Summary statistics retrieved successfully' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Hospital ID filter' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for data filtering' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for data filtering' })
  async getSummary(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      hospitalId: hospitalId || 'all',
      startDate,
      endDate,
    };

    const dashboardData = await this.commandCenterService.getDashboardData(filters);
    return {
      summary: dashboardData.summary,
    };
  }
}
