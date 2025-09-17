import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min, Max, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AmbulanceType, AmbulanceStatus, EquipmentStatus } from '@prisma/client';

export class CreateAmbulanceDto {
  @ApiProperty({ 
    description: 'GPS device IMEI (15-digit number)', 
    example: '123456789012345',
    minLength: 15,
    maxLength: 15
  })
  @IsString()
  @Length(15, 15, { message: 'IMEI must be exactly 15 digits' })
  vehicleImei!: string;

  @ApiProperty({ description: 'Radio call sign', example: 'Alpha-1' })
  @IsString()
  callSign!: string;

  @ApiProperty({ description: 'License plate number', example: 'ABC-123' })
  @IsString()
  plateNumber!: string;

  @ApiProperty({ description: 'Vehicle model', example: 'Mercedes Sprinter' })
  @IsString()
  model!: string;

  @ApiProperty({ description: 'Manufacturing year', example: 2023 })
  @IsNumber()
  year!: number;

  @ApiProperty({ enum: AmbulanceType, description: 'Type of ambulance' })
  @IsEnum(AmbulanceType)
  type!: AmbulanceType;

  @ApiPropertyOptional({ description: 'Vehicle manufacturer', example: 'Mercedes-Benz' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Vehicle Identification Number' })
  @IsOptional()
  @IsString()
  vin?: string;

  @ApiProperty({ description: 'Home base station', example: 'Jazan Central Station' })
  @IsString()
  baseStation!: string;

  @ApiProperty({ enum: AmbulanceStatus, description: 'Current operational status' })
  @IsEnum(AmbulanceStatus)
  status!: AmbulanceStatus;

  @ApiPropertyOptional({ description: 'Current latitude coordinate' })
  @IsOptional()
  @IsNumber()
  currentLocationLat?: number;

  @ApiPropertyOptional({ description: 'Current longitude coordinate' })
  @IsOptional()
  @IsNumber()
  currentLocationLng?: number;

  @ApiPropertyOptional({ description: 'Human-readable current address' })
  @IsOptional()
  @IsString()
  currentLocationAddress?: string;

  @ApiPropertyOptional({ description: 'Driver name' })
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional({ description: 'Driver phone number' })
  @IsOptional()
  @IsString()
  driverPhone?: string;

  @ApiPropertyOptional({ description: 'Driver user ID' })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiProperty({ enum: EquipmentStatus, description: 'Equipment operational status' })
  @IsEnum(EquipmentStatus)
  equipmentStatus!: EquipmentStatus;


  @ApiProperty({ description: 'Whether ambulance is active', default: true })
  @IsBoolean()
  isActive: boolean = true;
}
