import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '@prisma/client';

export class AssignmentFilterDto {
  @ApiPropertyOptional({ enum: AssignmentStatus, description: 'Filter by assignment status' })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({ description: 'Filter by ticket ID' })
  @IsOptional()
  @IsString()
  ticketId?: string;

  @ApiPropertyOptional({ description: 'Filter by ambulance ID' })
  @IsOptional()
  @IsString()
  ambulanceId?: string;

  @ApiPropertyOptional({ description: 'Filter by driver ID' })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Filter by assignment date (from)', example: '2024-02-15' })
  @IsOptional()
  @IsDateString()
  assignedFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by assignment date (to)', example: '2024-02-16' })
  @IsOptional()
  @IsDateString()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Search by ticket number, ambulance call sign, or driver name' })
  @IsOptional()
  @IsString()
  search?: string;
}


