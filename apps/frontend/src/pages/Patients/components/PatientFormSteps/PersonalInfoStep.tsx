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
import { calculateAge, calculateDoBFromAge, formatDateToLocalInput } from '../../../../utils/ageCalculator';

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
  // State to track age parts for display/editing
  // These are derived from formData but kept in state to allow independent editing before DoB calculation
  const [ageParts, setAgeParts] = React.useState({
    years: '',
    months: '',
    days: ''
  });

  // Effect to update age parts when formData changes (e.g. DoB selected or patient loaded)
  React.useEffect(() => {
    // If we have a DoB, calculate age parts from it
    if (formData.dateOfBirth) {
      const ageDetails = calculateAge(formData.dateOfBirth);
      setAgeParts({
        years: ageDetails.years.toString(),
        months: ageDetails.months.toString(),
        days: ageDetails.days.toString()
      });
    } else {
      // If no DoB, check if we have explicit age parts in formData
      // This might happen if we just cleared DoB or if data came from somewhere else without DoB
      setAgeParts({
        years: formData.age !== undefined ? formData.age.toString() : '',
        months: formData.ageMonths !== undefined ? formData.ageMonths.toString() : '',
        days: formData.ageDays !== undefined ? formData.ageDays.toString() : ''
      });
    }
  }, [formData.dateOfBirth, formData.age, formData.ageMonths, formData.ageDays]);

  const handleChange = (field: keyof CreatePatientData, value: any) => {
    // Handle dateOfBirth changes
    if (field === 'dateOfBirth') {
      if (value && value.trim() !== '') {
        // Date of birth is being set
        try {
          // Calculate age details to update the form data
          const ageDetails = calculateAge(value);

          onDataChange({
            [field]: value,
            age: ageDetails.years,
            ageMonths: ageDetails.months,
            ageDays: ageDetails.days
          });
          return;
        } catch (error) {
          // If date is invalid, just update dateOfBirth
          onDataChange({ [field]: value });
          return;
        }
      } else {
        // Date of birth is being cleared
        // Also clear age fields
        onDataChange({
          [field]: value || undefined,
          age: undefined,
          ageMonths: undefined,
          ageDays: undefined
        });
        return;
      }
    }

    onDataChange({ [field]: value });
  };

  // Handle changes to specific age parts (Years, Months, Days)
  const handleAgePartChange = (part: 'years' | 'months' | 'days', value: string) => {
    // Only allow non-negative numbers
    if (value && (isNaN(parseInt(value)) || parseInt(value) < 0)) {
      return;
    }

    const newAgeParts = { ...ageParts, [part]: value };
    setAgeParts(newAgeParts);

    const years = parseInt(newAgeParts.years) || 0;
    const months = parseInt(newAgeParts.months) || 0;
    const days = parseInt(newAgeParts.days) || 0;

    // Any input triggers calculation
    if (years > 0 || months > 0 || days > 0 || value === '0') {
      const dob = calculateDoBFromAge(years, months, days);
      // Use local date formatting to avoid timezone offset issues
      const dobString = formatDateToLocalInput(dob);

      onDataChange({
        dateOfBirth: dobString,
        age: years,
        ageMonths: months,
        ageDays: days
      });
    } else if (newAgeParts.years === '' && newAgeParts.months === '' && newAgeParts.days === '') {
      // If all cleared, clear DoB
      onDataChange({
        dateOfBirth: undefined,
        age: undefined,
        ageMonths: undefined,
        ageDays: undefined
      });
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    // Auto-fill form with selected patient data
    const dateOfBirth = patient.dateOfBirth
      ? new Date(patient.dateOfBirth).toISOString().split('T')[0]
      : '';

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
          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth || ''}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            onBlur={() => onFieldBlur?.('dateOfBirth')}
            error={touched.dateOfBirth && !!validationErrors.dateOfBirth}
            helperText={touched.dateOfBirth && validationErrors.dateOfBirth ? validationErrors.dateOfBirth : 'Optional - Age is calculated automatically'}
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
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Days"
                value={ageParts.days}
                onChange={(e) => handleAgePartChange('days', e.target.value)}
                onBlur={() => onFieldBlur?.('ageDays')}
                type="number"
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Months"
                value={ageParts.months}
                onChange={(e) => handleAgePartChange('months', e.target.value)}
                onBlur={() => onFieldBlur?.('ageMonths')}
                type="number"
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Years"
                value={ageParts.years}
                onChange={(e) => handleAgePartChange('years', e.target.value)}
                onBlur={() => onFieldBlur?.('age')}
                type="number"
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Enter age to calculate Date of Birth automatically
              </Typography>
            </Grid>
          </Grid>
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
      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.soft', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
        <Typography variant="body2" color="info.main">
          <strong>Note:</strong> The Date of Birth is the primary source of truth. Entering age (Years, Months, Days) will calculate the Date of Birth based on today's date.
        </Typography>
      </Box>
    </Box>
  );
};

export default PersonalInfoStep;
