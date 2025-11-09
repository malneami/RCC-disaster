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

interface AdmissionDetails {
  admissionTime: string;
  modeOfArrival: 'AMBULANCE_RED_CRESCENT' | 'PRIVATE_CAR' | 'TRANSFERRED_FROM_ANOTHER_HOSPITAL';
  transferRequestDateTime?: string;
  transferArrivalDateTime?: string;
}

interface AdmissionDetailsStepProps {
  data: AdmissionDetails;
  onChange: (data: AdmissionDetails) => void;
  validationErrors?: Record<string, string>;
  timelineWarnings?: Record<string, string[]>;
}

const AdmissionDetailsStep: React.FC<AdmissionDetailsStepProps> = ({
  data,
  onChange,
  validationErrors = {},
  timelineWarnings = {},
}) => {
  const handleChange = (field: keyof AdmissionDetails) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    onChange({ ...data, [field]: event.target.value });
  };

  const emphasizeKeywords = (text: string) => {
    const keywords = [
      'Admission',
      'Triage',
      'ECG',
      'PCI',
      'Transfer',
      'Door',
      'Balloon',
      'Symptom',
    ];

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
            color="warning.main"
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
            borderColor: 'warning.main',
            borderWidth: 2,
          },
          '& .MuiOutlinedInput-root:hover fieldset': {
            borderColor: 'warning.main',
          },
          '& .MuiOutlinedInput-root.Mui-focused fieldset': {
            borderColor: 'warning.dark',
          },
        }
      : undefined;

  const admissionWarnings = timelineWarnings['admissionDetails.admissionTime'];
  const transferRequestWarnings = timelineWarnings['admissionDetails.transferRequestDateTime'];
  const transferArrivalWarnings = timelineWarnings['admissionDetails.transferArrivalDateTime'];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Admission Details
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Enter the admission time and mode of arrival for the patient.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Admission Time"
            type="datetime-local"
            value={data.admissionTime}
            onChange={handleChange('admissionTime')}
            InputLabelProps={{ shrink: true }}
            required
            error={!!validationErrors['admissionDetails.admissionTime']}
          helperText={
            validationErrors['admissionDetails.admissionTime'] ||
            buildHelperText('When the patient arrived at the facility', admissionWarnings)
          }
          sx={warningBorderStyles(admissionWarnings)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!!validationErrors['admissionDetails.modeOfArrival']}>
            <InputLabel>Mode of Arrival</InputLabel>
            <Select
              value={data.modeOfArrival}
              onChange={handleChange('modeOfArrival')}
              label="Mode of Arrival"
            >
              <MenuItem value="AMBULANCE_RED_CRESCENT">Ambulance (Red Crescent)</MenuItem>
              <MenuItem value="PRIVATE_CAR">Private Car</MenuItem>
              <MenuItem value="TRANSFERRED_FROM_ANOTHER_HOSPITAL">Transferred from another hospital</MenuItem>
            </Select>
            {validationErrors['admissionDetails.modeOfArrival'] && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                {validationErrors['admissionDetails.modeOfArrival']}
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
                value={data.transferRequestDateTime || ''}
                onChange={handleChange('transferRequestDateTime')}
                InputLabelProps={{
                  shrink: true,
                }}
                helperText={buildHelperText('When the transfer was requested', transferRequestWarnings)}
                sx={warningBorderStyles(transferRequestWarnings)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Transfer Arrival Date & Time"
                type="datetime-local"
                value={data.transferArrivalDateTime || ''}
                onChange={handleChange('transferArrivalDateTime')}
                InputLabelProps={{
                  shrink: true,
                }}
                helperText={buildHelperText('When the receiving hospital confirmed arrival', transferArrivalWarnings)}
                sx={warningBorderStyles(transferArrivalWarnings)}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default AdmissionDetailsStep;
