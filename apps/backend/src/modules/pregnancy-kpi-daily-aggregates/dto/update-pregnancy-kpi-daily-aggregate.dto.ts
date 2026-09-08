import { PartialType } from '@nestjs/mapped-types';
import { CreatePregnancyKpiDailyAggregateDto } from './create-pregnancy-kpi-daily-aggregate.dto';

export class UpdatePregnancyKpiDailyAggregateDto extends PartialType(CreatePregnancyKpiDailyAggregateDto) {}
