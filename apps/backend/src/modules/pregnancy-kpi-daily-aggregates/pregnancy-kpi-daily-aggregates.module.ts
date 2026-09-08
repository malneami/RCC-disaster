import { Module } from '@nestjs/common';
import { PregnancyKpiDailyAggregatesService } from './pregnancy-kpi-daily-aggregates.service';
import { PregnancyKpiDailyAggregatesController } from './pregnancy-kpi-daily-aggregates.controller';

@Module({
  controllers: [PregnancyKpiDailyAggregatesController],
  providers: [PregnancyKpiDailyAggregatesService],
  exports: [PregnancyKpiDailyAggregatesService],
})
export class PregnancyKpiDailyAggregatesModule {}
