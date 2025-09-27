import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { NotificationPriority, CaseType } from '@prisma/client';

export class CreateReplyDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority = NotificationPriority.MEDIUM;

  @IsUUID()
  caseNoteId!: string;

  @IsOptional()
  @IsUUID()
  parentReplyId?: string;

  @IsEnum(CaseType)
  caseType!: CaseType;

  @IsString()
  caseId!: string;

  @IsUUID()
  patientId!: string;

  @IsString()
  patientName!: string;

  @IsOptional()
  @IsString()
  ticketId?: string;

  @IsOptional()
  @IsString()
  metadata?: string;
}
