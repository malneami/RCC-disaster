import React from 'react';
import {
  Grid,
  Typography,
  TextField,
} from '@mui/material';

interface PerformanceTimingsSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

const PerformanceTimingsSection: React.FC<PerformanceTimingsSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Performance Timings (minutes)
        </Typography>
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Door to CT Scan (min)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.doorToCtScanMinutes || ''}
          onChange={(e) => handleInputChange('doorToCtScanMinutes', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Door to Needle (min)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.doorToNeedleMinutes || ''}
          onChange={(e) => handleInputChange('doorToNeedleMinutes', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Door to Mechanical Thrombectomy (min)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.doorToMechanicalThrombectomyMinutes || ''}
          onChange={(e) => handleInputChange('doorToMechanicalThrombectomyMinutes', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Symptom to Needle (min)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.symptomNeedleMinutes || ''}
          onChange={(e) => handleInputChange('symptomNeedleMinutes', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Symptom to Mechanical Thrombectomy (min)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.symptomToMechanicalThrombectomyMinutes || ''}
          onChange={(e) => handleInputChange('symptomToMechanicalThrombectomyMinutes', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="CT Scan to Needle (min)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.imagingToNeedleMinutes || ''}
          onChange={(e) => handleInputChange('imagingToNeedleMinutes', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="CT Scan to Mechanical Thrombectomy (min)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.imagingToMechanicalThrombectomyMinutes || ''}
          onChange={(e) => handleInputChange('imagingToMechanicalThrombectomyMinutes', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Dysphagia Screening (min)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.dysphagiaScreeningMinutes || ''}
          onChange={(e) => handleInputChange('dysphagiaScreeningMinutes', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Early Mobilization (hours)"
          type="number"
          inputProps={{ min: 0, step: 0.5 }}
          value={formData.earlyMobilizationHours || ''}
          onChange={(e) => handleInputChange('earlyMobilizationHours', parseFloat(e.target.value) || null)}
        />
      </Grid>
    </>
  );
};

export default PerformanceTimingsSection;
