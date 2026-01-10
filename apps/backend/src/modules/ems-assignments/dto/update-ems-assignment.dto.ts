import { IsOptional, IsEnum, IsDateString, IsNumber, Min, IsString, ValidateIf, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '@prisma/client';

export class UpdateEmsAssignmentDto {
  @ApiPropertyOptional({ description: 'Origin Hospital ID', example: 'hospital-uuid' })
  @IsOptional()
  @IsUUID()
  originHospitalId?: string;

  @ApiPropertyOptional({ description: 'Destination Hospital ID', example: 'hospital-uuid' })
  @IsOptional()
  @IsUUID()
  destinationHospitalId?: string;

  @ApiPropertyOptional({ description: 'Ambulance ID to assign', example: 'ambulance-uuid' })
  @IsOptional()
  @IsUUID()
  ambulanceId?: string;

  @ApiPropertyOptional({ description: 'Driver ID to assign', example: 'driver-uuid' })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional({ enum: AssignmentStatus, description: 'Assignment status' })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({ description: 'Assignment time', example: '2024-02-15T08:40:00Z' })
  @IsOptional()
  @ValidateIf((o) => o.assignedAt !== undefined && o.assignedAt !== null)
  @IsDateString()
  assignedAt?: string;

  @ApiPropertyOptional({ description: 'EMS contact time', example: '2024-02-15T08:45:00Z' })
  @IsOptional()
  @ValidateIf((o) => o.emsContactTime !== undefined && o.emsContactTime !== null)
  @IsDateString()
  emsContactTime?: string;

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


