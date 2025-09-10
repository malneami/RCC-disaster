import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AssignmentStatus } from '@prisma/client';

export class UpdateEMSStatusDto {
  @IsEnum(AssignmentStatus)
  emsStatus!: AssignmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

