import { TraumaModeOfArrival, TraumaMechanismOfInjury, TraumaDispositionType } from '@prisma/client';

export class TraumaCaseResponseDto {
  id!: string;
  ticketId!: string;
  patientId!: string;
  originHospitalId!: string;
  destinationHospitalId?: string;
  
  // Date and Time Information
  arrivalDateTime!: Date;
  incidentDateTime?: Date;
  modeOfArrival!: TraumaModeOfArrival;
  transferRequestDateTime?: Date;
  transferArrivalDateTime?: Date;
  transferDurationMinutes?: number;
  
  // Chief Complaint and Mechanism
  chiefComplaint?: string;
  mechanismOfInjury!: TraumaMechanismOfInjury;
  
  // Vital Signs
  vitalSigns?: any;
  glasgowComaScale?: number;
  systolicBloodPressure?: number;
  respiratoryRate?: number;
  additionalVitalSigns?: string;
  
  // Injury Information - Body Regions
  headAndNeckInjury?: string;
  faceInjury?: string;
  chestInjury?: string;
  abdomenInjury?: string;
  extremitiesInjury?: string;
  externalInjury?: string;
  
  // Assessment and Disposition
  primarySurveyFindings?: string;
  edDisposition?: TraumaDispositionType;
  additionalNotes?: string;
  disposition?: any;
  
  // KPI Tracking
  responseTimeMinutes?: number;
  criticalCase!: boolean;
  transferCase!: boolean;
  averageGlasgowScore?: number;
  mortalityRate?: number;
  averageLengthOfStay?: number;
  
  // Audit Fields
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;
  createdById!: string;
  
  // Relations
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId?: string;
    mrn?: string;
    dateOfBirth: Date;
    gender: string;
    phoneNumber?: string;
    email?: string;
  };
  
  originHospital?: {
    id: string;
    name: string;
    cluster: string;
  };
  
  destinationHospital?: {
    id: string;
    name: string;
    cluster: string;
  };
  
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
