import { Module } from '@nestjs/common';
import { EmsDashboardController } from './ems-dashboard.controller';
import { EmsDashboardService } from './ems-dashboard.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EmsDashboardController],
  providers: [EmsDashboardService],
  exports: [EmsDashboardService],
})
export class EmsDashboardModule {}


