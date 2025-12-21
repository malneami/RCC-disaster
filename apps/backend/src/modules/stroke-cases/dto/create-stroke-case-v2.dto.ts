import { IsString, IsEnum, IsOptional, IsNumber, ValidateNested, IsBoolean, IsDateString, IsArray, IsEmail, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
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

export class PatientInfoV2Dto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  mrn?: string;

  @IsOptional()
  @IsString()
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
  @ValidateIf((o) => o.email !== undefined && o.email !== null && o.email !== '')
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;
}

export class CreateStrokeCaseV2Dto {
  @IsOptional()
  @IsString()
  ticketId?: string | null;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PatientInfoV2Dto)
  patientInfo?: PatientInfoV2Dto;

  @IsOptional()
  @IsString()
  chiefComplaint?: string;


  @IsString()
  originHospitalId!: string;

  @IsOptional()
  @IsString()
  destinationHospitalId?: string | null;

  @IsEnum(StrokeType)
  strokeType!: StrokeType;

  @IsEnum(StrokeStatus)
  currentStatus!: StrokeStatus;


  @IsOptional()
  @IsEnum(StrokeTreatment)
  selectedTreatment?: StrokeTreatment | null;

  // Stroke Toolkit Fields - Patient Arrival & Timing (Step 1)
  @IsOptional()
  @IsEnum(StrokeModeOfArrival)
  modeOfArrival?: StrokeModeOfArrival | null;

  @IsOptional()
  @IsDateString()
  transferRequestDateTime?: string | null;

  @IsOptional()
  @IsDateString()
  transferArrivalDateTime?: string | null;

  @IsOptional()
  @IsDateString()
  srcaCallTime?: string | null;

  @IsOptional()
  @IsDateString()
  timeOfSymptomOnset?: string;

  @IsOptional()
  @IsDateString()
  lastKnownNormal?: string;

  @IsOptional()
  @IsDateString()
  dateOfAdmission?: string;

  @IsOptional()
  @IsDateString()
  timeOfTriage?: string;

  @IsOptional()
  @IsDateString()
  timeOfPhysicianAssessment?: string;

  // Clinical Assessment & Diagnosis (Step 2)
  @IsOptional()
  @IsEnum(StrokeTypeDetailed)
  strokeTypeDetailed?: StrokeTypeDetailed;

  @IsOptional()
  @IsBoolean()
  swallowingScreeningPerformed?: boolean;

  @IsOptional()
  @IsDateString()
  timeOfSwallowingScreening?: string;

  @IsOptional()
  @IsEnum(SwallowingScreeningResult)
  swallowingScreeningResult?: SwallowingScreeningResult;

  @IsOptional()
  @IsBoolean()
  ctScanPerformed?: boolean;

  @IsOptional()
  @IsDateString()
  timeOfCtScanStart?: string;

  @IsOptional()
  @IsDateString()
  timeOfCtReportFinal?: string;

  @IsOptional()
  @IsEnum(CTFindings)
  ctFindings?: CTFindings;

  @IsOptional()
  @IsBoolean()
  lvoDetected?: boolean;

  @IsOptional()
  @IsEnum(CandidateAssessment)
  candidateForIVThrombolysis?: CandidateAssessment;

  @IsOptional()
  @IsDateString()
  thrombolysisOrderTime?: string;

  @IsOptional()
  @IsDateString()
  ivThrombolysisAdministrationTime?: string;

  @IsOptional()
  @IsEnum(IVThrombolysisGiven)
  ivThrombolysisGiven?: IVThrombolysisGiven;

  @IsOptional()
  @IsString()
  reasonForNotAdministeringIV?: string;

  @IsOptional()
  @IsEnum(CandidateAssessment)
  candidateForMechanicalThrombectomy?: CandidateAssessment;

  @IsOptional()
  @IsDateString()
  timeOfMechanicalThrombectomyPuncture?: string;

  @IsOptional()
  @IsBoolean()
  mechanicalThrombectomyPerformed?: boolean;

  @IsOptional()
  @IsDateString()
  timeOfThrombectomyComplete?: string;

  // Disposition & Transfer Decisions (Step 3)
  @IsOptional()
  @IsBoolean()
  facilityHasCt?: boolean;

  @IsOptional()
  @IsBoolean()
  transferToAnotherHospital?: boolean;

  @IsOptional()
  @IsDateString()
  timeOfTransferActivation?: string;

  @IsOptional()
  @IsDateString()
  timeOfTransferDeparture?: string;

  @IsOptional()
  @IsBoolean()
  prehospitalNotificationBySrca?: boolean;

  @IsOptional()
  @IsBoolean()
  prehospitalNotificationByUccPhc?: boolean;

  @IsOptional()
  @IsEnum(StrokeDisposition)
  disposition?: StrokeDisposition;

  @IsOptional()
  @IsArray()
  @IsEnum(ReferralTo, { each: true })
  referralTo?: ReferralTo[];

  @IsOptional()
  @IsBoolean()
  admittedToStrokeUnit?: boolean;

  // Follow-up & Outcome Tracking (Step 4)
  @IsOptional()
  @IsBoolean()
  followUpContactAttempted?: boolean;

  @IsOptional()
  @IsEnum(ModifiedRankinScale)
  modifiedRankinScaleAt90Days?: ModifiedRankinScale;
}

