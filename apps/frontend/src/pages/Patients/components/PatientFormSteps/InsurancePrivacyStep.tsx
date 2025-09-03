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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { CreatePatientData } from '../../../../services/patientService';

interface InsurancePrivacyStepProps {
  formData: CreatePatientData;
  onDataChange: (data: Partial<CreatePatientData>) => void;
}

const InsurancePrivacyStep: React.FC<InsurancePrivacyStepProps> = ({ formData, onDataChange }) => {
  const handleChange = (field: keyof CreatePatientData, value: any) => {
    onDataChange({ [field]: value });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Insurance Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please provide the patient's insurance details.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Insurance Provider"
            value={formData.insuranceProvider || ''}
            onChange={(e) => handleChange('insuranceProvider', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Policy Number"
            value={formData.insuranceNumber || ''}
            onChange={(e) => handleChange('insuranceNumber', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Group Number"
            value={formData.insuranceGroup || ''}
            onChange={(e) => handleChange('insuranceGroup', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Insurance Expiry Date"
            type="date"
            value={formData.insuranceExpiry || ''}
            onChange={(e) => handleChange('insuranceExpiry', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Privacy & Consent
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please set privacy levels and consent preferences.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Privacy Level</InputLabel>
            <Select
              value={formData.privacyLevel || 'PRIVATE'}
              onChange={(e) => handleChange('privacyLevel', e.target.value)}
              label="Privacy Level"
            >
              <MenuItem value="PUBLIC">Public</MenuItem>
              <MenuItem value="INTERNAL">Internal</MenuItem>
              <MenuItem value="PRIVATE">Private</MenuItem>
              <MenuItem value="RESTRICTED">Restricted</MenuItem>
              <MenuItem value="CONFIDENTIAL">Confidential</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Data Retention Policy"
            value={formData.dataRetentionPolicy || ''}
            onChange={(e) => handleChange('dataRetentionPolicy', e.target.value)}
            placeholder="e.g., 7 years, lifetime, etc."
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.consentGiven || false}
                onChange={(e) => handleChange('consentGiven', e.target.checked)}
              />
            }
            label="Patient has given consent for data processing and sharing"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Privacy Notice:</strong> All patient information is protected under HIPAA regulations. 
          Access to this data is logged and monitored for security purposes. 
          By proceeding, you confirm that you have the necessary authorization to view and modify this patient's information.
        </Typography>
      </Box>
    </Box>
  );
};

export default InsurancePrivacyStep;
