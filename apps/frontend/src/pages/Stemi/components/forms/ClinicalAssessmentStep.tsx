import React from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { ClinicalAssessment } from '../../services/stemiService';
import { StemiDatetimeService } from '../../services/stemiDatetimeService';

interface ClinicalAssessmentStepProps {
  data: ClinicalAssessment;
  onChange: (data: ClinicalAssessment) => void;
  additionalData: {
    currentStatus: string;
    selectedTreatment: any;
    ecgResult: any;
    ecgFindings: string;
    isTroponinPositive: boolean;
    troponinValue: number | undefined;
    additionalNotes: string;
  };
  onAdditionalDataChange: (data: {
    currentStatus: string;
    selectedTreatment: any;
    ecgResult: any;
    ecgFindings: string;
    isTroponinPositive: boolean;
    troponinValue: number | undefined;
    additionalNotes: string;
  }) => void;
  timelineWarnings?: Record<string, string[]>;
}

const ClinicalAssessmentStep: React.FC<ClinicalAssessmentStepProps> = ({
  data,
  onChange,
  additionalData,
  onAdditionalDataChange,
  timelineWarnings = {},
}) => {
  const handleChange = (field: keyof ClinicalAssessment) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.type === 'number' ?
      (event.target.value === '' ? undefined : Number(event.target.value)) :
      event.target.value;
    onChange({ ...data, [field]: value });
  };

  const emphasizeKeywords = (text: string) => {
    const keywords = ['Symptom', 'Admission', 'Triage', 'ECG', 'PCI', 'Door'];
    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
    const parts = text.split(regex);

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

  const buildHelperText = (defaultText: string, warnings?: string[]) => {
    if (!warnings || warnings.length === 0) {
      return defaultText;
    }

    return (
      <Box>
        <Typography variant="caption" color="textSecondary" display="block">
          {defaultText}
        </Typography>
        {warnings.map((warning, index) => (
          <Typography
            key={`${warning}-${index}`}
            variant="body2"
            color="error"
            display="block"
            sx={{ mt: 1, fontWeight: 600 }}
          >
            {emphasizeKeywords(warning)}
          </Typography>
        ))}
      </Box>
    );
  };

  const warningBorderStyles = (warnings?: string[]) =>
    warnings && warnings.length > 0
      ? {
        '& .MuiOutlinedInput-root fieldset': {
          borderColor: 'error.main',
          borderWidth: 2,
        },
        '& .MuiOutlinedInput-root:hover fieldset': {
          borderColor: 'error.main',
        },
        '& .MuiOutlinedInput-root.Mui-focused fieldset': {
          borderColor: 'error.dark',
        },
      }
      : undefined;

  const symptomOnsetWarnings = timelineWarnings['clinicalAssessment.symptomOnset'];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Clinical Assessment
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Record the clinical assessment details for this STEMI case.
      </Typography>

      <Grid container spacing={3}>
        {/* MI Type */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>MI Type</InputLabel>
            <Select
              value={data.miType || ''}
              onChange={handleChange('miType')}
              label="MI Type"
            >
              <MenuItem value="">Select MI Type</MenuItem>
              <MenuItem value="STEMI">STEMI</MenuItem>
              <MenuItem value="NON_STEMI">Non STEMI</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" display="block" color="textSecondary">
            Type of myocardial infarction
          </Typography>
        </Grid>

        {/* Symptom Onset */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Symptom Onset"
            type="datetime-local"
            value={data.symptomOnset || StemiDatetimeService.getCurrentLocalDateTime()}
            onChange={handleChange('symptomOnset')}
            InputLabelProps={{ shrink: true }}
            helperText={buildHelperText('When symptoms started', symptomOnsetWarnings)}
            sx={warningBorderStyles(symptomOnsetWarnings)}
          />
        </Grid>

        {/* Symptom Duration */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Symptom Duration (minutes)"
            type="number"
            value={data.symptomDuration || ''}
            onChange={handleChange('symptomDuration')}
            inputProps={{ min: 0 }}
            helperText="Duration of symptoms in minutes"
          />
        </Grid>

        {/* Additional Clinical Data */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Additional Clinical Data
          </Typography>
        </Grid>

        {/* Current Status */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Current Status</InputLabel>
            <Select
              value={additionalData.currentStatus || ''}
              onChange={(e) => onAdditionalDataChange({ ...additionalData, currentStatus: e.target.value })}
              label="Current Status"
            >
              <MenuItem value="SUSPECTED">Suspected</MenuItem>
              <MenuItem value="ECG_PENDING">ECG Pending</MenuItem>
              <MenuItem value="STEMI_CONFIRMED">STEMI Confirmed</MenuItem>
              <MenuItem value="NSTEMI_CONFIRMED">NSTEMI Confirmed</MenuItem>
              <MenuItem value="UNSTABLE_ANGINA">Unstable Angina</MenuItem>
              <MenuItem value="RCC_ACTIVATED">RCC Activated</MenuItem>
              <MenuItem value="IN_TRANSIT">In Transit</MenuItem>
              <MenuItem value="PCI_READY">PCI Ready</MenuItem>
              <MenuItem value="BALLOON_INFLATED">Balloon Inflated</MenuItem>
              <MenuItem value="CCU_ADMITTED">CCU Admitted</MenuItem>
              <MenuItem value="DISCHARGED">Discharged</MenuItem>
              <MenuItem value="EXPIRED">Expired</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Selected Treatment */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Selected Treatment</InputLabel>
            <Select
              value={additionalData.selectedTreatment || ''}
              onChange={(e) => onAdditionalDataChange({ ...additionalData, selectedTreatment: e.target.value })}
              label="Selected Treatment"
            >
              <MenuItem value="">Select Treatment</MenuItem>
              <MenuItem value="PRIMARY_PCI">Primary PCI</MenuItem>
              <MenuItem value="RESCUE_PCI">Rescue PCI</MenuItem>
              <MenuItem value="FIBRINOLYSIS">Fibrinolysis</MenuItem>
              <MenuItem value="TRANSFER_FOR_PRIMARY_PCI">Transfer for Primary PCI</MenuItem>
              <MenuItem value="MEDICAL_MANAGEMENT">Medical Management</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* ECG Result */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>ECG Result</InputLabel>
            <Select
              value={additionalData.ecgResult || ''}
              onChange={(e) => onAdditionalDataChange({ ...additionalData, ecgResult: e.target.value })}
              label="ECG Result"
            >
              <MenuItem value="">Select ECG Result</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="NORMAL">Normal</MenuItem>
              <MenuItem value="STEMI_ANTERIOR">STEMI Anterior</MenuItem>
              <MenuItem value="STEMI_INFERIOR">STEMI Inferior</MenuItem>
              <MenuItem value="STEMI_LATERAL">STEMI Lateral</MenuItem>
              <MenuItem value="STEMI_POSTERIOR">STEMI Posterior</MenuItem>
              <MenuItem value="NSTEMI_CHANGES">NSTEMI Changes</MenuItem>
              <MenuItem value="UNSTABLE_PATTERN">Unstable Pattern</MenuItem>
              <MenuItem value="TECHNICAL_ISSUE">Technical Issue</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Troponin Value */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Troponin Value"
            type="number"
            value={additionalData.troponinValue || ''}
            onChange={(e) => onAdditionalDataChange({
              ...additionalData,
              troponinValue: e.target.value === '' ? undefined : Number(e.target.value)
            })}
            inputProps={{ min: 0, step: 0.01 }}
            helperText="Troponin level (ng/mL)"
          />
        </Grid>

        {/* ECG Findings */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="ECG Findings"
            value={additionalData.ecgFindings || ''}
            onChange={(e) => onAdditionalDataChange({ ...additionalData, ecgFindings: e.target.value })}
            multiline
            rows={3}
            helperText="Detailed ECG findings and interpretation"
          />
        </Grid>

        {/* Additional Notes */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Additional Notes"
            value={additionalData.additionalNotes || ''}
            onChange={(e) => onAdditionalDataChange({ ...additionalData, additionalNotes: e.target.value })}
            multiline
            rows={3}
            helperText="Any additional clinical notes or observations"
          />
        </Grid>

        {/* Outcome */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Out Come</InputLabel>
            <Select
              value={data.outcome || ''}
              onChange={handleChange('outcome')}
              label="Out Come"
            >
              <MenuItem value="">Select Outcome</MenuItem>
              <MenuItem value="TRANSFERRED_TO_PCI_CAPABLE_HOSPITAL">Transferred to PCI Capable Hospital</MenuItem>
              <MenuItem value="DAMA_FROM_ED">DAMA from ED</MenuItem>
              <MenuItem value="DISCHARGED_ALIVE">Discharged a live</MenuItem>
              <MenuItem value="DAMA">DAMA</MenuItem>
              <MenuItem value="STILL_ADMITTED">Still Admitted</MenuItem>
              <MenuItem value="DIED">Died</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" display="block" color="textSecondary">
            Patient outcome after treatment
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClinicalAssessmentStep;
