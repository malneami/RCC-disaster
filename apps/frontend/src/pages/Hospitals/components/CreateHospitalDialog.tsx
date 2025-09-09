import React from 'react';
import { CreateHospitalDto } from '../../../services/hospitalService';
import FormDialog, { FormField } from '../../../components/Common/FormDialog';

interface CreateHospitalDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHospitalDto) => void;
}

const CreateHospitalDialog: React.FC<CreateHospitalDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const handleSubmit = async (formData: Record<string, any>) => {
    await onSubmit(formData as CreateHospitalDto);
  };

  const fields: FormField[] = [
    // Basic Information
    {
      key: 'name',
      label: 'Hospital Name',
      type: 'text',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => !value?.trim() ? 'Hospital name is required' : null,
    },
    {
      key: 'address',
      label: 'Address',
      type: 'text',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => !value?.trim() ? 'Address is required' : null,
    },
    {
      key: 'contactPhone',
      label: 'Contact Phone',
      type: 'text',
      gridSize: { xs: 12, sm: 6 },
      placeholder: '+966 50 123 4567',
    },
    {
      key: 'contactEmail',
      label: 'Contact Email',
      type: 'email',
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => {
        if (!value) return null;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Invalid email format';
        }
        return null;
      },
    },
    // Location
    {
      key: 'latitude',
      label: 'Latitude',
      type: 'number',
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => {
        if (value === undefined || value === null) return null;
        if (value < -90 || value > 90) {
          return 'Latitude must be between -90 and 90';
        }
        return null;
      },
    },
    {
      key: 'longitude',
      label: 'Longitude',
      type: 'number',
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => {
        if (value === undefined || value === null) return null;
        if (value < -180 || value > 180) {
          return 'Longitude must be between -180 and 180';
        }
        return null;
      },
    },
    // Status and Cluster
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      options: [
        { value: 'AVAILABLE', label: 'Available' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'LIMITED', label: 'Limited' },
        { value: 'CRITICAL', label: 'Critical' },
        { value: 'OFFLINE', label: 'Offline' },
      ],
    },
    {
      key: 'cluster',
      label: 'Cluster',
      type: 'select',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      options: [
        { value: 'Jazan', label: 'Jazan' },
      ],
    },
    // ICU Beds
    {
      key: 'icuBeds',
      label: 'Total ICU Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'ICU beds cannot be negative' : null,
    },
    {
      key: 'icuBedsAvailable',
      label: 'Available ICU Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Available ICU beds cannot be negative' : null,
    },
    // PICU Beds
    {
      key: 'picuBeds',
      label: 'Total PICU Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'PICU beds cannot be negative' : null,
    },
    {
      key: 'picuBedsAvailable',
      label: 'Available PICU Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Available PICU beds cannot be negative' : null,
    },
    // Male Beds
    {
      key: 'maleBeds',
      label: 'Total Male Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Male beds cannot be negative' : null,
    },
    {
      key: 'maleBedsAvailable',
      label: 'Available Male Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Available male beds cannot be negative' : null,
    },
    // Female Beds
    {
      key: 'femaleBeds',
      label: 'Total Female Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Female beds cannot be negative' : null,
    },
    {
      key: 'femaleBedsAvailable',
      label: 'Available Female Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Available female beds cannot be negative' : null,
    },
    // Pediatric Beds
    {
      key: 'pediatricBeds',
      label: 'Total Pediatric Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Pediatric beds cannot be negative' : null,
    },
    {
      key: 'pediatricBedsAvailable',
      label: 'Available Pediatric Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Available pediatric beds cannot be negative' : null,
    },
    // Standard Beds
    {
      key: 'standardBeds',
      label: 'Total Standard Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Standard beds cannot be negative' : null,
    },
    {
      key: 'standardBedsAvailable',
      label: 'Available Standard Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Available standard beds cannot be negative' : null,
    },
    // NICU Beds
    {
      key: 'nicuBeds',
      label: 'Total NICU Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'NICU beds cannot be negative' : null,
    },
    {
      key: 'nicuBedsAvailable',
      label: 'Available NICU Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Available NICU beds cannot be negative' : null,
    },
    // Equipment
    {
      key: 'ventilators',
      label: 'Total Ventilators',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Ventilators cannot be negative' : null,
    },
    {
      key: 'ventilatorsAvailable',
      label: 'Available Ventilators',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Available ventilators cannot be negative' : null,
    },
    // Services
    {
      key: 'hasStemiService',
      label: 'STEMI Service',
      type: 'boolean',
      gridSize: { xs: 12, sm: 4 },
    },
    {
      key: 'hasStrokeService',
      label: 'Stroke Service',
      type: 'boolean',
      gridSize: { xs: 12, sm: 4 },
    },
    {
      key: 'hasTraumaService',
      label: 'Trauma Service',
      type: 'boolean',
      gridSize: { xs: 12, sm: 4 },
    },
    {
      key: 'hasStrokeUnit',
      label: 'Stroke Unit',
      type: 'boolean',
      gridSize: { xs: 12, sm: 4 },
    },
    {
      key: 'hasCardiologyCenter',
      label: 'Cardiology Center',
      type: 'boolean',
      gridSize: { xs: 12, sm: 4 },
    },
    // Additional Settings
    {
      key: 'traumaLevel',
      label: 'Trauma Level',
      type: 'select',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      options: [
        { value: 'NONE', label: 'None' },
        { value: 'LEVEL_1', label: 'Level 1' },
        { value: 'LEVEL_2', label: 'Level 2' },
        { value: 'LEVEL_3', label: 'Level 3' },
        { value: 'LEVEL_4', label: 'Level 4' },
        { value: 'LEVEL_5', label: 'Level 5' },
      ],
    },
    {
      key: 'emergencyDeptStatus',
      label: 'Emergency Department Status',
      type: 'select',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      options: [
        { value: 'available', label: 'Available' },
        { value: 'limited', label: 'Limited' },
        { value: 'closed', label: 'Closed' },
      ],
    },
  ];

  const initialData: CreateHospitalDto = {
    name: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    icuBeds: 0,
    icuBedsAvailable: 0,
    picuBeds: 0,
    picuBedsAvailable: 0,
    maleBeds: 0,
    maleBedsAvailable: 0,
    femaleBeds: 0,
    femaleBedsAvailable: 0,
    pediatricBeds: 0,
    pediatricBedsAvailable: 0,
    standardBeds: 0,
    standardBedsAvailable: 0,
    ventilators: 0,
    ventilatorsAvailable: 0,
    hasStemiService: false,
    hasStrokeService: false,
    hasTraumaService: false,
    cluster: 'Jazan',
    status: 'AVAILABLE',
    contactPhone: '',
    contactEmail: '',
    emergencyDeptStatus: 'available',
    nicuBeds: 0,
    nicuBedsAvailable: 0,
    hasStrokeUnit: false,
    traumaLevel: 'NONE',
    hasCardiologyCenter: false,
  };

  return (
    <FormDialog
      open={open}
      title="Create New Hospital"
      fields={fields}
      initialData={initialData}
      onSubmit={handleSubmit}
      onClose={onClose}
      submitButtonText="Create Hospital"
      cancelButtonText="Cancel"
      maxWidth="lg"
    />
  );
};

export default CreateHospitalDialog;
