import { PartialType } from '@nestjs/mapped-types';
import { CreateNeonatalTransferDto } from './create-neonatal-transfer.dto';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { NeonatalTransferStatus } from '@prisma/client';

export class UpdateNeonatalTransferDto extends PartialType(CreateNeonatalTransferDto) {
  @IsOptional()
  @IsEnum(NeonatalTransferStatus)
  status?: NeonatalTransferStatus;

  // Timeline timestamps (ISO strings) — set as the case advances
  @IsOptional()
  @IsDateString()
  activatedAt?: string;

  @IsOptional()
  @IsDateString()
  neonatologistConnectedAt?: string;

  @IsOptional()
  @IsDateString()
  decisionAt?: string;

  @IsOptional()
  @IsDateString()
  dispatchedAt?: string;

  @IsOptional()
  @IsDateString()
  departedAt?: string;

  @IsOptional()
  @IsDateString()
  arrivedAt?: string;

  @IsOptional()
  @IsDateString()
  closedAt?: string;
}
