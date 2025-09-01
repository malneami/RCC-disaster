import { IsString, IsEnum, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CriticalCaseType, CriticalCaseSeverity, CriticalCaseStatus } from '@prisma/client';

export class CreateCriticalCaseDto {
  @ApiProperty({ description: 'Patient name' })
  @IsString()
  @IsNotEmpty()
  patientName!: string;

  @ApiProperty({ description: 'Type of critical case', enum: CriticalCaseType })
  @IsEnum(CriticalCaseType)
  caseType!: CriticalCaseType;

  @ApiProperty({ description: 'Severity level', enum: CriticalCaseSeverity })
  @IsEnum(CriticalCaseSeverity)
  severity!: CriticalCaseSeverity;

  @ApiProperty({ description: 'Case status', enum: CriticalCaseStatus })
  @IsEnum(CriticalCaseStatus)
  @IsOptional()
  status?: CriticalCaseStatus;

  @ApiProperty({ description: 'Start time of the case' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ description: 'Case description' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Hospital ID' })
  @IsString()
  @IsNotEmpty()
  hospitalId!: string;
}

export class UpdateCriticalCaseDto {
  @ApiProperty({ description: 'Patient name' })
  @IsString()
  @IsOptional()
  patientName?: string;

  @ApiProperty({ description: 'Type of critical case', enum: CriticalCaseType })
  @IsEnum(CriticalCaseType)
  @IsOptional()
  caseType?: CriticalCaseType;

  @ApiProperty({ description: 'Severity level', enum: CriticalCaseSeverity })
  @IsEnum(CriticalCaseSeverity)
  @IsOptional()
  severity?: CriticalCaseSeverity;

  @ApiProperty({ description: 'Case status', enum: CriticalCaseStatus })
  @IsEnum(CriticalCaseStatus)
  @IsOptional()
  status?: CriticalCaseStatus;

  @ApiProperty({ description: 'Start time of the case' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ description: 'Case description' })
  @IsString()
  @IsOptional()
  description?: string;
}
