import { IsEnum, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisasterCommandDecisionAction } from '@prisma/client';

export class LogCommandDecisionDto {
  @ApiProperty({
    enum: DisasterCommandDecisionAction,
    description: 'Decision action type',
  })
  @IsNotEmpty()
  @IsEnum(DisasterCommandDecisionAction)
  action!: DisasterCommandDecisionAction;

  @ApiPropertyOptional({
    description: 'Custom details for CUSTOM action (JSON object)',
  })
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}
