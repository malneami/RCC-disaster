import React from 'react';
import {
  Grid,
  Typography,
  TextField,
} from '@mui/material';

interface ClinicalAssessmentsSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

const ClinicalAssessmentsSection: React.FC<ClinicalAssessmentsSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Clinical Assessments
        </Typography>
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="NIHSS Baseline"
          type="number"
          inputProps={{ min: 0, max: 42 }}
          value={formData.nihssBaseline || ''}
          onChange={(e) => handleInputChange('nihssBaseline', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="NIHSS 24hr"
          type="number"
          inputProps={{ min: 0, max: 42 }}
          value={formData.nihss24hr || ''}
          onChange={(e) => handleInputChange('nihss24hr', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="NIHSS Discharge"
          type="number"
          inputProps={{ min: 0, max: 42 }}
          value={formData.nihssDischarge || ''}
          onChange={(e) => handleInputChange('nihssDischarge', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="mRS Baseline"
          type="number"
          inputProps={{ min: 0, max: 6 }}
          value={formData.mrsBaseline || ''}
          onChange={(e) => handleInputChange('mrsBaseline', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="mRS 90-day"
          type="number"
          inputProps={{ min: 0, max: 6 }}
          value={formData.mrs90day || ''}
          onChange={(e) => handleInputChange('mrs90day', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="GCS Baseline"
          type="number"
          inputProps={{ min: 3, max: 15 }}
          value={formData.gcsBaseline || ''}
          onChange={(e) => handleInputChange('gcsBaseline', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Barthel Baseline"
          type="number"
          inputProps={{ min: 0, max: 100 }}
          value={formData.barthelBaseline || ''}
          onChange={(e) => handleInputChange('barthelBaseline', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Barthel Discharge"
          type="number"
          inputProps={{ min: 0, max: 100 }}
          value={formData.barthelDischarge || ''}
          onChange={(e) => handleInputChange('barthelDischarge', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="ASPECTS Score"
          type="number"
          inputProps={{ min: 0, max: 10 }}
          value={formData.aspectsScore || ''}
          onChange={(e) => handleInputChange('aspectsScore', parseInt(e.target.value) || null)}
        />
      </Grid>
    </>
  );
};

export default ClinicalAssessmentsSection;
