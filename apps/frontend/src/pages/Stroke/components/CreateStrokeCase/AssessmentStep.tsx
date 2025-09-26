import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';

import { CreateStrokeCaseData } from '../../../../services/strokeService';
import { formatForDateTimeLocal, formatForUTC } from '../../../../helpers';

interface AssessmentStepProps {
  formData: CreateStrokeCaseData;
  updateFormData: (field: keyof CreateStrokeCaseData, value: any) => void;
  validationErrors?: Record<string, string>;
}

const AssessmentStep: React.FC<AssessmentStepProps> = ({
  formData,
  updateFormData,
  validationErrors = {},
}) => {
  const handleDateTimeChange = (field: string, value: string) => {
    // Convert datetime-local input to ISO-8601 format for backend
    if (value) {
      const isoValue = formatForUTC(value);
      updateFormData(field as keyof CreateStrokeCaseData, isoValue);
    } else {
      updateFormData(field as keyof CreateStrokeCaseData, null);
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Patient Arrival & Timing Section */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Patient Arrival & Timing Assessment
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Record the patient's arrival details and key timing information for KPI calculations.
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required error={!!validationErrors['strokeType']}>
          <InputLabel>Stroke Type</InputLabel>
          <Select
            value={formData.strokeType}
            label="Stroke Type"
            onChange={(e) => updateFormData('strokeType', e.target.value)}
          >
            <MenuItem value="ISCHEMIC">Ischemic</MenuItem>
            <MenuItem value="HEMORRHAGIC">Hemorrhagic</MenuItem>
            <MenuItem value="TIA">TIA</MenuItem>
            <MenuItem value="UNKNOWN">Unknown</MenuItem>
          </Select>
          {validationErrors['strokeType'] && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
              {validationErrors['strokeType']}
            </Typography>
          )}
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Chief Complaint"
          value={formData.chiefComplaint || ''}
          onChange={(e) => updateFormData('chiefComplaint', e.target.value)}
        />
      </Grid>
      
      {formData.modeOfArrival === 'BY_AMBULANCE_RED_CRESCENT' && (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="SRCA Call Time"
            type="datetime-local"
            value={formatForDateTimeLocal(formData.srcaCallTime || '')}
            onChange={(e) => handleDateTimeChange('srcaCallTime', e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Time when SRCA was contacted (KPI#9)"
          />
        </Grid>
      )}
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Time of Symptom Onset"
          type="datetime-local"
          value={formatForDateTimeLocal(formData.timeOfSymptomOnset || '')}
          onChange={(e) => handleDateTimeChange('timeOfSymptomOnset', e.target.value)}
          InputLabelProps={{ shrink: true }}
          helperText="When symptoms first appeared"
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Date of Admission"
          type="datetime-local"
          value={formatForDateTimeLocal(formData.dateOfAdmission || '')}
          onChange={(e) => handleDateTimeChange('dateOfAdmission', e.target.value)}
          InputLabelProps={{ shrink: true }}
          helperText="When patient was registered at hospital"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Time of Triage"
          type="datetime-local"
          value={formatForDateTimeLocal(formData.timeOfTriage || '')}
          onChange={(e) => handleDateTimeChange('timeOfTriage', e.target.value)}
          InputLabelProps={{ shrink: true }}
          helperText="When patient was triaged"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Time of Physician Assessment"
          type="datetime-local"
          value={formatForDateTimeLocal(formData.timeOfPhysicianAssessment || '')}
          onChange={(e) => handleDateTimeChange('timeOfPhysicianAssessment', e.target.value)}
          InputLabelProps={{ shrink: true }}
          helperText="When physician first assessed patient (KPI#1)"
        />
      </Grid>




    </Grid>
  );
};

export default AssessmentStep;
