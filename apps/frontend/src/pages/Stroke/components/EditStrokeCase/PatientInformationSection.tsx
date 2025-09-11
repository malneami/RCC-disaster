import React from 'react';
import {
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

interface PatientInformationSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
  isAdmin?: boolean;
}

const PatientInformationSection: React.FC<PatientInformationSectionProps> = ({
  formData,
  handleInputChange,
  isAdmin = false,
}) => {

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Patient Information
        </Typography>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="First Name"
          value={formData.patientInfo?.firstName || ''}
          onChange={(e) => handleInputChange('patientInfo', {
            ...formData.patientInfo,
            firstName: e.target.value
          })}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Last Name"
          value={formData.patientInfo?.lastName || ''}
          onChange={(e) => handleInputChange('patientInfo', {
            ...formData.patientInfo,
            lastName: e.target.value
          })}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="National ID"
          value={formData.patientInfo?.nationalId || ''}
          onChange={(e) => handleInputChange('patientInfo', {
            ...formData.patientInfo,
            nationalId: e.target.value
          })}
          disabled={!isAdmin}
          helperText={!isAdmin ? "Only admins can edit National ID" : ""}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Medical Record Number (MRN)"
          value={formData.patientInfo?.mrn || ''}
          onChange={(e) => handleInputChange('patientInfo', {
            ...formData.patientInfo,
            mrn: e.target.value
          })}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Age"
          type="number"
          inputProps={{ min: 0, max: 150 }}
          value={formData.patientInfo?.age || ''}
          onChange={(e) => handleInputChange('patientInfo', {
            ...formData.patientInfo,
            age: parseInt(e.target.value) || undefined
          })}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Gender</InputLabel>
          <Select
            value={formData.patientInfo?.gender || ''}
            label="Gender"
            onChange={(e) => handleInputChange('patientInfo', {
              ...formData.patientInfo,
              gender: e.target.value
            })}
          >
            <MenuItem value="MALE">Male</MenuItem>
            <MenuItem value="FEMALE">Female</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
            <MenuItem value="UNKNOWN">Unknown</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone Number"
          value={formData.patientInfo?.phoneNumber || ''}
          onChange={(e) => handleInputChange('patientInfo', {
            ...formData.patientInfo,
            phoneNumber: e.target.value
          })}
        />
      </Grid>
    </>
  );
};

export default PatientInformationSection;
