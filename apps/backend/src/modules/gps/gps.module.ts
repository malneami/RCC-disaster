import { Module } from '@nestjs/common';
import { GpsController } from './gps.controller';
import { GpsServicesModule } from '../../common/services/gps-services.module';

@Module({
  imports: [GpsServicesModule],
  controllers: [GpsController],
})
export class GpsModule {}

