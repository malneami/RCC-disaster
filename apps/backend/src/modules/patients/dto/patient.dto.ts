import { IsString, IsOptional, IsDateString, IsEnum, IsBoolean, IsNumber, IsArray, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PatientGender } from '@prisma/client';

// Define enums locally until Prisma generates them
enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
  SEPARATED = 'SEPARATED',
  UNKNOWN = 'UNKNOWN',
}

enum PrivacyLevel {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  PRIVATE = 'PRIVATE',
  RESTRICTED = 'RESTRICTED',
  CONFIDENTIAL = 'CONFIDENTIAL',
}

export class CreatePatientDto {
  @ApiProperty({ description: 'Medical Record Number' })
  @IsOptional()
  @IsString()
  mrn?: string;

  @ApiProperty({ description: 'National ID (Saudi Arabia)' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiProperty({ description: 'First Name' })
  @IsString()
  firstName!: string;

  @ApiProperty({ description: 'Last Name' })
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({ description: 'Middle Name' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({ description: 'Date of Birth (will be replaced by age)' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Age in years' })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional({ description: 'Age in months (for precise age when manually entered)' })
  @IsOptional()
  @IsNumber()
  ageMonths?: number;

  @ApiPropertyOptional({ description: 'Age in days (for precise age when manually entered)' })
  @IsOptional()
  @IsNumber()
  ageDays?: number;

  @ApiProperty({ enum: PatientGender, description: 'Gender' })
  @IsEnum(PatientGender)
  gender!: PatientGender;

  @ApiPropertyOptional({ enum: MaritalStatus, description: 'Marital Status' })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  // Contact Information
  @ApiPropertyOptional({ description: 'Phone Number' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Email Address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State/Province' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'ZIP Code' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Country', default: 'Saudi Arabia' })
  @IsOptional()
  @IsString()
  country?: string;

  // Emergency Contacts
  @ApiPropertyOptional({ description: 'Emergency Contact Name' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ description: 'Emergency Contact Phone' })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @ApiPropertyOptional({ description: 'Emergency Contact Email' })
  @IsOptional()
  @IsEmail()
  emergencyEmail?: string;

  @ApiPropertyOptional({ description: 'Emergency Contact Relationship' })
  @IsOptional()
  @IsString()
  emergencyRelationship?: string;

  // Insurance Information
  @ApiPropertyOptional({ description: 'Insurance Provider' })
  @IsOptional()
  @IsString()
  insuranceProvider?: string;

  @ApiPropertyOptional({ description: 'Insurance Number' })
  @IsOptional()
  @IsString()
  insuranceNumber?: string;

  @ApiPropertyOptional({ description: 'Insurance Group' })
  @IsOptional()
  @IsString()
  insuranceGroup?: string;

  @ApiPropertyOptional({ description: 'Insurance Expiry Date' })
  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  // Medical Information
  @ApiPropertyOptional({ description: 'Blood Type' })
  @IsOptional()
  @IsString()
  bloodType?: string;

  @ApiPropertyOptional({ description: 'RH Factor (Positive/Negative)' })
  @IsOptional()
  @IsString()
  rhFactor?: string;

  @ApiPropertyOptional({ description: 'Allergies (JSON string)' })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiPropertyOptional({ description: 'Current Medications (JSON string)' })
  @IsOptional()
  @IsString()
  medications?: string;

  @ApiPropertyOptional({ description: 'Medical History' })
  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @ApiPropertyOptional({ description: 'Risk Factors (JSON string)' })
  @IsOptional()
  @IsString()
  riskFactors?: string;

  @ApiPropertyOptional({ description: 'Chronic Conditions (JSON string)' })
  @IsOptional()
  @IsString()
  chronicConditions?: string;

  // Physical Measurements
  @ApiPropertyOptional({ description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: 'Height in cm' })
  @IsOptional()
  @IsNumber()
  height?: number;

  // HIPAA Compliance
  @ApiPropertyOptional({ enum: PrivacyLevel, description: 'Privacy Level', default: 'PRIVATE' })
  @IsOptional()
  @IsEnum(PrivacyLevel)
  privacyLevel?: PrivacyLevel;

  @ApiPropertyOptional({ description: 'Consent Given', default: false })
  @IsOptional()
  @IsBoolean()
  consentGiven?: boolean;

  @ApiPropertyOptional({ description: 'Data Retention Policy' })
  @IsOptional()
  @IsString()
  dataRetentionPolicy?: string;
}

export class UpdatePatientDto {
  @ApiPropertyOptional({ description: 'Medical Record Number' })
  @IsOptional()
  @IsString()
  mrn?: string;

  @ApiPropertyOptional({ description: 'National ID (Saudi Arabia)' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({ description: 'First Name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last Name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Middle Name' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({ description: 'Date of Birth (will be replaced by age)' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Age in years' })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional({ description: 'Age in months (for precise age when manually entered)' })
  @IsOptional()
  @IsNumber()
  ageMonths?: number;

  @ApiPropertyOptional({ description: 'Age in days (for precise age when manually entered)' })
  @IsOptional()
  @IsNumber()
  ageDays?: number;

  @ApiPropertyOptional({ enum: PatientGender, description: 'Gender' })
  @IsOptional()
  @IsEnum(PatientGender)
  gender?: PatientGender;

  @ApiPropertyOptional({ enum: MaritalStatus, description: 'Marital Status' })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  // Contact Information
  @ApiPropertyOptional({ description: 'Phone Number' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Email Address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State/Province' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'ZIP Code' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Country', default: 'Saudi Arabia' })
  @IsOptional()
  @IsString()
  country?: string;

  // Emergency Contacts
  @ApiPropertyOptional({ description: 'Emergency Contact Name' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ description: 'Emergency Phone Number' })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @ApiPropertyOptional({ description: 'Emergency Email' })
  @IsOptional()
  emergencyEmail?: string;

  @ApiPropertyOptional({ description: 'Emergency Contact Relationship' })
  @IsOptional()
  @IsString()
  emergencyRelationship?: string;

  // Insurance Information
  @ApiPropertyOptional({ description: 'Insurance Provider' })
  @IsOptional()
  @IsString()
  insuranceProvider?: string;

  @ApiPropertyOptional({ description: 'Insurance Policy Number' })
  @IsOptional()
  @IsString()
  insuranceNumber?: string;

  @ApiPropertyOptional({ description: 'Insurance Group' })
  @IsOptional()
  @IsString()
  insuranceGroup?: string;

  @ApiPropertyOptional({ description: 'Insurance Expiry Date' })
  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  // Medical Information
  @ApiPropertyOptional({ description: 'Blood Type' })
  @IsOptional()
  @IsString()
  bloodType?: string;

  @ApiPropertyOptional({ description: 'RH Factor' })
  @IsOptional()
  @IsString()
  rhFactor?: string;

  @ApiPropertyOptional({ description: 'Allergies (JSON array as string)' })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiPropertyOptional({ description: 'Current Medications (JSON array as string)' })
  @IsOptional()
  @IsString()
  medications?: string;

  @ApiPropertyOptional({ description: 'Medical History' })
  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @ApiPropertyOptional({ description: 'Risk Factors (JSON array as string)' })
  @IsOptional()
  @IsString()
  riskFactors?: string;

  @ApiPropertyOptional({ description: 'Chronic Conditions (JSON array as string)' })
  @IsOptional()
  @IsString()
  chronicConditions?: string;

  @ApiPropertyOptional({ description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: 'Height in cm' })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ enum: PrivacyLevel, description: 'Privacy Level' })
  @IsOptional()
  @IsEnum(PrivacyLevel)
  privacyLevel?: PrivacyLevel;

  @ApiPropertyOptional({ description: 'Consent Given' })
  @IsOptional()
  @IsBoolean()
  consentGiven?: boolean;

  @ApiPropertyOptional({ description: 'Data Retention Policy' })
  @IsOptional()
  @IsString()
  dataRetentionPolicy?: string;

  @ApiPropertyOptional({ description: 'Update specific fields only' })
  @IsOptional()
  @IsArray()
  fieldsToUpdate?: string[];
}

export class PatientSearchDto {
  @ApiPropertyOptional({ description: 'Search query for name, MRN, or national ID' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Medical Record Number' })
  @IsOptional()
  @IsString()
  mrn?: string;

  @ApiPropertyOptional({ description: 'National ID' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({ description: 'First Name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last Name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ enum: PatientGender, description: 'Gender' })
  @IsOptional()
  @IsEnum(PatientGender)
  gender?: PatientGender;

  @ApiPropertyOptional({ description: 'Age (minimum)' })
  @IsOptional()
  @IsNumber()
  ageMin?: number;

  @ApiPropertyOptional({ description: 'Age (maximum)' })
  @IsOptional()
  @IsNumber()
  ageMax?: number;

  @ApiPropertyOptional({ enum: PrivacyLevel, description: 'Privacy Level' })
  @IsOptional()
  @IsEnum(PrivacyLevel)
  privacyLevel?: PrivacyLevel;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class PatientFilterDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PatientGender, description: 'Gender filter' })
  @IsOptional()
  @IsEnum(PatientGender)
  gender?: PatientGender;

  @ApiPropertyOptional({ enum: MaritalStatus, description: 'Marital status filter' })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional({ description: 'Start date for creation' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for creation' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: PrivacyLevel, description: 'Privacy level filter' })
  @IsOptional()
  @IsEnum(PrivacyLevel)
  privacyLevel?: PrivacyLevel;

  @ApiPropertyOptional({ description: 'Blood type filter' })
  @IsOptional()
  @IsString()
  bloodType?: string;

  @ApiPropertyOptional({ description: 'Has insurance filter' })
  @IsOptional()
  @IsBoolean()
  hasInsurance?: boolean;

  @ApiPropertyOptional({ description: 'Hospital ID filter' })
  @IsOptional()
  @IsString()
  hospitalId?: string;
}

export class DuplicateDetectionDto {
  @ApiProperty({ description: 'Patient ID to check for duplicates' })
  @IsString()
  patientId!: string;

  @ApiPropertyOptional({ description: 'Confidence threshold', default: 0.8 })
  @IsOptional()
  @IsNumber()
  confidenceThreshold?: number;
}

export class PatientExportDto {
  @ApiProperty({ description: 'Patient ID to export' })
  @IsString()
  patientId!: string;

  @ApiPropertyOptional({ description: 'Export format', default: 'PDF' })
  @IsOptional()
  @IsString()
  format?: 'PDF' | 'JSON' | 'CSV';

  @ApiPropertyOptional({ description: 'Include medical records', default: true })
  @IsOptional()
  @IsBoolean()
  includeMedicalRecords?: boolean;

  @ApiPropertyOptional({ description: 'Include access logs', default: false })
  @IsOptional()
  @IsBoolean()
  includeAccessLogs?: boolean;
}
