import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsDateString, IsNumber, Min, Max, IsNotEmpty, ValidateNested, IsArray, ValidateIf } from 'class-validator';
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

export class UpdateStrokeCaseDto {
  @IsOptional()
  @IsString()
  ticketId?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

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
  @IsEnum(StrokeModeOfArrival)
  modeOfArrival?: StrokeModeOfArrival;

  @IsOptional()
  @IsDateString()
  srcaCallTime?: string;

  @IsOptional()
  @IsDateString()
  timeOfSymptomOnset?: string;

  @IsOptional()
  @IsDateString()
  lastKnownNormal?: string;

  @IsOptional()
  @IsDateString()
  timeOfRegistration?: string;

  @IsOptional()
  @IsDateString()
  timeOfTriage?: string;

  @IsOptional()
  @IsDateString()
  timeOfPhysicianAssessment?: string;

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
  @ValidateIf((o) => o.candidateForIVThrombolysis !== null)
  @IsEnum(CandidateAssessment)
  candidateForIVThrombolysis?: CandidateAssessment | null;

  @IsOptional()
  @IsDateString()
  thrombolysisOrderTime?: string;

  @IsOptional()
  @IsDateString()
  ivThrombolysisAdministrationTime?: string;

  @IsOptional()
  @ValidateIf((o) => o.ivThrombolysisGiven !== null)
  @IsEnum(IVThrombolysisGiven)
  ivThrombolysisGiven?: IVThrombolysisGiven | null;

  @IsOptional()
  @IsString()
  reasonForNotAdministeringIV?: string;

  @IsOptional()
  @ValidateIf((o) => o.candidateForMechanicalThrombectomy !== null)
  @IsEnum(CandidateAssessment)
  candidateForMechanicalThrombectomy?: CandidateAssessment | null;

  @IsOptional()
  @IsDateString()
  timeOfMechanicalThrombectomyPuncture?: string;

  @IsOptional()
  @IsBoolean()
  mechanicalThrombectomyPerformed?: boolean;

  @IsOptional()
  @IsDateString()
  timeOfThrombectomyComplete?: string;

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
  @ValidateIf((o) => o.disposition !== null)
  @IsEnum(StrokeDisposition)
  disposition?: StrokeDisposition | null;

  @IsOptional()
  @IsArray()
  @IsEnum(ReferralTo, { each: true })
  referralTo?: ReferralTo[];

  @IsOptional()
  @IsBoolean()
  admittedToStrokeUnit?: boolean;

  @IsOptional()
  @IsBoolean()
  followUpContactAttempted?: boolean;

  @IsOptional()
  @ValidateIf((o) => o.modifiedRankinScaleAt90Days !== null)
  @IsEnum(ModifiedRankinScale)
  modifiedRankinScaleAt90Days?: ModifiedRankinScale | null;

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
  doorToCtScanMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  doorToNeedleMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  doorToMechanicalThrombectomyMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  symptomNeedleMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  symptomToMechanicalThrombectomyMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  imagingToNeedleMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  imagingToMechanicalThrombectomyMinutes?: number;

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

  @IsOptional()
  @IsBoolean()
  metKpi9?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi10?: boolean;

  @IsOptional()
  @IsBoolean()
  metKpi11?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  doorToPhysicianMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  registrationToCtMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  registrationToThrombolysisMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  registrationToMechanicalThrombectomyMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  srcaCallToArrivalMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  transferActivationToDepartureMinutes?: number;

  @IsOptional()
  @IsBoolean()
  swallowingScreeningWithin4Hours?: boolean;
}