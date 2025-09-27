/**
 * Incident Details Step Component
 * Second step of the trauma case creation form
 */

import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { MODE_OF_ARRIVAL_OPTIONS, MECHANISM_OF_INJURY_OPTIONS } from '../../constants/traumaConstants';
import { IncidentDetailsFormData } from '../../types/traumaTypes';

interface IncidentDetailsStepProps {
  data: IncidentDetailsFormData;
  onChange: (data: Partial<IncidentDetailsFormData>) => void;
  errors: Record<string, string>;
}

const IncidentDetailsStep: React.FC<IncidentDetailsStepProps> = ({
  data,
  onChange,
  errors,
}) => {
  const handleChange = (field: keyof IncidentDetailsFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    onChange({ [field]: event.target.value });
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <h3>Incident Details</h3>
        <p>Enter information about the incident and patient arrival.</p>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Arrival Date & Time"
          type="datetime-local"
          value={data.arrivalDateTime}
          onChange={handleChange('arrivalDateTime')}
          InputLabelProps={{ shrink: true }}
          error={!!errors.arrivalDateTime}
          helperText={errors.arrivalDateTime}
          required
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Incident Date & Time"
          type="datetime-local"
          value={data.incidentDateTime}
          onChange={handleChange('incidentDateTime')}
          InputLabelProps={{ shrink: true }}
          error={!!errors.incidentDateTime}
          helperText={errors.incidentDateTime}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Mode of Arrival</InputLabel>
          <Select
            value={data.modeOfArrival}
            onChange={handleChange('modeOfArrival')}
            error={!!errors.modeOfArrival}
          >
            {MODE_OF_ARRIVAL_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Mechanism of Injury</InputLabel>
          <Select
            value={data.mechanismOfInjury}
            onChange={handleChange('mechanismOfInjury')}
            error={!!errors.mechanismOfInjury}
          >
            {MECHANISM_OF_INJURY_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      {/* Conditional Transfer Fields */}
      {data.modeOfArrival === 'TRANSFERRED_FROM_ANOTHER_HOSPITAL' && (
        <>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Transfer Request Date & Time"
              type="datetime-local"
              value={data.transferRequestDateTime}
              onChange={handleChange('transferRequestDateTime')}
              InputLabelProps={{ shrink: true }}
              error={!!errors.transferRequestDateTime}
              helperText={errors.transferRequestDateTime}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Transfer Arrival Date & Time"
              type="datetime-local"
              value={data.transferArrivalDateTime}
              onChange={handleChange('transferArrivalDateTime')}
              InputLabelProps={{ shrink: true }}
              error={!!errors.transferArrivalDateTime}
              helperText={errors.transferArrivalDateTime}
            />
          </Grid>
        </>
      )}
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Chief Complaint"
          multiline
          rows={2}
          value={data.chiefComplaint}
          onChange={handleChange('chiefComplaint')}
          error={!!errors.chiefComplaint}
          helperText={errors.chiefComplaint}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Primary Survey Findings"
          multiline
          rows={3}
          value={data.primarySurveyFindings}
          onChange={handleChange('primarySurveyFindings')}
          error={!!errors.primarySurveyFindings}
          helperText={errors.primarySurveyFindings}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Additional Notes"
          multiline
          rows={2}
          value={data.additionalNotes}
          onChange={handleChange('additionalNotes')}
          error={!!errors.additionalNotes}
          helperText={errors.additionalNotes}
        />
      </Grid>
    </Grid>
  );
};

export default IncidentDetailsStep;

