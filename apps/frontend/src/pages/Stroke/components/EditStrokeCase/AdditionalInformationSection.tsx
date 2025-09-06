import React from 'react';
import {
  Grid,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

interface AdditionalInformationSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

const AdditionalInformationSection: React.FC<AdditionalInformationSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Additional Information
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="CT Results"
          multiline
          rows={2}
          value={formData.ctResults || ''}
          onChange={(e) => handleInputChange('ctResults', e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="MRI Results"
          multiline
          rows={2}
          value={formData.mriResults || ''}
          onChange={(e) => handleInputChange('mriResults', e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Complications"
          multiline
          rows={2}
          value={formData.complications || ''}
          onChange={(e) => handleInputChange('complications', e.target.value)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Discharge Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={formData.dischargeDate ? formData.dischargeDate.slice(0, 10) : ''}
          onChange={(e) => handleInputChange('dischargeDate', e.target.value)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Length of Stay (days)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.lengthOfStayDays || ''}
          onChange={(e) => handleInputChange('lengthOfStayDays', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Follow-up Call Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={formData.followUpCallDate ? formData.followUpCallDate.slice(0, 10) : ''}
          onChange={(e) => handleInputChange('followUpCallDate', e.target.value)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.followUpCallCompleted || false}
              onChange={(e) => handleInputChange('followUpCallCompleted', e.target.checked)}
            />
          }
          label="Follow-up Call Completed"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.successful || false}
              onChange={(e) => handleInputChange('successful', e.target.checked)}
            />
          }
          label="Treatment Successful"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.thirtyDayReadmission || false}
              onChange={(e) => handleInputChange('thirtyDayReadmission', e.target.checked)}
            />
          }
          label="30-day Readmission"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.ninetyDayMortality || false}
              onChange={(e) => handleInputChange('ninetyDayMortality', e.target.checked)}
            />
          }
          label="90-day Mortality"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Secondary Prevention Measures"
          multiline
          rows={2}
          value={formData.secondaryPrevention || ''}
          onChange={(e) => handleInputChange('secondaryPrevention', e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Discharge Destination"
          value={formData.dischargeDestination || ''}
          onChange={(e) => handleInputChange('dischargeDestination', e.target.value)}
        />
      </Grid>
    </>
  );
};

export default AdditionalInformationSection;
