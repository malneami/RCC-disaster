import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateHospitalCapacityDto {
  // ICU Beds
  @ApiProperty({ description: 'Total ICU beds', required: false })
  @IsOptional()
  @IsNumber()
  icuBeds?: number;

  @ApiProperty({ description: 'Available ICU beds', required: false })
  @IsOptional()
  @IsNumber()
  icuBedsAvailable?: number;

  // PICU Beds
  @ApiProperty({ description: 'Total PICU beds', required: false })
  @IsOptional()
  @IsNumber()
  picuBeds?: number;

  @ApiProperty({ description: 'Available PICU beds', required: false })
  @IsOptional()
  @IsNumber()
  picuBedsAvailable?: number;

  // Male/Female Beds
  @ApiProperty({ description: 'Total male beds', required: false })
  @IsOptional()
  @IsNumber()
  maleBeds?: number;

  @ApiProperty({ description: 'Available male beds', required: false })
  @IsOptional()
  @IsNumber()
  maleBedsAvailable?: number;

  @ApiProperty({ description: 'Total female beds', required: false })
  @IsOptional()
  @IsNumber()
  femaleBeds?: number;

  @ApiProperty({ description: 'Available female beds', required: false })
  @IsOptional()
  @IsNumber()
  femaleBedsAvailable?: number;

  // Pediatric Beds
  @ApiProperty({ description: 'Total pediatric beds', required: false })
  @IsOptional()
  @IsNumber()
  pediatricBeds?: number;

  @ApiProperty({ description: 'Available pediatric beds', required: false })
  @IsOptional()
  @IsNumber()
  pediatricBedsAvailable?: number;

  // Standard Beds
  @ApiProperty({ description: 'Total standard beds', required: false })
  @IsOptional()
  @IsNumber()
  standardBeds?: number;

  @ApiProperty({ description: 'Available standard beds', required: false })
  @IsOptional()
  @IsNumber()
  standardBedsAvailable?: number;

  // NICU
  @ApiProperty({ description: 'Total NICU beds', required: false })
  @IsOptional()
  @IsNumber()
  nicuBeds?: number;

  @ApiProperty({ description: 'Available NICU beds', required: false })
  @IsOptional()
  @IsNumber()
  nicuBedsAvailable?: number;

  // Services
  @ApiProperty({ description: 'Has STEMI service', required: false })
  @IsOptional()
  @IsBoolean()
  hasStemiService?: boolean;

  @ApiProperty({ description: 'Has Stroke service', required: false })
  @IsOptional()
  @IsBoolean()
  hasStrokeService?: boolean;

  @ApiProperty({ description: 'Has Trauma service', required: false })
  @IsOptional()
  @IsBoolean()
  hasTraumaService?: boolean;

  @ApiProperty({ description: 'Has Stroke Unit', required: false })
  @IsOptional()
  @IsBoolean()
  hasStrokeUnit?: boolean;

  @ApiProperty({ description: 'Has Cardiology Center', required: false })
  @IsOptional()
  @IsBoolean()
  hasCardiologyCenter?: boolean;
}
