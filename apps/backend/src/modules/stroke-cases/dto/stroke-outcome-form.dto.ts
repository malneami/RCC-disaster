import { IsOptional, IsString, IsInt, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class StrokeOutcomeFormDto {
  @IsOptional()
  @IsString()
  dischargeType?: string; // PLANNED, UNPLANNED, AGAINST_MEDICAL_ADVICE, etc.

  @IsOptional()
  @IsDateString()
  dischargeDate?: string;

  @IsOptional()
  @IsString()
  followUpNotCompletedReason?: string;

  @IsOptional()
  @IsString()
  followUpSpecify?: string;

  @IsOptional()
  @IsString()
  followUpType?: string; // PHONE, IN_PERSON, TELEHEALTH, etc.

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dischargeModifiedRankinScale?: number; // 0-6 scale

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  followUpModifiedRankinScale?: number; // 0-6 scale

  @IsOptional()
  @IsString()
  closureReport?: string;

  @IsOptional()
  @IsString()
  functionalStatus?: string; // INDEPENDENT, ASSISTANCE_REQUIRED, DEPENDENT, etc.

  @IsOptional()
  @IsString()
  mortality?: string; // ALIVE, DEAD, UNKNOWN

  @IsOptional()
  @IsBoolean()
  threeMonthFollowupComplete?: boolean;

  @IsOptional()
  @IsBoolean()
  outcomeFormCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  outcomeFormCompletionDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  outcomePercentageCompleteness?: number;
}

export class UpdateStrokeOutcomeFormDto {
  @IsOptional()
  @IsString()
  dischargeType?: string;

  @IsOptional()
  @IsDateString()
  dischargeDate?: string;

  @IsOptional()
  @IsString()
  followUpNotCompletedReason?: string;

  @IsOptional()
  @IsString()
  followUpSpecify?: string;

  @IsOptional()
  @IsString()
  followUpType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dischargeModifiedRankinScale?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  followUpModifiedRankinScale?: number;

  @IsOptional()
  @IsString()
  closureReport?: string;

  @IsOptional()
  @IsString()
  functionalStatus?: string;

  @IsOptional()
  @IsString()
  mortality?: string;

  @IsOptional()
  @IsBoolean()
  threeMonthFollowupComplete?: boolean;

  @IsOptional()
  @IsBoolean()
  outcomeFormCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  outcomeFormCompletionDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  outcomePercentageCompleteness?: number;
}
