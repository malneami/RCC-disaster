import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsOptional, IsUUID, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { MedicalRecordType } from '@prisma/client';

export class CreateMedicalRecordAttachmentDto {
  @ApiProperty({ description: 'File name' })
  @IsString()
  fileName!: string;

  @ApiProperty({ description: 'MIME type' })
  @IsString()
  mimeType!: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  fileSize!: number;

  @ApiProperty({ description: 'Base64 encoded file data' })
  @IsString()
  fileData!: string;
}

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

  @ApiPropertyOptional({ description: 'Attachments to create with the record', type: [CreateMedicalRecordAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMedicalRecordAttachmentDto)
  attachments?: CreateMedicalRecordAttachmentDto[];

  @ApiProperty({ description: 'Date of the medical record' })
  @IsDateString()
  recordDate!: string;
}
