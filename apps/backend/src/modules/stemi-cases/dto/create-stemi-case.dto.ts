import { IsString, IsOptional, IsBoolean, IsDateString, IsEnum, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
// Note: Using string literals instead of enums for flexibility

export class PatientInfoDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  nationalId!: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string; // Will be removed after migration

  @IsOptional()
  @IsNumber()
  age?: number; // Age in years

  @IsEnum(['MALE', 'FEMALE'])
  gender!: 'MALE' | 'FEMALE';

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  medications?: string;

  @IsString()
  originHospitalId!: string;

  @IsOptional()
  @IsString()
  destinationHospitalId?: string;
}

export class CriticalTimestampsDto {
  @IsOptional()
  @IsDateString()
  triageTime?: string;

  @IsOptional()
  @IsDateString()
  firstEcgTime?: string;
}

export class InterventionsAndTreatmentsDto {
  @IsOptional()
  @IsBoolean()
  eligibleForPrimaryPci?: boolean;

  @IsOptional()
  @IsEnum(['PRIMARY', 'NON_PRIMARY', 'RESCUE_PCI'])
  pciType?: 'PRIMARY' | 'NON_PRIMARY' | 'RESCUE_PCI';

  @IsOptional()
  @IsString()
  pciLocation?: string;

  @IsOptional()
  @IsDateString()
  doorOutTime?: string;

  @IsOptional()
  @IsDateString()
  balloonInflationTime?: string;

  @IsOptional()
  @IsBoolean()
  thrombolyticGiven?: boolean;

  @IsOptional()
  @IsDateString()
  thrombolyticAdminTime?: string;

  @IsOptional()
  @IsString()
  fibrinolyticAbsoluteContraindications?: string;

  @IsOptional()
  @IsString()
  fibrinolyticRelativeContraindications?: string;
}

export class ClinicalAssessmentDto {
  @IsOptional()
  @IsNumber()
  heartScore?: number;

  @IsOptional()
  @IsString()
  clinicalRiskLevel?: string;

  @IsOptional()
  @IsString()
  presentingSymptoms?: string;

  @IsOptional()
  @IsDateString()
  symptomOnset?: string;

  @IsOptional()
  @IsNumber()
  symptomDuration?: number;

  @IsOptional()
  @IsEnum(['STEMI', 'NON_STEMI'])
  miType?: 'STEMI' | 'NON_STEMI';

  @IsOptional()
  @IsEnum(['TRANSFERRED_TO_PCI_CAPABLE_HOSPITAL', 'DAMA_FROM_ED', 'DISCHARGED_ALIVE', 'DAMA', 'STILL_ADMITTED', 'DIED'])
  outcome?: 'TRANSFERRED_TO_PCI_CAPABLE_HOSPITAL' | 'DAMA_FROM_ED' | 'DISCHARGED_ALIVE' | 'DAMA' | 'STILL_ADMITTED' | 'DIED';
}

export class CreateStemiCaseDto {
  @ValidateNested()
  @Type(() => PatientInfoDto)
  patientInfo!: PatientInfoDto;

  @IsString()
  admissionTime!: string;

  @IsEnum(['AMBULANCE_RED_CRESCENT', 'PRIVATE_CAR', 'TRANSFERRED_FROM_ANOTHER_HOSPITAL'])
  modeOfArrival!: 'AMBULANCE_RED_CRESCENT' | 'PRIVATE_CAR' | 'TRANSFERRED_FROM_ANOTHER_HOSPITAL';

  @IsOptional()
  @IsDateString()
  transferRequestDateTime?: string;

  @IsOptional()
  @IsDateString()
  transferArrivalDateTime?: string;

  @ValidateNested()
  @Type(() => CriticalTimestampsDto)
  criticalTimestamps!: CriticalTimestampsDto;

  @ValidateNested()
  @Type(() => InterventionsAndTreatmentsDto)
  interventionsAndTreatments!: InterventionsAndTreatmentsDto;

  @ValidateNested()
  @Type(() => ClinicalAssessmentDto)
  clinicalAssessment!: ClinicalAssessmentDto;

  @IsOptional()
  @IsString()
  currentStatus?: string;

  @IsOptional()
  @IsString()
  selectedTreatment?: string;

  @IsOptional()
  @IsEnum(['DIRECT', 'TRANSFER'])
  caseType?: 'DIRECT' | 'TRANSFER';

  @IsOptional()
  @IsString()
  ecgResult?: string;

  @IsOptional()
  @IsString()
  ecgFindings?: string;

  @IsOptional()
  @IsBoolean()
  isTroponinPositive?: boolean;

  @IsOptional()
  @IsNumber()
  troponinValue?: number;

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

export class UpdateStemiCaseDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PatientInfoDto)
  patientInfo?: PatientInfoDto;

  @IsOptional()
  @IsString()
  admissionTime?: string;

  @IsOptional()
  @IsEnum(['AMBULANCE_RED_CRESCENT', 'PRIVATE_CAR', 'TRANSFERRED_FROM_ANOTHER_HOSPITAL'])
  modeOfArrival?: 'AMBULANCE_RED_CRESCENT' | 'PRIVATE_CAR' | 'TRANSFERRED_FROM_ANOTHER_HOSPITAL';

  @IsOptional()
  @IsDateString()
  transferRequestDateTime?: string;

  @IsOptional()
  @IsDateString()
  transferArrivalDateTime?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CriticalTimestampsDto)
  criticalTimestamps?: CriticalTimestampsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InterventionsAndTreatmentsDto)
  interventionsAndTreatments?: InterventionsAndTreatmentsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClinicalAssessmentDto)
  clinicalAssessment?: ClinicalAssessmentDto;

  @IsOptional()
  @IsString()
  currentStatus?: string;

  @IsOptional()
  @IsString()
  selectedTreatment?: string;

  @IsOptional()
  @IsEnum(['DIRECT', 'TRANSFER'])
  caseType?: 'DIRECT' | 'TRANSFER';

  @IsOptional()
  @IsString()
  ecgResult?: string;

  @IsOptional()
  @IsString()
  ecgFindings?: string;

  @IsOptional()
  @IsBoolean()
  isTroponinPositive?: boolean;

  @IsOptional()
  @IsNumber()
  troponinValue?: number;

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
