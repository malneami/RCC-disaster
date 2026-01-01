import { useState, useEffect } from 'react';
import { Patient, CreatePatientData, patientService } from '../../../services/patientService';
import { calculateAgeInYears } from '../../../utils/ageCalculator';

interface UsePatientFormProps {
  patient?: Patient | null;
  open: boolean;
  onPatientCreated: (patient: Patient) => void;
  onPatientUpdated: (patient: Patient) => void;
}

// Helper function to initialize form data
const initializeFormData = (patient?: Patient | null): CreatePatientData => {
  if (patient) {
    const dateOfBirth = patient.dateOfBirth 
      ? new Date(patient.dateOfBirth).toISOString().split('T')[0] 
      : '';
    
    return {
      mrn: patient.mrn || '',
      nationalId: patient.nationalId || '',
      firstName: patient.firstName,
      lastName: patient.lastName,
      middleName: patient.middleName || '',
      dateOfBirth: dateOfBirth,
      age: patient.age || undefined,
      ageMonths: patient.ageMonths || undefined,
      ageDays: patient.ageDays || undefined,
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
      const initializedData = initializeFormData(patient);
      setFormData(initializedData);
      setValidationErrors({});
      setTouched({});
      
      // Validate date of birth if provided when editing
      if (initializedData.dateOfBirth) {
        const dobError = validateField('dateOfBirth', initializedData.dateOfBirth);
        if (dobError) {
          setValidationErrors(prev => ({ ...prev, dateOfBirth: dobError }));
          setTouched(prev => ({ ...prev, dateOfBirth: true }));
        }
      }
    }
  }, [patient, open]);

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'firstName':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Please enter the patient\'s first name';
        }
        return '';
      case 'lastName':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Please enter the patient\'s last name';
        }
        return '';
      case 'dateOfBirth':
        // Date of birth is optional, but if provided, validate it
        if (value && value.trim() !== '') {
          // Validate date is not in the future
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(23, 59, 59, 999); // Set to end of today
          if (selectedDate > today) {
            return 'Date of birth cannot be in the future. Please select a valid date';
          }
          // Validate date is not too old (reasonable limit)
          const minDate = new Date('1900-01-01');
          if (selectedDate < minDate) {
            return 'Please enter a valid date of birth (after 1900)';
          }
        }
        return '';
      case 'age':
        // Age is required - but if date of birth is provided, age should be calculated
        // Check if we have date of birth - if yes, calculate age from it
        if (formData.dateOfBirth && formData.dateOfBirth.trim() !== '') {
          try {
            const calculatedAge = calculateAgeInYears(formData.dateOfBirth);
            // Age is valid if calculated from DOB (even if 0 for very young babies)
            if (calculatedAge >= 0 && calculatedAge <= 150) {
              return '';
            }
          } catch (error) {
            // If DOB is invalid, fall through to manual age validation
          }
        }
        
        // If no DOB or DOB is invalid, validate manually entered age
        // Check if we have months or days even if age is 0 or undefined
        const hasMonthsOrDays = (formData.ageMonths !== undefined && formData.ageMonths > 0) || 
                                (formData.ageDays !== undefined && formData.ageDays > 0);
        
        if ((value === undefined || value === null || value === '') && !hasMonthsOrDays) {
          return 'Please enter the patient\'s age (e.g., "25 years", "3 months", "10 days", "2 months, 5 days", or "15 days"), or provide date of birth';
        }
        
        // If we have months or days, age can be 0 or undefined
        if (hasMonthsOrDays) {
          // Validate that age is not negative if provided
          if (value !== undefined && value !== null && value !== '') {
            const ageNum = typeof value === 'number' ? value : parseInt(String(value));
            if (isNaN(ageNum) || ageNum < 0) {
              return 'Age must be a valid number. Enter age in format like "25 years", "3 months", or "10 days"';
            }
            if (ageNum > 150) {
              return 'Please enter a realistic age (maximum 150 years)';
            }
          }
          return '';
        }
        
        // Validate age is a non-negative number (0 is valid for babies)
        const ageNum = typeof value === 'number' ? value : parseInt(String(value));
        if (isNaN(ageNum) || ageNum < 0) {
          return 'Age must be a valid number. Enter age in format like "25 years", "3 months", or "10 days"';
        }
        if (ageNum > 150) {
          return 'Please enter a realistic age (maximum 150 years)';
        }
        return '';
      case 'nationalId':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Please enter the patient\'s National ID';
        }
        const nationalIdStr = String(value).trim();
        // Allow "00000000000000" to be used multiple times (for new babies)
        if (nationalIdStr === '00000000000000') {
          return '';
        }
        // Check if National ID contains only numbers
        if (!/^\d+$/.test(nationalIdStr)) {
          return 'National ID can only contain numbers. Please remove any letters or special characters';
        }
        // Validate length (typically 10 digits for Saudi Arabia, but allow flexibility)
        if (nationalIdStr.length < 10) {
          return `National ID must be at least 10 digits. You entered ${nationalIdStr.length} digit(s)`;
        }
        if (nationalIdStr.length > 14) {
          return `National ID cannot exceed 14 digits. You entered ${nationalIdStr.length} digits`;
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
    
    // Date of birth is optional, but validate if provided
    if (formData.dateOfBirth) {
      const dateOfBirthError = validateField('dateOfBirth', formData.dateOfBirth);
      if (dateOfBirthError) errors.dateOfBirth = dateOfBirthError;
    }
    
    const ageError = validateField('age', formData.age);
    if (ageError) errors.age = ageError;

    const nationalIdError = validateField('nationalId', formData.nationalId);
    if (nationalIdError) errors.nationalId = nationalIdError;

    // Mark all Personal Info fields as touched
    setTouched(prev => ({
      ...prev,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
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
    
    // Date of birth is optional, but validate if provided
    if (formData.dateOfBirth) {
      const dateOfBirthError = validateField('dateOfBirth', formData.dateOfBirth);
      if (dateOfBirthError) errors.dateOfBirth = dateOfBirthError;
    }
    
    const ageError = validateField('age', formData.age);
    if (ageError) errors.age = ageError;

    const nationalIdError = validateField('nationalId', formData.nationalId);
    if (nationalIdError) errors.nationalId = nationalIdError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDataChange = (newData: Partial<CreatePatientData>) => {
    // Auto-calculate age when dateOfBirth changes (only if dateOfBirth is provided and not empty)
    if (newData.dateOfBirth !== undefined) {
      if (newData.dateOfBirth && newData.dateOfBirth.trim() !== '') {
        try {
          const calculatedAge = calculateAgeInYears(newData.dateOfBirth);
          // Always set age to calculated value (even if 0 for very young babies)
          newData.age = calculatedAge >= 0 ? calculatedAge : 0;
        } catch (err) {
          // If date is invalid, don't update age
        }
      } else {
        // If dateOfBirth is being cleared, convert empty string to undefined
        newData.dateOfBirth = undefined;
        // Don't auto-update age if DOB is cleared - let user keep their age
      }
    }
    
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
    // Also clear age error if dateOfBirth was updated
    if (newData.dateOfBirth !== undefined && updatedErrors.age) {
      delete updatedErrors.age;
    }
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
      setError('Please correct the errors in the form before submitting.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Ensure age is calculated from date of birth if DOB is provided
      let finalAge = formData.age;
      let finalAgeMonths = formData.ageMonths;
      let finalAgeDays = formData.ageDays;
      
      if (formData.dateOfBirth && formData.dateOfBirth.trim() !== '') {
        try {
          const calculatedAge = calculateAgeInYears(formData.dateOfBirth);
          finalAge = calculatedAge >= 0 ? calculatedAge : 0;
          // Clear months and days when DOB is provided (age calculated from DOB)
          finalAgeMonths = undefined;
          finalAgeDays = undefined;
        } catch (error) {
          // If DOB is invalid, use the entered age, months, and days
        }
      }

      const submitData: any = {
        ...formData,
        age: finalAge,
        ageMonths: finalAgeMonths,
        ageDays: finalAgeDays,
        insuranceExpiry: formData.insuranceExpiry ? new Date(formData.insuranceExpiry).toISOString() : undefined,
      };

      // Handle dateOfBirth: remove if empty for create, set to null for update if cleared
      if (!submitData.dateOfBirth || submitData.dateOfBirth.trim() === '') {
        if (patient) {
          // For update, explicitly set to null to clear it
          submitData.dateOfBirth = null;
        } else {
          // For create, remove it to avoid validation error
          delete submitData.dateOfBirth;
        }
      } else {
        // Ensure dateOfBirth is properly formatted
        submitData.dateOfBirth = submitData.dateOfBirth.trim();
      }

      if (patient) {
        const updatedPatient = await patientService.updatePatient(patient.id, submitData);
        onPatientUpdated(updatedPatient);
      } else {
        const newPatient = await patientService.createPatient(submitData);
        onPatientCreated(newPatient);
      }
    } catch (err: any) {
      console.error('Error saving patient:', err);
      // Extract specific error message from backend response
      let errorMessage = 'Failed to save patient. Please try again.';
      
      if (err.response && err.response.data) {
        const { message } = err.response.data;
        
        if (Array.isArray(message)) {
          // NestJS class-validator error array
          errorMessage = message.join('\n');
        } else if (typeof message === 'string') {
          // Specific backend error message (e.g. ConflictException)
          errorMessage = message;
        }
      }
      setError(errorMessage);
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


