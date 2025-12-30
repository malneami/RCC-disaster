import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString, IsUUID, ValidateNested, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { TicketPriority, TicketStatus, TicketPathway } from '@prisma/client';
import { VitalsDto, DiagnosticsDto, RequiredResourcesDto } from './create-ticket.dto';
import { AssignBedDto } from '../../beds/dto/assign-bed.dto';

export class UpdateTicketDto {
  @IsOptional()
  @IsUUID()
  originHospitalId?: string;

  @IsOptional()
  @IsUUID()
  destinationHospitalId?: string;

  @IsOptional()
  @IsEnum(['MEDIUM', 'CRITICAL', 'EMERGENCY'])
  priority?: 'MEDIUM' | 'CRITICAL' | 'EMERGENCY';

  @IsOptional()
  @IsEnum(TicketPathway)
  pathway?: TicketPathway;

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
  @IsDateString()
  actualArrival?: string;

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
  bedAssignment?: AssignBedDto; 
}

export class UpdateTicketStatusDto {
  @IsNotEmpty()
  @IsEnum(TicketStatus)
  status!: TicketStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignTicketDto {
  @IsNotEmpty()
  @IsUUID()
  assignedToId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
