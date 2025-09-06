import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

import { CreateStrokeCaseData, StrokeSeverity } from '../../../../services/strokeService';

interface ClinicalAssessmentsStepProps {
  formData: CreateStrokeCaseData;
  updateFormData: (field: keyof CreateStrokeCaseData, value: any) => void;
}

const ClinicalAssessmentsStep: React.FC<ClinicalAssessmentsStepProps> = ({
  formData,
  updateFormData,
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="NIHSS Baseline"
          type="number"
          inputProps={{ min: 0, max: 42 }}
          value={formData.nihssBaseline || ''}
          onChange={(e) => updateFormData('nihssBaseline', parseInt(e.target.value) || null)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="NIHSS 24hr"
          type="number"
          inputProps={{ min: 0, max: 42 }}
          value={formData.nihss24hr || ''}
          onChange={(e) => updateFormData('nihss24hr', parseInt(e.target.value) || null)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="mRS Baseline"
          type="number"
          inputProps={{ min: 0, max: 6 }}
          value={formData.mrsBaseline || ''}
          onChange={(e) => updateFormData('mrsBaseline', parseInt(e.target.value) || null)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="mRS 90-day"
          type="number"
          inputProps={{ min: 0, max: 6 }}
          value={formData.mrs90day || ''}
          onChange={(e) => updateFormData('mrs90day', parseInt(e.target.value) || null)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Barthel Baseline"
          type="number"
          inputProps={{ min: 0, max: 100 }}
          value={formData.barthelBaseline || ''}
          onChange={(e) => updateFormData('barthelBaseline', parseInt(e.target.value) || null)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="ASPECTS Score"
          type="number"
          inputProps={{ min: 0, max: 10 }}
          value={formData.aspectsScore || ''}
          onChange={(e) => updateFormData('aspectsScore', parseInt(e.target.value) || null)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="GCS Baseline"
          type="number"
          inputProps={{ min: 3, max: 15 }}
          value={formData.gcsBaseline || ''}
          onChange={(e) => updateFormData('gcsBaseline', parseInt(e.target.value) || null)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Stroke Severity</InputLabel>
          <Select
            value={formData.strokeSeverity || ''}
            label="Stroke Severity"
            onChange={(e) => updateFormData('strokeSeverity', e.target.value as StrokeSeverity)}
          >
            <MenuItem value="MILD">Mild</MenuItem>
            <MenuItem value="MODERATE">Moderate</MenuItem>
            <MenuItem value="SEVERE">Severe</MenuItem>
            <MenuItem value="CRITICAL">Critical</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Symptom to Hospital (minutes)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.symptomToHospitalMinutes || ''}
          onChange={(e) => updateFormData('symptomToHospitalMinutes', parseInt(e.target.value) || null)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.wakeUpStroke || false}
              onChange={(e) => updateFormData('wakeUpStroke', e.target.checked)}
            />
          }
          label="Wake-up Stroke"
        />
      </Grid>
    </Grid>
  );
};

export default ClinicalAssessmentsStep;
