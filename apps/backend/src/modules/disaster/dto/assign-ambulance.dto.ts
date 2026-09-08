import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TriageColorCode } from '@prisma/client';

export class AssignAmbulanceDto {
  @ApiProperty({ description: 'Ambulance ID to assign' })
  @IsNotEmpty()
  @IsUUID()
  ambulanceId!: string;

  @ApiPropertyOptional({
    enum: TriageColorCode,
    description: 'START triage category for MCI (RED, YELLOW, GREEN, BLACK)',
  })
  @IsOptional()
  @IsEnum(TriageColorCode)
  triageCategory?: TriageColorCode;
}
