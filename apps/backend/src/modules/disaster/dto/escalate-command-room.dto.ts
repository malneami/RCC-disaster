import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DisasterEscalationLevel } from '@prisma/client';

export class EscalateCommandRoomDto {
  @ApiProperty({
    enum: DisasterEscalationLevel,
    description: 'New escalation level',
  })
  @IsNotEmpty()
  @IsEnum(DisasterEscalationLevel)
  escalationLevel!: DisasterEscalationLevel;
}
