import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  InputAdornment,
} from '@mui/material';
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Wc as GenderIcon,
  Info as InfoIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import { CreatePatientData, Patient } from '../../../../services/patientService';
import NationalIdInput from '../../../../components/Common/NationalIdInput';
import { calculateAge, calculateDoBFromAge, formatDateToLocalInput } from '../../../../utils/ageCalculator';
import PersonalInfoFormField from './PersonalInfoFormField';
import AgeInputSection from './AgeInputSection';

interface PersonalInfoStepProps {
  formData: CreatePatientData;
  onDataChange: (data: Partial<CreatePatientData>) => void;
  onFieldBlur?: (field: string) => void;
  validationErrors?: Record<string, string>;
  touched?: Record<string, boolean>;
  onViewDuplicate?: (patient: Patient) => void;
  onPatientSelected?: (patient: Patient) => void;
  isEditing?: boolean;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  formData,
  onDataChange,
  onFieldBlur,
  validationErrors = {},
  touched = {},
  onPatientSelected
}) => {
  const [ageParts, setAgeParts] = React.useState({
    years: '',
    months: '',
    days: ''
  });

  React.useEffect(() => {
    if (formData.dateOfBirth) {
      const ageDetails = calculateAge(formData.dateOfBirth);
      setAgeParts({
        years: ageDetails.years.toString(),
        months: ageDetails.months.toString(),
        days: ageDetails.days.toString()
      });
    } else {
      setAgeParts({
        years: formData.age !== undefined ? formData.age.toString() : '',
        months: formData.ageMonths !== undefined ? formData.ageMonths.toString() : '',
        days: formData.ageDays !== undefined ? formData.ageDays.toString() : ''
      });
    }
  }, [formData.dateOfBirth, formData.age, formData.ageMonths, formData.ageDays]);

  const handleChange = (field: keyof CreatePatientData, value: any) => {
    if (field === 'dateOfBirth') {
      if (value && value.trim() !== '') {
        try {
          const ageDetails = calculateAge(value);
          onDataChange({
            [field]: value,
            age: ageDetails.years,
            ageMonths: ageDetails.months,
            ageDays: ageDetails.days
          });
          return;
        } catch (error) {
          onDataChange({ [field]: value });
          return;
        }
      } else {
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

  const handleAgePartChange = (part: 'years' | 'months' | 'days', value: string) => {
    if (value && (isNaN(parseInt(value)) || parseInt(value) < 0)) {
      return;
    }

    const newAgeParts = { ...ageParts, [part]: value };
    setAgeParts(newAgeParts);

    const years = parseInt(newAgeParts.years) || 0;
    const months = parseInt(newAgeParts.months) || 0;
    const days = parseInt(newAgeParts.days) || 0;

    if (years > 0 || months > 0 || days > 0 || value === '0') {
      const dob = calculateDoBFromAge(years, months, days);
      const dobString = formatDateToLocalInput(dob);
      onDataChange({
        dateOfBirth: dobString,
        age: years,
        ageMonths: months,
        ageDays: days
      });
    } else if (newAgeParts.years === '' && newAgeParts.months === '' && newAgeParts.days === '') {
      onDataChange({
        dateOfBirth: undefined,
        age: undefined,
        ageMonths: undefined,
        ageDays: undefined
      });
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    const dateOfBirth = patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '';
    onDataChange({
      firstName: patient.firstName,
      lastName: patient.lastName,
      nationalId: patient.nationalId,
      mrn: patient.mrn,
      dateOfBirth,
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
    onPatientSelected?.(patient);
  };

  const formControlSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      background: '#ffffff',
      transition: 'all 0.3s ease',
      '&:hover': {
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(66, 165, 245, 0.5)',
        },
      },
      '&.Mui-focused': {
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#42a5f5',
          borderWidth: '2px',
        },
        boxShadow: '0 0 0 4px rgba(66, 165, 245, 0.1)',
      },
    },
  };


  return (
    <Box>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(66, 165, 245, 0.25)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(66, 165, 245, 0.3)',
            }}
          >
            <PersonIcon sx={{ fontSize: '24px' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', fontSize: '1.25rem' }}>
              Personal Information
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem', mt: 0.25 }}>
              Provide the patient's basic personal information
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2.5}>
          {/* Name Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 600, mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Name Information
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="First Name"
              value={formData.firstName || ''}
              onChange={(e) => handleChange('firstName', e.target.value)}
              onBlur={() => onFieldBlur?.('firstName')}
              required
              error={touched.firstName && !!validationErrors.firstName}
              helperText={touched.firstName && validationErrors.firstName ? validationErrors.firstName : ''}
              icon={
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="Last Name"
              value={formData.lastName || ''}
              onChange={(e) => handleChange('lastName', e.target.value)}
              onBlur={() => onFieldBlur?.('lastName')}
              required
              error={touched.lastName && !!validationErrors.lastName}
              helperText={touched.lastName && validationErrors.lastName ? validationErrors.lastName : ''}
              icon={
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="Middle Name"
              value={formData.middleName || ''}
              onChange={(e) => handleChange('middleName', e.target.value)}
              icon={
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: '#9e9e9e', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required sx={formControlSx}>
              <InputLabel>Gender</InputLabel>
              <Select
                value={formData.gender || 'MALE'}
                onChange={(e) => handleChange('gender', e.target.value)}
                label="Gender"
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <GenderIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="MALE">Male</MenuItem>
                <MenuItem value="FEMALE">Female</MenuItem>
                <MenuItem value="UNKNOWN">Unknown</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Date & Age Section */}
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 600, mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Date of Birth & Age
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth || ''}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              onBlur={() => onFieldBlur?.('dateOfBirth')}
              error={touched.dateOfBirth && !!validationErrors.dateOfBirth}
              helperText={touched.dateOfBirth && validationErrors.dateOfBirth ? validationErrors.dateOfBirth : 'Optional - Age is calculated automatically'}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: new Date().toISOString().split('T')[0] }}
              icon={
                <InputAdornment position="start">
                  <CalendarIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <AgeInputSection
              ageParts={ageParts}
              onAgePartChange={handleAgePartChange}
              onFieldBlur={onFieldBlur}
            />
          </Grid>

          {/* Identification Section */}
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 600, mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Identification
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={formControlSx}>
              <InputLabel>Marital Status</InputLabel>
              <Select
                value={formData.maritalStatus || 'UNKNOWN'}
                onChange={(e) => handleChange('maritalStatus', e.target.value)}
                label="Marital Status"
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <InfoIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                  </InputAdornment>
                }
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
            <PersonalInfoFormField
              fullWidth
              label="MRN (Medical Record Number)"
              value={formData.mrn || ''}
              onChange={(e) => handleChange('mrn', e.target.value)}
              icon={
                <InputAdornment position="start">
                  <HospitalIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
        </Grid>
      </Box>

      <Box
        sx={{
          mt: 2,
          p: 2.5,
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(66, 165, 245, 0.08) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(33, 150, 243, 0.25)',
          boxShadow: '0 2px 8px rgba(33, 150, 243, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <InfoIcon sx={{ color: '#2196f3', fontSize: '20px', mt: 0.25 }} />
          <Typography variant="body2" sx={{ color: '#1976d2', fontSize: '0.875rem', lineHeight: 1.6 }}>
            <strong>Note:</strong> The Date of Birth is the primary source of truth. Entering age (Years, Months, Days) will calculate the Date of Birth based on today's date. The system will automatically check for existing patients using the National ID and prevent duplicate patient creation across all hospitals.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default PersonalInfoStep;
