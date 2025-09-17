import { Module } from '@nestjs/common';
import { GpsApiService } from './gps-api.service';
import { GpsValidationService } from './gps-validation.service';
import { GpsMonitoringEnhancedService } from './gps-monitoring-enhanced.service';
import { EmsOrchestrationEnhancedService } from './ems-orchestration-enhanced.service';
import { GpsPollingService } from './gps-polling.service';
import { GpsLoggingService } from './gps-logging.service';
import { GpsStatusEngineService } from './gps-status-engine.service';
import { CacheModule } from '../cache/cache.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { AppConfigModule } from '../../config/config.module';
import { PrismaService } from '../../database/prisma.service';
import { EmsGatewayModule } from '../../modules/ems-gateway/ems-gateway.module';

@Module({
  imports: [
    AppConfigModule,
    CacheModule,
    MonitoringModule,
    EmsGatewayModule,
  ],
  providers: [
    GpsApiService,
    GpsValidationService,
    GpsMonitoringEnhancedService,
    EmsOrchestrationEnhancedService,
    GpsPollingService,
    GpsLoggingService,
    GpsStatusEngineService,
    PrismaService,
  ],
  exports: [
    GpsApiService,
    GpsValidationService,
    GpsMonitoringEnhancedService,
    EmsOrchestrationEnhancedService,
    GpsPollingService,
    GpsLoggingService,
    GpsStatusEngineService,
  ],
})
export class GpsServicesModule {}


