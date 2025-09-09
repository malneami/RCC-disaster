
# Trauma Portal Implementation Master Prompt



## Overview
Implement a comprehensive trauma portal for the RCC Healthcare Platform that manages trauma patients, their injuries, vitals, scores, and dispositions with real-time KPI tracking.

## Patient-Record Architecture

### Core Concept: One Patient, Multiple Records
The RCC Healthcare Platform follows a **one-patient, multiple-records** architecture:

- **Patient**: A single entity identified by National ID, containing basic demographics (name, DOB, gender, contact info)
- **Records**: Multiple specialized records per patient across different portals (Stroke, Trauma, STEMI, etc.)
- **Linking**: All records are connected via the patient's National ID, allowing comprehensive patient history across all care pathways

### Example Patient Journey:
```
Patient: John Doe (National ID: 123456789)
├── Stroke Record #1 (2024-01-15) - Acute stroke management
├── Stroke Record #2 (2024-03-20) - Follow-up care
├── Trauma Record #1 (2024-02-10) - Motor vehicle accident
└── STEMI Record #1 (2024-04-05) - Heart attack
```

### Benefits:
- **Unified Patient View**: Complete medical history across all specialties
- **Data Consistency**: Single source of truth for patient demographics
- **Cross-Portal Analytics**: Analyze patient outcomes across different care pathways
- **Duplicate Prevention**: Automatic detection and merging of duplicate patients

### Implementation Details:

#### Patient Creation Flow:
1. **New Patient**: If National ID not found → Create new Patient record
2. **Existing Patient**: If National ID found → Link to existing Patient record
3. **Portal Record**: Create specialized record (TraumaPatient, StrokeCase, etc.) linked to Patient

#### Data Relationships:
```sql
-- Patient (Master Record)
Patient {
  id: UUID
  nationalId: String (unique)
  firstName: String
  lastName: String
  dateOfBirth: Date
  gender: Enum
  phoneNumber: String
  email: String
}

-- Trauma Record (Specialized Record)
TraumaPatient {
  id: UUID
  patientId: UUID → Patient.id
  hospitalId: UUID → Hospital.id
  arrivalDate: DateTime
  mechanismOfTrauma: Enum
  // ... trauma-specific fields
}

-- Stroke Record (Specialized Record)
StrokeCase {
  id: UUID
  patientId: UUID → Patient.id
  hospitalId: UUID → Hospital.id
  onsetDateTime: DateTime
  strokeType: Enum
  // ... stroke-specific fields
}
```

#### Cross-Portal Queries:
```typescript
// Get all records for a patient across all portals
const patientHistory = await prisma.patient.findUnique({
  where: { nationalId: '123456789' },
  include: {
    traumaPatients: true,
    strokeCases: true,
    stemiCases: true,
    // ... other portal records
  }
});
```

## 1. Database Schema (Prisma)

### Add to `prisma/schemas/enums.prisma`:
```prisma
enum TraumaModeOfArrival {
  RED_CRESCENT
  PRIVATE_CAR
  TRANSFERRED
}

enum TraumaMechanism {
  PENETRATING
  BLUNT
  BURN
  FALL
  MOTOR_VEHICLE_ACCIDENT
  OTHER
}

enum TraumaBodyRegion {
  HEAD_NECK
  FACE
  CHEST
  ABDOMEN
  EXTREMITIES
  EXTERNAL
}

enum TraumaInjurySeverity {
  NO_INJURY
  MINOR
  MODERATE
  SERIOUS
  SEVERE
  CRITICAL
  UNSURVIVABLE
}

enum TraumaDisposition {
  ADMISSION
  TRANSFER_EXTERNAL
  DISCHARGE_HOME
  DEATH_ED
  DAMA
}

enum GlasgowComaScale {
  GCS_3
  GCS_4
  GCS_5
  GCS_6
  GCS_7
  GCS_8
  GCS_9
  GCS_10
  GCS_11
  GCS_12
  GCS_13
  GCS_14
  GCS_15
}
```

### Create `prisma/schemas/trauma-patient.prisma`:
```prisma
model TraumaPatient {
  id                              String      @id @default(uuid())
  patientId                       String      @map("patient_id")
  hospitalId                      String      @map("hospital_id")
  
  // Basic Demographics
  arrivalDate                     DateTime    @map("arrival_date")
  arrivalTime                     DateTime?   @map("arrival_time")
  gender                          PatientGender
  
  // Arrival Information
  modeOfArrival                   TraumaModeOfArrival @map("mode_of_arrival")
  transferRequestDatetime         DateTime?   @map("transfer_request_datetime")
  transferArrivalDatetime         DateTime?   @map("transfer_arrival_datetime")
  transferDurationMinutes         Int?       @map("transfer_duration_minutes")
  
  // Clinical Information
  mechanismOfTrauma               TraumaMechanism @map("mechanism_of_trauma")
  primarySurveyFindings          String?     @map("primary_survey_findings")
  
  // Audit Fields
  createdAt                       DateTime    @default(now()) @map("created_at")
  updatedAt                       DateTime    @updatedAt @map("updated_at")
  deletedAt                       DateTime?   @map("deleted_at")
  createdById                     String      @map("created_by_id")
  
  // Relations
  patient                         Patient     @relation(fields: [patientId], references: [id])
  hospital                        Hospital    @relation(fields: [hospitalId], references: [id])
  createdBy                       User        @relation("TraumaPatientCreator", fields: [createdById], references: [id])
  
  // Related Models
  vitals                          TraumaVitals[]
  injuries                        TraumaInjury[]
  scores                          TraumaScore[]
  disposition                     TraumaDisposition[]
  
  @@map("trauma_patients")
  @@index([patientId])
  @@index([hospitalId])
  @@index([arrivalDate])
  @@index([modeOfArrival])
  @@index([mechanismOfTrauma])
  @@index([createdAt])
  @@index([createdById])
}
```

### Create `prisma/schemas/trauma-vitals.prisma`:
```prisma
model TraumaVitals {
  id                              String      @id @default(uuid())
  traumaPatientId                 String      @map("trauma_patient_id")
  
  // Vital Signs
  systolicBp                      Int?        @map("systolic_bp")
  diastolicBp                     Int?        @map("diastolic_bp")
  heartRate                       Int?        @map("heart_rate")
  respiratoryRate                 Int?        @map("respiratory_rate")
  temperature                     Decimal?    @db.Decimal(4,1)
  oxygenSaturation               Int?        @map("oxygen_saturation")
  glasgowComaScale               GlasgowComaScale? @map("glasgow_coma_scale")
  
  // Additional Vitals (JSON)
  additionalVitals               String?     @map("additional_vitals")
  
  // Calculated Scores
  rtsScore                       Decimal?    @map("rts_score") @db.Decimal(5,2)
  
  // Audit Fields
  createdAt                       DateTime    @default(now()) @map("created_at")
  createdById                     String      @map("created_by_id")
  
  // Relations
  traumaPatient                   TraumaPatient @relation(fields: [traumaPatientId], references: [id])
  createdBy                       User        @relation("TraumaVitalsCreator", fields: [createdById], references: [id])
  
  @@map("trauma_vitals")
  @@index([traumaPatientId])
  @@index([createdAt])
  @@index([createdById])
}
```

### Create `prisma/schemas/trauma-injuries.prisma`:
```prisma
model TraumaInjury {
  id                              String      @id @default(uuid())
  traumaPatientId                 String      @map("trauma_patient_id")
  
  // Injury Details
  bodyRegion                      TraumaBodyRegion @map("body_region")
  injurySeverity                 TraumaInjurySeverity @map("injury_severity")
  injuryDescription               String?     @map("injury_description")
  
  // AIS Scoring
  aisScore                       Int         @map("ais_score")
  
  // Audit Fields
  createdAt                       DateTime    @default(now()) @map("created_at")
  createdById                     String      @map("created_by_id")
  
  // Relations
  traumaPatient                   TraumaPatient @relation(fields: [traumaPatientId], references: [id])
  createdBy                       User        @relation("TraumaInjuryCreator", fields: [createdById], references: [id])
  
  @@map("trauma_injuries")
  @@index([traumaPatientId])
  @@index([bodyRegion])
  @@index([injurySeverity])
  @@index([createdAt])
  @@index([createdById])
}
```

### Create `prisma/schemas/trauma-scores.prisma`:
```prisma
model TraumaScore {
  id                              String      @id @default(uuid())
  traumaPatientId                 String      @map("trauma_patient_id")
  
  // ISS (Injury Severity Score)
  issScore                       Int?        @map("iss_score")
  
  // TRISS (Trauma and Injury Severity Score)
  trissProbability               Decimal?    @map("triss_probability") @db.Decimal(5,4)
  b0                             Decimal?    @db.Decimal(8,4)
  b1                             Decimal?    @db.Decimal(8,4)
  b2                             Decimal?    @db.Decimal(8,4)
  b3                             Decimal?    @db.Decimal(8,4)
  ageIndex                       Int?
  bCoefficient                   Decimal?    @map("b_coefficient") @db.Decimal(8,4)
  
  // Completion Flags
  completedRts                   Boolean     @default(false) @map("completed_rts")
  completedIss                   Boolean     @default(false) @map("completed_iss")
  completedTriss                 Boolean     @default(false) @map("completed_triss")
  
  // Audit Fields
  createdAt                       DateTime    @default(now()) @map("created_at")
  createdById                     String      @map("created_by_id")
  
  // Relations
  traumaPatient                   TraumaPatient @relation(fields: [traumaPatientId], references: [id])
  createdBy                       User        @relation("TraumaScoreCreator", fields: [createdById], references: [id])
  
  @@map("trauma_scores")
  @@index([traumaPatientId])
  @@index([createdAt])
  @@index([createdById])
}
```

### Create `prisma/schemas/trauma-disposition.prisma`:
```prisma
model TraumaDisposition {
  id                              String      @id @default(uuid())
  traumaPatientId                 String      @map("trauma_patient_id")
  
  // Disposition Details
  disposition                     TraumaDisposition @map("disposition")
  dispositionDatetime             DateTime?   @map("disposition_datetime")
  dispositionNotes                String?     @map("disposition_notes")
  
  // Audit Fields
  createdAt                       DateTime    @default(now()) @map("created_at")
  createdById                     String      @map("created_by_id")
  
  // Relations
  traumaPatient                   TraumaPatient @relation(fields: [traumaPatientId], references: [id])
  createdBy                       User        @relation("TraumaDispositionCreator", fields: [createdById], references: [id])
  
  @@map("trauma_disposition")
  @@index([traumaPatientId])
  @@index([disposition])
  @@index([createdAt])
  @@index([createdById])
}
```

## 2. Backend Implementation

### Create `src/modules/trauma-patients/trauma-patients.service.ts`:
```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTraumaPatientDto } from './dto/create-trauma-patient.dto';
import { UpdateTraumaPatientDto } from './dto/update-trauma-patient.dto';
import { TraumaPatient, TraumaModeOfArrival, TraumaMechanism } from '@prisma/client';
import { PatientMergeService } from '../patients/patient-merge.service';

@Injectable()
export class TraumaPatientsService {
  constructor(
    private prisma: PrismaService,
    private patientMergeService: PatientMergeService
  ) {}

  async create(createTraumaPatientDto: CreateTraumaPatientDto, userId: string): Promise<TraumaPatient> {
    let patientId = createTraumaPatientDto.patientId;
    
    // Auto-create patient if not provided but patientInfo is provided
    if (!patientId && createTraumaPatientDto.patientInfo) {
      // Check for existing patient by National ID first
      if (createTraumaPatientDto.patientInfo.nationalId) {
        const existingPatientId = await this.patientMergeService.findAndMergeDuplicatesByNationalId(
          createTraumaPatientDto.patientInfo.nationalId.trim()
        );
        
        if (existingPatientId) {
          patientId = existingPatientId;
        }
      }
      
      // If no existing patient found, create new one
      if (!patientId) {
        const patientData = {
          firstName: createTraumaPatientDto.patientInfo.firstName.trim(),
          lastName: createTraumaPatientDto.patientInfo.lastName.trim(),
          nationalId: createTraumaPatientDto.patientInfo.nationalId?.trim() || null,
          mrn: createTraumaPatientDto.patientInfo.mrn?.trim() || null,
          phoneNumber: createTraumaPatientDto.patientInfo.phoneNumber?.trim() || null,
          email: createTraumaPatientDto.patientInfo.email?.trim() || null,
          dateOfBirth: createTraumaPatientDto.patientInfo.dateOfBirth ? new Date(createTraumaPatientDto.patientInfo.dateOfBirth) : new Date('1900-01-01'),
          gender: createTraumaPatientDto.patientInfo.gender || 'UNKNOWN',
          createdById: userId,
        };
        
        const patient = await this.prisma.patient.create({ data: patientData });
        patientId = patient.id;
      }
    }

    if (!patientId) {
      throw new BadRequestException('Patient ID or patient information is required');
    }

    const traumaPatientData = {
      patientId,
      hospitalId: createTraumaPatientDto.hospitalId,
      arrivalDate: new Date(createTraumaPatientDto.arrivalDate),
      arrivalTime: createTraumaPatientDto.arrivalTime ? new Date(createTraumaPatientDto.arrivalTime) : null,
      gender: createTraumaPatientDto.gender,
      modeOfArrival: createTraumaPatientDto.modeOfArrival,
      transferRequestDatetime: createTraumaPatientDto.transferRequestDatetime ? new Date(createTraumaPatientDto.transferRequestDatetime) : null,
      transferArrivalDatetime: createTraumaPatientDto.transferArrivalDatetime ? new Date(createTraumaPatientDto.transferArrivalDatetime) : null,
      transferDurationMinutes: createTraumaPatientDto.transferDurationMinutes,
      mechanismOfTrauma: createTraumaPatientDto.mechanismOfTrauma,
      primarySurveyFindings: createTraumaPatientDto.primarySurveyFindings,
      createdById: userId,
    };

    return this.prisma.traumaPatient.create({
      data: traumaPatientData,
      include: {
        patient: true,
        hospital: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        vitals: true,
        injuries: true,
        disposition: true,
      },
    });
  }

  async findAll(filters?: {
    hospitalId?: string;
    modeOfArrival?: TraumaModeOfArrival;
    mechanismOfTrauma?: TraumaMechanism;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<TraumaPatient[]> {
    const where: any = {
      deletedAt: null,
    };

    if (filters?.hospitalId) {
      where.hospitalId = filters.hospitalId;
    }

    if (filters?.modeOfArrival) {
      where.modeOfArrival = filters.modeOfArrival;
    }

    if (filters?.mechanismOfTrauma) {
      where.mechanismOfTrauma = filters.mechanismOfTrauma;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.arrivalDate = {};
      if (filters.dateFrom) where.arrivalDate.gte = filters.dateFrom;
      if (filters.dateTo) where.arrivalDate.lte = filters.dateTo;
    }

    return this.prisma.traumaPatient.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            mrn: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
            hasTraumaService: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        vitals: true,
        injuries: true,
        disposition: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<TraumaPatient> {
    const traumaPatient = await this.prisma.traumaPatient.findUnique({
      where: { id, deletedAt: null },
      include: {
        patient: true,
        hospital: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        vitals: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        injuries: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        scores: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        disposition: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!traumaPatient) {
      throw new NotFoundException('Trauma patient not found');
    }

    return traumaPatient;
  }

  async update(id: string, updateTraumaPatientDto: UpdateTraumaPatientDto, userId: string): Promise<TraumaPatient> {
    const existingPatient = await this.findOne(id);

    return this.prisma.traumaPatient.update({
      where: { id },
      data: {
        ...updateTraumaPatientDto,
        arrivalDate: updateTraumaPatientDto.arrivalDate ? new Date(updateTraumaPatientDto.arrivalDate) : undefined,
        arrivalTime: updateTraumaPatientDto.arrivalTime ? new Date(updateTraumaPatientDto.arrivalTime) : undefined,
        transferRequestDatetime: updateTraumaPatientDto.transferRequestDatetime ? new Date(updateTraumaPatientDto.transferRequestDatetime) : undefined,
        transferArrivalDatetime: updateTraumaPatientDto.transferArrivalDatetime ? new Date(updateTraumaPatientDto.transferArrivalDatetime) : undefined,
        updatedAt: new Date(),
      },
      include: {
        patient: true,
        hospital: true,
        createdBy: true,
        vitals: true,
        injuries: true,
        disposition: true,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.traumaPatient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

### Create DTOs:
```typescript
// src/modules/trauma-patients/dto/create-trauma-patient.dto.ts
import { IsString, IsEnum, IsNotEmpty, IsOptional, IsDateString, IsInt, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TraumaModeOfArrival, TraumaMechanism, PatientGender } from '@prisma/client';

export class PatientInfoDto {
  @ApiProperty({ description: 'Patient first name' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ description: 'Patient last name' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ description: 'Patient national ID', required: false })
  @IsString()
  @IsOptional()
  nationalId?: string;

  @ApiProperty({ description: 'Patient MRN', required: false })
  @IsString()
  @IsOptional()
  mrn?: string;

  @ApiProperty({ description: 'Patient date of birth', required: false })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ description: 'Patient gender', enum: PatientGender, required: false })
  @IsEnum(PatientGender)
  @IsOptional()
  gender?: PatientGender;

  @ApiProperty({ description: 'Patient phone number', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ description: 'Patient email', required: false })
  @IsString()
  @IsOptional()
  email?: string;
}

export class CreateTraumaPatientDto {
  @ApiProperty({ description: 'Patient ID (if existing)', required: false })
  @IsString()
  @IsOptional()
  patientId?: string;

  @ApiProperty({ description: 'Patient information (if new patient)', required: false })
  @IsObject()
  @IsOptional()
  patientInfo?: PatientInfoDto;

  @ApiProperty({ description: 'Hospital ID' })
  @IsString()
  @IsNotEmpty()
  hospitalId!: string;

  @ApiProperty({ description: 'Arrival date' })
  @IsDateString()
  arrivalDate!: string;

  @ApiProperty({ description: 'Arrival time', required: false })
  @IsDateString()
  @IsOptional()
  arrivalTime?: string;

  @ApiProperty({ description: 'Patient gender', enum: PatientGender })
  @IsEnum(PatientGender)
  gender!: PatientGender;

  @ApiProperty({ description: 'Mode of arrival', enum: TraumaModeOfArrival })
  @IsEnum(TraumaModeOfArrival)
  modeOfArrival!: TraumaModeOfArrival;

  @ApiProperty({ description: 'Transfer request datetime', required: false })
  @IsDateString()
  @IsOptional()
  transferRequestDatetime?: string;

  @ApiProperty({ description: 'Transfer arrival datetime', required: false })
  @IsDateString()
  @IsOptional()
  transferArrivalDatetime?: string;

  @ApiProperty({ description: 'Transfer duration in minutes', required: false })
  @IsInt()
  @IsOptional()
  transferDurationMinutes?: number;

  @ApiProperty({ description: 'Mechanism of trauma', enum: TraumaMechanism })
  @IsEnum(TraumaMechanism)
  mechanismOfTrauma!: TraumaMechanism;

  @ApiProperty({ description: 'Primary survey findings', required: false })
  @IsString()
  @IsOptional()
  primarySurveyFindings?: string;
}
```

## 3. Frontend Implementation

### Create `src/services/traumaService.ts`:
```typescript
import { apiClient } from './apiClient';

export interface PatientInfo {
  firstName: string;
  lastName: string;
  nationalId?: string;
  mrn?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  phoneNumber?: string;
  email?: string;
}

export interface TraumaPatient {
  id: string;
  patientId: string;
  hospitalId: string;
  arrivalDate: string;
  arrivalTime?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  modeOfArrival: 'RED_CRESCENT' | 'PRIVATE_CAR' | 'TRANSFERRED';
  transferRequestDatetime?: string;
  transferArrivalDatetime?: string;
  transferDurationMinutes?: number;
  mechanismOfTrauma: 'PENETRATING' | 'BLUNT' | 'BURN' | 'FALL' | 'MOTOR_VEHICLE_ACCIDENT' | 'OTHER';
  primarySurveyFindings?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId?: string;
    mrn?: string;
    dateOfBirth: string;
    gender: string;
  };
  hospital: {
    id: string;
    name: string;
    hasTraumaService: boolean;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  vitals?: TraumaVitals[];
  injuries?: TraumaInjury[];
  scores?: TraumaScore[];
  disposition?: TraumaDisposition[];
}

export interface TraumaVitals {
  id: string;
  traumaPatientId: string;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  glasgowComaScale?: number;
  additionalVitals?: string;
  rtsScore?: number;
  createdAt: string;
  createdById: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TraumaInjury {
  id: string;
  traumaPatientId: string;
  bodyRegion: 'HEAD_NECK' | 'FACE' | 'CHEST' | 'ABDOMEN' | 'EXTREMITIES' | 'EXTERNAL';
  injurySeverity: 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL' | 'FATAL';
  injuryDescription?: string;
  aisScore: number;
  createdAt: string;
  createdById: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TraumaScore {
  id: string;
  traumaPatientId: string;
  issScore?: number;
  trissProbability?: number;
  b0?: number;
  b1?: number;
  b2?: number;
  b3?: number;
  ageIndex?: number;
  bCoefficient?: number;
  completedRts: boolean;
  completedIss: boolean;
  completedTriss: boolean;
  createdAt: string;
  createdById: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TraumaDisposition {
  id: string;
  traumaPatientId: string;
  disposition: 'ADMISSION' | 'TRANSFER_EXTERNAL' | 'DISCHARGE_HOME' | 'DEATH_ED' | 'DAMA';
  dispositionDatetime?: string;
  dispositionNotes?: string;
  createdAt: string;
  createdById: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TraumaKPISummary {
  avgTransferTimeMinutes?: number;
  minTransferTimeMinutes?: number;
  maxTransferTimeMinutes?: number;
  totalMajorTraumaPatients: number;
  completedSeverityAssessments: number;
  severityAssessmentPercentage?: number;
  edDeaths: number;
  edMortalityRate?: number;
  expectedMortalityRate?: number;
  kpi2Status?: string;
  kpi3Status?: string;
  kpi4Status?: string;
}

export interface CreateTraumaPatientRequest {
  patientId?: string;
  patientInfo?: PatientInfo;
  hospitalId: string;
  arrivalDate: string;
  arrivalTime?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  modeOfArrival: 'RED_CRESCENT' | 'PRIVATE_CAR' | 'TRANSFERRED';
  transferRequestDatetime?: string;
  transferArrivalDatetime?: string;
  transferDurationMinutes?: number;
  mechanismOfTrauma: 'PENETRATING' | 'BLUNT' | 'BURN' | 'FALL' | 'MOTOR_VEHICLE_ACCIDENT' | 'OTHER';
  primarySurveyFindings?: string;
}

class TraumaService {
  // Trauma Patients
  static async getTraumaPatients(filters?: {
    hospitalId?: string;
    modeOfArrival?: string;
    mechanismOfTrauma?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<TraumaPatient[]> {
    const params = new URLSearchParams();
    if (filters?.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters?.modeOfArrival) params.append('modeOfArrival', filters.modeOfArrival);
    if (filters?.mechanismOfTrauma) params.append('mechanismOfTrauma', filters.mechanismOfTrauma);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const response = await apiClient.get(`/trauma-patients?${params.toString()}`);
    return response.data;
  }

  static async getTraumaPatient(id: string): Promise<TraumaPatient> {
    const response = await apiClient.get(`/trauma-patients/${id}`);
    return response.data;
  }

  static async createTraumaPatient(data: CreateTraumaPatientRequest): Promise<TraumaPatient> {
    const response = await apiClient.post('/trauma-patients', data);
    return response.data;
  }

  static async updateTraumaPatient(id: string, data: Partial<CreateTraumaPatientRequest>): Promise<TraumaPatient> {
    const response = await apiClient.patch(`/trauma-patients/${id}`, data);
    return response.data;
  }

  static async deleteTraumaPatient(id: string): Promise<void> {
    await apiClient.delete(`/trauma-patients/${id}`);
  }

  // Trauma Vitals
  static async getTraumaVitals(traumaPatientId?: string): Promise<TraumaVitals[]> {
    const params = traumaPatientId ? `?traumaPatientId=${traumaPatientId}` : '';
    const response = await apiClient.get(`/trauma-vitals${params}`);
    return response.data;
  }

  static async createTraumaVitals(data: {
    traumaPatientId: string;
    systolicBp?: number;
    diastolicBp?: number;
    heartRate?: number;
    respiratoryRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    glasgowComaScale?: number;
    additionalVitals?: string;
  }): Promise<TraumaVitals> {
    const response = await apiClient.post('/trauma-vitals', data);
    return response.data;
  }

  // Trauma Injuries
  static async getTraumaInjuries(traumaPatientId?: string): Promise<TraumaInjury[]> {
    const params = traumaPatientId ? `?traumaPatientId=${traumaPatientId}` : '';
    const response = await apiClient.get(`/trauma-injuries${params}`);
    return response.data;
  }

  static async createTraumaInjury(data: {
    traumaPatientId: string;
    bodyRegion: 'HEAD_NECK' | 'FACE' | 'CHEST' | 'ABDOMEN' | 'EXTREMITIES' | 'EXTERNAL';
    injurySeverity: 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL' | 'FATAL';
    injuryDescription?: string;
    aisScore: number;
  }): Promise<TraumaInjury> {
    const response = await apiClient.post('/trauma-injuries', data);
    return response.data;
  }

  // Trauma Scores
  static async getTraumaScores(traumaPatientId?: string): Promise<TraumaScore[]> {
    const params = traumaPatientId ? `?traumaPatientId=${traumaPatientId}` : '';
    const response = await apiClient.get(`/trauma-scores${params}`);
    return response.data;
  }

  static async createTraumaScore(traumaPatientId: string): Promise<TraumaScore> {
    const response = await apiClient.post('/trauma-scores', { traumaPatientId });
    return response.data;
  }

  // Trauma Disposition
  static async getTraumaDisposition(traumaPatientId?: string): Promise<TraumaDisposition[]> {
    const params = traumaPatientId ? `?traumaPatientId=${traumaPatientId}` : '';
    const response = await apiClient.get(`/trauma-disposition${params}`);
    return response.data;
  }

  static async createTraumaDisposition(data: {
    traumaPatientId: string;
    disposition: 'ADMISSION' | 'TRANSFER_EXTERNAL' | 'DISCHARGE_HOME' | 'DEATH_ED' | 'DAMA';
    dispositionDatetime?: string;
    dispositionNotes?: string;
  }): Promise<TraumaDisposition> {
    const response = await apiClient.post('/trauma-disposition', data);
    return response.data;
  }

  // KPI Summary
  static async getKPISummary(hospitalId?: string): Promise<TraumaKPISummary> {
    const params = hospitalId ? `?hospitalId=${hospitalId}` : '';
    const response = await apiClient.get(`/trauma-kpis${params}`);
    return response.data;
  }
}

export const traumaService = TraumaService;
export default TraumaService;
```

## 4. Detailed Form Inputs

### Step 1: Patient Information
- **First Name** (required)
- **Last Name** (required)
- **National ID** (optional, used for patient linking)
- **MRN** (Medical Record Number, optional)
- **Date of Birth** (optional)
- **Gender** (dropdown: MALE, FEMALE, OTHER, UNKNOWN)
- **Phone Number** (optional)
- **Email** (optional)

### Step 2: Trauma Details
- **Arrival Date** (required, date picker)
- **Arrival Time** (optional, time picker)
- **Mode of Arrival** (required, dropdown):
  - Red Crescent
  - Private Car
  - Transferred
- **Transfer Request Datetime** (optional, if transferred)
- **Transfer Arrival Datetime** (optional, if transferred)
- **Transfer Duration Minutes** (auto-calculated or manual)
- **Mechanism of Trauma** (required, dropdown):
  - Penetrating
  - Blunt
  - Burn
  - Fall
  - Motor Vehicle Accident
  - Other

### Step 3: Vital Signs
- **Systolic Blood Pressure** (mmHg, number input)
- **Diastolic Blood Pressure** (mmHg, number input)
- **Heart Rate** (beats/min, number input)
- **Respiratory Rate** (breaths/min, number input)
- **Temperature** (°C, decimal input)
- **Oxygen Saturation** (%, number input)
- **Glasgow Coma Scale** (dropdown: GCS 3-15):
  - GCS 3
  - GCS 4
  - GCS 5
  - GCS 6
  - GCS 7
  - GCS 8
  - GCS 9
  - GCS 10
  - GCS 11
  - GCS 12
  - GCS 13
  - GCS 14
  - GCS 15
- **Additional Vital Signs** (text area for HR, SpO2, Temp, etc.)

### Step 4: Injury Categories (AIS Scoring)

#### 1. Head and Neck (Includes Cervical Spine)
**Injury Severity Dropdown:**
- **No Injury**: • No injury
- **Minor**: • All Other Injuries
- **Moderate**: 
  - • Tiny Epidural, Subdural, or Intracerebral Hematoma
  - • Intra-ventricular hemorrhage or subarachnoid hemorrhage
  - • Simple undisplaced Skull Fracture
  - • Penetrating Neck Injury with tissue loss
- **Serious**: 
  - • Mild Brain Edema (Compressed ventricles without brain stem cisterns)
  - • Small Brain Contusion
  - • Superficial penetrating injury to skull (less than 2 cm deep)
  - • Penetrating Neck Injury with major blood loss (More than 20%)
- **Severe**: 
  - • Moderate Brain Edema (Compressed ventricles and brain stem cisterns)
- **Critical**: [Additional critical injuries]
- **Unsurvivable**: [Unsurvivable injuries]

**Additional Fields:**
- **Injury Description** (text area)
- **AIS Score** (auto-calculated based on severity selection)

#### 2. Face (Facial Skeleton, Nose, Mouth, Eyes, & Ears)
**Injury Severity Dropdown:**
- **No Injury**: • No injury
- **Minor**: • All Other Injuries
- **Moderate**: • [Moderate facial injuries]
- **Serious**: • [Serious facial injuries]
- **Severe**: • [Severe facial injuries]
- **Critical**: • [Critical facial injuries]
- **Unsurvivable**: • [Unsurvivable facial injuries]

**Additional Fields:**
- **Injury Description** (text area)
- **AIS Score** (auto-calculated)

#### 3. Chest (Thoracic Spine and Diaphragm)
**Injury Severity Dropdown:**
- **No Injury**: • No injury
- **Minor**: • All Other Injuries
- **Moderate**: • [Moderate chest injuries]
- **Serious**: • [Serious chest injuries]
- **Severe**: • [Severe chest injuries]
- **Critical**: • [Critical chest injuries]
- **Unsurvivable**: • [Unsurvivable chest injuries]

**Additional Fields:**
- **Injury Description** (text area)
- **AIS Score** (auto-calculated)

#### 4. Abdomen (Abdominal Organs and Lumbar Spine)
**Injury Severity Dropdown:**
- **No Injury**: • No injury
- **Minor**: • All Other Injuries
- **Moderate**: • [Moderate abdominal injuries]
- **Serious**: • [Serious abdominal injuries]
- **Severe**: • [Severe abdominal injuries]
- **Critical**: • [Critical abdominal injuries]
- **Unsurvivable**: • [Unsurvivable abdominal injuries]

**Additional Fields:**
- **Injury Description** (text area)
- **AIS Score** (auto-calculated)

#### 5. Extremities or Pelvic Girdle (Including Pelvic Skeleton Injuries, Extremity Injuries, Sprains, Fractures, Dislocations)
**Injury Severity Dropdown:**
- **No Injury**: • No injury
- **Minor**: • All Other Injuries
- **Moderate**: • [Moderate extremity injuries]
- **Serious**: • [Serious extremity injuries]
- **Severe**: • [Severe extremity injuries]
- **Critical**: • [Critical extremity injuries]
- **Unsurvivable**: • [Unsurvivable extremity injuries]

**Additional Fields:**
- **Injury Description** (text area)
- **AIS Score** (auto-calculated)

#### 6. External and Other
**Injury Severity Dropdown:**
- **No Injury**: • No injury
- **Minor**: • All Other Injuries
- **Moderate**: 
  - • 2nd or 3rd degree burns involving 10% to 19% of Total Body Surface
- **Serious**: 
  - • Total scalp avulsion or scalp injury with significant blood loss
  - • 2nd or 3rd degree burns involving 20% to 29% of Total Body Surface
  - • Near drowning without neurological deficit
- **Severe**: 
  - • 2nd or 3rd degree burns involving 30% to 39% of Total Body Surface
  - • Near drowning with neurological deficit
- **Critical**: 
  - • 2nd or 3rd degree burns involving 40% to 90% of Total Body Surface
  - • Drowning with cardiac arrest
- **Unsurvivable**: 
  - • 2nd or 3rd degree burns involving most of Total Body Surface

**Additional Fields:**
- **Injury Description** (text area)
- **AIS Score** (auto-calculated)

### Step 5: Assessment & Disposition
- **Primary Survey Findings** (text area for ABCDE assessment findings)
- **ED Disposition** (required, dropdown):
  - Admission
  - Transferred to another hospital
  - Discharged home
  - Death in ED
  - DAMA
- **Disposition Notes** (text area)
- **Disposition Datetime** (optional, date/time picker)

## 5. Detailed Injury Severity Options

### Head and Neck (Includes Cervical Spine) - Complete Options
**Injury Severity Dropdown with Specific Descriptions:**

1. **No Injury**: • No injury
2. **Minor**: • All Other Injuries
3. **Moderate**: 
   - • Tiny Epidural, Subdural, or Intracerebral Hematoma
   - • Intra-ventricular hemorrhage or subarachnoid hemorrhage
   - • Simple undisplaced Skull Fracture
   - • Penetrating Neck Injury with tissue loss
4. **Serious**: 
   - • Mild Brain Edema (Compressed ventricles without brain stem cisterns)
   - • Small Brain Contusion
   - • Superficial penetrating injury to skull (less than 2 cm deep)
   - • Penetrating Neck Injury with major blood loss (More than 20%)
5. **Severe**: 
   - • Moderate Brain Edema (Compressed ventricles and brain stem cisterns)
6. **Critical**: [Additional critical injuries to be defined]
7. **Unsurvivable**: [Unsurvivable injuries to be defined]

### External and Other (Includes Injuries Such as Lacerations, Contusions, Burns or Hypothermia) - Complete Options
**Injury Severity Dropdown with Specific Descriptions:**

1. **No Injury**: • No injury
2. **Minor**: • All Other Injuries
3. **Moderate**: 
   - • 2nd or 3rd degree burns involving 10% to 19% of Total Body Surface
4. **Serious**: 
   - • Total scalp avulsion or scalp injury with significant blood loss
   - • 2nd or 3rd degree burns involving 20% to 29% of Total Body Surface
   - • Near drowning without neurological deficit
5. **Severe**: 
   - • 2nd or 3rd degree burns involving 30% to 39% of Total Body Surface
   - • Near drowning with neurological deficit
6. **Critical**: 
   - • 2nd or 3rd degree burns involving 40% to 90% of Total Body Surface
   - • Drowning with cardiac arrest
7. **Unsurvivable**: 
   - • 2nd or 3rd degree burns involving most of Total Body Surface

### Other Body Regions
For Face, Chest, Abdomen, and Extremities, the injury severity options follow the same structure:
- **No Injury**: • No injury
- **Minor**: • All Other Injuries
- **Moderate**: • [Specific moderate injuries for each region]
- **Serious**: • [Specific serious injuries for each region]
- **Severe**: • [Specific severe injuries for each region]
- **Critical**: • [Specific critical injuries for each region]
- **Unsurvivable**: • [Specific unsurvivable injuries for each region]

*Note: Specific injury descriptions for Face, Chest, Abdomen, and Extremities should be added based on medical standards and AIS guidelines.*

## 6. Form Component Implementation

### Key Form Features:
- **Multi-step wizard** with 5 steps: Patient Info → Trauma Details → Vital Signs → Injuries → Assessment & Disposition
- **Dynamic injury severity dropdowns** with specific medical descriptions
- **Auto-calculated AIS scores** based on severity selection
- **Real-time validation** with immediate feedback
- **Patient linking** via National ID for cross-portal integration

### Injury Severity Implementation:
Each body region will have a dropdown with the exact text you provided:
- **Head and Neck**: Complete with all specific injury descriptions
- **External**: Complete with burn and drowning descriptions
- **Other regions**: Placeholder structure ready for specific medical descriptions

### Vital Signs Implementation:
- **Glasgow Coma Scale**: Dropdown with GCS 3-15 options
- **Blood Pressure**: Separate systolic/diastolic inputs
- **Additional Vitals**: Free-text area for HR, SpO2, Temp, etc.

## 7. TypeScript Interfaces

### Create `src/pages/Trauma/types/TraumaFormData.ts`:
```typescript
export interface TraumaFormData {
  patientInfo: {
    firstName: string;
    lastName: string;
    nationalId?: string;
    mrn?: string;
    dateOfBirth?: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
    phoneNumber?: string;
    email?: string;
  };
  traumaDetails: {
    arrivalDate: Date;
    arrivalTime?: Date;
    modeOfArrival: 'RED_CRESCENT' | 'PRIVATE_CAR' | 'TRANSFERRED';
    transferRequestDatetime?: Date;
    transferArrivalDatetime?: Date;
    transferDurationMinutes?: number;
    mechanismOfTrauma: 'PENETRATING' | 'BLUNT' | 'BURN' | 'FALL' | 'MOTOR_VEHICLE_ACCIDENT' | 'OTHER';
  };
  vitalSigns: {
    systolicBp?: number;
    diastolicBp?: number;
    heartRate?: number;
    respiratoryRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    glasgowComaScale?: 'GCS_3' | 'GCS_4' | 'GCS_5' | 'GCS_6' | 'GCS_7' | 'GCS_8' | 'GCS_9' | 'GCS_10' | 'GCS_11' | 'GCS_12' | 'GCS_13' | 'GCS_14' | 'GCS_15';
    additionalVitals?: string;
  };
  injuries: {
    headNeck: { 
      severity: 'NO_INJURY' | 'MINOR' | 'MODERATE' | 'SERIOUS' | 'SEVERE' | 'CRITICAL' | 'UNSURVIVABLE';
      description: string;
      aisScore: number;
    };
    face: { 
      severity: 'NO_INJURY' | 'MINOR' | 'MODERATE' | 'SERIOUS' | 'SEVERE' | 'CRITICAL' | 'UNSURVIVABLE';
      description: string;
      aisScore: number;
    };
    chest: { 
      severity: 'NO_INJURY' | 'MINOR' | 'MODERATE' | 'SERIOUS' | 'SEVERE' | 'CRITICAL' | 'UNSURVIVABLE';
      description: string;
      aisScore: number;
    };
    abdomen: { 
      severity: 'NO_INJURY' | 'MINOR' | 'MODERATE' | 'SERIOUS' | 'SEVERE' | 'CRITICAL' | 'UNSURVIVABLE';
      description: string;
      aisScore: number;
    };
    extremities: { 
      severity: 'NO_INJURY' | 'MINOR' | 'MODERATE' | 'SERIOUS' | 'SEVERE' | 'CRITICAL' | 'UNSURVIVABLE';
      description: string;
      aisScore: number;
    };
    external: { 
      severity: 'NO_INJURY' | 'MINOR' | 'MODERATE' | 'SERIOUS' | 'SEVERE' | 'CRITICAL' | 'UNSURVIVABLE';
      description: string;
      aisScore: number;
    };
  };
  assessmentDisposition: {
    primarySurveyFindings?: string;
    disposition: 'ADMISSION' | 'TRANSFER_EXTERNAL' | 'DISCHARGE_HOME' | 'DEATH_ED' | 'DAMA';
    dispositionNotes?: string;
    dispositionDatetime?: Date;
  };
}

// AIS Score Mapping
export const AIS_SCORE_MAPPING = {
  NO_INJURY: 0,
  MINOR: 1,
  MODERATE: 2,
  SERIOUS: 3,
  SEVERE: 4,
  CRITICAL: 5,
  UNSURVIVABLE: 6,
} as const;

// Glasgow Coma Scale Options
export const GCS_OPTIONS = [
  { value: 'GCS_3', label: 'GCS 3' },
  { value: 'GCS_4', label: 'GCS 4' },
  { value: 'GCS_5', label: 'GCS 5' },
  { value: 'GCS_6', label: 'GCS 6' },
  { value: 'GCS_7', label: 'GCS 7' },
  { value: 'GCS_8', label: 'GCS 8' },
  { value: 'GCS_9', label: 'GCS 9' },
  { value: 'GCS_10', label: 'GCS 10' },
  { value: 'GCS_11', label: 'GCS 11' },
  { value: 'GCS_12', label: 'GCS 12' },
  { value: 'GCS_13', label: 'GCS 13' },
  { value: 'GCS_14', label: 'GCS 14' },
  { value: 'GCS_15', label: 'GCS 15' },
] as const;

// Injury Severity Options
export const INJURY_SEVERITY_OPTIONS = [
  { value: 'NO_INJURY', label: 'No Injury' },
  { value: 'MINOR', label: 'Minor' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'SERIOUS', label: 'Serious' },
  { value: 'SEVERE', label: 'Severe' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'UNSURVIVABLE', label: 'Unsurvivable' },
] as const;

// Body Region Options
export const BODY_REGION_OPTIONS = [
  { value: 'HEAD_NECK', label: 'Head and Neck (Includes Cervical Spine)' },
  { value: 'FACE', label: 'Face (Facial Skeleton, Nose, Mouth, Eyes, & Ears)' },
  { value: 'CHEST', label: 'Chest (Thoracic Spine and Diaphragm)' },
  { value: 'ABDOMEN', label: 'Abdomen (Abdominal Organs and Lumbar Spine)' },
  { value: 'EXTREMITIES', label: 'Extremities or Pelvic Girdle' },
  { value: 'EXTERNAL', label: 'External and Other' },
] as const;
```

## 6. Form Components

### Create `src/pages/Trauma/components/MultiStepTraumaForm.tsx`:
```typescript
import React, { useState } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Alert } from '@mui/material';
import PatientInfoStep from './MultiStepTraumaForm/PatientInfoStep';
import TraumaDetailsStep from './MultiStepTraumaForm/TraumaDetailsStep';
import VitalSignsStep from './MultiStepTraumaForm/VitalSignsStep';
import InjuriesStep from './MultiStepTraumaForm/InjuriesStep';
import AssessmentDispositionStep from './MultiStepTraumaForm/AssessmentDispositionStep';
import { TraumaFormData } from '../types/TraumaFormData';

interface MultiStepTraumaFormProps {
  onSubmit: (data: TraumaFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const steps = [
  'Patient Information',
  'Trauma Details',
  'Vital Signs',
  'Injuries',
  'Assessment & Disposition'
];

const MultiStepTraumaForm: React.FC<MultiStepTraumaFormProps> = ({
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<TraumaFormData>({
    patientInfo: {
      firstName: '',
      lastName: '',
      nationalId: '',
      mrn: '',
      dateOfBirth: '',
      gender: 'UNKNOWN',
      phoneNumber: '',
      email: '',
    },
    traumaDetails: {
      arrivalDate: new Date(),
      arrivalTime: new Date(),
      modeOfArrival: 'RED_CRESCENT',
      transferRequestDatetime: undefined,
      transferArrivalDatetime: undefined,
      mechanismOfTrauma: 'MOTOR_VEHICLE_ACCIDENT',
    },
    vitalSigns: {
      systolicBp: undefined,
      diastolicBp: undefined,
      heartRate: undefined,
      respiratoryRate: undefined,
      temperature: undefined,
      oxygenSaturation: undefined,
      glasgowComaScale: undefined,
      additionalVitals: '',
    },
    injuries: {
      headNeck: { severity: 'NO_INJURY', description: '', aisScore: 0 },
      face: { severity: 'NO_INJURY', description: '', aisScore: 0 },
      chest: { severity: 'NO_INJURY', description: '', aisScore: 0 },
      abdomen: { severity: 'NO_INJURY', description: '', aisScore: 0 },
      extremities: { severity: 'NO_INJURY', description: '', aisScore: 0 },
      external: { severity: 'NO_INJURY', description: '', aisScore: 0 },
    },
    assessmentDisposition: {
      primarySurveyFindings: '',
      disposition: 'ADMISSION',
      dispositionNotes: '',
    },
  });

  const updateFormData = (section: keyof TraumaFormData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(formData.patientInfo.firstName && formData.patientInfo.lastName);
      case 1:
        return !!(formData.traumaDetails.arrivalDate && formData.traumaDetails.mechanismOfTrauma);
      case 2:
        return true; // Vital signs are optional
      case 3:
        return true; // Injuries are optional
      case 4:
        return !!(formData.assessmentDisposition.disposition);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to create trauma patient');
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <PatientInfoStep
            formData={formData.patientInfo}
            updateFormData={(data) => updateFormData('patientInfo', data)}
          />
        );
      case 1:
        return (
          <TraumaDetailsStep
            formData={formData.traumaDetails}
            updateFormData={(data) => updateFormData('traumaDetails', data)}
          />
        );
      case 2:
        return (
          <VitalSignsStep
            formData={formData.vitalSigns}
            updateFormData={(data) => updateFormData('vitalSigns', data)}
          />
        );
      case 3:
        return (
          <InjuriesStep
            formData={formData.injuries}
            updateFormData={(data) => updateFormData('injuries', data)}
          />
        );
      case 4:
        return (
          <AssessmentDispositionStep
            formData={formData.assessmentDisposition}
            updateFormData={(data) => updateFormData('assessmentDisposition', data)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ minHeight: 400 }}>
        {renderStepContent(activeStep)}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={!isStepValid(activeStep) || loading}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Patient'}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default MultiStepTraumaForm;
```

## 7. Implementation Steps

### Phase 1: Database Setup
1. **Add Prisma Schema Files**: Add all trauma-related schema files to `prisma/schemas/`
2. **Update Main Schema**: Include trauma models in the main `schema.prisma`
3. **Generate Prisma Client**: Run `npx prisma generate`
4. **Run Migrations**: Execute `npx prisma migrate dev` to create database tables

### Phase 2: Backend Implementation
5. **Create DTOs**: Implement all trauma-related DTOs with validation
6. **Create Services**: Implement trauma services with patient linking logic
7. **Create Controllers**: Implement API endpoints for all trauma operations
8. **Create Modules**: Define trauma modules and add to app module
9. **Add Patient Merge Logic**: Ensure trauma patients link to existing patients by National ID

### Phase 3: Frontend Implementation
10. **Create Type Definitions**: Implement all TypeScript interfaces
11. **Create Service Layer**: Implement trauma service for API communication
12. **Create Form Components**: Implement multi-step trauma form with all detailed inputs
13. **Create Portal Pages**: Implement trauma portal dashboard and patient management
14. **Add Routes**: Add trauma portal routes to the main App.tsx
15. **Add Navigation**: Add trauma portal to sidebar navigation

### Phase 4: Testing & Validation
16. **Test Patient Linking**: Verify National ID-based patient linking works correctly
17. **Test Form Validation**: Ensure all form inputs validate properly
18. **Test AIS Scoring**: Verify automatic AIS score calculation
19. **Test KPI Calculations**: Verify trauma KPI calculations work correctly
20. **Test Cross-Portal Queries**: Verify patient history across portals works

## 8. Key Features

### Core Functionality
- **Patient Management**: Auto-create patients or link to existing ones via National ID
- **Multi-Portal Integration**: Seamless integration with Stroke and STEMI portals
- **Cross-Portal Patient History**: View complete patient history across all care pathways

### Trauma-Specific Features
- **Comprehensive Vital Signs**: Track systolic/diastolic BP, HR, RR, temp, SpO2, GCS
- **Detailed Injury Documentation**: Document injuries by 6 body regions with specific severity levels
- **AIS Scoring**: Automatic Abbreviated Injury Scale scoring based on severity selection
- **Trauma Scoring**: Automatic ISS (Injury Severity Score) and TRISS calculations
- **Transfer Management**: Track transfer times and durations for performance metrics

### Clinical Workflow
- **Multi-Step Form**: Intuitive 5-step form for complete trauma documentation
- **ABCDE Assessment**: Primary survey findings documentation
- **Disposition Tracking**: Complete ED disposition management
- **Real-Time Validation**: Form validation with immediate feedback

### Analytics & Reporting
- **KPI Dashboard**: Real-time trauma care performance metrics
- **Transfer Time Analysis**: Average, min, max transfer times
- **Mortality Tracking**: ED mortality rates and expected vs actual outcomes
- **Severity Assessment**: Completion rates for trauma severity assessments
- **Timeline View**: Visual timeline of trauma care events

### Data Management
- **Patient Deduplication**: Automatic detection and merging of duplicate patients
- **Data Export**: Export trauma data for reporting and analysis
- **Audit Trail**: Complete audit trail for all trauma records
- **Data Integrity**: Validation and consistency checks across all data points

This implementation provides a comprehensive trauma portal that integrates seamlessly with the existing RCC Healthcare Platform architecture while maintaining the one-patient, multiple-records design pattern.
