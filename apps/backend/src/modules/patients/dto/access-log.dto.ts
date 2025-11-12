import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum AccessType {
  VIEW = 'VIEW',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  SEARCH = 'SEARCH',
}

export enum AccessMethod {
  API = 'API',
  WEB = 'WEB',
  MOBILE = 'MOBILE',
}

export class CreateAccessLogDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsUUID()
  patientId!: string;

  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: AccessType, description: 'Type of access' })
  @IsEnum(AccessType)
  accessType!: AccessType;

  @ApiProperty({ enum: AccessMethod, description: 'Method of access', default: AccessMethod.API })
  @IsEnum(AccessMethod)
  @IsOptional()
  accessMethod?: AccessMethod;

  @ApiPropertyOptional({ description: 'IP Address' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User Agent' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Reason for access' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateAccessLogDto {
  @ApiPropertyOptional({ enum: AccessType, description: 'Type of access' })
  @IsEnum(AccessType)
  @IsOptional()
  accessType?: AccessType;

  @ApiPropertyOptional({ enum: AccessMethod, description: 'Method of access' })
  @IsEnum(AccessMethod)
  @IsOptional()
  accessMethod?: AccessMethod;

  @ApiPropertyOptional({ description: 'IP Address' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User Agent' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Reason for access' })
  @IsString()
  @IsOptional()
  reason?: string;
}

