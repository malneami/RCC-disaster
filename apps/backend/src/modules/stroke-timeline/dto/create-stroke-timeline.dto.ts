import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsDateString, Min, Max, IsNotEmpty } from 'class-validator';
import { StrokeStatus, StrokeEventType } from '@prisma/client';

export class CreateStrokeTimelineDto {
  @IsString()
  @IsNotEmpty()
  strokeCaseId!: string;

  @IsString()
  @IsNotEmpty()
  ticketId!: string;

  // Status Tracking
  @IsOptional()
  @IsEnum(StrokeStatus)
  fromStatus?: StrokeStatus;

  @IsEnum(StrokeStatus)
  @IsNotEmpty()
  toStatus!: StrokeStatus;

  // Event Details
  @IsDateString()
  @IsNotEmpty()
  eventTimestamp!: string;

  @IsString()
  @IsNotEmpty()
  eventDescription!: string;

  @IsOptional()
  @IsString()
  eventLocation?: string; // ED, CT_SUITE, ANGIO_SUITE, STROKE_UNIT

  @IsEnum(StrokeEventType)
  @IsNotEmpty()
  eventType!: StrokeEventType;

  @IsString()
  @IsNotEmpty()
  triggeredBy!: string;

  // Timing Metrics
  @IsOptional()
  @IsInt()
  @Min(0)
  minutesFromSymptom?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minutesFromAdmission?: number;

  @IsOptional()
  @IsBoolean()
  withinTarget?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetMinutes?: number;

  // Clinical Context
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(42)
  nihssAtSession?: number;

  @IsOptional()
  @IsString()
  clinicalNotes?: string;
}

export class UpdateStrokeTimelineDto extends CreateStrokeTimelineDto {
  // All fields are optional for updates
}
