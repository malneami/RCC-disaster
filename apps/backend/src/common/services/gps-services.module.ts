import { Module } from '@nestjs/common';
import { GpsApiService } from './gps-api.service';
import { GpsRetryService } from './gps-retry.service';
import { CacheModule } from '../cache/cache.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { AppConfigModule } from '../../config/config.module';

@Module({
  imports: [
    AppConfigModule,
    CacheModule,
    MonitoringModule,
  ],
  providers: [
    GpsApiService,
    GpsRetryService,
  ],
  exports: [
    GpsApiService,
    GpsRetryService,
  ],
})
export class GpsServicesModule {}


