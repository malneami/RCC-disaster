import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, IsUUID } from 'class-validator';
import { NotificationType, NotificationPriority, CaseType, DeliveryMethod } from '@prisma/client';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsEnum(NotificationPriority)
  priority!: NotificationPriority;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsEnum(CaseType)
  caseType!: CaseType;

  @IsString()
  caseId!: string;

  @IsOptional()
  @IsString()
  ticketId?: string;

  @IsString()
  patientId!: string;

  @IsString()
  patientName!: string;

  @IsOptional()
  @IsString()
  metadata?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipientUserIds?: string[];

  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;
}

export class CreateCaseNoteDto {
  @IsString()
  content!: string;

  @IsEnum(NotificationPriority)
  priority!: NotificationPriority;

  @IsEnum(CaseType)
  caseType!: CaseType;

  @IsString()
  caseId!: string;

  @IsOptional()
  @IsString()
  ticketId?: string;

  @IsString()
  patientId!: string;

  @IsString()
  patientName!: string;

  @IsBoolean()
  notifyTeam!: boolean;

  @IsOptional()
  @IsString()
  metadata?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipientUserIds?: string[];

  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;
}

export class NotificationFilterDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsEnum(CaseType)
  caseType?: CaseType;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  caseId?: string;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class MarkNotificationReadDto {
  @IsArray()
  @IsString({ each: true })
  notificationIds!: string[];
}

export class NotificationRecipientDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;
}
