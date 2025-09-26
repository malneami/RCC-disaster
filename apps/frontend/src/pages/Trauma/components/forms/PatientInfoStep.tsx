/**
 * Patient Information Step Component
 * First step of the trauma case creation form
 */

import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { GENDER_OPTIONS } from '../../constants/traumaConstants';
import { PatientInfoFormData } from '../../types/traumaTypes';
import NationalIdInput from '../../../../components/Common/NationalIdInput';
import HospitalSelect from '../../../../components/Common/HospitalSelect';
import { Patient } from '../../../../services/patientService';

interface PatientInfoStepProps {
  data: PatientInfoFormData;
  onChange: (data: Partial<PatientInfoFormData>) => void;
  errors: Record<string, string>;
  validationErrors?: Record<string, string>;
  isAdmin?: boolean;
}

const PatientInfoStep: React.FC<PatientInfoStepProps> = ({
  data,
  onChange,
  errors,
  validationErrors = {},
  isAdmin = true,
}) => {
  const handleChange = (field: keyof PatientInfoFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    onChange({ [field]: event.target.value });
  };

  const handlePatientSelect = (patient: Patient) => {
    onChange({
      firstName: patient.firstName,
      lastName: patient.lastName,
      nationalId: patient.nationalId || '',
      age: patient.age || undefined,
      gender: patient.gender as 'MALE' | 'FEMALE',
      phoneNumber: patient.phoneNumber || '',
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
          required
          error={!!errors.nationalId || !!validationErrors['patientInfo.nationalId']}
          helperText={errors.nationalId || validationErrors['patientInfo.nationalId']}
          portalType="trauma"
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Age"
          type="number"
          value={data.age || ''}
          onChange={(e) => onChange({ age: parseInt(e.target.value) || undefined })}
          inputProps={{ min: 0, max: 150 }}
          error={!!errors.age || !!validationErrors['patientInfo.age']}
          helperText={errors.age || validationErrors['patientInfo.age']}
          required
          disabled={!isAdmin}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required error={!!errors.gender || !!validationErrors['patientInfo.gender']}>
          <InputLabel>Gender</InputLabel>
          <Select
            value={data.gender}
            onChange={handleChange('gender')}
            disabled={!isAdmin}
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
          label="Phone Number"
          value={data.phoneNumber}
          onChange={handleChange('phoneNumber')}
          error={!!errors.phoneNumber}
          helperText={errors.phoneNumber}
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
          error={!!errors.emergencyPhone}
          helperText={errors.emergencyPhone}
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
          onChange={(value) => onChange({ originHospitalId: value })}
          label="Origin Hospital"
          required
          error={!!errors.originHospitalId || !!validationErrors['patientInfo.originHospitalId']}
          helperText={errors.originHospitalId || validationErrors['patientInfo.originHospitalId']}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <HospitalSelect
          value={data.destinationHospitalId || ''}
          onChange={(value) => onChange({ destinationHospitalId: value || undefined })}
          label="Destination Hospital (Optional)"
          error={!!errors.destinationHospitalId}
          helperText={errors.destinationHospitalId}
          placeholder="None"
        />
      </Grid>
    </Grid>
  );
};

export default PatientInfoStep;

