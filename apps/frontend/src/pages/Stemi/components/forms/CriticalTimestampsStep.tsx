import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { CriticalTimestamps } from '../../services/stemiService';
import { KpiViolation } from '../../../../utils/kpiValidationUtils';

interface CriticalTimestampsStepProps {
  data: CriticalTimestamps;
  onChange: (data: CriticalTimestamps) => void;
  timelineWarnings?: Record<string, string[]>;
  kpiViolations?: Record<string, KpiViolation>;
}

const CriticalTimestampsStep: React.FC<CriticalTimestampsStepProps> = ({
  data,
  onChange,
  timelineWarnings = {},
  kpiViolations = {},
}) => {
  const handleChange = (field: keyof CriticalTimestamps) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    onChange({ ...data, [field]: event.target.value });
  };

  const emphasizeKeywords = (text: string) => {
    const keywords = ['Admission', 'Triage', 'ECG', 'Door', 'Balloon', 'PCI', 'Symptom'];
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

  const buildHelperText = (defaultText: string, warnings?: string[], kpiViolation?: KpiViolation) => {
    if ((!warnings || warnings.length === 0) && !kpiViolation) {
      return defaultText;
    }

    return (
      <Box>
        <Typography variant="caption" color="textSecondary" display="block">
          {defaultText}
        </Typography>
        {kpiViolation && (
          <Typography
            variant="body2"
            color="warning.main"
            display="block"
            sx={{ mt: 1, fontWeight: 'bold' }}
          >
            Alert: {kpiViolation.message}
          </Typography>
        )}
        {warnings?.map((warning, index) => (
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

  const warningBorderStyles = (warnings?: string[], kpiViolation?: KpiViolation) => {
    if (warnings && warnings.length > 0) {
      return {
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
      };
    }

    if (kpiViolation) {
      return {
        '& .MuiOutlinedInput-root fieldset': {
          borderColor: 'warning.main',
          borderWidth: 2,
        },
        '& .MuiOutlinedInput-root:hover fieldset': {
          borderColor: 'warning.main',
        },
        '& .MuiOutlinedInput-root.Mui-focused fieldset': {
          borderColor: 'warning.dark',
        },
      };
    }

    return undefined;
  };

  const triageWarnings = timelineWarnings['criticalTimestamps.triageTime'];
  const ecgWarnings = timelineWarnings['criticalTimestamps.firstEcgTime'];

  const triageViolation = kpiViolations['criticalTimestamps.triageTime'];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Critical Timestamps
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Record the critical timestamps for this STEMI case. These are used for KPI calculations.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Triage Time"
            type="datetime-local"
            value={data.triageTime}
            onChange={handleChange('triageTime')}
            InputLabelProps={{ shrink: true }}
            helperText={buildHelperText('When the patient was triaged at the facility', triageWarnings, triageViolation)}
            sx={warningBorderStyles(triageWarnings, triageViolation)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First ECG Time"
            type="datetime-local"
            value={data.firstEcgTime}
            onChange={handleChange('firstEcgTime')}
            InputLabelProps={{ shrink: true }}
            helperText={buildHelperText('When the first ECG was performed', ecgWarnings)}
            sx={warningBorderStyles(ecgWarnings)}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CriticalTimestampsStep;
