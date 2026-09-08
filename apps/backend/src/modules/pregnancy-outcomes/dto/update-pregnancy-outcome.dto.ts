import { PartialType } from '@nestjs/mapped-types';
import { CreatePregnancyOutcomeDto } from './create-pregnancy-outcome.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePregnancyOutcomeDto extends PartialType(CreatePregnancyOutcomeDto) {
  @IsOptional()
  @IsBoolean()
  reviewFlag?: boolean;
}
