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
import { ClinicalAssessment } from '../../services/stemiService';
import { StemiDatetimeService } from '../../services/stemiDatetimeService';

interface ClinicalAssessmentStepProps {
  data: ClinicalAssessment;
  onChange: (data: ClinicalAssessment) => void;
}

const ClinicalAssessmentStep: React.FC<ClinicalAssessmentStepProps> = ({
  data,
  onChange,
}) => {
  const handleChange = (field: keyof ClinicalAssessment) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.type === 'number' ? 
      (event.target.value === '' ? undefined : Number(event.target.value)) : 
      event.target.value;
    onChange({ ...data, [field]: value });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Clinical Assessment
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Record the clinical assessment details for this STEMI case.
      </Typography>

      <Grid container spacing={3}>
        {/* HEART Score */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="HEART Score"
            type="number"
            value={data.heartScore || ''}
            onChange={handleChange('heartScore')}
            inputProps={{ min: 0, max: 10 }}
            helperText="HEART score for risk stratification (0-10)"
          />
        </Grid>

        {/* Clinical Risk Level */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Clinical Risk Level</InputLabel>
            <Select
              value={data.clinicalRiskLevel || ''}
              onChange={handleChange('clinicalRiskLevel')}
              label="Clinical Risk Level"
            >
              <MenuItem value="">Select Risk Level</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Intermediate">Intermediate</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Very High">Very High</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Presenting Symptoms */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Presenting Symptoms"
            value={data.presentingSymptoms || ''}
            onChange={handleChange('presentingSymptoms')}
            multiline
            rows={3}
            helperText="Describe the patient's presenting symptoms"
          />
        </Grid>

        {/* Symptom Onset */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Symptom Onset"
            type="datetime-local"
            value={data.symptomOnset || StemiDatetimeService.getCurrentLocalDateTime()}
            onChange={handleChange('symptomOnset')}
            InputLabelProps={{ shrink: true }}
            helperText="When symptoms started"
          />
        </Grid>

        {/* Symptom Duration */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Symptom Duration (minutes)"
            type="number"
            value={data.symptomDuration || ''}
            onChange={handleChange('symptomDuration')}
            inputProps={{ min: 0 }}
            helperText="Duration of symptoms in minutes"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClinicalAssessmentStep;
