import { Module } from '@nestjs/common';
import { GpsTrackingController } from './gps-tracking.controller';
import { GpsTrackingService } from './gps-tracking.service';
import { DatabaseModule } from '../../database/database.module';
import { GpsServicesModule } from '../../common/services/gps-services.module';

@Module({
  imports: [
    DatabaseModule,
    GpsServicesModule,
  ],
  controllers: [GpsTrackingController],
  providers: [GpsTrackingService],
  exports: [GpsTrackingService],
})
export class GpsTrackingModule {}
