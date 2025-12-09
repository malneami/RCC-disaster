import { Module } from '@nestjs/common';
import { AmbulanceTrackingController } from './ambulance-tracking.controller';
import { AmbulanceTrackingService } from '../../common/services/ambulance-tracking.service';
import { HospitalBoundsService } from '../../common/services/hospital-bounds.service';
import { EMSStatusUpdaterService } from '../../common/services/ems-status-updater.service';
import { GPSPollingService } from '../../common/services/gps-polling.service';
import { DatabaseModule } from '../../database/database.module';

import { AmbulancesModule } from '../ambulances/ambulances.module';

@Module({
  imports: [DatabaseModule, AmbulancesModule],
  controllers: [AmbulanceTrackingController],
  providers: [
    AmbulanceTrackingService,
    HospitalBoundsService,
    EMSStatusUpdaterService,
    GPSPollingService
  ],
  exports: [
    AmbulanceTrackingService,
    HospitalBoundsService,
    EMSStatusUpdaterService,
    GPSPollingService
  ],
})
export class AmbulanceTrackingModule {}
