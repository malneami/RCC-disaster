import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsDateString, Min, Max } from 'class-validator';
import { 
  StrokeType, 
  StrokeStatus, 
  StrokeTreatment,
  StrokeModeOfArrival,
  StrokeTypeDetailed,
  SwallowingScreeningResult,
  CTFindings,
  CandidateAssessment,
  IVThrombolysisGiven,
  StrokeDisposition,
  ReferralTo,
  ModifiedRankinScale
} from '@prisma/client';

export class UpdateStrokeCaseV2Dto {
  // All fields are optional for updates - no required fields

  @IsOptional()
  @IsString()
  ticketId?: string | null;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  originHospitalId?: string;

  @IsOptional()
  @IsString()
  destinationHospitalId?: string | null;

  @IsOptional()
  @IsEnum(StrokeType)
  strokeType?: StrokeType;

  @IsOptional()
  @IsEnum(StrokeStatus)
  currentStatus?: StrokeStatus;

  @IsOptional()
  @IsEnum(StrokeTreatment)
  selectedTreatment?: StrokeTreatment | null;

  // Patient Arrival & Timing
  @IsOptional()
  @IsEnum(StrokeModeOfArrival)
  modeOfArrival?: StrokeModeOfArrival | null;

  @IsOptional()
  @IsDateString()
  srcaCallTime?: string | null;

  @IsOptional()
  @IsDateString()
  timeOfSymptomOnset?: string | null;

  @IsOptional()
  @IsDateString()
  lastKnownNormal?: string | null;

  @IsOptional()
  @IsDateString()
  dateOfAdmission?: string | null;

  @IsOptional()
  @IsDateString()
  timeOfTriage?: string | null;

  @IsOptional()
  @IsDateString()
  timeOfPhysicianAssessment?: string | null;

  // Clinical Assessment & Diagnosis
  @IsOptional()
  @IsEnum(StrokeTypeDetailed)
  strokeTypeDetailed?: StrokeTypeDetailed | null;

  @IsOptional()
  @IsBoolean()
  swallowingScreeningPerformed?: boolean | null;

  @IsOptional()
  @IsDateString()
  timeOfSwallowingScreening?: string | null;

  @IsOptional()
  @IsEnum(SwallowingScreeningResult)
  swallowingScreeningResult?: SwallowingScreeningResult | null;

  @IsOptional()
  @IsBoolean()
  ctScanPerformed?: boolean | null;

  @IsOptional()
  @IsDateString()
  timeOfCtScanStart?: string | null;

  @IsOptional()
  @IsDateString()
  timeOfCtReportFinal?: string | null;

  @IsOptional()
  @IsEnum(CTFindings)
  ctFindings?: CTFindings | null;

  @IsOptional()
  @IsBoolean()
  lvoDetected?: boolean | null;

  @IsOptional()
  @IsEnum(CandidateAssessment)
  candidateForIVThrombolysis?: CandidateAssessment | null;

  @IsOptional()
  @IsDateString()
  thrombolysisOrderTime?: string | null;

  @IsOptional()
  @IsDateString()
  ivThrombolysisAdministrationTime?: string | null;

  @IsOptional()
  @IsEnum(IVThrombolysisGiven)
  ivThrombolysisGiven?: IVThrombolysisGiven | null;

  @IsOptional()
  @IsString()
  reasonForNotAdministeringIV?: string | null;

  @IsOptional()
  @IsEnum(CandidateAssessment)
  candidateForMechanicalThrombectomy?: CandidateAssessment | null;

  @IsOptional()
  @IsDateString()
  timeOfMechanicalThrombectomyPuncture?: string | null;

  @IsOptional()
  @IsBoolean()
  mechanicalThrombectomyPerformed?: boolean | null;

  @IsOptional()
  @IsDateString()
  timeOfThrombectomyComplete?: string | null;

  // Disposition & Transfer Decisions
  @IsOptional()
  @IsBoolean()
  facilityHasCt?: boolean | null;

  @IsOptional()
  @IsBoolean()
  transferToAnotherHospital?: boolean | null;

  @IsOptional()
  @IsDateString()
  timeOfTransferActivation?: string | null;

  @IsOptional()
  @IsDateString()
  timeOfTransferDeparture?: string | null;

  @IsOptional()
  @IsBoolean()
  prehospitalNotificationBySrca?: boolean | null;

  @IsOptional()
  @IsBoolean()
  prehospitalNotificationByUccPhc?: boolean | null;

  @IsOptional()
  @IsEnum(StrokeDisposition)
  disposition?: StrokeDisposition | null;

  @IsOptional()
  @IsEnum(ReferralTo)
  referralTo?: ReferralTo | null;

  @IsOptional()
  @IsBoolean()
  admittedToStrokeUnit?: boolean | null;

  // Follow-up & Outcome Tracking
  @IsOptional()
  @IsBoolean()
  followUpContactAttempted?: boolean | null;

  @IsOptional()
  @IsEnum(ModifiedRankinScale)
  modifiedRankinScaleAt90Days?: ModifiedRankinScale | null;

  // Legacy fields
  @IsOptional()
  @IsString()
  strokeSubtype?: string | null;

  @IsOptional()
  @IsBoolean()
  eligibleForThrombolysis?: boolean | null;

  @IsOptional()
  @IsString()
  thrombolysisContraindications?: string | null;

  @IsOptional()
  @IsBoolean()
  eligibleForThrombectomy?: boolean | null;

  @IsOptional()
  @IsString()
  thrombectomyContraindications?: string | null;

  @IsOptional()
  @IsDateString()
  pathwayStarted?: string | null;

  @IsOptional()
  @IsDateString()
  pathwayCompleted?: string | null;

  @IsOptional()
  @IsDateString()
  strokeUnitAdmissionTime?: string | null;

  @IsOptional()
  @IsInt()
  symptomNeedleMinutes?: number | null;

  @IsOptional()
  @IsInt()
  symptomToMechanicalThrombectomyMinutes?: number | null;

  @IsOptional()
  @IsInt()
  imagingToNeedleMinutes?: number | null;

  @IsOptional()
  @IsInt()
  imagingToMechanicalThrombectomyMinutes?: number | null;
}