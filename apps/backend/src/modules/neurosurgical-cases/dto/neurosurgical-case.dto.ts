import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsNotEmpty,
  IsDateString,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  NeurosurgicalTriggerReason,
  NeurosurgicalSeverity,
  NeurosurgicalPupils,
  NeurosurgicalGcsTrend,
  NeurosurgicalDisposition,
  NeurosurgicalOutcome,
  NeurosurgicalDefinitiveTreatment,
  NeurosurgicalCtLocation,
} from '@prisma/client';

export class CreateNeurosurgicalCaseDto {
  @IsString()
  @IsNotEmpty()
  ticketId!: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  originHospitalId?: string;

  @IsOptional()
  @IsString()
  destinationHospitalId?: string;

  @IsEnum(NeurosurgicalTriggerReason)
  triggerReason!: NeurosurgicalTriggerReason;

  @IsOptional()
  @IsString()
  triggerReasonOther?: string;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(15)
  @Type(() => Number)
  gcs?: number;

  @IsOptional()
  @IsEnum(NeurosurgicalGcsTrend)
  gcsTrend?: NeurosurgicalGcsTrend;

  @IsOptional()
  @IsEnum(NeurosurgicalPupils)
  pupils?: NeurosurgicalPupils;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  newFocalDeficit?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  seizure?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  intubated?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hemodynamicInstability?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  anticoagulantUse?: boolean;

  @IsOptional()
  @IsString()
  mechanismOfInjury?: string;

  @IsOptional()
  @IsEnum(NeurosurgicalSeverity)
  severity?: NeurosurgicalSeverity;

  @ValidateIf((o) => !!o.severityOverrideReason || (o.severity && o.gcs !== undefined))
  @IsOptional()
  @IsString()
  severityOverrideReason?: string;

  @IsOptional()
  @IsDateString()
  doorTime?: string;

  @IsOptional()
  @IsDateString()
  doorOutTime?: string;

  @IsOptional()
  @IsDateString()
  rccActivationTime?: string;

  @IsOptional()
  @IsEnum(NeurosurgicalCtLocation)
  ctLocation?: NeurosurgicalCtLocation;

  @IsOptional()
  @IsDateString()
  ctScanStartTime?: string;

  @IsOptional()
  @IsDateString()
  ctReportFinalTime?: string;

  @IsOptional()
  @IsDateString()
  neurosurgeonNotifiedAt?: string;

  @IsOptional()
  @IsDateString()
  neurosurgeonConnectedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateNeurosurgicalCaseDto {
  @IsOptional()
  @IsString()
  destinationHospitalId?: string;

  @IsOptional()
  @IsEnum(NeurosurgicalTriggerReason)
  triggerReason?: NeurosurgicalTriggerReason;

  @IsOptional()
  @IsString()
  triggerReasonOther?: string;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(15)
  @Type(() => Number)
  gcs?: number;

  @IsOptional()
  @IsEnum(NeurosurgicalGcsTrend)
  gcsTrend?: NeurosurgicalGcsTrend;

  @IsOptional()
  @IsEnum(NeurosurgicalPupils)
  pupils?: NeurosurgicalPupils;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  newFocalDeficit?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  seizure?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  intubated?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hemodynamicInstability?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  anticoagulantUse?: boolean;

  @IsOptional()
  @IsString()
  mechanismOfInjury?: string;

  @IsOptional()
  @IsEnum(NeurosurgicalSeverity)
  severity?: NeurosurgicalSeverity;

  @IsOptional()
  @IsString()
  severityOverrideReason?: string;

  @IsOptional()
  @IsDateString()
  doorTime?: string;

  @IsOptional()
  @IsDateString()
  doorOutTime?: string;

  @IsOptional()
  @IsDateString()
  rccActivationTime?: string;

  @IsOptional()
  @IsEnum(NeurosurgicalCtLocation)
  ctLocation?: NeurosurgicalCtLocation;

  @IsOptional()
  @IsDateString()
  ctScanStartTime?: string;

  @IsOptional()
  @IsDateString()
  ctReportFinalTime?: string;

  @IsOptional()
  @IsDateString()
  neurosurgeonNotifiedAt?: string;

  @IsOptional()
  @IsDateString()
  neurosurgeonConnectedAt?: string;

  @IsOptional()
  @IsDateString()
  definitiveCareReachedAt?: string;

  @IsOptional()
  @IsEnum(NeurosurgicalDisposition)
  definitiveDisposition?: NeurosurgicalDisposition;

  @IsOptional()
  dispositionDetail?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(NeurosurgicalOutcome)
  neurologicalOutcome?: NeurosurgicalOutcome;

  @IsOptional()
  @IsEnum(NeurosurgicalDefinitiveTreatment)
  definitiveTreatment?: NeurosurgicalDefinitiveTreatment;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  deteriorationDuringTransfer?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  cardiacArrestDuringTransfer?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unplannedIntubation?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  delayedIntervention?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  wrongDestination?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  repeatTransferRequired?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ActivateFromTicketDto {
  @IsEnum(NeurosurgicalTriggerReason)
  triggerReason!: NeurosurgicalTriggerReason;

  @IsOptional()
  @IsString()
  triggerReasonOther?: string;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(15)
  @Type(() => Number)
  gcs?: number;

  @IsOptional()
  @IsEnum(NeurosurgicalGcsTrend)
  gcsTrend?: NeurosurgicalGcsTrend;

  @IsOptional()
  @IsEnum(NeurosurgicalPupils)
  pupils?: NeurosurgicalPupils;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  newFocalDeficit?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  seizure?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  intubated?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hemodynamicInstability?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  anticoagulantUse?: boolean;

  @IsOptional()
  @IsString()
  mechanismOfInjury?: string;

  @IsOptional()
  @IsEnum(NeurosurgicalSeverity)
  severity?: NeurosurgicalSeverity;

  @IsOptional()
  @IsString()
  severityOverrideReason?: string;

  @IsOptional()
  @IsDateString()
  doorTime?: string;

  @IsOptional()
  @IsDateString()
  doorOutTime?: string;

  @IsOptional()
  @IsDateString()
  rccActivationTime?: string;

  @IsOptional()
  @IsEnum(NeurosurgicalCtLocation)
  ctLocation?: NeurosurgicalCtLocation;

  @IsOptional()
  @IsDateString()
  ctScanStartTime?: string;

  @IsOptional()
  @IsDateString()
  ctReportFinalTime?: string;

  @IsOptional()
  @IsDateString()
  neurosurgeonNotifiedAt?: string;

  @IsOptional()
  @IsDateString()
  neurosurgeonConnectedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
