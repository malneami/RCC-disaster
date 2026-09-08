import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ObActivationLevel,
  ObExpectedDeliveryMode,
  ObSystemSuggestedDeliveryMode,
  ObPhysicianConfirmedDeliveryMode,
  ObAcceptanceStatus,
  ObAmbulanceType,
  ObConsciousness,
  ObBleeding,
  ObFetalStatus,
} from '@prisma/client';

export class CreateObMaternalTransferDto {
  @IsString()
  @IsNotEmpty()
  ticketId!: string;

  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsOptional()
  @IsString()
  pregnancyCaseId?: string;

  @IsInt()
  @Min(1)
  @Max(45)
  gestationalAgeWeeks!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  gravida?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  para?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sbp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  dbp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  hr?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rr?: number;

  @IsOptional()
  @IsNumber()
  temp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  spo2?: number;

  @IsOptional()
  @IsEnum(ObConsciousness)
  consciousness?: ObConsciousness;

  @IsOptional()
  @IsEnum(ObBleeding)
  bleeding?: ObBleeding;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  seizure?: boolean;

  @IsOptional()
  suspectedConditions?: string[];

  @IsOptional()
  @IsEnum(ObFetalStatus)
  fetalStatus?: ObFetalStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  fetalHeartRate?: number;

  @IsOptional()
  @IsNumber()
  hb?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  platelets?: number;

  @IsOptional()
  @IsNumber()
  glucose?: number;

  @IsOptional()
  @IsString()
  urineProtein?: string;

  @IsOptional()
  labsOther?: Record<string, unknown>;

  @IsOptional()
  stabilizationDone?: string[];

  @IsString()
  @IsNotEmpty()
  referringFacilityId!: string;

  @IsOptional()
  @IsString()
  referringContactName?: string;

  @IsOptional()
  @IsString()
  referringContactPhone?: string;

  @IsEnum(ObActivationLevel)
  @IsNotEmpty()
  activationLevel!: ObActivationLevel;

  @IsEnum(ObExpectedDeliveryMode)
  @IsNotEmpty()
  expectedDeliveryMode!: ObExpectedDeliveryMode;

  @IsOptional()
  @IsEnum(ObSystemSuggestedDeliveryMode)
  systemSuggestedDeliveryMode?: ObSystemSuggestedDeliveryMode;

  @IsOptional()
  @IsEnum(ObPhysicianConfirmedDeliveryMode)
  physicianConfirmedDeliveryMode?: ObPhysicianConfirmedDeliveryMode;

  @IsOptional()
  @IsString()
  destinationHospitalId?: string;

  @IsOptional()
  @IsEnum(ObAcceptanceStatus)
  acceptanceStatus?: ObAcceptanceStatus;

  @IsEnum(ObAmbulanceType)
  @IsNotEmpty()
  ambulanceType!: ObAmbulanceType;
}
