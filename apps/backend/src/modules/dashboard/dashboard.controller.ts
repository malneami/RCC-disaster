import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
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
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved successfully' })
  async getDashboardMetrics() {
    return this.dashboardService.getDashboardMetrics();
  }

  @Get('pathway-metrics')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER, UserRole.HOSPITAL_USER)
  @ApiOperation({ summary: 'Get pathway performance metrics' })
  @ApiResponse({ status: 200, description: 'Pathway performance metrics retrieved successfully' })
  async getPathwayPerformanceMetrics() {
    return this.dashboardService.getPathwayPerformanceMetrics();
  }
}
