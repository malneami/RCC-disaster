import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TriageColorCode } from '@prisma/client';

export class UpdateTriageCategoryDto {
  @ApiProperty({
    enum: TriageColorCode,
    description: 'Triage category (RED, YELLOW, GREEN, BLACK)',
  })
  @IsNotEmpty()
  @IsEnum(TriageColorCode)
  triageCategory!: TriageColorCode;
}
