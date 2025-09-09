import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGpsLogDto {
  @ApiProperty({ description: 'Ambulance ID', example: 'ambulance-uuid' })
  @IsString()
  ambulanceId!: string;

  @ApiProperty({ description: 'Latitude coordinate', example: 16.8892 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ description: 'Longitude coordinate', example: 42.5511 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ description: 'Speed in km/h', example: 65.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;

  @ApiPropertyOptional({ description: 'Direction in degrees (0-360)', example: 180 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  direction?: number;

  @ApiProperty({ description: 'GPS timestamp', example: '2024-02-15T08:30:00Z' })
  @IsString()
  timestamp!: string;

  @ApiPropertyOptional({ description: 'Fuel level percentage (0-100)', example: 85.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fuelLevel?: number;

  @ApiPropertyOptional({ description: 'Engine status (on/off)', example: true })
  @IsOptional()
  @IsBoolean()
  engineStatus?: boolean;

  @ApiPropertyOptional({ description: 'Reverse geocoded address' })
  @IsOptional()
  @IsString()
  locationAddress?: string;

  @ApiPropertyOptional({ description: 'GPS accuracy in meters', example: 3.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;
}
