import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { MedicalRecordType } from '@prisma/client';

export class CreateMedicalRecordDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsUUID()
  patientId!: string;

  @ApiProperty({ 
    description: 'Type of medical record',
    enum: MedicalRecordType,
    example: 'CONSULTATION'
  })
  @IsEnum(MedicalRecordType)
  recordType!: MedicalRecordType;

  @ApiProperty({ description: 'Title of the medical record' })
  @IsString()
  title!: string;

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

  @ApiPropertyOptional({ description: 'File attachments' })
  @IsOptional()
  @IsString()
  attachments?: string;

  @ApiProperty({ description: 'Date of the medical record' })
  @IsDateString()
  recordDate!: string;
}
