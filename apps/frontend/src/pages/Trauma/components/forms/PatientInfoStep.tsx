import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { GENDER_OPTIONS } from '../../constants/traumaConstants';
import { PatientInfoFormData } from '../../types/traumaTypes';
import NationalIdInput from '../../../../components/Common/NationalIdInput';
import HospitalSelect from '../../../../components/Common/HospitalSelect';
import { Patient } from '../../../../services/patientService';
import { hospitalService, Hospital } from '../../../../services/hospitalService';
import { calculateAge, calculateDoBFromAge, formatDateToLocalInput } from '../../../../utils/ageCalculator';

interface PatientInfoStepProps {
  data: PatientInfoFormData;
  onChange: (data: Partial<PatientInfoFormData>) => void;
  errors: Record<string, string>;
  validationErrors?: Record<string, string>;
  isAdmin?: boolean;
  onOriginHospitalSelect?: (hospital: Hospital | null) => void;
  destinationRequired?: boolean;
}

const PatientInfoStep: React.FC<PatientInfoStepProps> = ({
  data,
  onChange,
  errors,
  validationErrors = {},
  isAdmin = true,
  onOriginHospitalSelect,
  destinationRequired = false,
}) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  // State for age parts
  const [ageParts, setAgeParts] = useState({
    years: '',
    months: '',
    days: ''
  });

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoadingHospitals(true);
        const hospitalsData = await hospitalService.getAllHospitals();
        setHospitals(hospitalsData);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
      } finally {
        setLoadingHospitals(false);
      }
    };

    fetchHospitals();
  }, []);

  // Update age parts when data.dateOfBirth or data.age changes
  useEffect(() => {
    if (data.dateOfBirth) {
      const ageDetails = calculateAge(data.dateOfBirth);
      setAgeParts({
        years: ageDetails.years.toString(),
        months: ageDetails.months.toString(),
        days: ageDetails.days.toString()
      });
    } else if (data.age !== undefined) {
      // If only age (years) is available
      setAgeParts(prev => ({
        ...prev,
        years: data.age?.toString() || '',
        // Keep existing months/days if match roughly, or reset? 
        // For simplicity, if DoB is missing but Age is present, we might just show years.
        // But better to respect user input if they just typed it.
      }));
    }
  }, [data.dateOfBirth, data.age]);

  const handleChange = (field: keyof PatientInfoFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    onChange({ [field]: event.target.value });
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;
    const newData: Partial<PatientInfoFormData> = { dateOfBirth: date };

    if (date) {
      const ageDetails = calculateAge(date);
      newData.age = ageDetails.years;
      // We don't store months/days in Trauma types currently, but UI state updates via useEffect
    } else {
      newData.age = undefined;
    }

    onChange(newData);
  };

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
      const dobString = formatDateToLocalInput(dob);

      onChange({
        dateOfBirth: dobString,
        age: years,
      });
    } else if (newAgeParts.years === '' && newAgeParts.months === '' && newAgeParts.days === '') {
      onChange({
        dateOfBirth: undefined,
        age: undefined,
      });
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    // Format DoB if it exists
    const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : undefined;

    // Calculate age from DOB if not provided
    let age = patient.age;
    if (age === undefined && dob) {
      age = calculateAge(dob).years;
    }

    onChange({
      firstName: patient.firstName,
      lastName: patient.lastName,
      nationalId: patient.nationalId || '',
      dateOfBirth: dob,
      age: age || undefined,
      gender: patient.gender as 'MALE' | 'FEMALE',
      phoneNumber: patient.phoneNumber || '',
      email: patient.email || '',
      address: patient.address || '',
      emergencyContact: patient.emergencyContact || '',
      emergencyPhone: patient.emergencyPhone || '',
      medicalHistory: patient.medicalHistory || '',
      allergies: patient.allergies || '',
      medications: patient.medications || '',
    });
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <h3>Patient Information</h3>
        <p>Enter the patient's basic demographic information.</p>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="First Name"
          value={data.firstName}
          onChange={handleChange('firstName')}
          error={!!errors.firstName || !!validationErrors['patientInfo.firstName']}
          helperText={errors.firstName || validationErrors['patientInfo.firstName']}
          required
          disabled={!isAdmin}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Last Name"
          value={data.lastName}
          onChange={handleChange('lastName')}
          error={!!errors.lastName || !!validationErrors['patientInfo.lastName']}
          helperText={errors.lastName || validationErrors['patientInfo.lastName']}
          required
          disabled={!isAdmin}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <NationalIdInput
          value={data.nationalId}
          onChange={(value) => onChange({ nationalId: value })}
          onPatientSelect={handlePatientSelect}
          label="National ID"
          required={!data.nationalIdNotAvailable}
          error={!!errors.nationalId || !!validationErrors['patientInfo.nationalId']}
          helperText={errors.nationalId || validationErrors['patientInfo.nationalId']}
          portalType="trauma"
          notAvailable={data.nationalIdNotAvailable || false}
          onNotAvailableChange={(checked) => onChange({
            nationalIdNotAvailable: checked,
            nationalId: checked ? '' : data.nationalId
          })}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required error={!!errors.gender || !!validationErrors['patientInfo.gender']}>
          <InputLabel>Gender</InputLabel>
          <Select
            value={data.gender}
            onChange={handleChange('gender')}
            disabled={!isAdmin}
            label="Gender"
          >
            {GENDER_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {(errors.gender || validationErrors['patientInfo.gender']) && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
              {errors.gender || validationErrors['patientInfo.gender']}
            </Typography>
          )}
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Date of Birth"
          type="date"
          value={data.dateOfBirth || ''}
          onChange={handleDateChange}
          InputLabelProps={{ shrink: true }}
          inputProps={{ max: new Date().toISOString().split('T')[0] }}
          error={!!errors.dateOfBirth || !!validationErrors['patientInfo.dateOfBirth']}
          helperText={errors.dateOfBirth || validationErrors['patientInfo.dateOfBirth'] || 'Age calculated automatically'}
          disabled={!isAdmin}
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
              type="number"
              inputProps={{ min: 0 }}
              disabled={!isAdmin}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Months"
              value={ageParts.months}
              onChange={(e) => handleAgePartChange('months', e.target.value)}
              type="number"
              inputProps={{ min: 0 }}
              disabled={!isAdmin}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Years"
              value={ageParts.years}
              onChange={(e) => handleAgePartChange('years', e.target.value)}
              type="number"
              inputProps={{ min: 0, max: 150 }}
              error={!!errors.age || !!validationErrors['patientInfo.age']}
              disabled={!isAdmin}
            />
          </Grid>
          <Grid item xs={12}>
            {(errors.age || validationErrors['patientInfo.age']) && (
              <Typography variant="caption" color="error">
                {errors.age || validationErrors['patientInfo.age']}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone Number"
          value={data.phoneNumber}
          onChange={handleChange('phoneNumber')}
          error={!!errors.phoneNumber || !!validationErrors['patientInfo.phoneNumber']}
          helperText={errors.phoneNumber || validationErrors['patientInfo.phoneNumber']}
          disabled={!isAdmin}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={data.email || ''}
          onChange={handleChange('email')}
          error={!!errors.email || !!validationErrors['patientInfo.email']}
          helperText={errors.email || validationErrors['patientInfo.email']}
          disabled={!isAdmin}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Address"
          multiline
          rows={2}
          value={data.address}
          onChange={handleChange('address')}
          error={!!errors.address}
          helperText={errors.address}
          disabled={!isAdmin}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Emergency Contact"
          value={data.emergencyContact}
          onChange={handleChange('emergencyContact')}
          error={!!errors.emergencyContact}
          helperText={errors.emergencyContact}
          disabled={!isAdmin}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Emergency Contact Phone"
          value={data.emergencyPhone}
          onChange={handleChange('emergencyPhone')}
          error={!!errors.emergencyPhone || !!validationErrors['patientInfo.emergencyPhone']}
          helperText={errors.emergencyPhone || validationErrors['patientInfo.emergencyPhone']}
          disabled={!isAdmin}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Medical History"
          multiline
          rows={3}
          value={data.medicalHistory}
          onChange={handleChange('medicalHistory')}
          error={!!errors.medicalHistory}
          helperText={errors.medicalHistory}
          disabled={!isAdmin}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Allergies"
          value={data.allergies}
          onChange={handleChange('allergies')}
          error={!!errors.allergies}
          helperText={errors.allergies}
          disabled={!isAdmin}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Current Medications"
          value={data.medications}
          onChange={handleChange('medications')}
          error={!!errors.medications}
          helperText={errors.medications}
          disabled={!isAdmin}
        />
      </Grid>

      {/* Hospital Selection */}
      <Grid item xs={12}>
        <h4>Hospital Information</h4>
        <p>Select the origin hospital (required) and destination hospital (optional for transfers).</p>
      </Grid>

      <Grid item xs={12} sm={6}>
        <HospitalSelect
          value={data.originHospitalId}
          onChange={(value) => {
            onChange({ originHospitalId: value });
            const hospital = hospitals.find(h => h.id === value);
            onOriginHospitalSelect?.(hospital || null);
          }}
          label="Origin Hospital"
          required
          error={!!errors.originHospitalId || !!validationErrors['patientInfo.originHospitalId']}
          helperText={errors.originHospitalId || validationErrors['patientInfo.originHospitalId']}
          showServiceBadges
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required={destinationRequired} error={!!errors.destinationHospitalId || !!validationErrors['patientInfo.destinationHospitalId']}>
          <InputLabel>{destinationRequired ? 'Destination Hospital (Required)' : 'Destination Hospital (Optional)'}</InputLabel>
          <Select
            value={data.destinationHospitalId || ''}
            onChange={(e) => onChange({ destinationHospitalId: e.target.value || undefined })}
            disabled={loadingHospitals}
            label={destinationRequired ? 'Destination Hospital (Required)' : 'Destination Hospital (Optional)'}
          >
            {!destinationRequired && (
              <MenuItem value="">
                <em>No destination hospital</em>
              </MenuItem>
            )}
            {loadingHospitals ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading hospitals...
              </MenuItem>
            ) : (
              hospitals
                .filter((hospital) => hospital.hasTraumaService)
                .map((hospital) => (
                  <MenuItem key={hospital.id} value={hospital.id}>
                    <Box>
                      <Typography variant="body1">{hospital.name}</Typography>
                      {hospital.address && (
                        <Typography variant="caption" color="text.secondary">
                          {hospital.address}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))
            )}
          </Select>
          {(errors.destinationHospitalId || validationErrors['patientInfo.destinationHospitalId']) && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
              {errors.destinationHospitalId || validationErrors['patientInfo.destinationHospitalId']}
            </Typography>
          )}
          {!errors.destinationHospitalId && !validationErrors['patientInfo.destinationHospitalId'] && destinationRequired && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
              Only hospitals with Trauma service are shown
            </Typography>
          )}
        </FormControl>
      </Grid>
      {destinationRequired && (
        <Grid item xs={12}>
          <Alert severity="warning">
            Please select a destination hospital because the selected origin hospital does not provide Trauma service.
          </Alert>
        </Grid>
      )}
    </Grid>
  );
};

export default PatientInfoStep;
