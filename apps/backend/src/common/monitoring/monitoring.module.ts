import { Module } from '@nestjs/common';
import { GpsMonitoringService } from './gps-monitoring.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [GpsMonitoringService],
  exports: [GpsMonitoringService],
})
export class MonitoringModule {}


