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
  Alert,
  Typography,
} from '@mui/material';
import { MODE_OF_ARRIVAL_OPTIONS, MECHANISM_OF_INJURY_OPTIONS } from '../../constants/traumaConstants';
import { IncidentDetailsFormData } from '../../types/traumaTypes';

interface IncidentDetailsStepProps {
  data: IncidentDetailsFormData;
  onChange: (data: Partial<IncidentDetailsFormData>) => void;
  errors: Record<string, string>;
  validationErrors?: Record<string, string>;
  timelineWarnings?: Record<string, string[]>;
}

const emphasizeKeywords = (text: string): React.ReactNode => {
  const keywords = ['arrival', 'incident', 'transfer', 'request', 'time', 'before', 'after'];
  const parts = text.split(new RegExp(`(${keywords.join('|')})`, 'gi'));
  return parts.map((part, index) => {
    if (keywords.some(k => part.toLowerCase() === k.toLowerCase())) {
      return <strong key={index}>{part}</strong>;
    }
    return part;
  });
};

const IncidentDetailsStep: React.FC<IncidentDetailsStepProps> = ({
  data,
  onChange,
  errors,
  validationErrors = {},
  timelineWarnings = {},
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
          error={!!errors.arrivalDateTime || !!validationErrors['incidentDetails.arrivalDateTime'] || !!timelineWarnings['incidentDetails.arrivalDateTime']}
          helperText={errors.arrivalDateTime || validationErrors['incidentDetails.arrivalDateTime']}
          required
        />
        {timelineWarnings['incidentDetails.arrivalDateTime']?.map((warning, idx) => (
          <Alert key={idx} severity="warning" variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {emphasizeKeywords(warning)}
            </Typography>
          </Alert>
        ))}
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Incident Date & Time"
          type="datetime-local"
          value={data.incidentDateTime}
          onChange={handleChange('incidentDateTime')}
          InputLabelProps={{ shrink: true }}
          error={!!errors.incidentDateTime || !!validationErrors['incidentDetails.incidentDateTime'] || !!timelineWarnings['incidentDetails.incidentDateTime']}
          helperText={errors.incidentDateTime || validationErrors['incidentDetails.incidentDateTime']}
        />
        {timelineWarnings['incidentDetails.incidentDateTime']?.map((warning, idx) => (
          <Alert key={idx} severity="warning" variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {emphasizeKeywords(warning)}
            </Typography>
          </Alert>
        ))}
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required error={!!errors.modeOfArrival || !!validationErrors['incidentDetails.modeOfArrival']}>
          <InputLabel>Mode of Arrival</InputLabel>
          <Select
            value={data.modeOfArrival}
            onChange={handleChange('modeOfArrival')}
            label="Mode of Arrival"
          >
            {MODE_OF_ARRIVAL_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {(errors.modeOfArrival || validationErrors['incidentDetails.modeOfArrival']) && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
              {errors.modeOfArrival || validationErrors['incidentDetails.modeOfArrival']}
            </Typography>
          )}
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required error={!!errors.mechanismOfInjury || !!validationErrors['incidentDetails.mechanismOfInjury']}>
          <InputLabel>Mechanism of Injury</InputLabel>
          <Select
            value={data.mechanismOfInjury}
            onChange={handleChange('mechanismOfInjury')}
            label="Mechanism of Injury"
          >
            {MECHANISM_OF_INJURY_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {(errors.mechanismOfInjury || validationErrors['incidentDetails.mechanismOfInjury']) && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
              {errors.mechanismOfInjury || validationErrors['incidentDetails.mechanismOfInjury']}
            </Typography>
          )}
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
              error={!!errors.transferRequestDateTime || !!validationErrors['incidentDetails.transferRequestDateTime'] || !!timelineWarnings['incidentDetails.transferRequestDateTime']}
              helperText={errors.transferRequestDateTime || validationErrors['incidentDetails.transferRequestDateTime']}
            />
            {timelineWarnings['incidentDetails.transferRequestDateTime']?.map((warning, idx) => (
              <Alert key={idx} severity="warning" variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {emphasizeKeywords(warning)}
                </Typography>
              </Alert>
            ))}
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Transfer Arrival Date & Time"
              type="datetime-local"
              value={data.transferArrivalDateTime}
              onChange={handleChange('transferArrivalDateTime')}
              InputLabelProps={{ shrink: true }}
              error={!!errors.transferArrivalDateTime || !!validationErrors['incidentDetails.transferArrivalDateTime'] || !!timelineWarnings['incidentDetails.transferArrivalDateTime']}
              helperText={errors.transferArrivalDateTime || validationErrors['incidentDetails.transferArrivalDateTime']}
            />
            {timelineWarnings['incidentDetails.transferArrivalDateTime']?.map((warning, idx) => (
              <Alert key={idx} severity="warning" variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {emphasizeKeywords(warning)}
                </Typography>
              </Alert>
            ))}
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

      {/* KPI & Clinical Timelines Section */}
      <Grid item xs={12}>
        <div style={{ marginTop: '16px', marginBottom: '8px' }}>
          <Typography variant="h6" color="primary" gutterBottom>
            Clinical Timelines & KPIs
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Essential timestamps for Trauma Performance Monitoring.
          </Typography>
        </div>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="ED Stabilization Time"
          type="datetime-local"
          value={data.edStabilizationDateTime || ''}
          onChange={handleChange('edStabilizationDateTime')}
          InputLabelProps={{ shrink: true }}
          error={!!validationErrors['incidentDetails.edStabilizationDateTime'] || !!timelineWarnings['incidentDetails.edStabilizationDateTime']}
          helperText={
            validationErrors['incidentDetails.edStabilizationDateTime'] ||
            timelineWarnings['incidentDetails.edStabilizationDateTime']?.[0] ||
            "Start time for Hemorrhage Control"
          }
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Hemorrhage Control (OR/Angio) Time"
          type="datetime-local"
          value={data.hemorrhageControlDateTime || ''}
          onChange={handleChange('hemorrhageControlDateTime')}
          InputLabelProps={{ shrink: true }}
          error={!!validationErrors['incidentDetails.hemorrhageControlDateTime'] || !!timelineWarnings['incidentDetails.hemorrhageControlDateTime']}
          helperText={
            validationErrors['incidentDetails.hemorrhageControlDateTime'] ||
            timelineWarnings['incidentDetails.hemorrhageControlDateTime']?.[0] ||
            "Target: Within 60 mins of stabilization"
          }
        />
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <input
              type="checkbox"
              id="isMtpActivated"
              checked={data.isMtpActivated || false}
              onChange={(e) => onChange({ isMtpActivated: e.target.checked })}
              style={{ width: '20px', height: '20px', marginRight: '10px' }}
            />
            <label htmlFor="isMtpActivated" style={{ fontSize: '16px', fontWeight: 500 }}>
              Massive Transfusion Protocol (MTP) Activated?
            </label>
          </div>
        </FormControl>
      </Grid>

      {data.isMtpActivated && (
        <>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="MTP Activation Time"
              type="datetime-local"
              value={data.mtpActivationDateTime || ''}
              onChange={handleChange('mtpActivationDateTime')}
              InputLabelProps={{ shrink: true }}
              error={!!validationErrors['incidentDetails.mtpActivationDateTime'] || !!timelineWarnings['incidentDetails.mtpActivationDateTime']}
              helperText={
                validationErrors['incidentDetails.mtpActivationDateTime'] ||
                timelineWarnings['incidentDetails.mtpActivationDateTime']?.[0]
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Blood Unit Transfusion Time"
              type="datetime-local"
              value={data.firstBloodUnitTransfusionDateTime || ''}
              onChange={handleChange('firstBloodUnitTransfusionDateTime')}
              InputLabelProps={{ shrink: true }}
              error={!!validationErrors['incidentDetails.firstBloodUnitTransfusionDateTime'] || !!timelineWarnings['incidentDetails.firstBloodUnitTransfusionDateTime']}
              helperText={
                validationErrors['incidentDetails.firstBloodUnitTransfusionDateTime'] ||
                timelineWarnings['incidentDetails.firstBloodUnitTransfusionDateTime']?.[0] ||
                "Target: Within 15 mins of activation"
              }
            />
          </Grid>
        </>
      )}

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

