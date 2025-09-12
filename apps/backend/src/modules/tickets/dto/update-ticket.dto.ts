import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString, IsUUID, ValidateNested, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { TicketPriority, TicketStatus, TicketPathway } from '@prisma/client';
import { VitalsDto, SymptomsDto, DiagnosticsDto, RequiredResourcesDto } from './create-ticket.dto';

export class UpdateTicketDto {
  @IsOptional()
  @IsUUID()
  destinationHospitalId?: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsEnum(TicketPathway)
  pathway?: TicketPathway;

  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SymptomsDto)
  symptoms?: SymptomsDto;

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
