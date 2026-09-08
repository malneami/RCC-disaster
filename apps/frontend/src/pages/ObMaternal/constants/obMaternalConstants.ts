import type {
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
} from '../../../services/obMaternalTransferService';

export const OB_STATUS_OPTIONS: { value: ObMaternalTransferStatus; label: string }[] = [
  { value: 'CREATED', label: 'Created' },
  { value: 'ACTIVATED', label: 'Activated' },
  { value: 'OB_CONNECTED', label: 'OB Connected' },
  { value: 'DECISION_MADE', label: 'Decision Made' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'DEPARTED', label: 'Departed' },
  { value: 'ARRIVED', label: 'Arrived' },
  { value: 'CLOSED', label: 'Closed' },
];

export const ACTIVATION_LEVEL_OPTIONS: { value: ObActivationLevel; label: string }[] = [
  { value: 'MATERNAL_RED', label: 'Maternal Red' },
  { value: 'MATERNAL_ORANGE', label: 'Maternal Orange' },
];

export const EXPECTED_DELIVERY_MODE_OPTIONS: { value: ObExpectedDeliveryMode; label: string }[] = [
  { value: 'VAGINAL', label: 'Vaginal' },
  { value: 'CESAREAN', label: 'Cesarean' },
  { value: 'PENDING', label: 'Pending' },
];

export const SYSTEM_SUGGESTED_DELIVERY_MODE_OPTIONS: {
  value: ObSystemSuggestedDeliveryMode;
  label: string;
}[] = [
  { value: 'LIKELY_CS', label: 'Likely CS' },
  { value: 'LIKELY_VAGINAL', label: 'Likely Vaginal' },
  { value: 'PENDING', label: 'Pending' },
];

export const PHYSICIAN_CONFIRMED_DELIVERY_MODE_OPTIONS: {
  value: ObPhysicianConfirmedDeliveryMode;
  label: string;
}[] = [
  { value: 'VAGINAL', label: 'Vaginal' },
  { value: 'CESAREAN', label: 'Cesarean' },
];

export const ACCEPTANCE_STATUS_OPTIONS: { value: ObAcceptanceStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
];

export const AMBULANCE_TYPE_OPTIONS: { value: ObAmbulanceType; label: string }[] = [
  { value: 'BLS', label: 'BLS' },
  { value: 'ALS', label: 'ALS' },
  { value: 'AIR', label: 'Air' },
];

export const CONSCIOUSNESS_OPTIONS: { value: ObConsciousness; label: string }[] = [
  { value: 'ALERT', label: 'Alert' },
  { value: 'VERBAL', label: 'Verbal' },
  { value: 'PAIN', label: 'Pain' },
  { value: 'UNRESPONSIVE', label: 'Unresponsive' },
];

export const BLEEDING_OPTIONS: { value: ObBleeding; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'MILD', label: 'Mild' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'SEVERE', label: 'Severe' },
];

export const FETAL_STATUS_OPTIONS: { value: ObFetalStatus; label: string }[] = [
  { value: 'REASSURING', label: 'Reassuring' },
  { value: 'NONREASSURING', label: 'Non-reassuring' },
  { value: 'UNKNOWN', label: 'Unknown' },
];

export const COMMON_SUSPECTED_CONDITIONS = [
  'Preeclampsia',
  'Eclampsia',
  'Placental abruption',
  'Placenta previa',
  'PPROM',
  'Severe hemorrhage',
  'Cardiac arrest',
  'Respiratory failure',
  'Other',
];

export const COMMON_STABILIZATION_ITEMS = [
  'IV access',
  'Fluid resuscitation',
  'Blood transfusion',
  'Magnesium sulfate',
  'Antihypertensive',
  'Oxygen',
  'Intubation',
  'CPR',
  'Other',
];

export const MATERNAL_STATUS_OPTIONS = [
  { value: 'ALIVE', label: 'Alive' },
  { value: 'DECEASED', label: 'Deceased' },
];

export const PERINATAL_STATUS_OPTIONS = [
  { value: 'ALIVE', label: 'Alive' },
  { value: 'STILLBIRTH', label: 'Stillbirth' },
  { value: 'NEONATAL_DEATH', label: 'Neonatal Death' },
  { value: 'UNKNOWN', label: 'Unknown' },
];

export const OB_FORM_STEPS = [
  'Patient & OB Info',
  'Vitals & Clinical',
  'Referring Facility',
  'Activation & Delivery',
  'Destination',
  'Ambulance & Review',
];
