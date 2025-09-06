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
          label="Door to Imaging (min)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.doorToImagingMinutes || ''}
          onChange={(e) => handleInputChange('doorToImagingMinutes', parseInt(e.target.value) || null)}
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
          label="Door to Groin (min)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.doorToGroinMinutes || ''}
          onChange={(e) => handleInputChange('doorToGroinMinutes', parseInt(e.target.value) || null)}
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
          label="Symptom to Groin (min)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.symptomGroinMinutes || ''}
          onChange={(e) => handleInputChange('symptomGroinMinutes', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Imaging to Needle (min)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.imagingToNeedleMinutes || ''}
          onChange={(e) => handleInputChange('imagingToNeedleMinutes', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Imaging to Groin (min)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.imagingToGroinMinutes || ''}
          onChange={(e) => handleInputChange('imagingToGroinMinutes', parseInt(e.target.value) || null)}
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
