import React from 'react';
import {
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

import { StrokeTreatment } from '../../../../services/strokeService';

interface TreatmentInformationSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

const TreatmentInformationSection: React.FC<TreatmentInformationSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Treatment Information
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Selected Treatment</InputLabel>
          <Select
            value={formData.selectedTreatment || ''}
            label="Selected Treatment"
            onChange={(e) => handleInputChange('selectedTreatment', e.target.value)}
          >
            <MenuItem value="IV_THROMBOLYSIS">IV Thrombolysis</MenuItem>
            <MenuItem value="MECHANICAL_THROMBECTOMY">Mechanical Thrombectomy</MenuItem>
            <MenuItem value="COMBINED_THERAPY">Combined Therapy</MenuItem>
            <MenuItem value="CONSERVATIVE_MANAGEMENT">Conservative Management</MenuItem>
            <MenuItem value="SURGICAL_INTERVENTION">Surgical Intervention</MenuItem>
            <MenuItem value="NOT_ELIGIBLE">Not Eligible</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.eligibleForThrombolysis || false}
              onChange={(e) => handleInputChange('eligibleForThrombolysis', e.target.checked)}
            />
          }
          label="Eligible for Thrombolysis"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Thrombolysis Contraindications"
          multiline
          rows={2}
          value={formData.thrombolysisContraindications || ''}
          onChange={(e) => handleInputChange('thrombolysisContraindications', e.target.value)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.eligibleForThrombectomy || false}
              onChange={(e) => handleInputChange('eligibleForThrombectomy', e.target.checked)}
            />
          }
          label="Eligible for Thrombectomy"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Thrombectomy Contraindications"
          multiline
          rows={2}
          value={formData.thrombectomyContraindications || ''}
          onChange={(e) => handleInputChange('thrombectomyContraindications', e.target.value)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Pathway Started"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          value={formData.pathwayStarted ? formData.pathwayStarted.slice(0, 16) : ''}
          onChange={(e) => handleInputChange('pathwayStarted', e.target.value)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Pathway Completed"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          value={formData.pathwayCompleted ? formData.pathwayCompleted.slice(0, 16) : ''}
          onChange={(e) => handleInputChange('pathwayCompleted', e.target.value)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Stroke Unit Admission Time"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          value={formData.strokeUnitAdmissionTime ? formData.strokeUnitAdmissionTime.slice(0, 16) : ''}
          onChange={(e) => handleInputChange('strokeUnitAdmissionTime', e.target.value)}
        />
      </Grid>
    </>
  );
};

export default TreatmentInformationSection;
