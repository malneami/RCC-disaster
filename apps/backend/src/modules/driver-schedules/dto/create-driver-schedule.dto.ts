import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftType, ScheduleStatus } from '@prisma/client';

export class CreateDriverScheduleDto {
  @ApiProperty({ description: 'Driver ID', example: 'driver-uuid' })
  @IsString()
  driverId!: string;

  @ApiProperty({ description: 'Ambulance ID', example: 'ambulance-uuid' })
  @IsString()
  ambulanceId!: string;

  @ApiProperty({ description: 'Shift start time', example: '2024-02-15T06:00:00Z' })
  @IsDateString()
  shiftStart!: string;

  @ApiProperty({ description: 'Shift end time', example: '2024-02-15T18:00:00Z' })
  @IsDateString()
  shiftEnd!: string;

  @ApiProperty({ enum: ShiftType, description: 'Type of shift' })
  @IsEnum(ShiftType)
  shiftType!: ShiftType;

  @ApiProperty({ enum: ScheduleStatus, description: 'Schedule status' })
  @IsEnum(ScheduleStatus)
  status!: ScheduleStatus;

  @ApiPropertyOptional({ description: 'Break start time', example: '2024-02-15T12:00:00Z' })
  @IsOptional()
  @IsDateString()
  breakStart?: string;

  @ApiPropertyOptional({ description: 'Break end time', example: '2024-02-15T13:00:00Z' })
  @IsOptional()
  @IsDateString()
  breakEnd?: string;

  @ApiPropertyOptional({ description: 'Overtime hours', example: 2.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeHours?: number;

  @ApiPropertyOptional({ description: 'Schedule notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
