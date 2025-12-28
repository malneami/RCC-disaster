import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBedDto {
  @ApiProperty({ description: 'Unit ID where the bed will be created' })
  @IsUUID()
  unitId!: string;

  @ApiProperty({ description: 'Bed number (e.g., "ICU-01", "PICU-02")' })
  @IsString()
  bedNumber!: string;

  @ApiPropertyOptional({ description: 'Location of the bed (optional)' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Additional notes about the bed (optional)' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Whether the bed is operational (default: true)', default: true })
  @IsOptional()
  @IsBoolean()
  isOperational?: boolean;
}

