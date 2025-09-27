import { IsOptional, IsString, IsEnum, IsBoolean, IsDateString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
// Note: Using string literals instead of enums for flexibility

export class StemiFilterDto {
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
  @IsEnum(['AMBULANCE_RED_CRESCENT', 'PRIVATE_CAR', 'TRANSFERRED_FROM_ANOTHER_HOSPITAL'])
  modeOfArrival?: 'AMBULANCE_RED_CRESCENT' | 'PRIVATE_CAR' | 'TRANSFERRED_FROM_ANOTHER_HOSPITAL';

  @IsOptional()
  @IsString()
  currentStatus?: string;

  @IsOptional()
  @IsString()
  selectedTreatment?: string;

  @IsOptional()
  @IsString()
  ecgResult?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  eligibleForPrimaryPci?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  thrombolyticGiven?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isTroponinPositive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  rccActivated?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  offset?: number;

  @IsOptional()
  @IsString()
  search?: string;
}

