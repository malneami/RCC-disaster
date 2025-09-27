import { PartialType } from '@nestjs/mapped-types';
import { CreateReplyDto } from './create-reply.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateReplyDto extends PartialType(CreateReplyDto) {
  @IsOptional()
  @IsString()
  content?: string;
}
