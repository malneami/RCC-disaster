import React, { useState, useEffect } from 'react';
import { Hospital, UpdateHospitalCapacityDto } from '../../../services/hospitalService';
import FormDialog, { FormField } from '../../../components/Common/FormDialog';

interface UpdateCapacityDialogProps {
  open: boolean;
  hospital: Hospital | null;
  onClose: () => void;
  onSubmit: (hospitalId: string, data: UpdateHospitalCapacityDto) => void;
}

const UpdateCapacityDialog: React.FC<UpdateCapacityDialogProps> = ({
  open,
  hospital,
  onClose,
  onSubmit,
}) => {
  const [initialData, setInitialData] = useState<UpdateHospitalCapacityDto>({});

  useEffect(() => {
    if (hospital) {
      setInitialData({
        icuBeds: hospital.icuBeds,
        icuBedsAvailable: hospital.icuBedsAvailable,
        picuBeds: hospital.picuBeds,
        picuBedsAvailable: hospital.picuBedsAvailable,
        maleBeds: hospital.maleBeds,
        maleBedsAvailable: hospital.maleBedsAvailable,
        femaleBeds: hospital.femaleBeds,
        femaleBedsAvailable: hospital.femaleBedsAvailable,
        pediatricBeds: hospital.pediatricBeds,
        pediatricBedsAvailable: hospital.pediatricBedsAvailable,
        standardBeds: hospital.standardBeds,
        standardBedsAvailable: hospital.standardBedsAvailable,
        nicuBeds: hospital.nicuBeds,
        nicuBedsAvailable: hospital.nicuBedsAvailable,
        updateSource: 'MANUAL',
      });
    }
  }, [hospital]);

  const handleSubmit = async (formData: Record<string, any>) => {
    if (hospital) {
      await onSubmit(hospital.id, formData as UpdateHospitalCapacityDto);
    }
  };

  const fields: FormField[] = [
    // ICU Beds Section
    {
      key: 'icuBeds',
      label: 'Total ICU Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Cannot be negative' : null,
    },
    {
      key: 'icuBedsAvailable',
      label: 'Available ICU Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => {
        if (value < 0) return 'Cannot be negative';
        const total = initialData.icuBeds;
        if (total !== undefined && value > total) {
          return 'Available beds cannot exceed total beds';
        }
        return null;
      },
    },
    // PICU Beds Section
    {
      key: 'picuBeds',
      label: 'Total PICU Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Cannot be negative' : null,
    },
    {
      key: 'picuBedsAvailable',
      label: 'Available PICU Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => {
        if (value < 0) return 'Cannot be negative';
        const total = initialData.picuBeds;
        if (total !== undefined && value > total) {
          return 'Available beds cannot exceed total beds';
        }
        return null;
      },
    },
    // Male Beds Section
    {
      key: 'maleBeds',
      label: 'Total Male Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Cannot be negative' : null,
    },
    {
      key: 'maleBedsAvailable',
      label: 'Available Male Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => {
        if (value < 0) return 'Cannot be negative';
        const total = initialData.maleBeds;
        if (total !== undefined && value > total) {
          return 'Available beds cannot exceed total beds';
        }
        return null;
      },
    },
    // Female Beds Section
    {
      key: 'femaleBeds',
      label: 'Total Female Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Cannot be negative' : null,
    },
    {
      key: 'femaleBedsAvailable',
      label: 'Available Female Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => {
        if (value < 0) return 'Cannot be negative';
        const total = initialData.femaleBeds;
        if (total !== undefined && value > total) {
          return 'Available beds cannot exceed total beds';
        }
        return null;
      },
    },
    // Pediatric Beds Section
    {
      key: 'pediatricBeds',
      label: 'Total Pediatric Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Cannot be negative' : null,
    },
    {
      key: 'pediatricBedsAvailable',
      label: 'Available Pediatric Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => {
        if (value < 0) return 'Cannot be negative';
        const total = initialData.pediatricBeds;
        if (total !== undefined && value > total) {
          return 'Available beds cannot exceed total beds';
        }
        return null;
      },
    },
    // Standard Beds Section
    {
      key: 'standardBeds',
      label: 'Total Standard Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Cannot be negative' : null,
    },
    {
      key: 'standardBedsAvailable',
      label: 'Available Standard Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => {
        if (value < 0) return 'Cannot be negative';
        const total = initialData.standardBeds;
        if (total !== undefined && value > total) {
          return 'Available beds cannot exceed total beds';
        }
        return null;
      },
    },
    // NICU Beds Section
    {
      key: 'nicuBeds',
      label: 'Total NICU Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => value < 0 ? 'Cannot be negative' : null,
    },
    {
      key: 'nicuBedsAvailable',
      label: 'Available NICU Beds',
      type: 'number',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      validation: (value) => {
        if (value < 0) return 'Cannot be negative';
        const total = initialData.nicuBeds;
        if (total !== undefined && value > total) {
          return 'Available beds cannot exceed total beds';
        }
        return null;
      },
    },
    // Update Source
    {
      key: 'updateSource',
      label: 'Update Source',
      type: 'select',
      required: true,
      gridSize: { xs: 12, sm: 6 },
      options: [
        { value: 'MANUAL', label: 'Manual' },
        { value: 'API', label: 'API' },
        { value: 'SCHEDULED_SYNC', label: 'Scheduled Sync' },
      ],
    },
  ];

  if (!hospital) return null;

  return (
    <FormDialog
      open={open}
      title={`Update Capacity - ${hospital.name}`}
      fields={fields}
      initialData={initialData}
      onSubmit={handleSubmit}
      onClose={onClose}
      submitButtonText="Update Capacity"
      cancelButtonText="Cancel"
      maxWidth="lg"
    />
  );
};

export default UpdateCapacityDialog;
