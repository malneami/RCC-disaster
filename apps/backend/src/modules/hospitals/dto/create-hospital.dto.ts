import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsLatitude, IsLongitude } from 'class-validator';
import { HospitalStatus, TraumaLevel } from '@prisma/client';

export class CreateHospitalDto {
  @ApiProperty({ description: 'Hospital name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Hospital address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Latitude coordinate', required: false })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiProperty({ description: 'Longitude coordinate', required: false })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  // ICU Beds
  @ApiProperty({ description: 'Total ICU beds', default: 0 })
  @IsOptional()
  @IsNumber()
  icuBeds?: number;

  @ApiProperty({ description: 'Available ICU beds', default: 0 })
  @IsOptional()
  @IsNumber()
  icuBedsAvailable?: number;

  // PICU Beds
  @ApiProperty({ description: 'Total PICU beds', default: 0 })
  @IsOptional()
  @IsNumber()
  picuBeds?: number;

  @ApiProperty({ description: 'Available PICU beds', default: 0 })
  @IsOptional()
  @IsNumber()
  picuBedsAvailable?: number;

  // Male/Female Beds
  @ApiProperty({ description: 'Total male beds', default: 0 })
  @IsOptional()
  @IsNumber()
  maleBeds?: number;

  @ApiProperty({ description: 'Available male beds', default: 0 })
  @IsOptional()
  @IsNumber()
  maleBedsAvailable?: number;

  @ApiProperty({ description: 'Total female beds', default: 0 })
  @IsOptional()
  @IsNumber()
  femaleBeds?: number;

  @ApiProperty({ description: 'Available female beds', default: 0 })
  @IsOptional()
  @IsNumber()
  femaleBedsAvailable?: number;

  // Pediatric Beds
  @ApiProperty({ description: 'Total pediatric beds', default: 0 })
  @IsOptional()
  @IsNumber()
  pediatricBeds?: number;

  @ApiProperty({ description: 'Available pediatric beds', default: 0 })
  @IsOptional()
  @IsNumber()
  pediatricBedsAvailable?: number;

  // Standard Beds
  @ApiProperty({ description: 'Total standard beds', default: 0 })
  @IsOptional()
  @IsNumber()
  standardBeds?: number;

  @ApiProperty({ description: 'Available standard beds', default: 0 })
  @IsOptional()
  @IsNumber()
  standardBedsAvailable?: number;

  // Services
  @ApiProperty({ description: 'Has STEMI service', default: false })
  @IsOptional()
  @IsBoolean()
  hasStemiService?: boolean;

  @ApiProperty({ description: 'Has stroke service', default: false })
  @IsOptional()
  @IsBoolean()
  hasStrokeService?: boolean;

  @ApiProperty({ description: 'Has trauma service', default: false })
  @IsOptional()
  @IsBoolean()
  hasTraumaService?: boolean;

  // Hospital Info
  @ApiProperty({ description: 'Hospital cluster', default: 'Jazan' })
  @IsOptional()
  @IsString()
  cluster?: string;

  @ApiProperty({ description: 'Hospital status', enum: HospitalStatus, default: HospitalStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(HospitalStatus)
  status?: HospitalStatus;

  @ApiProperty({ description: 'Contact phone number', required: false })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ description: 'Contact email', required: false })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  // Emergency Department
  @ApiProperty({ description: 'Emergency department status', default: 'available' })
  @IsOptional()
  @IsString()
  emergencyDeptStatus?: string;

  // NICU
  @ApiProperty({ description: 'Total NICU beds', default: 0 })
  @IsOptional()
  @IsNumber()
  nicuBeds?: number;

  @ApiProperty({ description: 'Available NICU beds', default: 0 })
  @IsOptional()
  @IsNumber()
  nicuBedsAvailable?: number;

  // Specialized Services
  @ApiProperty({ description: 'Has stroke unit', default: false })
  @IsOptional()
  @IsBoolean()
  hasStrokeUnit?: boolean;

  @ApiProperty({ description: 'Trauma level', enum: TraumaLevel, default: TraumaLevel.NONE })
  @IsOptional()
  @IsEnum(TraumaLevel)
  traumaLevel?: TraumaLevel;

  @ApiProperty({ description: 'Has cardiology center', default: false })
  @IsOptional()
  @IsBoolean()
  hasCardiologyCenter?: boolean;
}
