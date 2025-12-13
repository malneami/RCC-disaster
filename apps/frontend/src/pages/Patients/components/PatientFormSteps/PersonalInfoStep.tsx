import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import { CreatePatientData, Patient } from '../../../../services/patientService';
import NationalIdInput from '../../../../components/Common/NationalIdInput';
import { calculateAge, formatAge, calculateAgeInYears, parseAgeText } from '../../../../utils/ageCalculator';

interface PersonalInfoStepProps {
  formData: CreatePatientData;
  onDataChange: (data: Partial<CreatePatientData>) => void;
  onFieldBlur?: (field: string) => void;
  validationErrors?: Record<string, string>;
  touched?: Record<string, boolean>;
  onViewDuplicate?: (patient: Patient) => void;
  onPatientSelected?: (patient: Patient) => void; // New callback for when patient is selected from suggestions
  isEditing?: boolean; // Add this prop to indicate if we're editing
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ 
  formData, 
  onDataChange, 
  onFieldBlur,
  validationErrors = {},
  touched = {},
  onPatientSelected 
}) => {
  // Track if age was manually edited (to show text input instead of formatted string)
  const [ageManuallyEdited, setAgeManuallyEdited] = React.useState(false);
  // Store the age text input (e.g., "5 years", "3 months", "2 years, 3 months, 5 days")
  const [ageTextInput, setAgeTextInput] = React.useState<string>('');

  // Helper function to format age from stored values
  const formatAgeFromStoredValues = (): string => {
    const parts: string[] = [];
    
    if (formData.age !== undefined && formData.age !== null && formData.age > 0) {
      parts.push(`${formData.age} ${formData.age === 1 ? 'year' : 'years'}`);
    }
    if (formData.ageMonths !== undefined && formData.ageMonths > 0) {
      parts.push(`${formData.ageMonths} ${formData.ageMonths === 1 ? 'month' : 'months'}`);
    }
    if (formData.ageDays !== undefined && formData.ageDays > 0) {
      parts.push(`${formData.ageDays} ${formData.ageDays === 1 ? 'day' : 'days'}`);
    }
    
    return parts.join(', ');
  };

  // Initialize age text input when form data changes (for editing)
  React.useEffect(() => {
    if (formData.dateOfBirth && formData.dateOfBirth.trim() !== '' && !ageManuallyEdited) {
      // If DOB exists and not manually edited, clear text input (will show formatted from DOB)
      setAgeTextInput('');
      return;
    }
    
    // If no DOB, check if we have stored age data (age, ageMonths, ageDays)
    if (!formData.dateOfBirth || formData.dateOfBirth.trim() === '') {
      const hasAgeData = (formData.age !== undefined && formData.age !== null) || 
                         (formData.ageMonths !== undefined && formData.ageMonths > 0) ||
                         (formData.ageDays !== undefined && formData.ageDays > 0);
      
      if (hasAgeData) {
        const formattedAge = formatAgeFromStoredValues();
        // Only update if the formatted age changed and user hasn't manually edited
        // This prevents overwriting user input while they're typing
        if (formattedAge && (!ageTextInput || ageTextInput.trim() === '' || !ageManuallyEdited)) {
          setAgeTextInput(formattedAge);
          setAgeManuallyEdited(true); // Mark as manually edited so it shows as text input
        }
      } else if (!ageTextInput || ageTextInput.trim() === '') {
        // If no age data at all, clear the input
        setAgeTextInput('');
      }
    }
  }, [formData.dateOfBirth, formData.age, formData.ageMonths, formData.ageDays]);

  const handleChange = (field: keyof CreatePatientData, value: any) => {
    // Handle dateOfBirth changes (including clearing it)
    if (field === 'dateOfBirth') {
      if (value && value.trim() !== '') {
        // Date of birth is being set
        try {
          const calculatedAge = calculateAgeInYears(value);
          setAgeManuallyEdited(false); // Reset flag when DOB changes
          setAgeTextInput(''); // Clear text input when DOB changes
          // Always set age to calculated value (even if 0 for very young babies)
          // Clear ageMonths and ageDays when DOB is provided (age will be calculated from DOB)
          onDataChange({ 
            [field]: value,
            age: calculatedAge >= 0 ? calculatedAge : 0,
            ageMonths: undefined,
            ageDays: undefined
          });
          return;
        } catch (error) {
          // If date is invalid, just update dateOfBirth
          onDataChange({ [field]: value });
          return;
        }
      } else {
        // Date of birth is being cleared
        setAgeManuallyEdited(true);
        // Format age from stored values (age, ageMonths, ageDays)
        const formattedAge = formatAgeFromStoredValues();
        if (formattedAge) {
          setAgeTextInput(formattedAge);
        } else {
          // If no stored age data, clear the input
          setAgeTextInput('');
        }
        onDataChange({ 
          [field]: value || undefined, // Convert empty string to undefined
        });
        return;
      }
    }
    
    // If age is manually edited, mark it as manually edited
    if (field === 'age') {
      setAgeManuallyEdited(true);
    }
    
    onDataChange({ [field]: value });
  };

  // Handle age text input change
  const handleAgeTextChange = (text: string) => {
    setAgeTextInput(text);
    setAgeManuallyEdited(true);
    
    // Parse the text and extract years, months, and days for storage
    if (text.trim() === '') {
      onDataChange({ age: undefined, ageMonths: undefined, ageDays: undefined });
      return;
    }
    
    const parsed = parseAgeText(text);
    if (parsed.isValid) {
      // Store years, months, and days separately
      // Allow age to be 0 if only months/days are provided
      const hasMonthsOrDays = parsed.months > 0 || parsed.days > 0;
      const ageValue = parsed.years > 0 ? parsed.years : (hasMonthsOrDays ? 0 : undefined);
      onDataChange({ 
        age: ageValue,
        ageMonths: parsed.months > 0 ? parsed.months : undefined,
        ageDays: parsed.days > 0 ? parsed.days : undefined
      });
    } else {
      // If parsing fails, still try to store as number if it's just a number
      const simpleNumber = parseInt(text);
      if (!isNaN(simpleNumber)) {
        onDataChange({ age: simpleNumber, ageMonths: undefined, ageDays: undefined });
      }
    }
  };

  // Get age display value
  const getAgeDisplayValue = (): string => {
    // If date of birth exists and not manually edited, show formatted age
    if (formData.dateOfBirth && formData.dateOfBirth.trim() !== '' && !ageManuallyEdited) {
      try {
        const ageDetails = calculateAge(formData.dateOfBirth);
        return formatAge(ageDetails);
      } catch (error) {
        return ageTextInput || formatAgeFromStoredValues() || '';
      }
    }
    
    // If manually edited, show the text input
    if (ageManuallyEdited) {
      return ageTextInput;
    }
    
    // If no DOB and not manually edited, format from stored values
    const formattedFromStored = formatAgeFromStoredValues();
    if (formattedFromStored) {
      return formattedFromStored;
    }
    
    // Fallback to age as years
    return formData.age !== undefined && formData.age !== null 
      ? `${formData.age} years` 
      : '';
  };

  // Check if age field should show as text (formatted) or text input
  const shouldShowFormattedAge = (): boolean => {
    return !ageManuallyEdited && !!formData.dateOfBirth;
  };

  const handlePatientSelect = (patient: Patient) => {
    // Auto-fill form with selected patient data
    const dateOfBirth = patient.dateOfBirth 
      ? new Date(patient.dateOfBirth).toISOString().split('T')[0] 
      : '';
    
    // Reset age manually edited flag when selecting patient
    setAgeManuallyEdited(false);
    
    onDataChange({
      firstName: patient.firstName,
      lastName: patient.lastName,
      nationalId: patient.nationalId,
      mrn: patient.mrn,
      dateOfBirth: dateOfBirth,
      age: patient.age || undefined,
      ageMonths: patient.ageMonths || undefined,
      ageDays: patient.ageDays || undefined,
      gender: patient.gender,
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
      weight: patient.weight || undefined,
      height: patient.height || undefined,
      privacyLevel: patient.privacyLevel,
      consentGiven: patient.consentGiven,
    });
    
    // Notify parent component that a patient was selected for editing
    onPatientSelected?.(patient);
  };


  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Personal Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please provide the patient's basic personal information. The system will automatically check for existing patients using the National ID 
        and prevent duplicate patient creation across all hospitals.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            value={formData.firstName || ''}
            onChange={(e) => handleChange('firstName', e.target.value)}
            onBlur={() => onFieldBlur?.('firstName')}
            required
            error={touched.firstName && !!validationErrors.firstName}
            helperText={touched.firstName && validationErrors.firstName ? validationErrors.firstName : ''}
            FormHelperTextProps={{
              sx: { color: 'error.main' }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            value={formData.lastName || ''}
            onChange={(e) => handleChange('lastName', e.target.value)}
            onBlur={() => onFieldBlur?.('lastName')}
            required
            error={touched.lastName && !!validationErrors.lastName}
            helperText={touched.lastName && validationErrors.lastName ? validationErrors.lastName : ''}
            FormHelperTextProps={{
              sx: { color: 'error.main' }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Middle Name"
            value={formData.middleName || ''}
            onChange={(e) => handleChange('middleName', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth || ''}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            onBlur={() => onFieldBlur?.('dateOfBirth')}
            error={touched.dateOfBirth && !!validationErrors.dateOfBirth}
            helperText={touched.dateOfBirth && validationErrors.dateOfBirth ? validationErrors.dateOfBirth : 'Optional - Age will be calculated automatically if provided'}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              max: new Date().toISOString().split('T')[0], // Prevent future dates
            }}
            FormHelperTextProps={{
              sx: { color: touched.dateOfBirth && validationErrors.dateOfBirth ? 'error.main' : 'text.secondary' }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          {shouldShowFormattedAge() ? (
            <TextField
              fullWidth
              label="Age"
              value={getAgeDisplayValue()}
              onFocus={() => {
                // Switch to text input when user focuses on the field
                setAgeManuallyEdited(true);
                setAgeTextInput(getAgeDisplayValue());
              }}
              onChange={(e) => {
                // When user starts typing, switch to text input
                handleAgeTextChange(e.target.value);
              }}
              onBlur={() => onFieldBlur?.('age')}
              required
              error={touched.age && !!validationErrors.age}
              helperText={touched.age && validationErrors.age ? validationErrors.age : 'Calculated from date of birth. Click to edit manually (e.g., "5 years", "3 months, 5 days", or "15 days")'}
              placeholder="Click to enter age manually"
              FormHelperTextProps={{
                sx: { color: touched.age && validationErrors.age ? 'error.main' : 'text.secondary' }
              }}
              sx={{
                '& .MuiInputBase-input': {
                  cursor: 'text',
                },
              }}
            />
          ) : (
            <TextField
              fullWidth
              label="Age"
              type="text"
              value={getAgeDisplayValue()}
              onChange={(e) => {
                handleAgeTextChange(e.target.value);
              }}
              onBlur={() => onFieldBlur?.('age')}
              required
              error={touched.age && !!validationErrors.age}
              helperText={touched.age && validationErrors.age ? validationErrors.age : 'Enter age (e.g., "25 years", "3 months, 5 days", or "15 days")'}
              placeholder="e.g., 25 years, 3 months, 10 days, 2 months, 5 days, or 15 days"
              FormHelperTextProps={{
                sx: { color: touched.age && validationErrors.age ? 'error.main' : 'text.secondary' }
              }}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Gender</InputLabel>
            <Select
              value={formData.gender || 'MALE'}
              onChange={(e) => handleChange('gender', e.target.value)}
              label="Gender"
            >
              <MenuItem value="MALE">Male</MenuItem>
              <MenuItem value="FEMALE">Female</MenuItem>
              <MenuItem value="UNKNOWN">Unknown</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Marital Status</InputLabel>
            <Select
              value={formData.maritalStatus || 'UNKNOWN'}
              onChange={(e) => handleChange('maritalStatus', e.target.value)}
              label="Marital Status"
            >
              <MenuItem value="SINGLE">Single</MenuItem>
              <MenuItem value="MARRIED">Married</MenuItem>
              <MenuItem value="DIVORCED">Divorced</MenuItem>
              <MenuItem value="WIDOWED">Widowed</MenuItem>
              <MenuItem value="UNKNOWN">Unknown</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <NationalIdInput
            value={formData.nationalId || ''}
            onChange={(value) => handleChange('nationalId', value)}
            onPatientSelect={handlePatientSelect}
            onBlur={() => onFieldBlur?.('nationalId')}
            label="National ID"
            required
            error={touched.nationalId && !!validationErrors.nationalId}
            helperText={touched.nationalId && validationErrors.nationalId ? validationErrors.nationalId : ''}
            portalType="patient"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="MRN (Medical Record Number)"
            value={formData.mrn || ''}
            onChange={(e) => handleChange('mrn', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default PersonalInfoStep;
