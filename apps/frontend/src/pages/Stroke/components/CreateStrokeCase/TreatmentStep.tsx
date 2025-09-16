import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

import { 
  CreateStrokeCaseData, 
  StrokeDisposition, 
  ReferralTo, 
  ModifiedRankinScale,
  IVThrombolysisGiven,
  CandidateAssessment
} from '../../../../services/strokeService';
import { formatForDateTimeLocal, formatForUTC } from '../../../../helpers';

interface TreatmentStepProps {
  formData: CreateStrokeCaseData;
  updateFormData: (field: keyof CreateStrokeCaseData, value: any) => void;
}

const TreatmentStep: React.FC<TreatmentStepProps> = ({
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

  const handleArrayChange = (field: string, value: string[]) => {
    updateFormData(field as keyof CreateStrokeCaseData, value);
  };

  // Conditional logic variables
  const showIVThrombolysisFields = formData.candidateForIVThrombolysis === 'YES';
  const showReasonForNotAdministeringIV = formData.ivThrombolysisGiven === 'NO';
  const showMechanicalThrombectomyFields = formData.candidateForMechanicalThrombectomy === 'YES';
  const showThrombectomyCompleteTime = formData.mechanicalThrombectomyPerformed === true;
  const showTransferFields = formData.transferToAnotherHospital === true;
  const showFollowUpFields = formData.followUpContactAttempted === true;

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
            onChange={(e) => updateFormData('candidateForIVThrombolysis', e.target.value as CandidateAssessment)}
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
            />
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
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>IV Thrombolysis Given</InputLabel>
              <Select
                value={formData.ivThrombolysisGiven || ''}
                onChange={(e) => updateFormData('ivThrombolysisGiven', e.target.value as IVThrombolysisGiven)}
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
            onChange={(e) => updateFormData('candidateForMechanicalThrombectomy', e.target.value as CandidateAssessment)}
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
              label="Time of Groin Puncture"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.timeOfGroinPuncture || '')}
              onChange={(e) => handleDateTimeChange('timeOfGroinPuncture', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="When groin puncture was performed (KPI#8)"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.mechanicalThrombectomyPerformed || false}
                  onChange={(e) => updateFormData('mechanicalThrombectomyPerformed', e.target.checked)}
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
          />
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

      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.facilityHasCt || false}
              onChange={(e) => updateFormData('facilityHasCt', e.target.checked)}
            />
          }
          label="Facility has CT"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.transferToAnotherHospital || false}
              onChange={(e) => updateFormData('transferToAnotherHospital', e.target.checked)}
            />
          }
          label="Transfer to Another Hospital"
        />
      </Grid>
      {showTransferFields && (
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
      )}
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.prehospitalNotificationBySrca || false}
              onChange={(e) => updateFormData('prehospitalNotificationBySrca', e.target.checked)}
            />
          }
          label="Prehospital Notification by SRCA"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.prehospitalNotificationByUccPhc || false}
              onChange={(e) => updateFormData('prehospitalNotificationByUccPhc', e.target.checked)}
            />
          }
          label="Prehospital Notification by UCC/PHC"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Disposition</InputLabel>
          <Select
            value={formData.disposition || ''}
            onChange={(e) => updateFormData('disposition', e.target.value as StrokeDisposition)}
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
        <FormControl fullWidth>
          <InputLabel>Referral To</InputLabel>
          <Select
            multiple
            value={formData.referralTo || []}
            onChange={(e) => handleArrayChange('referralTo', e.target.value as ReferralTo[])}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map((value) => (
                  <Box key={value} sx={{ 
                    px: 1, 
                    py: 0.5, 
                    bgcolor: 'primary.main', 
                    color: 'primary.contrastText',
                    borderRadius: 1,
                    fontSize: '0.75rem'
                  }}>
                    {value.replace(/_/g, ' ')}
                  </Box>
                ))}
              </Box>
            )}
          >
            <MenuItem value="STROKE_UNIT">Stroke Unit</MenuItem>
            <MenuItem value="ICU">ICU</MenuItem>
            <MenuItem value="NEUROLOGY">Neurology</MenuItem>
            <MenuItem value="INTERVENTIONAL_RADIOLOGY">Interventional Radiology</MenuItem>
            <MenuItem value="ANOTHER_HOSPITAL">Another Hospital</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
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

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
      </Grid>

      {/* Follow-up & Outcome Section */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Follow-up & Outcome Tracking
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Record follow-up information and patient outcomes (KPI#11).
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.followUpContactAttempted || false}
              onChange={(e) => updateFormData('followUpContactAttempted', e.target.checked)}
            />
          }
          label="Follow-up Contact Attempted"
        />
      </Grid>
      {showFollowUpFields && (
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Modified Rankin Scale at 90 days</InputLabel>
            <Select
              value={formData.modifiedRankinScaleAt90Days || ''}
              onChange={(e) => updateFormData('modifiedRankinScaleAt90Days', e.target.value as ModifiedRankinScale)}
            >
              <MenuItem value="SCORE_0">Score 0 - No symptoms</MenuItem>
              <MenuItem value="SCORE_1">Score 1 - No significant disability</MenuItem>
              <MenuItem value="SCORE_2">Score 2 - Slight disability</MenuItem>
              <MenuItem value="SCORE_3">Score 3 - Moderate disability</MenuItem>
              <MenuItem value="SCORE_4">Score 4 - Moderately severe disability</MenuItem>
              <MenuItem value="SCORE_5">Score 5 - Severe disability</MenuItem>
              <MenuItem value="SCORE_6_DEAD">Score 6 - Dead</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      )}
    </Grid>
  );
};

export default TreatmentStep;
