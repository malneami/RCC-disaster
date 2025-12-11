import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  FormControlLabel,
  Checkbox,
  Alert,
  Box,
} from '@mui/material';

import { 
  CreateStrokeCaseData, 
  StrokeDisposition, 
  IVThrombolysisGiven,
  CandidateAssessment
} from '../../../../services/strokeService';
import { formatForDateTimeLocal, formatForUTC } from '../../../../helpers';

interface TreatmentStepProps {
  formData: CreateStrokeCaseData;
  updateFormData: (field: keyof CreateStrokeCaseData, value: any) => void;
  timelineWarnings?: Record<string, string[]>;
}

const TreatmentStep: React.FC<TreatmentStepProps> = ({
  formData,
  updateFormData,
  timelineWarnings = {},
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

  const emphasizeKeywords = (text: string) => {
    const keywords = [
      'Thrombolysis',
      'Thrombectomy',
      'Transfer activation',
      'Transfer departure',
      'Admission',
      'CT report',
    ];
    
    const parts = text.split(/(\s+)/);
    return parts.map((part, index) => {
      const isKeyword = keywords.some(
        (keyword) => keyword.toLowerCase() === part.toLowerCase()
      );
      return isKeyword ? (
        <Box key={`${part}-${index}`} component="span" sx={{ fontWeight: 700 }}>
          {part}
        </Box>
      ) : (
        <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
      );
    });
  };

  // Conditional logic variables
  const showIVThrombolysisFields = formData.candidateForIVThrombolysis === 'YES';
  const showReasonForNotAdministeringIV = formData.ivThrombolysisGiven === 'NO';
  const showMechanicalThrombectomyFields = formData.candidateForMechanicalThrombectomy === 'YES';
  const showThrombectomyCompleteTime = formData.mechanicalThrombectomyPerformed === true;

  return (
    <Grid container spacing={3}>
      {/* Treatment Details Section */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Treatment Details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Record treatment decisions and administration details.
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Candidate for IV Thrombolysis</InputLabel>
          <Select
            value={formData.candidateForIVThrombolysis || ''}
            onChange={(e) => {
              const newValue = e.target.value as CandidateAssessment;
              const wasYes = formData.candidateForIVThrombolysis === 'YES';
              updateFormData('candidateForIVThrombolysis', newValue);
              if (wasYes && newValue !== 'YES') {
                // Clear thrombolysis related fields when changed from YES
                updateFormData('thrombolysisOrderTime', null);
                updateFormData('ivThrombolysisAdministrationTime', null);
                updateFormData('ivThrombolysisGiven', null);
                updateFormData('reasonForNotAdministeringIV', null);
              }
            }}
            label="Candidate for IV Thrombolysis"
          >
            <MenuItem value="YES">Yes</MenuItem>
            <MenuItem value="NO">No</MenuItem>
            <MenuItem value="NOT_ASSESSED">Not Assessed</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      {showIVThrombolysisFields && (
        <>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Thrombolysis Order Time"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.thrombolysisOrderTime || '')}
              onChange={(e) => handleDateTimeChange('thrombolysisOrderTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="When thrombolysis was ordered"
              error={!!timelineWarnings['thrombolysisOrderTime']}
            />
            {timelineWarnings['thrombolysisOrderTime']?.map((warning, idx) => (
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
              label="IV Thrombolysis Administration Time"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.ivThrombolysisAdministrationTime || '')}
              onChange={(e) => handleDateTimeChange('ivThrombolysisAdministrationTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="When IV thrombolysis was administered (KPI#4)"
              error={!!timelineWarnings['ivThrombolysisAdministrationTime']}
            />
            {timelineWarnings['ivThrombolysisAdministrationTime']?.map((warning, idx) => (
              <Alert key={idx} severity="warning" variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {emphasizeKeywords(warning)}
                </Typography>
              </Alert>
            ))}
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>IV Thrombolysis Given</InputLabel>
              <Select
                value={formData.ivThrombolysisGiven || ''}
                onChange={(e) => updateFormData('ivThrombolysisGiven', e.target.value as IVThrombolysisGiven)}
                label="IV Thrombolysis Given"
              >
                <MenuItem value="YES">Yes</MenuItem>
                <MenuItem value="NO">No</MenuItem>
                <MenuItem value="NOT_APPLICABLE">Not Applicable</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </>
      )}
      
      {showReasonForNotAdministeringIV && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Reason for Not Administering IV"
            multiline
            rows={2}
            value={formData.reasonForNotAdministeringIV || ''}
            onChange={(e) => updateFormData('reasonForNotAdministeringIV', e.target.value)}
            helperText="If IV thrombolysis was not given, specify the reason"
          />
        </Grid>
      )}

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Candidate for Mechanical Thrombectomy</InputLabel>
          <Select
            value={formData.candidateForMechanicalThrombectomy || ''}
            onChange={(e) => {
              const newValue = e.target.value as CandidateAssessment;
              const wasYes = formData.candidateForMechanicalThrombectomy === 'YES';
              updateFormData('candidateForMechanicalThrombectomy', newValue);
              if (wasYes && newValue !== 'YES') {
                // Clear thrombectomy related fields when changed from YES
                updateFormData('timeOfMechanicalThrombectomyPuncture', null);
                updateFormData('mechanicalThrombectomyPerformed', false);
                updateFormData('timeOfThrombectomyComplete', null);
              }
            }}
            label="Candidate for Mechanical Thrombectomy"
          >
            <MenuItem value="YES">Yes</MenuItem>
            <MenuItem value="NO">No</MenuItem>
            <MenuItem value="NOT_ASSESSED">Not Assessed</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      {showMechanicalThrombectomyFields && (
        <>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Time of Mechanical Thrombectomy Puncture"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.timeOfMechanicalThrombectomyPuncture || '')}
              onChange={(e) => handleDateTimeChange('timeOfMechanicalThrombectomyPuncture', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="When mechanical thrombectomy puncture was performed (KPI#8)"
              error={!!timelineWarnings['timeOfMechanicalThrombectomyPuncture']}
            />
            {timelineWarnings['timeOfMechanicalThrombectomyPuncture']?.map((warning, idx) => (
              <Alert key={idx} severity="warning" variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {emphasizeKeywords(warning)}
                </Typography>
              </Alert>
            ))}
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.mechanicalThrombectomyPerformed || false}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    updateFormData('mechanicalThrombectomyPerformed', isChecked);
                    if (!isChecked) {
                      // Clear thrombectomy complete time when unchecked
                      updateFormData('timeOfThrombectomyComplete', null);
                    }
                  }}
                />
              }
              label="Mechanical Thrombectomy Performed"
            />
          </Grid>
        </>
      )}
      
      {showThrombectomyCompleteTime && (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Time of Thrombectomy Complete"
            type="datetime-local"
            value={formatForDateTimeLocal(formData.timeOfThrombectomyComplete || '')}
            onChange={(e) => handleDateTimeChange('timeOfThrombectomyComplete', e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="When thrombectomy was completed"
            error={!!timelineWarnings['timeOfThrombectomyComplete']}
          />
          {timelineWarnings['timeOfThrombectomyComplete']?.map((warning, idx) => (
            <Alert key={idx} severity="warning" variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {emphasizeKeywords(warning)}
              </Typography>
            </Alert>
          ))}
        </Grid>
      )}

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
      </Grid>

      {/* Disposition & Transfer Section */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Disposition & Transfer Decisions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Record patient disposition and transfer information.
        </Typography>
      </Grid>

      
      
      {/* {showTransferFields && (
        <>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Time of Transfer Activation"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.timeOfTransferActivation || '')}
              onChange={(e) => handleDateTimeChange('timeOfTransferActivation', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="When transfer was activated"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Time of Transfer Departure"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.timeOfTransferDeparture || '')}
              onChange={(e) => handleDateTimeChange('timeOfTransferDeparture', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="When patient departed for transfer (KPI#7)"
            />
          </Grid>
        </>
      )} */}
     
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Disposition</InputLabel>
          <Select
            value={formData.disposition || ''}
            onChange={(e) => updateFormData('disposition', e.target.value as StrokeDisposition)}
            label="Disposition"
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 150,
                },
              },
            }}
          >
            <MenuItem value="STROKE_UNIT">Stroke Unit</MenuItem>
            <MenuItem value="ICU">ICU</MenuItem>
            <MenuItem value="INPATIENT_WARD">Inpatient Ward</MenuItem>
            <MenuItem value="DISCHARGED_HOME">Discharged Home</MenuItem>
            <MenuItem value="DIED_BEFORE_ADMISSION">Died Before Admission</MenuItem>
            <MenuItem value="TRANSFERRED_TO_ANOTHER_HOSPITAL">Transferred to Another Hospital</MenuItem>
            <MenuItem value="DAMA">DAMA (Discharged Against Medical Advice)</MenuItem>
            <MenuItem value="IN_ED_WAITING_FOR_ADMISSION">In ED Waiting for Admission</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.admittedToStrokeUnit || false}
              onChange={(e) => updateFormData('admittedToStrokeUnit', e.target.checked)}
            />
          }
          label="Admitted to Stroke Unit (KPI#6)"
        />
      </Grid>
    </Grid>
  );
};

export default TreatmentStep;
