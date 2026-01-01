import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupportMessageDto {
  @ApiProperty({ description: 'Message content', example: 'I have tried restarting the application but the issue persists.' })
  @IsString()
  content!: string;
}

