import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupportTicketCategory } from '@prisma/client';

export class CreateSupportTicketDto {
  @ApiProperty({ description: 'Issue description', example: 'Unable to login to the system' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({
    description: 'Ticket category',
    enum: SupportTicketCategory,
    example: SupportTicketCategory.TECHNICAL_ISSUE,
  })
  @IsOptional()
  @IsEnum(SupportTicketCategory)
  category?: SupportTicketCategory;
}

