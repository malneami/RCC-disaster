import { IsEnum, IsOptional, IsNumber, IsString, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisasterIncidentType, DisasterScope, TriageColorCode } from '@prisma/client';

export class CreateDisasterIncidentDto {
  @ApiProperty({ enum: DisasterScope })
  @IsEnum(DisasterScope)
  disasterScope!: DisasterScope;

  @ApiProperty({ enum: DisasterIncidentType })
  @IsEnum(DisasterIncidentType)
  incidentType!: DisasterIncidentType;

  @ApiPropertyOptional({ enum: TriageColorCode, description: 'Required for RTA_MCI' })
  @IsOptional()
  @IsEnum(TriageColorCode)
  colorCode?: TriageColorCode;

  @ApiProperty({ example: 16.8905 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  locationLat!: number;

  @ApiProperty({ example: 42.5514 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  locationLng!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationDescription?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedGreen?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedYellow?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedRed?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedBlack?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  estimatedETA?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
