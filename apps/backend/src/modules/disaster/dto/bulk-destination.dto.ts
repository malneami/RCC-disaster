import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TriageColorCode } from '@prisma/client';

export class BulkDestinationDto {
  @ApiProperty({ enum: TriageColorCode, description: 'Triage category (RED, YELLOW, GREEN, BLACK)' })
  @IsNotEmpty()
  @IsEnum(TriageColorCode)
  triageCategory!: TriageColorCode;

  @ApiProperty({ description: 'Destination hospital ID' })
  @IsNotEmpty()
  @IsUUID()
  hospitalId!: string;
}
