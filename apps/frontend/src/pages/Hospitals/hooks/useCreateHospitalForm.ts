import { useState, useEffect, useRef } from 'react';
import { CreateHospitalDto } from '../../../services/hospitalService';

export const useCreateHospitalForm = (
  open: boolean,
  onSubmit: (data: CreateHospitalDto) => void,
  onClose: () => void
) => {
  const [formData, setFormData] = useState<CreateHospitalDto>({
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const traumaLevelRef = useRef<HTMLDivElement>(null);

  const handleTraumaLevelOpen = () => {
    setTimeout(() => {
      traumaLevelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  useEffect(() => {
    if (open) {
      setFormData({
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
      });
      setErrors({});
    }
  }, [open]);

  const handleChange = (field: keyof CreateHospitalDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) newErrors.name = 'Hospital name is required';
    if (!formData.address?.trim()) newErrors.address = 'Address is required';
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }
    if (formData.latitude !== undefined && (formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }
    if (formData.longitude !== undefined && (formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    const bedFields = [
      'icuBeds', 'icuBedsAvailable', 'picuBeds', 'picuBedsAvailable',
      'maleBeds', 'maleBedsAvailable', 'femaleBeds', 'femaleBedsAvailable',
      'pediatricBeds', 'pediatricBedsAvailable', 'standardBeds', 'standardBedsAvailable',
      'nicuBeds', 'nicuBedsAvailable',
    ] as const;

    bedFields.forEach((field) => {
      if (formData[field] !== undefined && formData[field] < 0) {
        newErrors[field] = 'Cannot be negative';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    errors,
    isSubmitting,
    traumaLevelRef,
    handleChange,
    handleSubmit,
    handleTraumaLevelOpen,
  };
};
