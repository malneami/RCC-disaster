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
import { CreatePatientData } from '../../../../services/patientService';
import { useDuplicateChecker } from '../../../../hooks/useDuplicateChecker';
import DuplicateAlert from '../../../../components/common/DuplicateAlert';

interface PersonalInfoStepProps {
  formData: CreatePatientData;
  onDataChange: (data: Partial<CreatePatientData>) => void;
  onViewDuplicate?: (patient: any) => void;
  isEditing?: boolean; // Add this prop to indicate if we're editing
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ formData, onDataChange, onViewDuplicate, isEditing = false }) => {
  const handleChange = (field: keyof CreatePatientData, value: any) => {
    onDataChange({ [field]: value });
  };

  // Live duplicate checking - disabled when editing
  const { hasDuplicates, duplicates, loading, error } = useDuplicateChecker({
    nationalId: formData.nationalId,
    firstName: formData.firstName,
    lastName: formData.lastName,
    dateOfBirth: formData.dateOfBirth,
    enabled: !isEditing && !!(formData.nationalId || (formData.firstName && formData.lastName)),
    debounceMs: 800,
  });

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Personal Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please provide the patient's basic personal information.
      </Typography>

      {/* Duplicate Alert - only show when not editing */}
      {!isEditing && (
        <DuplicateAlert
          duplicates={duplicates}
          loading={loading}
          error={error}
          onViewPatient={onViewDuplicate}
          severity={hasDuplicates ? 'warning' : 'info'}
        />
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            value={formData.firstName || ''}
            onChange={(e) => handleChange('firstName', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            value={formData.lastName || ''}
            onChange={(e) => handleChange('lastName', e.target.value)}
            required
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
            required
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Gender</InputLabel>
            <Select
              value={formData.gender || 'UNKNOWN'}
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
          <TextField
            fullWidth
            label="National ID"
            value={formData.nationalId || ''}
            onChange={(e) => handleChange('nationalId', e.target.value)}
            InputProps={{
              endAdornment: !isEditing && loading && formData.nationalId ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Checking...
                  </Typography>
                </Box>
              ) : undefined,
            }}
            helperText={!isEditing && hasDuplicates && formData.nationalId ? 'Potential duplicates found' : ''}
            error={!!(!isEditing && hasDuplicates && formData.nationalId)}
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
