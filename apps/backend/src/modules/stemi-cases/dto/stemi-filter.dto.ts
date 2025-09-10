import { IsOptional, IsString, IsEnum, IsBoolean, IsDateString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { STEMIStatus, STEMITreatment, ECGInterpretation } from '@prisma/client';

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
  @IsEnum(['AMBULANCE', 'PRIVATE_VEHICLE', 'AIR_TRANSPORT', 'WALK_IN', 'POLICE', 'TRANSFERRED_FROM_HOSPITAL', 'OTHER'])
  modeOfArrival?: 'AMBULANCE' | 'PRIVATE_VEHICLE' | 'AIR_TRANSPORT' | 'WALK_IN' | 'POLICE' | 'TRANSFERRED_FROM_HOSPITAL' | 'OTHER';

  @IsOptional()
  @IsEnum(STEMIStatus)
  currentStatus?: STEMIStatus;

  @IsOptional()
  @IsEnum(STEMITreatment)
  selectedTreatment?: STEMITreatment;

  @IsOptional()
  @IsEnum(ECGInterpretation)
  ecgResult?: ECGInterpretation;

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

