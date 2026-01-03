import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AmbulanceStatus, AmbulanceType, EquipmentStatus } from '@prisma/client';

export class AmbulanceFilterDto {
  @ApiPropertyOptional({ enum: AmbulanceStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(AmbulanceStatus)
  status?: AmbulanceStatus;

  @ApiPropertyOptional({ enum: AmbulanceType, description: 'Filter by type' })
  @IsOptional()
  @IsEnum(AmbulanceType)
  type?: AmbulanceType;

  @ApiPropertyOptional({ enum: EquipmentStatus, description: 'Filter by equipment status' })
  @IsOptional()
  @IsEnum(EquipmentStatus)
  equipmentStatus?: EquipmentStatus;

  @ApiPropertyOptional({ description: 'Filter by base station' })
  @IsOptional()
  @IsString()
  baseStation?: string;

  @ApiPropertyOptional({ description: 'Filter by driver ID' })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search by call sign or plate number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number (default: 1)' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page (default: 10)' })
  @IsOptional()
  limit?: number;
}


