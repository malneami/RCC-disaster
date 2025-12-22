/**
 * Vitals Assessment Step Component
 * Third step of the trauma case creation form
 */

import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { VitalsAssessmentFormData } from '../../types/traumaTypes';
import { validateGlasgowComaScale } from '../../helpers/traumaHelpers';
import { GLASGOW_COMA_SCALE_OPTIONS } from '../../constants/traumaConstants';

interface VitalsAssessmentStepProps {
  data: VitalsAssessmentFormData;
  onChange: (data: Partial<VitalsAssessmentFormData>) => void;
  errors: Record<string, string>;
  validationErrors?: Record<string, string>;
}

const VitalsAssessmentStep: React.FC<VitalsAssessmentStepProps> = ({
  data,
  onChange,
  errors,
  validationErrors = {},
}) => {
  const handleVitalSignsChange = (field: keyof VitalsAssessmentFormData['vitalSigns']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(event.target.value) || 0;
    onChange({
      vitalSigns: {
        ...data.vitalSigns,
        [field]: value,
      },
    });
  };

  const handleDirectChange = (field: keyof VitalsAssessmentFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'additionalVitalSigns' 
      ? event.target.value 
      : parseFloat(event.target.value) || 0;
    onChange({ [field]: value });
  };


  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <h3>Vital Signs & Assessment</h3>
        <p>Record the patient's vital signs and neurological assessment.</p>
      </Grid>
      
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Vital Signs
        </Typography>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Temperature (°C)"
          type="number"
          value={data.vitalSigns.temperature || ''}
          onChange={handleVitalSignsChange('temperature')}
          error={!!errors.temperature || !!validationErrors['vitalsAssessment.vitalSigns.temperature']}
          helperText={errors.temperature || validationErrors['vitalsAssessment.vitalSigns.temperature'] || 'Normal range: 36.1-37.2°C'}
          inputProps={{ min: 30, max: 45, step: 0.1 }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Heart Rate (BPM)"
          type="number"
          value={data.vitalSigns.heartRate || ''}
          onChange={handleVitalSignsChange('heartRate')}
          error={!!errors.heartRate || !!validationErrors['vitalsAssessment.vitalSigns.heartRate']}
          helperText={errors.heartRate || validationErrors['vitalsAssessment.vitalSigns.heartRate'] || 'Normal range: 60-100 BPM'}
          inputProps={{ min: 30, max: 300 }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Oxygen Saturation (%)"
          type="number"
          value={data.vitalSigns.oxygenSaturation || ''}
          onChange={handleVitalSignsChange('oxygenSaturation')}
          error={!!errors.oxygenSaturation || !!validationErrors['vitalsAssessment.vitalSigns.oxygenSaturation']}
          helperText={errors.oxygenSaturation || validationErrors['vitalsAssessment.vitalSigns.oxygenSaturation'] || 'Normal range: 95-100%'}
          inputProps={{ min: 0, max: 100 }}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Respiratory Rate"
          type="number"
          value={data.respiratoryRate || ''}
          onChange={handleDirectChange('respiratoryRate')}
          error={!!errors.respiratoryRate || !!validationErrors['vitalsAssessment.respiratoryRate']}
          helperText={errors.respiratoryRate || validationErrors['vitalsAssessment.respiratoryRate'] || 'Normal range: 12-20 breaths/min'}
          inputProps={{ min: 5, max: 60 }}
        />
      </Grid>
      
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Neurological Assessment
        </Typography>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.glasgowComaScale || !!validationErrors['vitalsAssessment.glasgowComaScale']}>
          <InputLabel>Glasgow Coma Scale</InputLabel>
          <Select
            value={data.glasgowComaScale || ''}
            onChange={(event) => onChange({ glasgowComaScale: event.target.value as number })}
            label="Glasgow Coma Scale"
          >
            {GLASGOW_COMA_SCALE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {(errors.glasgowComaScale || validationErrors['vitalsAssessment.glasgowComaScale']) && (
            <div style={{ color: 'red', fontSize: '0.75rem', marginTop: '4px' }}>
              {errors.glasgowComaScale || validationErrors['vitalsAssessment.glasgowComaScale']}
            </div>
          )}
          <div style={{ fontSize: '0.75rem', marginTop: '4px', color: 'rgba(0, 0, 0, 0.6)' }}>
            Scale: 3-15 (3=worst, 15=best)
          </div>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Systolic Blood Pressure"
          type="number"
          value={data.systolicBloodPressure || ''}
          onChange={handleDirectChange('systolicBloodPressure')}
          error={!!errors.systolicBloodPressure || !!validationErrors['vitalsAssessment.systolicBloodPressure']}
          helperText={errors.systolicBloodPressure || validationErrors['vitalsAssessment.systolicBloodPressure'] || 'Systolic pressure only'}
          inputProps={{ min: 50, max: 300 }}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Additional Vital Signs"
          multiline
          rows={2}
          value={data.additionalVitalSigns}
          onChange={handleDirectChange('additionalVitalSigns')}
          error={!!errors.additionalVitalSigns}
          helperText={errors.additionalVitalSigns || 'Any additional vital signs or observations'}
        />
      </Grid>
      
      {data.glasgowComaScale && (
        <Grid item xs={12}>
          <Box 
            sx={{ 
              p: 2, 
              bgcolor: validateGlasgowComaScale(data.glasgowComaScale) ? 'success.light' : 'error.light',
              borderRadius: 1,
              textAlign: 'center'
            }}
          >
            <Typography variant="body2">
              <strong>GCS Score: {data.glasgowComaScale}</strong>
              {data.glasgowComaScale < 8 && ' - Critical (Intubation may be required)'}
              {data.glasgowComaScale >= 8 && data.glasgowComaScale < 13 && ' - Moderate'}
              {data.glasgowComaScale >= 13 && ' - Mild'}
            </Typography>
          </Box>
        </Grid>
      )}
    </Grid>
  );
};

export default VitalsAssessmentStep;
