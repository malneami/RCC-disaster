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
    gender: 'UNKNOWN',
    privacyLevel: 'PRIVATE',
    consentGiven: false,
  };
};

export const usePatientForm = ({ patient, open, onPatientCreated, onPatientUpdated }: UsePatientFormProps) => {
  const [formData, setFormData] = useState<CreatePatientData>({
    firstName: '',
    lastName: '',
    age: undefined,
    gender: 'UNKNOWN',
    privacyLevel: 'PRIVATE',
    consentGiven: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with patient data if editing
  useEffect(() => {
    if (open) {
      setFormData(initializeFormData(patient));
    }
  }, [patient, open]);

  const handleDataChange = (newData: Partial<CreatePatientData>) => {
    setFormData(prev => ({
      ...prev,
      ...newData,
    }));
    
    if (error) {
      setError(null);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.firstName || !formData.lastName || !formData.age) {
        setError('First name, last name, and age are required.');
        return;
      }

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
    handleDataChange,
    handleComplete,
  };
};
