import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsDateString, Min, Max } from 'class-validator';
import { StrokeType, StrokeSeverity, StrokeStatus, StrokeTreatment } from '@prisma/client';

export class UpdateStrokeCaseV2Dto {
  // All fields are optional for updates - no required fields

  @IsOptional()
  @IsEnum(StrokeStatus)
  currentStatus?: StrokeStatus;

  @IsOptional()
  @IsEnum(StrokeSeverity)
  strokeSeverity?: StrokeSeverity;

  @IsOptional()
  @IsEnum(StrokeTreatment)
  selectedTreatment?: StrokeTreatment;

  // Clinical Assessments
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(42)
  nihssBaseline?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(42)
  nihss24hr?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(42)
  nihssDischarge?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  mrsBaseline?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  mrs90day?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  barthelBaseline?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  barthelDischarge?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  aspectsScore?: number;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(15)
  gcsBaseline?: number;

  // Symptom & Presentation
  @IsOptional()
  @IsString()
  presentingSymptoms?: string;

  @IsOptional()
  @IsDateString()
  symptomOnset?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  symptomToHospitalMinutes?: number;

  @IsOptional()
  @IsDateString()
  lastKnownWell?: string;

  @IsOptional()
  @IsBoolean()
  wakeUpStroke?: boolean;

  // Treatment Details
  @IsOptional()
  @IsBoolean()
  eligibleForThrombolysis?: boolean;

  @IsOptional()
  @IsString()
  thrombolysisContraindications?: string;

  @IsOptional()
  @IsBoolean()
  eligibleForThrombectomy?: boolean;

  @IsOptional()
  @IsString()
  thrombectomyContraindications?: string;

  // Pathway Timings
  @IsOptional()
  @IsDateString()
  pathwayStarted?: string;

  @IsOptional()
  @IsDateString()
  pathwayCompleted?: string;

  @IsOptional()
  @IsDateString()
  strokeUnitAdmissionTime?: string;

  // Key Performance Timings (minutes)
  @IsOptional()
  @IsInt()
  @Min(0)
  doorToImagingMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  doorToNeedleMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  doorToGroinMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  symptomNeedleMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  symptomGroinMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  imagingToNeedleMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  imagingToGroinMinutes?: number;

  // Clinical Assessments Timeline
  @IsOptional()
  @IsInt()
  @Min(0)
  dysphagiaScreeningMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  earlyMobilizationHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  speechTherapyHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  physiotherapyHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  occupationalTherapyHours?: number;

  // Imaging Results
  @IsOptional()
  @IsString()
  ctResults?: string;

  @IsOptional()
  @IsString()
  ctaResults?: string;

  @IsOptional()
  @IsString()
  ctpResults?: string;

  @IsOptional()
  @IsString()
  mriResults?: string;

  @IsOptional()
  @IsString()
  mraResults?: string;

  @IsOptional()
  @IsString()
  echocardiogram?: string;

  @IsOptional()
  @IsString()
  carotidUcsDoppler?: string;

  // Treatment Outcomes
  @IsOptional()
  @IsBoolean()
  successful?: boolean;

  @IsOptional()
  @IsString()
  recanalizationGrade?: string;

  @IsOptional()
  @IsString()
  complications?: string;

  @IsOptional()
  @IsString()
  secondaryPrevention?: string;

  // Discharge & Follow-up
  @IsOptional()
  @IsString()
  dischargeDestination?: string;

  @IsOptional()
  @IsDateString()
  dischargeDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  lengthOfStayDays?: number;

  @IsOptional()
  @IsBoolean()
  thirtyDayReadmission?: boolean;

  @IsOptional()
  @IsBoolean()
  ninetyDayMortality?: boolean;

  @IsOptional()
  @IsBoolean()
  followUpCallCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  followUpCallDate?: string;
}
