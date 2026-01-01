import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SupportTicketStatus } from '@prisma/client';

export class UpdateTicketStatusDto {
  @ApiProperty({
    description: 'New ticket status',
    enum: SupportTicketStatus,
    example: SupportTicketStatus.IN_PROGRESS,
  })
  @IsEnum(SupportTicketStatus)
  status!: SupportTicketStatus;
}

