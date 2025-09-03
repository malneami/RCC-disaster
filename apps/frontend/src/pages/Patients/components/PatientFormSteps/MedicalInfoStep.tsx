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

interface MedicalInfoStepProps {
  formData: CreatePatientData;
  onDataChange: (data: Partial<CreatePatientData>) => void;
}

const MedicalInfoStep: React.FC<MedicalInfoStepProps> = ({ formData, onDataChange }) => {
  const handleChange = (field: keyof CreatePatientData, value: any) => {
    onDataChange({ [field]: value });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Medical Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please provide the patient's medical details and history.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Blood Type</InputLabel>
            <Select
              value={formData.bloodType || ''}
              onChange={(e) => handleChange('bloodType', e.target.value)}
              label="Blood Type"
            >
              <MenuItem value="A+">A+</MenuItem>
              <MenuItem value="A-">A-</MenuItem>
              <MenuItem value="B+">B+</MenuItem>
              <MenuItem value="B-">B-</MenuItem>
              <MenuItem value="AB+">AB+</MenuItem>
              <MenuItem value="AB-">AB-</MenuItem>
              <MenuItem value="O+">O+</MenuItem>
              <MenuItem value="O-">O-</MenuItem>
              <MenuItem value="UNKNOWN">Unknown</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>RH Factor</InputLabel>
            <Select
              value={formData.rhFactor || ''}
              onChange={(e) => handleChange('rhFactor', e.target.value)}
              label="RH Factor"
            >
              <MenuItem value="POSITIVE">Positive</MenuItem>
              <MenuItem value="NEGATIVE">Negative</MenuItem>
              <MenuItem value="UNKNOWN">Unknown</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Weight (kg)"
            type="number"
            value={formData.weight || ''}
            onChange={(e) => handleChange('weight', parseFloat(e.target.value) || null)}
            inputProps={{ min: 0, step: 0.1 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Height (cm)"
            type="number"
            value={formData.height || ''}
            onChange={(e) => handleChange('height', parseFloat(e.target.value) || null)}
            inputProps={{ min: 0, step: 0.1 }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Allergies"
            value={formData.allergies || ''}
            onChange={(e) => handleChange('allergies', e.target.value)}
            multiline
            rows={2}
            placeholder="Enter allergies separated by commas"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Current Medications"
            value={formData.medications || ''}
            onChange={(e) => handleChange('medications', e.target.value)}
            multiline
            rows={2}
            placeholder="Enter current medications separated by commas"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Risk Factors"
            value={formData.riskFactors || ''}
            onChange={(e) => handleChange('riskFactors', e.target.value)}
            multiline
            rows={2}
            placeholder="Enter risk factors separated by commas"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Chronic Conditions"
            value={formData.chronicConditions || ''}
            onChange={(e) => handleChange('chronicConditions', e.target.value)}
            multiline
            rows={2}
            placeholder="Enter chronic conditions separated by commas"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Medical History"
            value={formData.medicalHistory || ''}
            onChange={(e) => handleChange('medicalHistory', e.target.value)}
            multiline
            rows={4}
            placeholder="Enter detailed medical history"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MedicalInfoStep;
