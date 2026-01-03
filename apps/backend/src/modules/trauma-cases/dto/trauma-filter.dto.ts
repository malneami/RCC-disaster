import { IsOptional, IsString, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { TraumaModeOfArrival, TraumaMechanismOfInjury, TraumaDispositionType } from '@prisma/client';

export class TraumaFilterDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  originHospitalId?: string;

  @IsOptional()
  @IsString()
  destinationHospitalId?: string;

  @IsOptional()
  @IsEnum(TraumaModeOfArrival)
  modeOfArrival?: TraumaModeOfArrival;

  @IsOptional()
  @IsEnum(TraumaMechanismOfInjury)
  mechanismOfInjury?: TraumaMechanismOfInjury;

  @IsOptional()
  @IsEnum(TraumaDispositionType)
  edDisposition?: TraumaDispositionType;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  criticalCase?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  transferCase?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
