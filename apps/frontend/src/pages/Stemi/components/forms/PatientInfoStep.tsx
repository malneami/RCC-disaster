import React from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { PatientInfo } from '../../services/stemiService';
import HospitalSelect from '../../../../components/Common/HospitalSelect';
import StemiDestinationHospitalSelect from '../../../../components/Common/StemiDestinationHospitalSelect';
import NationalIdInput from '../../../../components/Common/NationalIdInput';

interface PatientInfoStepProps {
  data: PatientInfo;
  onChange: (data: PatientInfo) => void;
}

const PatientInfoStep: React.FC<PatientInfoStepProps> = ({
  data,
  onChange,
}) => {
  const handleChange = (field: keyof PatientInfo) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    onChange({ ...data, [field]: event.target.value });
  };

  const handleHospitalChange = (field: 'originHospitalId' | 'destinationHospitalId') => (
    hospitalId: string
  ) => {
    onChange({ ...data, [field]: hospitalId });
  };

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
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            value={data.lastName}
            onChange={handleChange('lastName')}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <NationalIdInput
            value={data.nationalId}
            onChange={(value) => onChange({ ...data, nationalId: value })}
            onPatientSelect={(patient) => {
              onChange({
                ...data,
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
            }}
            label="National ID"
            required
            portalType="stemi"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Age"
            type="number"
            value={data.age || ''}
            onChange={(e) => onChange({ ...data, age: parseInt(e.target.value) || undefined })}
            inputProps={{ min: 0, max: 150 }}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
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
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={data.phoneNumber || ''}
            onChange={handleChange('phoneNumber')}
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
                />
              </Grid>
      
              <Grid item xs={12} sm={6}>
                <StemiDestinationHospitalSelect
                  label="Destination Hospital (Optional)"
                  value={data.destinationHospitalId || ''}
                  onChange={handleHospitalChange('destinationHospitalId')}
                  helperText="Only hospitals with STEMI or Cardiology services are shown"
                />
              </Grid>
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
