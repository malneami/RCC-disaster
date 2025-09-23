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

import { CreateStrokeCaseData, StrokeModeOfArrival } from '../../../../services/strokeService';
import { formatForDateTimeLocal, formatForUTC } from '../../../../helpers';

interface AssessmentStepProps {
  formData: CreateStrokeCaseData;
  updateFormData: (field: keyof CreateStrokeCaseData, value: any) => void;
}

const AssessmentStep: React.FC<AssessmentStepProps> = ({
  formData,
  updateFormData,
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
        <FormControl fullWidth>
          <InputLabel>Mode of Arrival</InputLabel>
          <Select
            value={formData.modeOfArrival || ''}
            onChange={(e) => updateFormData('modeOfArrival', e.target.value as StrokeModeOfArrival)}
          >
           <MenuItem value="AMBULANCE">Ambulance</MenuItem>
              <MenuItem value="PRIVATE_VEHICLE">Private Vehicle</MenuItem>
              <MenuItem value="AIR_TRANSPORT">Air Transport</MenuItem>
              <MenuItem value="WALK_IN">Walk In</MenuItem>
              <MenuItem value="POLICE">Police</MenuItem>
              <MenuItem value="TRANSFERRED_FROM_HOSPITAL">Transferred from Hospital</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
          </Select>
        </FormControl>
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
          label="Last Known Normal"
          type="datetime-local"
          value={formatForDateTimeLocal(formData.lastKnownNormal || '')}
          onChange={(e) => handleDateTimeChange('lastKnownNormal', e.target.value)}
          InputLabelProps={{ shrink: true }}
          helperText="Last time patient was known to be normal"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Time of Registration"
          type="datetime-local"
          value={formatForDateTimeLocal(formData.timeOfRegistration || '')}
          onChange={(e) => handleDateTimeChange('timeOfRegistration', e.target.value)}
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
