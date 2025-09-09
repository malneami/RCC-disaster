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


interface BasicInformationSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

const BasicInformationSection: React.FC<BasicInformationSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Stroke Type</InputLabel>
          <Select
            value={formData.strokeType || ''}
            label="Stroke Type"
            onChange={(e) => handleInputChange('strokeType', e.target.value)}
          >
            <MenuItem value="ISCHEMIC">Ischemic</MenuItem>
            <MenuItem value="HEMORRHAGIC">Hemorrhagic</MenuItem>
            <MenuItem value="TIA">TIA</MenuItem>
            <MenuItem value="UNKNOWN">Unknown</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Stroke Subtype"
          value={formData.strokeSubtype || ''}
          onChange={(e) => handleInputChange('strokeSubtype', e.target.value)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Stroke Severity</InputLabel>
          <Select
            value={formData.strokeSeverity || ''}
            label="Stroke Severity"
            onChange={(e) => handleInputChange('strokeSeverity', e.target.value)}
          >
            <MenuItem value="MILD">Mild</MenuItem>
            <MenuItem value="MODERATE">Moderate</MenuItem>
            <MenuItem value="SEVERE">Severe</MenuItem>
            <MenuItem value="CRITICAL">Critical</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Current Status</InputLabel>
          <Select
            value={formData.currentStatus || ''}
            label="Current Status"
            onChange={(e) => handleInputChange('currentStatus', e.target.value)}
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

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Presenting Symptoms"
          multiline
          rows={3}
          value={formData.presentingSymptoms || ''}
          onChange={(e) => handleInputChange('presentingSymptoms', e.target.value)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Symptom Onset"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          value={formData.symptomOnset ? formData.symptomOnset.slice(0, 16) : ''}
          onChange={(e) => handleInputChange('symptomOnset', e.target.value)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Last Known Well"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          value={formData.lastKnownWell ? formData.lastKnownWell.slice(0, 16) : ''}
          onChange={(e) => handleInputChange('lastKnownWell', e.target.value)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Symptom to Hospital (minutes)"
          type="number"
          value={formData.symptomToHospitalMinutes || ''}
          onChange={(e) => handleInputChange('symptomToHospitalMinutes', parseInt(e.target.value) || null)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.wakeUpStroke || false}
              onChange={(e) => handleInputChange('wakeUpStroke', e.target.checked)}
            />
          }
          label="Wake-up Stroke"
        />
      </Grid>
    </>
  );
};

export default BasicInformationSection;
