import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsDateString, IsNumber, Min, Max, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StrokeType, StrokeSeverity, StrokeStatus, StrokeTreatment } from '@prisma/client';

export class PatientInfoDto {
  @IsOptional()
  @IsString()
  mrn?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string; // Will be removed after migration

  @IsOptional()
  @IsNumber()
  age?: number; // Age in years

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

export class CreateStrokeCaseDto {
  @IsOptional()
  @IsString()
  ticketId?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  // Patient information for auto-creation
  @IsOptional()
  @ValidateNested()
  @Type(() => PatientInfoDto)
  patientInfo?: PatientInfoDto;

  // Chief complaint for auto-created ticket
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsString()
  @IsNotEmpty()
  originHospitalId!: string;

  @IsOptional()
  @IsString()
  destinationHospitalId?: string;

  // Stroke Classification
  @IsEnum(StrokeType)
  @IsNotEmpty()
  strokeType!: StrokeType;

  @IsOptional()
  @IsString()
  strokeSubtype?: string;

  @IsOptional()
  @IsEnum(StrokeSeverity)
  strokeSeverity?: StrokeSeverity;

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
  @IsEnum(StrokeStatus)
  @IsNotEmpty()
  currentStatus!: StrokeStatus;

  @IsOptional()
  @IsEnum(StrokeTreatment)
  selectedTreatment?: StrokeTreatment;

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

  // KPI Tracking
  @IsOptional()
  @IsBoolean()
  metKpi1?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi2?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi3?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi4?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi5?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi6?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi7?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi8?: boolean;
}

export class UpdateStrokeCaseDto {
  // All fields are optional for updates - recreating without inheritance to avoid required field validation
  
  @IsOptional()
  @IsString()
  ticketId?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PatientInfoDto)
  patientInfo?: PatientInfoDto;

  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  originHospitalId?: string;

  @IsOptional()
  @IsString()
  destinationHospitalId?: string;

  @IsOptional()
  @IsEnum(StrokeType)
  strokeType?: StrokeType;

  @IsOptional()
  @IsString()
  strokeSubtype?: string;

  @IsOptional()
  @IsEnum(StrokeSeverity)
  strokeSeverity?: StrokeSeverity;

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

  @IsOptional()
  @IsEnum(StrokeStatus)
  currentStatus?: StrokeStatus;

  @IsOptional()
  @IsEnum(StrokeTreatment)
  selectedTreatment?: StrokeTreatment;

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

  @IsOptional()
  @IsDateString()
  pathwayStarted?: string;

  @IsOptional()
  @IsDateString()
  pathwayCompleted?: string;

  @IsOptional()
  @IsDateString()
  strokeUnitAdmissionTime?: string;

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

  @IsOptional()
  @IsBoolean()
  metKpi1?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi2?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi3?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi4?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi5?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi6?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi7?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi8?: boolean;
}
