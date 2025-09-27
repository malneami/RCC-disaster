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
  Typography,
  Divider,
} from '@mui/material';

import { 
  CreateStrokeCaseData, 
  SwallowingScreeningResult,
  CTFindings,
  ModifiedRankinScale
} from '../../../../services/strokeService';
import { formatForDateTimeLocal, formatForUTC } from '../../../../helpers';

interface DiagnosisStepProps {
  formData: CreateStrokeCaseData;
  updateFormData: (field: keyof CreateStrokeCaseData, value: any) => void;
}

const DiagnosisStep: React.FC<DiagnosisStepProps> = ({
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

  const showCtFields = formData.ctScanPerformed === true;
  const showSwallowingTime = formData.swallowingScreeningPerformed === true;

  return (
    <Grid container spacing={3}>
      {/* CT Scan & Diagnosis Section */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          CT Scan & Diagnosis
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Record CT scan results and diagnostic findings.
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.ctScanPerformed || false}
              onChange={(e) => updateFormData('ctScanPerformed', e.target.checked)}
            />
          }
          label="CT Scan Performed"
        />
      </Grid>

      {showCtFields && (
        <>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Time of CT Scan Start"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.timeOfCtScanStart || '')}
              onChange={(e) => handleDateTimeChange('timeOfCtScanStart', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Time the CT scan was initiated (KPI#3)"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Time of CT Report Final"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.timeOfCtReportFinal || '')}
              onChange={(e) => handleDateTimeChange('timeOfCtReportFinal', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Time the radiologist finalized and signed the CT report"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>CT Findings</InputLabel>
              <Select
                value={formData.ctFindings || ''}
                onChange={(e) => updateFormData('ctFindings', e.target.value as CTFindings)}
              >
                <MenuItem value="ISCHEMIC_CHANGES">Ischemic Changes</MenuItem>
                <MenuItem value="HEMORRHAGE">Hemorrhage</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="UNCLEAR">Unclear</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </>
      )}

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
      </Grid>

      {/* Swallowing Screening Section */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Swallowing Screening
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Record swallowing screening results (KPI#10).
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.swallowingScreeningPerformed || false}
              onChange={(e) => updateFormData('swallowingScreeningPerformed', e.target.checked)}
            />
          }
          label="Swallowing Screening Performed"
        />
      </Grid>

      {showSwallowingTime && (
        <>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Time of Swallowing Screening"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.timeOfSwallowingScreening || '')}
              onChange={(e) => handleDateTimeChange('timeOfSwallowingScreening', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Time swallowing screening was completed"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Swallowing Screening Result</InputLabel>
              <Select
                value={formData.swallowingScreeningResult || ''}
                onChange={(e) => updateFormData('swallowingScreeningResult', e.target.value as SwallowingScreeningResult)}
              >
                <MenuItem value="PASS">Pass</MenuItem>
                <MenuItem value="FAIL">Fail</MenuItem>
                <MenuItem value="NOT_APPLICABLE">Not Applicable</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Current Modified Rankin Scale</InputLabel>
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
        </>
      )}
    </Grid>
  );
};

export default DiagnosisStep;
