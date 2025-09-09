import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsDateString, IsNumber, Min, Max, IsNotEmpty, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { TraumaModeOfArrival, TraumaMechanismOfInjury, TraumaDispositionType } from '@prisma/client';

export class VitalSignsDto {
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @IsOptional()
  @IsNumber()
  oxygenSaturation?: number;

  @IsOptional()
  @IsNumber()
  respiratoryRate?: number;
}

export class DispositionDto {
  @IsOptional()
  @IsString()
  dischargeInstructions?: string;

  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @IsOptional()
  @IsString()
  followUpDate?: string;

  @IsOptional()
  @IsString()
  medicationsPrescribed?: string;

  @IsOptional()
  @IsString()
  restrictions?: string;
}

export class PatientInfoDto {
  @IsOptional()
  @IsString()
  mrn?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  medications?: string;
}

export class CreateTraumaCaseDto {
  @IsOptional()
  @IsString()
  ticketId?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsString()
  @IsNotEmpty()
  originHospitalId!: string;

  @IsOptional()
  @IsString()
  destinationHospitalId?: string;

  // Date and Time Information
  @IsDateString()
  @IsNotEmpty()
  arrivalDateTime!: string;

  @IsOptional()
  @IsDateString()
  incidentDateTime?: string;

  @IsEnum(TraumaModeOfArrival)
  @IsNotEmpty()
  modeOfArrival!: TraumaModeOfArrival;

  @IsOptional()
  @IsDateString()
  transferRequestDateTime?: string;

  @IsOptional()
  @IsDateString()
  transferArrivalDateTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  transferDurationMinutes?: number;

  // Chief Complaint and Mechanism
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsEnum(TraumaMechanismOfInjury)
  @IsNotEmpty()
  mechanismOfInjury!: TraumaMechanismOfInjury;

  // Vital Signs
  @IsOptional()
  @ValidateNested()
  @Type(() => VitalSignsDto)
  vitalSigns?: VitalSignsDto;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(15)
  glasgowComaScale?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  systolicBloodPressure?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  respiratoryRate?: number;

  @IsOptional()
  @IsString()
  additionalVitalSigns?: string;

  // Injury Information - Body Regions
  headAndNeckInjury?: string;
  faceInjury?: string;
  chestInjury?: string;
  abdomenInjury?: string;
  extremitiesInjury?: string;
  externalInjury?: string;

  // Assessment and Disposition
  @IsOptional()
  @IsString()
  primarySurveyFindings?: string;

  @IsOptional()
  @IsEnum(TraumaDispositionType)
  edDisposition?: TraumaDispositionType;

  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DispositionDto)
  disposition?: DispositionDto;

  // Patient Information
  @IsOptional()
  @ValidateNested()
  @Type(() => PatientInfoDto)
  patientInfo?: PatientInfoDto;
}