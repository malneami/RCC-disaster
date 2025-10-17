import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER, UserRole.HOSPITAL_USER)
  @ApiOperation({ summary: 'Get main dashboard metrics' })
  @ApiQuery({ name: 'hospitalId', required: false, type: String, description: 'Filter by hospital ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date for filtering (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date for filtering (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved successfully' })
  async getDashboardMetrics(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getDashboardMetrics({ hospitalId, startDate, endDate });
  }

  @Get('pathway-metrics')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER, UserRole.HOSPITAL_USER)
  @ApiOperation({ summary: 'Get pathway performance metrics' })
  @ApiQuery({ name: 'hospitalId', required: false, type: String, description: 'Filter by hospital ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date for filtering (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date for filtering (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Pathway performance metrics retrieved successfully' })
  async getPathwayPerformanceMetrics(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getPathwayPerformanceMetrics({ hospitalId, startDate, endDate });
  }
}
