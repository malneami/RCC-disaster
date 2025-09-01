import { FilterField } from '../../../components/common/FilterComponents';

/**
 * Patient filter field configuration
 */
export const patientFilterFields: FilterField[] = [
  {
    key: 'gender',
    label: 'Gender',
    type: 'select',
    gridSize: 6,
    options: [
      { value: '', label: 'All Genders' },
      { value: 'MALE', label: 'Male' },
      { value: 'FEMALE', label: 'Female' },
      { value: 'OTHER', label: 'Other' },
      { value: 'UNKNOWN', label: 'Unknown' },
    ],
  },
  {
    key: 'bloodType',
    label: 'Blood Type',
    type: 'select',
    gridSize: 6,
    options: [
      { value: '', label: 'All Blood Types' },
      { value: 'A+', label: 'A+' },
      { value: 'A-', label: 'A-' },
      { value: 'B+', label: 'B+' },
      { value: 'B-', label: 'B-' },
      { value: 'AB+', label: 'AB+' },
      { value: 'AB-', label: 'AB-' },
      { value: 'O+', label: 'O+' },
      { value: 'O-', label: 'O-' },
    ],
  },
  {
    key: 'city',
    label: 'City',
    type: 'text',
    gridSize: 6,
    placeholder: 'Enter city name',
  },
  {
    key: 'ageRange',
    label: 'Age Range',
    type: 'select',
    gridSize: 6,
    options: [
      { value: '', label: 'All Ages' },
      { value: '0-18', label: '0-18 years' },
      { value: '19-30', label: '19-30 years' },
      { value: '31-50', label: '31-50 years' },
      { value: '51-65', label: '51-65 years' },
      { value: '65+', label: '65+ years' },
    ],
  },
  {
    key: 'hasAllergies',
    label: 'Has Allergies',
    type: 'boolean',
    gridSize: 4,
  },
  {
    key: 'hasMedications',
    label: 'Has Medications',
    type: 'boolean',
    gridSize: 4,
  },
  {
    key: 'hasMedicalHistory',
    label: 'Has Medical History',
    type: 'boolean',
    gridSize: 4,
  },
];

/**
 * Example of how to use the global filter components for patients
 */
export const createPatientFilterDialog = (
  open: boolean,
  filters: any,
  onClose: () => void,
  onApply: (filters: any) => void,
  onReset: () => void
) => {
  return {
    open,
    title: 'Filter Patients',
    fields: patientFilterFields,
    values: filters,
    onClose,
    onApply,
    onReset,
    applyButtonText: 'Apply Filters',
    resetButtonText: 'Reset All',
    cancelButtonText: 'Cancel',
  };
};
