import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BedStatus } from '@prisma/client';

export class GetBedsDto {
  @ApiPropertyOptional({ description: 'Filter by hospital ID (admin only)' })
  @IsOptional()
  @IsUUID()
  hospitalId?: string;

  @ApiPropertyOptional({ description: 'Filter by unit ID' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by bed status',
    enum: BedStatus 
  })
  @IsOptional()
  @IsEnum(BedStatus)
  status?: BedStatus;
}

