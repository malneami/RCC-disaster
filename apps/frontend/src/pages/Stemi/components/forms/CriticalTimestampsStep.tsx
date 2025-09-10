import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { CriticalTimestamps } from '../../services/stemiService';

interface CriticalTimestampsStepProps {
  data: CriticalTimestamps;
  onChange: (data: CriticalTimestamps) => void;
}

const CriticalTimestampsStep: React.FC<CriticalTimestampsStepProps> = ({
  data,
  onChange,
}) => {
  const handleChange = (field: keyof CriticalTimestamps) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    onChange({ ...data, [field]: event.target.value });
  };

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
            helperText="When the patient was triaged at the facility"
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
            helperText="When the first ECG was performed"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CriticalTimestampsStep;
