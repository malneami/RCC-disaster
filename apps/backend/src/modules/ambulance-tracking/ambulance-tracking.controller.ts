import { Controller, Post, Get, Body, Param, Query, Logger } from '@nestjs/common';
import { AmbulanceTrackingService, AmbulanceLocationUpdate } from '../../common/services/ambulance-tracking.service';
import { HospitalBoundsService } from '../../common/services/hospital-bounds.service';
import { GPSPollingService } from '../../common/services/gps-polling.service';

@Controller('ambulance-tracking')
export class AmbulanceTrackingController {
  private readonly logger = new Logger(AmbulanceTrackingController.name);

  constructor(
    private ambulanceTrackingService: AmbulanceTrackingService,
    private hospitalBoundsService: HospitalBoundsService,
    private gpsPolling: GPSPollingService
  ) {}

  /**
   * Update ambulance location
   */
  @Post('location')
  async updateLocation(@Body() body: AmbulanceLocationUpdate & { ambulanceId: string }) {
    this.logger.log(`Received location update for ambulance ${body.ambulanceId}`);
    
    // Ensure timestamp is a Date object
    const timestamp = typeof body.timestamp === 'string' ? new Date(body.timestamp) : body.timestamp;
    
    return await this.ambulanceTrackingService.updateAmbulanceLocation(body.ambulanceId, {
      latitude: body.latitude,
      longitude: body.longitude,
      timestamp,
      speed: body.speed,
      direction: body.direction,
      accuracy: body.accuracy
    });
  }

  /**
   * Get ambulance status
   */
  @Get('status/:ambulanceId')
  async getAmbulanceStatus(@Param('ambulanceId') ambulanceId: string) {
    return await this.ambulanceTrackingService.getAmbulanceStatus(ambulanceId);
  }

  /**
   * Get all ambulance statuses
   */
  @Get('statuses')
  async getAllAmbulanceStatuses() {
    return await this.ambulanceTrackingService.getAllAmbulanceStatuses();
  }

  /**
   * Check if ambulance is within hospital
   */
  @Get('proximity/:ambulanceId/:hospitalId')
  async checkProximity(
    @Param('ambulanceId') ambulanceId: string,
    @Param('hospitalId') hospitalId: string,
    @Query('radius') radius?: string
  ) {
    const radiusKm = radius ? parseFloat(radius) : 1;
    return await this.ambulanceTrackingService.isAmbulanceWithinHospital(
      ambulanceId,
      hospitalId,
      radiusKm
    );
  }

  /**
   * Get all hospital bounds
   */
  @Get('hospital-bounds')
  async getHospitalBounds(@Query('radius') radius?: string) {
    const radiusKm = radius ? parseFloat(radius) : 1;
    return await this.hospitalBoundsService.getAllHospitalBounds(radiusKm);
  }

  /**
   * Get specific hospital bounds
   */
  @Get('hospital-bounds/:hospitalId')
  async getHospitalBoundsById(
    @Param('hospitalId') hospitalId: string,
    @Query('radius') radius?: string
  ) {
    const radiusKm = radius ? parseFloat(radius) : 1;
    return await this.hospitalBoundsService.getHospitalBounds(hospitalId, radiusKm);
  }

  /**
   * Test endpoint to validate coordinates against hospital bounds
   */
  @Post('test-coordinates')
  async testCoordinates(@Body() body: { latitude: number; longitude: number }) {
    this.logger.log(`Testing coordinates: ${body.latitude}, ${body.longitude}`);
    return await this.hospitalBoundsService.validateAmbulancePosition({
      latitude: body.latitude,
      longitude: body.longitude
    });
  }

  /**
   * Get zone entry logs
   */
  @Get('zone-logs')
  async getZoneLogs(
    @Query('hospitalIds') hospitalIds?: string | string[],
    @Query('ambulanceId') ambulanceId?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('includeActive') includeActive?: string,
  ) {
    const filters: any = {};
    
    if (hospitalIds) {
      filters.hospitalIds = Array.isArray(hospitalIds) ? hospitalIds : [hospitalIds];
    }
    
    if (ambulanceId) {
      filters.ambulanceId = ambulanceId;
    }
    
    if (startTime) {
      filters.startTime = new Date(startTime);
    }
    
    if (endTime) {
      filters.endTime = new Date(endTime);
    }
    
    // Add filter for active zones (no exit time)
    if (includeActive === 'true' || includeActive === '1') {
      filters.includeActive = true;
    } else if (includeActive === 'false' || includeActive === '0') {
      filters.includeActive = false;
    }
    
    const logs = await this.ambulanceTrackingService.getZoneLogs(filters);
    
    // Enhance response with calculated duration, active status, and flattened hospital data
    return logs.map(log => ({
      id: log.id,
      ambulanceId: log.ambulanceId,
      hospitalId: log.hospitalId,
      hospitalName: log.hospital.name,
      zoneType: log.zoneType,
      zoneName: log.zoneName,
      entryTime: log.entryTime,
      exitTime: log.exitTime,
      durationMinutes: log.exitTime 
        ? Math.round((log.exitTime.getTime() - log.entryTime.getTime()) / 60000)
        : null,
      isActive: !log.exitTime, // Still in zone if no exit time
    }));
  }

  /**
   * Trigger GPS sync manually
   */
  @Post('sync')
  async syncLocations() {
    return await this.ambulanceTrackingService.syncLocations();
  }

  /**
   * Get location history for an ambulance (last N minutes)
   */
  @Get(':ambulanceId/history')
  async getLocationHistory(
    @Param('ambulanceId') ambulanceId: string,
    @Query('minutes') minutes?: string
  ) {
    const minutesNum = minutes ? parseInt(minutes) : 20;
    return await this.ambulanceTrackingService.getLocationHistory(ambulanceId, minutesNum);
  }

  /**
   * Get zone logs for a specific ambulance
   */
  @Get(':ambulanceId/zone-logs')
  async getAmbulanceZoneLogs(@Param('ambulanceId') ambulanceId: string) {
    return await this.ambulanceTrackingService.getZoneLogs({ ambulanceId });
  }

  /**
   * Get ambulances that entered a zone within the last N minutes
   */
  @Get('zones/:hospitalId/recent')
  async getRecentAmbulancesInZone(
    @Param('hospitalId') hospitalId: string,
    @Query('minutes') minutes?: string
  ) {
    const minutesNum = minutes ? parseInt(minutes) : 1440;
    return await this.ambulanceTrackingService.getAmbulancesInZoneWithinTimeframe(
      hospitalId,
      minutesNum
    );
  }

  /**
   * Get ambulances for EMS assignment (entered origin or destination zones)
   */
  @Get('assignment/:originHospitalId/:destinationHospitalId')
  async getAmbulancesForAssignment(
    @Param('originHospitalId') originHospitalId: string,
    @Param('destinationHospitalId') destinationHospitalId: string,
    @Query('fromTime') fromTime?: string
  ) {
    const fromDate = fromTime ? new Date(fromTime) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours
    return await this.ambulanceTrackingService.getAmbulancesForAssignment(
      originHospitalId,
      destinationHospitalId,
      fromDate
    );
  }

  /**
   * Get GPS polling status
   */
  @Get('polling/status')
  async getPollingStatus() {
    return this.gpsPolling.getStatus();
  }

  /**
   * Trigger manual GPS poll
   */
  @Post('polling/trigger')
  async triggerPoll() {
    return await this.gpsPolling.triggerPoll();
  }
}
