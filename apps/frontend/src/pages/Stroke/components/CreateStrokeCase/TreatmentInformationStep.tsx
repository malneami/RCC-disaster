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

import { CreateStrokeCaseData, StrokeStatus, StrokeTreatment } from '../../../../services/strokeService';

interface TreatmentInformationStepProps {
  formData: CreateStrokeCaseData;
  updateFormData: (field: keyof CreateStrokeCaseData, value: any) => void;
}

const TreatmentInformationStep: React.FC<TreatmentInformationStepProps> = ({
  formData,
  updateFormData,
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Current Status</InputLabel>
          <Select
            value={formData.currentStatus}
            label="Current Status"
            onChange={(e) => updateFormData('currentStatus', e.target.value as StrokeStatus)}
          >
            <MenuItem value="SUSPECTED">Suspected</MenuItem>
            <MenuItem value="CONFIRMED">Confirmed</MenuItem>
            <MenuItem value="IMAGING_PENDING">Imaging Pending</MenuItem>
            <MenuItem value="IMAGING_COMPLETE">Imaging Complete</MenuItem>
            <MenuItem value="TREATMENT_EVALUATION">Treatment Evaluation</MenuItem>
            <MenuItem value="THROMBOLYSIS_STARTED">Thrombolysis Started</MenuItem>
            <MenuItem value="THROMBECTOMY_STARTED">Thrombectomy Started</MenuItem>
            <MenuItem value="TREATMENT_COMPLETE">Treatment Complete</MenuItem>
            <MenuItem value="STROKEUNIT_ADMITTED">Stroke Unit Admitted</MenuItem>
            <MenuItem value="REHABILITATION_STARTED">Rehabilitation Started</MenuItem>
            <MenuItem value="DISCHARGED">Discharged</MenuItem>
            <MenuItem value="FOLLOW_UP">Follow Up</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Selected Treatment</InputLabel>
          <Select
            value={formData.selectedTreatment || ''}
            label="Selected Treatment"
            onChange={(e) => updateFormData('selectedTreatment', e.target.value as StrokeTreatment)}
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
              onChange={(e) => updateFormData('eligibleForThrombolysis', e.target.checked)}
            />
          }
          label="Eligible for Thrombolysis"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.eligibleForThrombectomy || false}
              onChange={(e) => updateFormData('eligibleForThrombectomy', e.target.checked)}
            />
          }
          label="Eligible for Thrombectomy"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Thrombolysis Contraindications"
          multiline
          rows={2}
          value={formData.thrombolysisContraindications || ''}
          onChange={(e) => updateFormData('thrombolysisContraindications', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Thrombectomy Contraindications"
          multiline
          rows={2}
          value={formData.thrombectomyContraindications || ''}
          onChange={(e) => updateFormData('thrombectomyContraindications', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Door to Imaging (minutes)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.doorToImagingMinutes || ''}
          onChange={(e) => updateFormData('doorToImagingMinutes', parseInt(e.target.value) || null)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Door to Needle (minutes)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.doorToNeedleMinutes || ''}
          onChange={(e) => updateFormData('doorToNeedleMinutes', parseInt(e.target.value) || null)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Door to Groin (minutes)"
          type="number"
          inputProps={{ min: 0 }}
          value={formData.doorToGroinMinutes || ''}
          onChange={(e) => updateFormData('doorToGroinMinutes', parseInt(e.target.value) || null)}
        />
      </Grid>
    </Grid>
  );
};

export default TreatmentInformationStep;
