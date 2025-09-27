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
}

const AdmissionDetailsStep: React.FC<AdmissionDetailsStepProps> = ({
  data,
  onChange,
  validationErrors = {},
}) => {
  const handleChange = (field: keyof AdmissionDetails) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    onChange({ ...data, [field]: event.target.value });
  };

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
            helperText={validationErrors['admissionDetails.admissionTime'] || "When the patient arrived at the facility"}
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
                onChange={(e) => handleChange('transferRequestDateTime')(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Transfer Arrival Date & Time"
                type="datetime-local"
                value={data.transferArrivalDateTime || ''}
                onChange={(e) => handleChange('transferArrivalDateTime')(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default AdmissionDetailsStep;
