import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsDateString, IsUUID, IsArray, ValidateNested, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { TicketPriority, TicketStatus, TicketPathway } from '@prisma/client';

export class VitalsDto {
  @IsOptional()
  @IsNumber()
  bloodPressure?: number;

  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  oxygenSaturation?: number;

  @IsOptional()
  @IsNumber()
  respiratoryRate?: number;
}


export class DiagnosticsDto {
  @IsOptional()
  @IsString()
  ecg?: string;

  @IsOptional()
  @IsString()
  labResults?: string;

  @IsOptional()
  @IsString()
  ctScan?: string;

  @IsOptional()
  @IsString()
  otherTests?: string;
}

export class RequiredResourcesDto {
  @IsOptional()
  @IsBoolean()
  icu?: boolean;

  @IsOptional()
  @IsBoolean()
  ventilator?: boolean;

  @IsOptional()
  @IsBoolean()
  cardiology?: boolean;

  @IsOptional()
  @IsBoolean()
  neurology?: boolean;

  @IsOptional()
  @IsBoolean()
  trauma?: boolean;

  @IsOptional()
  @IsBoolean()
  nicu?: boolean;

  @IsOptional()
  @IsBoolean()
  picu?: boolean;
}

export class BedAssignmentDto {
  @IsOptional()
  @IsUUID()
  hospitalId?: string;

  @IsOptional()
  @IsEnum(['origin', 'destination'])
  hospitalType?: 'origin' | 'destination';

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsUUID()
  bedId?: string;

  @IsOptional()
  @IsString()
  bedNumber?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  arrivalDate?: string;
}

export class CreateTicketDto {
  @IsNotEmpty()
  @IsUUID()
  patientId!: string;

  @IsNotEmpty()
  @IsUUID()
  originHospitalId!: string;

  @IsOptional()
  @IsUUID()
  destinationHospitalId?: string;

  @IsNotEmpty()
  @IsEnum(['MEDIUM', 'CRITICAL', 'EMERGENCY'])
  priority!: 'MEDIUM' | 'CRITICAL' | 'EMERGENCY';

  @IsNotEmpty()
  @IsEnum(TicketPathway)
  pathway!: TicketPathway;

  @IsOptional()
  @IsDateString()
  triageTime?: string;

  @IsOptional()
  @IsDateString()
  symptomOnsetTime?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => VitalsDto)
  vitals?: VitalsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DiagnosticsDto)
  diagnostics?: DiagnosticsDto;

  @IsOptional()
  @IsString()
  treatmentPlan?: string;

  @IsOptional()
  @IsDateString()
  emsContactTime?: string;

  @IsOptional()
  @IsString()
  transportMode?: string;

  @IsOptional()
  @IsString()
  emsUnit?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isEmergency?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresBlood?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresSpecialist?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => RequiredResourcesDto)
  requiredResources?: RequiredResourcesDto;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BedAssignmentDto)
  bedAssignment?: BedAssignmentDto;
}
