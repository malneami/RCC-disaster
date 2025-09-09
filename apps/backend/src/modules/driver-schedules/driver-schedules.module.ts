import { Module } from '@nestjs/common';
import { DriverSchedulesController } from './driver-schedules.controller';
import { DriverSchedulesService } from './driver-schedules.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DriverSchedulesController],
  providers: [DriverSchedulesService],
  exports: [DriverSchedulesService],
})
export class DriverSchedulesModule {}


