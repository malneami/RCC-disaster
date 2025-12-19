import { IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { TicketPriority, TicketStatus } from '@prisma/client';

export class TicketFilterDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  pathway?: string;

  @IsOptional()
  @IsUUID()
  originHospitalId?: string;

  @IsOptional()
  @IsUUID()
  destinationHospitalId?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'priority', 'status'])
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  emsStatus?: string; 
}
