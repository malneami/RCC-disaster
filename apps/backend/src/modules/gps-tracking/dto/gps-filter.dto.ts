import { IsOptional, IsString, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GpsFilterDto {
  @ApiPropertyOptional({ description: 'Filter by ambulance ID' })
  @IsOptional()
  @IsString()
  ambulanceId?: string;

  @ApiPropertyOptional({ description: 'Filter by date (from)', example: '2024-02-15' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter by date (to)', example: '2024-02-16' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Minimum speed filter (km/h)', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSpeed?: number;

  @ApiPropertyOptional({ description: 'Maximum speed filter (km/h)', example: 120 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSpeed?: number;

  @ApiPropertyOptional({ description: 'Limit number of results', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 100;
}


