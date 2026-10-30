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
  NeonatalAcuityLevel,
  NicuLevel,
  NicuCotType,
  NeonatalRespiratorySupport,
  NeonatalAcceptanceStatus,
  NeonatalTransportTeam,
} from '@prisma/client';

export class CreateNeonatalTransferDto {
  @IsString()
  @IsNotEmpty()
  ticketId!: string;

  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsOptional()
  @IsString()
  obMaternalTransferId?: string;

  // Neonate identity
  @IsInt()
  @Min(22)
  @Max(44)
  gestationalAgeWeeks!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  gestationalAgeDays?: number;

  @IsOptional()
  @IsInt()
  @Min(200)
  @Max(7000)
  birthWeightGrams?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  ageHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  apgar1?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  apgar5?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  apgar10?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  antenatalSteroids?: boolean;

  // Vitals
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
  @IsInt()
  @Min(0)
  @Max(100)
  preDuctalSpo2?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  postDuctalSpo2?: number;

  @IsOptional()
  @IsNumber()
  bloodGlucose?: number;

  // Respiratory / support
  @IsOptional()
  @IsEnum(NeonatalRespiratorySupport)
  respiratorySupport?: NeonatalRespiratorySupport;

  @IsOptional()
  @IsInt()
  @Min(21)
  @Max(100)
  fiO2?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  surfactantGiven?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  inotropes?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  therapeuticHypothermia?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  seizure?: boolean;

  @IsOptional()
  @IsArray()
  suspectedConditions?: string[];

  @IsOptional()
  @IsArray()
  stabilizationDone?: string[];

  // Acuity scoring
  @IsEnum(NeonatalAcuityLevel)
  @IsNotEmpty()
  acuityLevel!: NeonatalAcuityLevel;

  @IsOptional()
  @IsInt()
  tripsScore?: number;

  @IsOptional()
  @IsInt()
  cribIIScore?: number;

  // Capacity requirement
  @IsEnum(NicuLevel)
  @IsNotEmpty()
  requiredNicuLevel!: NicuLevel;

  @IsEnum(NicuCotType)
  @IsNotEmpty()
  requiredCotType!: NicuCotType;

  // Referring
  @IsString()
  @IsNotEmpty()
  referringFacilityId!: string;

  @IsOptional()
  @IsString()
  referringContactName?: string;

  @IsOptional()
  @IsString()
  referringContactPhone?: string;

  // Destination and acceptance
  @IsOptional()
  @IsString()
  destinationHospitalId?: string;

  @IsOptional()
  @IsString()
  assignedBedId?: string;

  @IsOptional()
  @IsEnum(NeonatalAcceptanceStatus)
  acceptanceStatus?: NeonatalAcceptanceStatus;

  // Transport
  @IsEnum(NeonatalTransportTeam)
  @IsNotEmpty()
  transportTeam!: NeonatalTransportTeam;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  transportIncubator?: boolean;
}
