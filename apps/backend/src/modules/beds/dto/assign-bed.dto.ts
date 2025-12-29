import { IsUUID, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CaseType } from '@prisma/client';

export class AssignBedDto {
  @ApiProperty({ description: 'Patient ID to assign to the bed' })
  @IsUUID()
  patientId!: string;

  @ApiPropertyOptional({ description: 'Related case ID (trauma, stroke, or stemi case)' })
  @IsOptional()
  @IsUUID()
  caseId?: string;

  @ApiPropertyOptional({ 
    description: 'Type of case',
    enum: CaseType,
    example: CaseType.TRAUMA
  })
  @IsOptional()
  @IsEnum(CaseType)
  caseType?: CaseType;

  @ApiPropertyOptional({ 
    description: 'Date/time when patient will arrive at the bed (ISO 8601 format)',
    example: '2025-12-29T10:30:00Z'
  })
  @IsOptional()
  @IsDateString()
  arrivalDate?: string;
}
