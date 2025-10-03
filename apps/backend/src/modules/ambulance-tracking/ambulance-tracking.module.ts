import { Module } from '@nestjs/common';
import { AmbulanceTrackingController } from './ambulance-tracking.controller';
import { AmbulanceTrackingService } from '../../common/services/ambulance-tracking.service';
import { HospitalBoundsService } from '../../common/services/hospital-bounds.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AmbulanceTrackingController],
  providers: [AmbulanceTrackingService, HospitalBoundsService],
  exports: [AmbulanceTrackingService, HospitalBoundsService],
})
export class AmbulanceTrackingModule {}
