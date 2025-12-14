import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmsDashboardService } from './ems-dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('EMS Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ems-dashboard')
export class EmsDashboardController {
  constructor(private readonly emsDashboardService: EmsDashboardService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get EMS dashboard overview data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard() {
    return this.emsDashboardService.getDashboardData();
  }

  @Get('fleet-status')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get fleet status overview' })
  @ApiResponse({ status: 200, description: 'Fleet status retrieved successfully' })
  async getFleetStatus() {
    return this.emsDashboardService.getFleetStatus();
  }

  @Get('ambulance/:ambulanceId/status')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get detailed status for a specific ambulance' })
  @ApiResponse({ status: 200, description: 'Ambulance status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ambulance not found' })
  async getAmbulanceStatus(@Param('ambulanceId') ambulanceId: string) {
    return this.emsDashboardService.getAmbulanceStatus(ambulanceId);
  }

  @Get('performance-report')
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Get performance report for a date range' })
  @ApiResponse({ status: 200, description: 'Performance report retrieved successfully' })
  async getPerformanceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      // Parse dates with validation
      const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const parsedEndDate = endDate ? new Date(endDate) : new Date();
      
      // Validate parsed dates
      const validStartDate = !isNaN(parsedStartDate.getTime()) ? parsedStartDate : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const validEndDate = !isNaN(parsedEndDate.getTime()) ? parsedEndDate : new Date();
      
      return await this.emsDashboardService.getPerformanceReport(
        validStartDate,
        validEndDate,
      );
    } catch (error) {
      // Return a default response on error
      return {
        summary: {
          totalAssignments: 0,
          avgResponseTime: 0,
          onTimeArrivals: 0,
          totalDistance: 0,
          avgAssignmentDuration: 0,
        },
        metrics: [],
        period: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        },
        generatedAt: new Date().toISOString(),
        error: 'Failed to generate performance report',
      };
    }
  }

  @Get('driver/:driverId/performance')
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Get driver performance report' })
  @ApiResponse({ status: 200, description: 'Driver performance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async getDriverPerformance(
    @Param('driverId') driverId: string,
    @Query('days') days?: number,
  ) {
  }

  @Get('trigger-daily-metrics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Trigger generation of daily performance metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Metrics generation triggered successfully' })
  async triggerDailyMetrics(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : undefined;
    await this.emsDashboardService.generateDailyPerformanceMetric(targetDate);
    return { success: true, message: 'Daily metrics generation started', date: targetDate || 'yesterday' };
  }

  @Get('assignment-status-distribution')
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Get assignment status distribution for a date range' })
  @ApiResponse({ status: 200, description: 'Status distribution retrieved successfully' })
  async getAssignmentStatusDistribution(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const parsedEndDate = endDate ? new Date(endDate) : new Date();
      
      const validStartDate = !isNaN(parsedStartDate.getTime()) ? parsedStartDate : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const validEndDate = !isNaN(parsedEndDate.getTime()) ? parsedEndDate : new Date();
      
      return await this.emsDashboardService.getAssignmentStatusDistribution(
        validStartDate,
        validEndDate,
      );
    } catch (error) {
      return [
        { name: 'Arrived', value: 0 },
        { name: 'In Progress', value: 0 },
        { name: 'Cancelled', value: 0 },
      ];
    }
  }

  @Get('response-time-trends')
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Get response time trends for a date range' })
  @ApiResponse({ status: 200, description: 'Response time trends retrieved successfully' })
  async getResponseTimeTrends(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const parsedEndDate = endDate ? new Date(endDate) : new Date();
      
      const validStartDate = !isNaN(parsedStartDate.getTime()) ? parsedStartDate : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const validEndDate = !isNaN(parsedEndDate.getTime()) ? parsedEndDate : new Date();
      
      return await this.emsDashboardService.getResponseTimeTrends(
        validStartDate,
        validEndDate,
      );
    } catch (error) {
      return [];
    }
  }
}
