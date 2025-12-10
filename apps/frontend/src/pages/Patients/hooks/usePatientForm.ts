import { useState, useEffect } from 'react';
import { Patient, CreatePatientData, patientService } from '../../../services/patientService';

interface UsePatientFormProps {
  patient?: Patient | null;
  open: boolean;
  onPatientCreated: (patient: Patient) => void;
  onPatientUpdated: (patient: Patient) => void;
}

// Helper function to initialize form data
const initializeFormData = (patient?: Patient | null): CreatePatientData => {
  if (patient) {
    return {
      mrn: patient.mrn || '',
      nationalId: patient.nationalId || '',
      firstName: patient.firstName,
      lastName: patient.lastName,
      middleName: patient.middleName || '',
      age: patient.age || undefined,
      gender: patient.gender,
      maritalStatus: patient.maritalStatus || 'UNKNOWN',
      phoneNumber: patient.phoneNumber || '',
      email: patient.email || '',
      address: patient.address || '',
      city: patient.city || '',
      state: patient.state || '',
      zipCode: patient.zipCode || '',
      country: patient.country || 'Saudi Arabia',
      emergencyContact: patient.emergencyContact || '',
      emergencyPhone: patient.emergencyPhone || '',
      emergencyEmail: patient.emergencyEmail || '',
      emergencyRelationship: patient.emergencyRelationship || '',
      insuranceProvider: patient.insuranceProvider || '',
      insuranceNumber: patient.insuranceNumber || '',
      insuranceGroup: patient.insuranceGroup || '',
      insuranceExpiry: patient.insuranceExpiry ? new Date(patient.insuranceExpiry).toISOString().split('T')[0] : '',
      bloodType: patient.bloodType || '',
      rhFactor: patient.rhFactor || '',
      allergies: patient.allergies || '',
      medications: patient.medications || '',
      medicalHistory: patient.medicalHistory || '',
      riskFactors: patient.riskFactors || '',
      chronicConditions: patient.chronicConditions || '',
      weight: patient.weight,
      height: patient.height,
      privacyLevel: patient.privacyLevel,
      consentGiven: patient.consentGiven,
      dataRetentionPolicy: patient.dataRetentionPolicy || '',
    };
  }
  
  return {
    firstName: '',
    lastName: '',
    age: undefined,
    gender: 'MALE',
    privacyLevel: 'PRIVATE',
    consentGiven: false,
  };
};

export const usePatientForm = ({ patient, open, onPatientCreated, onPatientUpdated }: UsePatientFormProps) => {
  const [formData, setFormData] = useState<CreatePatientData>({
    firstName: '',
    lastName: '',
    age: undefined,
    gender: 'MALE',
    privacyLevel: 'PRIVATE',
    consentGiven: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form with patient data if editing
  useEffect(() => {
    if (open) {
      setFormData(initializeFormData(patient));
      setValidationErrors({});
      setTouched({});
    }
  }, [patient, open]);

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'firstName':
        return !value || value.trim() === '' ? 'First name is required' : '';
      case 'lastName':
        return !value || value.trim() === '' ? 'Last name is required' : '';
      case 'age':
        return !value || value === undefined || value === null ? 'Age is required' : '';
      case 'nationalId':
        if (!value || value.trim() === '') {
          return 'National ID is required';
        }
        // Check if National ID contains only numbers
        const nationalIdStr = String(value).trim();
        if (!/^\d+$/.test(nationalIdStr)) {
          return 'National ID must contain only numbers';
        }
        return '';
      default:
        return '';
    }
  };

  // Validate Personal Info step (first step)
  const validatePersonalInfoStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    const firstNameError = validateField('firstName', formData.firstName);
    if (firstNameError) errors.firstName = firstNameError;
    
    const lastNameError = validateField('lastName', formData.lastName);
    if (lastNameError) errors.lastName = lastNameError;
    
    const ageError = validateField('age', formData.age);
    if (ageError) errors.age = ageError;

    const nationalIdError = validateField('nationalId', formData.nationalId);
    if (nationalIdError) errors.nationalId = nationalIdError;

    // Mark all Personal Info fields as touched
    setTouched(prev => ({
      ...prev,
      firstName: true,
      lastName: true,
      age: true,
      nationalId: true,
    }));

    setValidationErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    const firstNameError = validateField('firstName', formData.firstName);
    if (firstNameError) errors.firstName = firstNameError;
    
    const lastNameError = validateField('lastName', formData.lastName);
    if (lastNameError) errors.lastName = lastNameError;
    
    const ageError = validateField('age', formData.age);
    if (ageError) errors.age = ageError;

    const nationalIdError = validateField('nationalId', formData.nationalId);
    if (nationalIdError) errors.nationalId = nationalIdError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDataChange = (newData: Partial<CreatePatientData>) => {
    setFormData(prev => ({
      ...prev,
      ...newData,
    }));
    
    // Clear validation errors for changed fields
    const updatedErrors = { ...validationErrors };
    Object.keys(newData).forEach(key => {
      if (updatedErrors[key]) {
        delete updatedErrors[key];
      }
    });
    setValidationErrors(updatedErrors);
    
    if (error) {
      setError(null);
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof CreatePatientData]);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleComplete = async () => {
    // Mark all required fields as touched
    setTouched({ firstName: true, lastName: true, age: true, nationalId: true });
    
    if (!validateForm()) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submitData = {
        ...formData,
        insuranceExpiry: formData.insuranceExpiry ? new Date(formData.insuranceExpiry).toISOString() : undefined,
      };

      if (patient) {
        const updatedPatient = await patientService.updatePatient(patient.id, submitData);
        onPatientUpdated(updatedPatient);
      } else {
        const newPatient = await patientService.createPatient(submitData);
        onPatientCreated(newPatient);
      }
    } catch (err) {
      console.error('Error saving patient:', err);
      setError('Failed to save patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    error,
    validationErrors,
    touched,
    handleDataChange,
    handleFieldBlur,
    handleComplete,
    validatePersonalInfoStep,
  };
};
