import { FilterField } from '../../../components/Common/FilterComponents';

export const createPatientFilterFields = (): FilterField[] => [
  {
    key: 'gender',
    label: 'Gender',
    type: 'select',
    options: [
      { value: 'MALE', label: 'Male' },
      { value: 'FEMALE', label: 'Female' },
      { value: 'OTHER', label: 'Other' },
      { value: 'UNKNOWN', label: 'Unknown' },
    ],
    gridSize: 6,
  },
  {
    key: 'maritalStatus',
    label: 'Marital Status',
    type: 'select',
    options: [
      { value: 'SINGLE', label: 'Single' },
      { value: 'MARRIED', label: 'Married' },
      { value: 'DIVORCED', label: 'Divorced' },
      { value: 'WIDOWED', label: 'Widowed' },
      { value: 'UNKNOWN', label: 'Unknown' },
    ],
    gridSize: 6,
  },
  {
    key: 'privacyLevel',
    label: 'Privacy Level',
    type: 'select',
    options: [
      { value: 'PUBLIC', label: 'Public' },
      { value: 'INTERNAL', label: 'Internal' },
      { value: 'PRIVATE', label: 'Private' },
      { value: 'RESTRICTED', label: 'Restricted' },
      { value: 'CONFIDENTIAL', label: 'Confidential' },
    ],
    gridSize: 6,
  },
  {
    key: 'bloodType',
    label: 'Blood Type',
    type: 'select',
    options: [
      { value: 'A+', label: 'A+' },
      { value: 'A-', label: 'A-' },
      { value: 'B+', label: 'B+' },
      { value: 'B-', label: 'B-' },
      { value: 'AB+', label: 'AB+' },
      { value: 'AB-', label: 'AB-' },
      { value: 'O+', label: 'O+' },
      { value: 'O-', label: 'O-' },
      { value: 'UNKNOWN', label: 'Unknown' },
    ],
    gridSize: 6,
  },
  {
    key: 'startDate',
    label: 'Created From',
    type: 'date',
    gridSize: 6,
  },
  {
    key: 'endDate',
    label: 'Created To',
    type: 'date',
    gridSize: 6,
  },
  {
    key: 'hasInsurance',
    label: 'Insurance Status',
    type: 'boolean',
    gridSize: 6,
  },
];
