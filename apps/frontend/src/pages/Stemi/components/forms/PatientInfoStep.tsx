import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
} from '@mui/material';
import { PatientInfo } from '../../services/stemiService';
import HospitalSelect from '../../../../components/Common/HospitalSelect';
import StemiDestinationHospitalSelect from '../../../../components/Common/StemiDestinationHospitalSelect';
import NationalIdInput from '../../../../components/Common/NationalIdInput';
import { Hospital } from '../../../../services/hospitalService';
import { calculateAge, calculateDoBFromAge, formatDateToLocalInput } from '../../../../utils/ageCalculator';

interface PatientInfoStepProps {
  data: PatientInfo;
  onChange: (data: PatientInfo) => void;
  validationErrors?: Record<string, string>;
  onOriginHospitalSelect?: (hospital: Hospital | null) => void;
  destinationRequired?: boolean;
}

const PatientInfoStep: React.FC<PatientInfoStepProps> = ({
  data,
  onChange,
  validationErrors = {},
  onOriginHospitalSelect,
  destinationRequired = false,
}) => {
  // State for age parts
  const [ageParts, setAgeParts] = useState({
    years: '',
    months: '',
    days: ''
  });

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
      setAgeParts(prev => ({
        ...prev,
        years: data.age?.toString() || '',
      }));
    }
  }, [data.dateOfBirth, data.age]);

  const handleChange = (field: keyof PatientInfo) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    onChange({ ...data, [field]: event.target.value });
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;
    const newData = { ...data, dateOfBirth: date };

    if (date) {
      const ageDetails = calculateAge(date);
      newData.age = ageDetails.years;
    } else {
      newData.age = undefined;
    }

    onChange(newData);
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

      onChange({
        ...data,
        dateOfBirth: dobString,
        age: years,
      });
    } else if (newAgeParts.years === '' && newAgeParts.months === '' && newAgeParts.days === '') {
      onChange({
        ...data,
        dateOfBirth: undefined,
        age: undefined,
      });
    }
  };

  const handleHospitalChange = (field: 'originHospitalId' | 'destinationHospitalId') => (
    hospitalId: string
  ) => {
    const newData = { ...data, [field]: hospitalId };

    // Automatically determine case type based on hospital selection
    const originHospitalId = field === 'originHospitalId' ? hospitalId : data.originHospitalId;
    const destinationHospitalId = field === 'destinationHospitalId' ? hospitalId : data.destinationHospitalId;

    // If origin and destination are different (and destination is not empty), it's a TRANSFER
    // If they're the same or destination is empty, it's DIRECT
    if (originHospitalId && destinationHospitalId && originHospitalId !== destinationHospitalId) {
      newData.caseType = 'TRANSFER';
    } else {
      newData.caseType = 'DIRECT';
    }

    onChange(newData);
  };

  const destinationError = validationErrors['patientInfo.destinationHospitalId'];
  const destinationLabel = destinationRequired
    ? 'Destination Hospital (Required)'
    : 'Destination Hospital (Optional)';

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Patient Information
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Enter the patient's basic information and hospital details.
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Basic Information
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            value={data.firstName}
            onChange={handleChange('firstName')}
            required
            error={!!validationErrors['patientInfo.firstName']}
            helperText={validationErrors['patientInfo.firstName']}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            value={data.lastName}
            onChange={handleChange('lastName')}
            required
            error={!!validationErrors['patientInfo.lastName']}
            helperText={validationErrors['patientInfo.lastName']}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <NationalIdInput
            value={data.nationalId}
            onChange={(value) => onChange({ ...data, nationalId: value })}
            onPatientSelect={(patient) => {
              // Format DoB if it exists
              const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : undefined;

              let age = patient.age;
              if (age === undefined && dob) {
                age = calculateAge(dob).years;
              }

              onChange({
                ...data,
                firstName: patient.firstName,
                lastName: patient.lastName,
                nationalId: patient.nationalId || '',
                dateOfBirth: dob,
                age: age || undefined,
                gender: patient.gender as 'MALE' | 'FEMALE',
                phoneNumber: patient.phoneNumber || '',
                address: patient.address || '',
                emergencyContact: patient.emergencyContact || '',
                emergencyPhone: patient.emergencyPhone || '',
                medicalHistory: patient.medicalHistory || '',
                allergies: patient.allergies || '',
                medications: patient.medications || '',
              });
            }}
            label="National ID"
            required={!data.nationalIdNotAvailable}
            error={!!validationErrors['patientInfo.nationalId']}
            helperText={validationErrors['patientInfo.nationalId']}
            portalType="stemi"
            notAvailable={data.nationalIdNotAvailable || false}
            onNotAvailableChange={(checked) => onChange({
              ...data,
              nationalIdNotAvailable: checked,
              nationalId: checked ? '' : data.nationalId
            })}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!!validationErrors['patientInfo.gender']}>
            <InputLabel>Gender</InputLabel>
            <Select
              value={data.gender}
              onChange={handleChange('gender')}
              label="Gender"
            >
              <MenuItem value="MALE">Male</MenuItem>
              <MenuItem value="FEMALE">Female</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
            {validationErrors['patientInfo.gender'] && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                {validationErrors['patientInfo.gender']}
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
            error={!!validationErrors['patientInfo.dateOfBirth']}
            helperText={validationErrors['patientInfo.dateOfBirth'] || 'Age calculated automatically'}
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
                error={!!validationErrors['patientInfo.age']}
              />
            </Grid>
            <Grid item xs={12}>
              {validationErrors['patientInfo.age'] && (
                <Typography variant="caption" color="error">
                  {validationErrors['patientInfo.age']}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={data.phoneNumber || ''}
            onChange={handleChange('phoneNumber')}
            error={!!validationErrors['patientInfo.phoneNumber']}
            helperText={
              validationErrors['patientInfo.phoneNumber'] ||
              'Digits only, you can include a leading "+" for international numbers'
            }
          />
        </Grid>

        {/* Hospital Information */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Hospital Information
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <HospitalSelect
            label="Origin Hospital"
            value={data.originHospitalId}
            onChange={handleHospitalChange('originHospitalId')}
            required
            error={!!validationErrors['patientInfo.originHospitalId']}
            helperText={validationErrors['patientInfo.originHospitalId']}
            onHospitalSelect={onOriginHospitalSelect}
            showServiceBadges
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <StemiDestinationHospitalSelect
            label={destinationLabel}
            value={data.destinationHospitalId || ''}
            onChange={handleHospitalChange('destinationHospitalId')}
            helperText={
              destinationError
                ? destinationError
                : 'Only hospitals with STEMI or Cardiology services are shown'
            }
            error={!!destinationError}
            required={destinationRequired}
          />
        </Grid>

        {destinationRequired && (
          <Grid item xs={12}>
            <Alert severity="warning">
              Please select a destination hospital because the selected origin hospital does not
              provide STEMI service.
            </Alert>
          </Grid>
        )}
        {/* Contact Information */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Contact Information
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            value={data.address || ''}
            onChange={handleChange('address')}
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Emergency Contact"
            value={data.emergencyContact || ''}
            onChange={handleChange('emergencyContact')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Emergency Phone"
            value={data.emergencyPhone || ''}
            onChange={handleChange('emergencyPhone')}
            error={!!validationErrors['patientInfo.emergencyPhone']}
            helperText={
              validationErrors['patientInfo.emergencyPhone'] ||
              'Digits only, you can include a leading "+" for international numbers'
            }
          />
        </Grid>

        {/* Medical Information */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Medical Information
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Medical History"
            value={data.medicalHistory || ''}
            onChange={handleChange('medicalHistory')}
            multiline
            rows={3}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Allergies"
            value={data.allergies || ''}
            onChange={handleChange('allergies')}
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Current Medications"
            value={data.medications || ''}
            onChange={handleChange('medications')}
            multiline
            rows={2}
          />
        </Grid>

      </Grid>
    </Box>
  );
};

export default PatientInfoStep;
