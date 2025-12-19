import { GPSMappingService } from '../../common/services/gps-mapping.service';
import { Module } from '@nestjs/common';
import { AmbulanceTrackingController } from './ambulance-tracking.controller';
import { AmbulanceTrackingService } from '../../common/services/ambulance-tracking.service';
import { HospitalBoundsService } from '../../common/services/hospital-bounds.service';
import { EMSStatusUpdaterService } from '../../common/services/ems-status-updater.service';
import { GPSPollingService } from '../../common/services/gps-polling.service';
import { FileLoggerService } from '../../common/services/file-logger.service';
import { DatabaseModule } from '../../database/database.module';

import { AmbulancesModule } from '../ambulances/ambulances.module';

@Module({
  imports: [DatabaseModule, AmbulancesModule],
  controllers: [AmbulanceTrackingController],
  providers: [
    FileLoggerService,
    AmbulanceTrackingService,
    HospitalBoundsService,
    EMSStatusUpdaterService,
    GPSPollingService,
    GPSMappingService
  ],
  exports: [
    AmbulanceTrackingService,
    HospitalBoundsService,
    EMSStatusUpdaterService,
    GPSPollingService
  ],
})
export class AmbulanceTrackingModule {}
