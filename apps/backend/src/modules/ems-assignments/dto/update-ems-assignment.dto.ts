import { IsOptional, IsEnum, IsDateString, IsNumber, Min, IsString, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '@prisma/client';

export class UpdateEmsAssignmentDto {
  @ApiPropertyOptional({ enum: AssignmentStatus, description: 'Assignment status' })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({ description: 'Estimated arrival time', example: '2024-02-15T08:45:00Z' })
  @IsOptional()
  @ValidateIf((o) => o.estimatedArrivalTime !== undefined && o.estimatedArrivalTime !== null)
  @IsDateString()
  estimatedArrivalTime?: string;

  @ApiPropertyOptional({ description: 'Actual arrival time', example: '2024-02-15T08:47:00Z' })
  @IsOptional()
  @ValidateIf((o) => o.actualArrivalTime !== undefined && o.actualArrivalTime !== null)
  @IsDateString()
  actualArrivalTime?: string;

  @ApiPropertyOptional({ description: 'Journey start time', example: '2024-02-15T08:50:00Z' })
  @IsOptional()
  @ValidateIf((o) => o.journeyStartTime !== undefined && o.journeyStartTime !== null)
  @IsDateString()
  journeyStartTime?: string;

  @ApiPropertyOptional({ description: 'Journey end time', example: '2024-02-15T09:30:00Z' })
  @IsOptional()
  @ValidateIf((o) => o.journeyEndTime !== undefined && o.journeyEndTime !== null)
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


