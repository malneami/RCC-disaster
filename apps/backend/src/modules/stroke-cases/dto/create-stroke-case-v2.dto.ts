import { IsString, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StrokeType, StrokeStatus, StrokeSeverity, StrokeTreatment } from '@prisma/client';

export class PatientInfoV2Dto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
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

  @IsString()
  originHospitalId!: string;

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

