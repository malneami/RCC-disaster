import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsNotEmpty,
  IsDateString,
  Min,
} from 'class-validator';

export class CreatePregnancyKpiDailyAggregateDto {
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  region!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalCases?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maternalRedCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maternalOrangeCount?: number;

  @IsOptional()
  @IsNumber()
  avgActivationToOb?: number;

  @IsOptional()
  @IsNumber()
  avgActivationToDispatch?: number;

  @IsOptional()
  @IsNumber()
  avgDispatchToArrival?: number;

  @IsOptional()
  @IsNumber()
  maternalMortalityRate?: number;

  @IsOptional()
  @IsNumber()
  severeMorbidityRate?: number;

  @IsOptional()
  @IsNumber()
  perinatalMortalityRate?: number;

  @IsOptional()
  @IsNumber()
  nicuRate?: number;

  @IsOptional()
  @IsNumber()
  vaginalPercentage?: number;

  @IsOptional()
  @IsNumber()
  cesareanPercentage?: number;

  @IsOptional()
  @IsNumber()
  emergencyCsPercentage?: number;

  @IsOptional()
  @IsNumber()
  planChangePercentage?: number;

  @IsOptional()
  @IsNumber()
  documentationCompletenessAvg?: number;
}
