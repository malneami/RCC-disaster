import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BedStatus } from '@prisma/client';

export class UpdateBedStatusDto {
  @ApiProperty({
    description: 'New bed status',
    enum: BedStatus,
  })
  @IsEnum(BedStatus)
  status!: BedStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

