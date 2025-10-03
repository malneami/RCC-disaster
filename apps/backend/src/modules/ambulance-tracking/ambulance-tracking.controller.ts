import { Controller, Post, Get, Body, Param, Query, Logger } from '@nestjs/common';
import { AmbulanceTrackingService, AmbulanceLocationUpdate } from '../../common/services/ambulance-tracking.service';
import { HospitalBoundsService } from '../../common/services/hospital-bounds.service';

@Controller('ambulance-tracking')
export class AmbulanceTrackingController {
  private readonly logger = new Logger(AmbulanceTrackingController.name);

  constructor(
    private ambulanceTrackingService: AmbulanceTrackingService,
    private hospitalBoundsService: HospitalBoundsService
  ) {}

  /**
   * Update ambulance location
   */
  @Post('location')
  async updateLocation(@Body() update: AmbulanceLocationUpdate) {
    this.logger.log(`Received location update for ambulance ${update.ambulanceId}`);
    return await this.ambulanceTrackingService.updateAmbulanceLocation(update);
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
}
