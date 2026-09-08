import { Module } from '@nestjs/common';
import { PregnancyOutcomesService } from './pregnancy-outcomes.service';
import { PregnancyOutcomesController } from './pregnancy-outcomes.controller';

@Module({
  controllers: [PregnancyOutcomesController],
  providers: [PregnancyOutcomesService],
  exports: [PregnancyOutcomesService],
})
export class PregnancyOutcomesModule {}
