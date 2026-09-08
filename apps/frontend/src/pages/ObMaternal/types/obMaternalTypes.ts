import type {
  ObMaternalTransfer,
  ObMaternalTransferStatus,
  ObActivationLevel,
  ObExpectedDeliveryMode,
  ObSystemSuggestedDeliveryMode,
  ObPhysicianConfirmedDeliveryMode,
  ObAcceptanceStatus,
  ObAmbulanceType,
  ObConsciousness,
  ObBleeding,
  ObFetalStatus,
  CreateObMaternalTransferData,
  UpdateObMaternalTransferData,
  ObMaternalTransferFilters,
} from '../../../services/obMaternalTransferService';

export type {
  ObMaternalTransfer,
  ObMaternalTransferStatus,
  ObActivationLevel,
  ObExpectedDeliveryMode,
  ObSystemSuggestedDeliveryMode,
  ObPhysicianConfirmedDeliveryMode,
  ObAcceptanceStatus,
  ObAmbulanceType,
  ObConsciousness,
  ObBleeding,
  ObFetalStatus,
  CreateObMaternalTransferData,
  UpdateObMaternalTransferData,
  ObMaternalTransferFilters,
};

export interface ObMaternalFormData {
  ticketId: string;
  patientId: string;
  patientDisplay?: string;
  pregnancyCaseId?: string;
  gestationalAgeWeeks: number;
  gravida?: number;
  para?: number;
  sbp?: number;
  dbp?: number;
  hr?: number;
  rr?: number;
  temp?: number;
  spo2?: number;
  consciousness?: ObConsciousness;
  bleeding?: ObBleeding;
  seizure?: boolean;
  suspectedConditions?: string[];
  fetalStatus?: ObFetalStatus;
  fetalHeartRate?: number;
  hb?: number;
  platelets?: number;
  glucose?: number;
  urineProtein?: string;
  labsOther?: Record<string, unknown>;
  stabilizationDone?: string[];
  referringFacilityId: string;
  referringContactName: string;
  referringContactPhone: string;
  activationLevel: ObActivationLevel;
  expectedDeliveryMode: ObExpectedDeliveryMode;
  systemSuggestedDeliveryMode?: ObSystemSuggestedDeliveryMode;
  physicianConfirmedDeliveryMode?: ObPhysicianConfirmedDeliveryMode;
  destinationHospitalId: string;
  acceptanceStatus: ObAcceptanceStatus;
  ambulanceType: ObAmbulanceType;
}
