import React, { useState } from 'react';
import {
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
} from '@mui/material';
import { PersonSearch as PersonSearchIcon } from '@mui/icons-material';

import { Patient } from '../../../../services/patientService';
import PatientSearchDialog from '../../../../components/Common/PatientSearchDialog';

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
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  const handlePatientSelect = (patient: Patient) => {
    handleInputChange('patientInfo', {
      firstName: patient.firstName,
      lastName: patient.lastName,
      nationalId: patient.nationalId || '',
      mrn: patient.mrn || '',
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
      gender: patient.gender || 'UNKNOWN',
      phoneNumber: patient.phoneNumber || '',
      email: patient.email || '',
    });
  };

  return (
    <>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6">
            Patient Information
          </Typography>
          <Button
            variant="outlined"
            startIcon={<PersonSearchIcon />}
            onClick={() => setPatientSearchOpen(true)}
            size="small"
          >
            Search Existing Patient
          </Button>
        </Box>
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
          label="Date of Birth"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={formData.patientInfo?.dateOfBirth ? formData.patientInfo.dateOfBirth.split('T')[0] : ''}
          onChange={(e) => handleInputChange('patientInfo', {
            ...formData.patientInfo,
            dateOfBirth: e.target.value
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
      
      <PatientSearchDialog
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        onPatientSelect={handlePatientSelect}
        title="Search for Existing Patient"
      />
    </>
  );
};

export default PatientInformationSection;
