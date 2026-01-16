import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { MedicalRecordType } from '@prisma/client';

export class UpdateMedicalRecordDto {
  @ApiPropertyOptional({ description: 'Patient ID' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({
    description: 'Type of medical record',
    enum: MedicalRecordType
  })
  @IsOptional()
  @IsEnum(MedicalRecordType)
  recordType?: MedicalRecordType;

  @ApiPropertyOptional({ description: 'Title of the medical record' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Description of the medical record' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Diagnosis information' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Treatment information' })
  @IsOptional()
  @IsString()
  treatment?: string;

  @ApiPropertyOptional({ description: 'Medications prescribed' })
  @IsOptional()
  @IsString()
  medications?: string;

  @ApiPropertyOptional({ description: 'Test results' })
  @IsOptional()
  @IsString()
  testResults?: string;

  @ApiPropertyOptional({ description: 'Date of the medical record' })
  @IsOptional()
  @IsDateString()
  recordDate?: string;
}
