import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GpsTrackingService } from './gps-tracking.service';
import { CreateGpsLogDto } from './dto/create-gps-log.dto';
import { GpsFilterDto } from './dto/gps-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('GPS Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gps-tracking')
export class GpsTrackingController {
  constructor(private readonly gpsTrackingService: GpsTrackingService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Create a new GPS tracking log' })
  @ApiResponse({ status: 201, description: 'GPS log created successfully' })
  @ApiResponse({ status: 404, description: 'Ambulance not found' })
  async create(@Body() createGpsLogDto: CreateGpsLogDto) {
    return this.gpsTrackingService.create(createGpsLogDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get GPS tracking logs with optional filtering' })
  @ApiResponse({ status: 200, description: 'GPS logs retrieved successfully' })
  async findAll(@Query() filter: GpsFilterDto) {
    return this.gpsTrackingService.findAll(filter);
  }

  @Get('active-locations')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get current locations of all active ambulances' })
  @ApiResponse({ status: 200, description: 'Active ambulance locations retrieved successfully' })
  async getActiveAmbulancesLocations() {
    return this.gpsTrackingService.getActiveAmbulancesLocations();
  }

  @Get('speed-violations')
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Get speed violations' })
  @ApiResponse({ status: 200, description: 'Speed violations retrieved successfully' })
  async getSpeedViolations(@Query('minSpeed') minSpeed?: number) {
    return this.gpsTrackingService.getSpeedViolations(minSpeed);
  }

  @Get('assignment/:assignmentId/route')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get route for a specific assignment' })
  @ApiResponse({ status: 200, description: 'Assignment route retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async getRouteForAssignment(@Param('assignmentId') assignmentId: string) {
    return this.gpsTrackingService.getRouteForAssignment(assignmentId);
  }

  @Get('ambulance/:ambulanceId/latest')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get latest location for an ambulance' })
  @ApiResponse({ status: 200, description: 'Latest location retrieved successfully' })
  async getLatestLocation(@Param('ambulanceId') ambulanceId: string) {
    return this.gpsTrackingService.getLatestLocation(ambulanceId);
  }

  @Get('ambulance/:ambulanceId/history')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get location history for an ambulance' })
  @ApiResponse({ status: 200, description: 'Location history retrieved successfully' })
  async getLocationHistory(
    @Param('ambulanceId') ambulanceId: string,
    @Query('hours') hours?: number,
  ) {
    return this.gpsTrackingService.getLocationHistory(ambulanceId, hours);
  }

  @Get('ambulance/:ambulanceId/fuel-consumption')
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @ApiOperation({ summary: 'Get fuel consumption data for an ambulance' })
  @ApiResponse({ status: 200, description: 'Fuel consumption data retrieved successfully' })
  async getFuelConsumption(
    @Param('ambulanceId') ambulanceId: string,
    @Query('days') days?: number,
  ) {
    return this.gpsTrackingService.getFuelConsumption(ambulanceId, days);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get GPS log by ID' })
  @ApiResponse({ status: 200, description: 'GPS log retrieved successfully' })
  @ApiResponse({ status: 404, description: 'GPS log not found' })
  async findOne(@Param('id') id: string) {
    return this.gpsTrackingService.findById(id);
  }

  @Post('cleanup')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clean up old GPS logs' })
  @ApiResponse({ status: 200, description: 'GPS logs cleaned up successfully' })
  async cleanupOldLogs(@Query('daysToKeep') daysToKeep?: number) {
    const deletedCount = await this.gpsTrackingService.cleanupOldLogs(daysToKeep);
    return { deletedCount, message: `Cleaned up ${deletedCount} old GPS logs` };
  }
}
