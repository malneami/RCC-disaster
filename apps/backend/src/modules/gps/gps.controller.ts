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
import { GpsApiService } from '../../common/services/gps-api.service';
import { GpsValidationService } from '../../common/services/gps-validation.service';
import { GpsMonitoringEnhancedService } from '../../common/services/gps-monitoring-enhanced.service';
import { GpsPollingService } from '../../common/services/gps-polling.service';
import { GpsStatusEngineService, GpsStatusAnalysis } from '../../common/services/gps-status-engine.service';
import { GpsLoggingService } from '../../common/services/gps-logging.service';
// GpsMockService removed - not needed in production
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { VehicleStatus } from '../../common/interfaces/gps.interfaces';

@ApiTags('GPS Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gps')
export class GpsController {
  constructor(
    private readonly gpsApiService: GpsApiService,
    private readonly gpsValidationService: GpsValidationService,
    private readonly gpsMonitoringService: GpsMonitoringEnhancedService,
    private readonly gpsPollingService: GpsPollingService,
    private readonly gpsStatusEngine: GpsStatusEngineService,
    private readonly gpsLoggingService: GpsLoggingService,
    // GpsMockService removed
  ) {}

  // ===== GPS API ENDPOINTS =====

  @Get('vehicle/:vehicleId')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Get GPS location for specific vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle location retrieved successfully' })
  async getVehicleLocation(@Param('vehicleId') vehicleId: string): Promise<VehicleStatus | null> {
    return this.gpsApiService.getVehicleLocation(vehicleId);
  }

  @Get('vehicles')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Get GPS locations for all vehicles' })
  @ApiResponse({ status: 200, description: 'All vehicle locations retrieved successfully' })
  async getAllVehicleLocations(): Promise<VehicleStatus[]> {
    return this.gpsApiService.getAllVehicleLocations();
  }

  @Post('vehicles/batch')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Get GPS locations for multiple vehicles' })
  @ApiResponse({ status: 200, description: 'Batch vehicle locations retrieved successfully' })
  async getMultipleVehicleLocations(@Body() body: { vehicleIds: string[] }): Promise<VehicleStatus[]> {
    return this.gpsApiService.getMultipleVehicleLocations(body.vehicleIds);
  }

  // ===== GPS VALIDATION ENDPOINTS =====

  @Post('validate/:vehicleId')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Validate GPS data for specific vehicle' })
  @ApiResponse({ status: 200, description: 'GPS data validation completed' })
  async validateVehicleGps(@Param('vehicleId') vehicleId: string): Promise<any> {
    const vehicleStatus = await this.gpsApiService.getVehicleLocation(vehicleId);
    if (!vehicleStatus) {
      throw new Error('Vehicle not found');
    }
    return this.gpsValidationService.validateVehicleStatus(vehicleStatus);
  }

  @Post('validate/batch')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Validate GPS data for multiple vehicles' })
  @ApiResponse({ status: 200, description: 'Batch GPS validation completed' })
  async validateMultipleVehicles(@Body() body: { vehicleIds: string[] }): Promise<any[]> {
    const vehicleStatuses = await this.gpsApiService.getMultipleVehicleLocations(body.vehicleIds);
    const results = [];
    
    for (const vehicleStatus of vehicleStatuses) {
      const validation = await this.gpsValidationService.validateVehicleStatus(vehicleStatus);
      results.push({
        vehicleId: vehicleStatus.vehicleId,
        validation,
      });
    }
    
    return results;
  }

  // ===== GPS STATUS ANALYSIS ENDPOINTS =====

  @Get('status/analysis/:ambulanceId')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Get GPS status analysis for specific ambulance' })
  @ApiResponse({ status: 200, description: 'Status analysis completed' })
  async getStatusAnalysis(@Param('ambulanceId') ambulanceId: string): Promise<GpsStatusAnalysis> {
    const gpsData = await this.gpsApiService.getVehicleLocation(ambulanceId);
    if (!gpsData) {
      throw new Error('No GPS data available for ambulance');
    }
    return this.gpsStatusEngine.analyzeGpsStatus(ambulanceId, gpsData);
  }

  @Post('status/analyze-all')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Analyze GPS status for all active ambulances' })
  @ApiResponse({ status: 200, description: 'Batch status analysis completed' })
  async analyzeAllAmbulances(): Promise<{ processed: number; results: any[] }> {
    // This would need to be implemented in the status engine service
    // For now, return a placeholder
    return { processed: 0, results: [] };
  }

  @Post('status/test-analysis')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Test GPS status analysis with mock data' })
  @ApiResponse({ status: 200, description: 'Test analysis completed' })
  async testStatusAnalysis(@Body() testData: {
    ambulanceId: string;
    mockGpsData: {
      latitude: number;
      longitude: number;
      speed: number;
      direction: number;
      timestamp: string;
      accuracy: number;
    };
  }): Promise<GpsStatusAnalysis> {
    const mockVehicleStatus: VehicleStatus = {
      vehicleId: testData.ambulanceId,
      location: {
        latitude: testData.mockGpsData.latitude,
        longitude: testData.mockGpsData.longitude,
        speed: testData.mockGpsData.speed,
        direction: testData.mockGpsData.direction,
        timestamp: new Date(testData.mockGpsData.timestamp),
        accuracy: testData.mockGpsData.accuracy,
      },
      fuelLevel: undefined,
      engineStatus: true,
      address: 'Test Location',
    };

    return this.gpsStatusEngine.analyzeGpsStatus(testData.ambulanceId, mockVehicleStatus);
  }

  // ===== GPS POLLING CONTROL ENDPOINTS =====

  @Get('polling/status')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Get GPS polling status' })
  @ApiResponse({ status: 200, description: 'Polling status retrieved' })
  getPollingStatus() {
    return this.gpsPollingService.getPollingStatus();
  }

  @Post('polling/start')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Start GPS polling' })
  @ApiResponse({ status: 200, description: 'GPS polling started' })
  startPolling() {
    this.gpsPollingService.startPolling();
    return { message: 'GPS polling started' };
  }

  @Post('polling/stop')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Stop GPS polling' })
  @ApiResponse({ status: 200, description: 'GPS polling stopped' })
  stopPolling() {
    this.gpsPollingService.stopPolling();
    return { message: 'GPS polling stopped' };
  }

  @Post('polling/trigger')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Trigger manual GPS polling' })
  @ApiResponse({ status: 200, description: 'Manual GPS polling triggered' })
  async triggerPolling() {
    await this.gpsPollingService.triggerPolling();
    return { message: 'Manual GPS polling triggered' };
  }

  // ===== GPS MONITORING ENDPOINTS =====

  @Get('health')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Get GPS system health status' })
  @ApiResponse({ status: 200, description: 'GPS health status retrieved' })
  async getGpsHealth() {
    // Placeholder - would need to implement in monitoring service
    return {
      isHealthy: true,
      lastUpdate: new Date(),
      activeConnections: 0,
      errorRate: 0,
      averageResponseTime: 0,
      alerts: [],
    };
  }

  @Get('alerts')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Get active GPS alerts' })
  @ApiResponse({ status: 200, description: 'Active GPS alerts retrieved' })
  async getActiveAlerts(@Query('limit') limit?: number) {
    // Placeholder - would need to implement in monitoring service
    return [];
  }

  @Post('alerts/:alertId/acknowledge')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Acknowledge GPS alert' })
  @ApiResponse({ status: 200, description: 'GPS alert acknowledged' })
  async acknowledgeAlert(@Param('alertId') alertId: string) {
    // Placeholder - would need to implement in monitoring service
    return { message: 'Alert acknowledged', alertId };
  }

  // ===== GPS LOGGING ENDPOINTS =====

  @Get('logs/api')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Get GPS API logs' })
  @ApiResponse({ status: 200, description: 'GPS API logs retrieved' })
  async getApiLogs(@Query('limit') limit?: number) {
    return this.gpsLoggingService.getRecentApiLogs(limit || 50);
  }

  @Get('logs/data')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Get GPS tracking logs' })
  @ApiResponse({ status: 200, description: 'GPS tracking logs retrieved' })
  async getDataLogs(@Query('limit') limit?: number) {
    // GPS data logs are now handled by GPSTrackingLog model
    // This endpoint can be used for tracking logs if needed
    return { message: 'GPS data logging is now handled by GPSTrackingLog model' };
  }

  @Get('logs/validation')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Get GPS validation logs' })
  @ApiResponse({ status: 200, description: 'GPS validation logs retrieved' })
  async getValidationLogs(@Query('limit') limit?: number) {
    return this.gpsLoggingService.getValidationLogs(limit || 50);
  }

  @Get('logs/summary')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Get GPS logging summary' })
  @ApiResponse({ status: 200, description: 'GPS logging summary retrieved' })
  async getLoggingSummary() {
    // Placeholder - would need to implement in logging service
    return {
      totalLogs: 0,
      apiLogs: 0,
      dataLogs: 0,
      validationLogs: 0,
      errorLogs: 0,
    };
  }

  // ===== GPS TESTING ENDPOINTS =====

  @Post('test/mock-data')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Generate mock GPS data for testing' })
  @ApiResponse({ status: 200, description: 'Mock GPS data generated' })
  async generateMockData(@Body() body: { vehicleId: string; count?: number }) {
    // Placeholder - would need to implement in mock service
    return { message: 'Mock data generation not implemented', vehicleId: body.vehicleId };
  }

  @Post('test/simulate-movement')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Simulate vehicle movement for testing' })
  @ApiResponse({ status: 200, description: 'Vehicle movement simulation started' })
  async simulateMovement(@Body() body: { 
    vehicleId: string; 
    route: Array<{ latitude: number; longitude: number }>;
    duration?: number;
  }) {
    // Placeholder - would need to implement in mock service
    return { message: 'Movement simulation not implemented', vehicleId: body.vehicleId };
  }

  // ===== GPS CONFIGURATION ENDPOINTS =====

  @Get('config')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Get GPS configuration' })
  @ApiResponse({ status: 200, description: 'GPS configuration retrieved' })
  getGpsConfig() {
    return {
      pollingInterval: 60000, // 1 minute
      movingSpeedThreshold: 5, // km/h
      stationarySpeedThreshold: 2, // km/h
      pickupArrivalThreshold: 50, // meters
      destinationArrivalThreshold: 100, // meters
      minStationaryTime: 60000, // 1 minute
      maxSpeedLimit: 120, // km/h
      confidenceThreshold: 80, // percentage
    };
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS)
  @ApiOperation({ summary: 'Get GPS system statistics' })
  @ApiResponse({ status: 200, description: 'GPS statistics retrieved' })
  async getGpsStatistics() {
    // This would need to be implemented
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      last24Hours: {
        requests: 0,
        errors: 0,
        averageResponseTime: 0,
      },
    };
  }
}
