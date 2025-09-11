import { IsString, IsEnum, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StrokeType, StrokeStatus, StrokeSeverity, StrokeTreatment } from '@prisma/client';

export class PatientInfoV2Dto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  mrn?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string; // Will be removed after migration

  @IsOptional()
  @IsNumber()
  age?: number; // Age in years

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

export class CreateStrokeCaseV2Dto {
  @IsOptional()
  @IsString()
  ticketId?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PatientInfoV2Dto)
  patientInfo?: PatientInfoV2Dto;

  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  presentingSymptoms?: string;

  @IsString()
  originHospitalId!: string;

  @IsOptional()
  @IsString()
  destinationHospitalId?: string;

  @IsEnum(StrokeType)
  strokeType!: StrokeType;

  @IsEnum(StrokeStatus)
  currentStatus!: StrokeStatus;

  @IsOptional()
  @IsEnum(StrokeSeverity)
  strokeSeverity?: StrokeSeverity;

  @IsOptional()
  @IsEnum(StrokeTreatment)
  selectedTreatment?: StrokeTreatment;
}

