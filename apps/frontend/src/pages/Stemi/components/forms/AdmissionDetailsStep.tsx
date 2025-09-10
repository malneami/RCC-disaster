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
  modeOfArrival: 'AMBULANCE' | 'PRIVATE_VEHICLE' | 'AIR_TRANSPORT' | 'WALK_IN' | 'POLICE' | 'TRANSFERRED_FROM_HOSPITAL' | 'OTHER';
}

interface AdmissionDetailsStepProps {
  data: AdmissionDetails;
  onChange: (data: AdmissionDetails) => void;
}

const AdmissionDetailsStep: React.FC<AdmissionDetailsStepProps> = ({
  data,
  onChange,
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
            helperText="When the patient arrived at the facility"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Mode of Arrival</InputLabel>
            <Select
              value={data.modeOfArrival}
              onChange={handleChange('modeOfArrival')}
              label="Mode of Arrival"
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
      </Grid>
    </Box>
  );
};

export default AdmissionDetailsStep;
