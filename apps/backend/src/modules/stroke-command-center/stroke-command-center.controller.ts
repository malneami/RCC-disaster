import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StrokeCommandCenterService } from './stroke-command-center.service';
import { StrokeCommandCenterFiltersDto, StrokeCommandCenterDataDto } from './dto/stroke-command-center.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Stroke Command Center')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard) // Temporarily disabled for testing
@Controller('stroke-command-center')
export class StrokeCommandCenterController {
  constructor(private readonly commandCenterService: StrokeCommandCenterService) {}

  @Get('dashboard')
  // // @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR) // Temporarily disabled for testing // Temporarily disabled for testing
  @ApiOperation({ summary: 'Get Stroke Command Center dashboard data' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data retrieved successfully',
    type: StrokeCommandCenterDataDto
  })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Hospital ID filter (use "all" for all hospitals)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for data filtering (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for data filtering (YYYY-MM-DD)' })
  async getDashboard(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<StrokeCommandCenterDataDto> {
    const filters: StrokeCommandCenterFiltersDto = {
      hospitalId: hospitalId || 'all',
      startDate,
      endDate,
    };

    return this.commandCenterService.getDashboardData(filters);
  }

  @Get('kpis')
  // // @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR) // Temporarily disabled for testing // Temporarily disabled for testing
  @ApiOperation({ summary: 'Get KPI metrics for stroke cases' })
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
      kpiData: dashboardData.kpiData,
      kpis: dashboardData.kpis,
    };
  }

  @Get('distribution')
  // @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR) // Temporarily disabled for testing
  @ApiOperation({ summary: 'Get distribution data for charts' })
  @ApiResponse({ status: 200, description: 'Distribution data retrieved successfully' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Hospital ID filter' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for data filtering' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for data filtering' })
  async getDistribution(
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
      distributionData: dashboardData.distributionData,
    };
  }

  @Get('performance')
  // @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR) // Temporarily disabled for testing
  @ApiOperation({ summary: 'Get therapy and admission performance data' })
  @ApiResponse({ status: 200, description: 'Performance data retrieved successfully' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Hospital ID filter' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for data filtering' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for data filtering' })
  async getPerformance(
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
      therapyPerformance: dashboardData.therapyPerformance,
      admissionFollowup: dashboardData.admissionFollowup,
    };
  }

  @Get('trends')
  // @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR) // Temporarily disabled for testing
  @ApiOperation({ summary: 'Get performance trend data' })
  @ApiResponse({ status: 200, description: 'Trend data retrieved successfully' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Hospital ID filter' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for data filtering' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for data filtering' })
  async getTrends(
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
      performanceTrend: dashboardData.performanceTrend,
    };
  }

  @Get('stroke-types')
  // @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR) // Temporarily disabled for testing
  @ApiOperation({ summary: 'Get stroke type distribution data' })
  @ApiResponse({ status: 200, description: 'Stroke type distribution retrieved successfully' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Hospital ID filter' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for data filtering' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for data filtering' })
  async getStrokeTypes(
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
      strokeTypeDistribution: dashboardData.strokeTypeDistribution,
    };
  }

  @Get('hospitals')
  // @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR) // Temporarily disabled for testing
  @ApiOperation({ summary: 'Get hospitals list for stroke command center' })
  @ApiResponse({ status: 200, description: 'Hospitals list retrieved successfully' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Specific hospital ID' })
  async getHospitals(
    @Query('hospitalId') hospitalId?: string,
  ) {
    const filters = {
      hospitalId: hospitalId || 'all',
    };

    const dashboardData = await this.commandCenterService.getDashboardData(filters);
    return {
      hospitals: dashboardData.hospitals,
    };
  }
}
