import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '@prisma/client';

export class CreateEmsAssignmentDto {
  @ApiProperty({ description: 'Ticket ID to assign', example: 'ticket-uuid' })
  @IsString()
  ticketId!: string;

  @ApiProperty({ description: 'Ambulance ID to assign', example: 'ambulance-uuid' })
  @IsString()
  ambulanceId!: string;

  @ApiProperty({ description: 'Driver ID to assign', example: 'driver-uuid' })
  @IsString()
  driverId!: string;

  @ApiProperty({ description: 'Assignment timestamp', example: '2024-02-15T08:30:00Z' })
  @IsDateString()
  assignedAt!: string;

  @ApiProperty({ enum: AssignmentStatus, description: 'Assignment status' })
  @IsEnum(AssignmentStatus)
  status!: AssignmentStatus;

  @ApiPropertyOptional({ description: 'Estimated arrival time', example: '2024-02-15T08:45:00Z' })
  @IsOptional()
  @IsDateString()
  estimatedArrivalTime?: string;

  @ApiPropertyOptional({ description: 'Actual arrival time', example: '2024-02-15T08:47:00Z' })
  @IsOptional()
  @IsDateString()
  actualArrivalTime?: string;

  @ApiPropertyOptional({ description: 'Journey start time', example: '2024-02-15T08:50:00Z' })
  @IsOptional()
  @IsDateString()
  journeyStartTime?: string;

  @ApiPropertyOptional({ description: 'Journey end time', example: '2024-02-15T09:30:00Z' })
  @IsOptional()
  @IsDateString()
  journeyEndTime?: string;

  @ApiPropertyOptional({ description: 'Total distance in kilometers', example: 15.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceKm?: number;

  @ApiPropertyOptional({ description: 'Assignment notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
