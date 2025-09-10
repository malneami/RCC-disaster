import React from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import { InterventionsAndTreatments } from '../../services/stemiService';
import { StemiDatetimeService } from '../../services/stemiDatetimeService';

interface InterventionsAndTreatmentsStepProps {
  data: InterventionsAndTreatments;
  onChange: (data: InterventionsAndTreatments) => void;
}

const InterventionsAndTreatmentsStep: React.FC<InterventionsAndTreatmentsStepProps> = ({
  data,
  onChange,
}) => {
  const handleChange = (field: keyof InterventionsAndTreatments) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    onChange({ ...data, [field]: value });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Interventions and Treatments
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Record the interventions and treatments for this STEMI case.
      </Typography>

      <Grid container spacing={3}>
        {/* Primary PCI Eligibility */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={data.eligibleForPrimaryPci || false}
                onChange={handleChange('eligibleForPrimaryPci')}
              />
            }
            label="Eligible for Primary PCI"
          />
          <Typography variant="caption" display="block" color="textSecondary">
            Is the patient eligible for primary PCI intervention?
          </Typography>
        </Grid>

        {/* PCI Location */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>PCI Location</InputLabel>
            <Select
              value={data.pciLocation || ''}
              onChange={handleChange('pciLocation')}
              label="PCI Location"
            >
              <MenuItem value="">Select PCI Location</MenuItem>
              <MenuItem value="King Fahad Central Hospital">King Fahad Central Hospital</MenuItem>
              <MenuItem value="Prince Mohammed Bin Nasser Hospital">Prince Mohammed Bin Nasser Hospital</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" display="block" color="textSecondary">
            Where the Primary PCI was or will be performed
          </Typography>
        </Grid>

        {/* Door Out Time */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Door Out Time"
            type="datetime-local"
            value={data.doorOutTime || StemiDatetimeService.getCurrentLocalDateTime()}
            onChange={handleChange('doorOutTime')}
            InputLabelProps={{ shrink: true }}
            disabled={!data.eligibleForPrimaryPci}
            helperText="When the patient left the referring facility for PCI"
          />
        </Grid>

        {/* Balloon Inflation Time */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Balloon Inflation Time"
            type="datetime-local"
            value={data.balloonInflationTime || StemiDatetimeService.getCurrentLocalDateTime()}
            onChange={handleChange('balloonInflationTime')}
            InputLabelProps={{ shrink: true }}
            disabled={!data.eligibleForPrimaryPci}
            helperText="When the balloon was inflated during the PCI procedure"
          />
        </Grid>

        {/* Thrombolytic Given */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={data.thrombolyticGiven || false}
                onChange={handleChange('thrombolyticGiven')}
              />
            }
            label="Thrombolytic Given"
          />
          <Typography variant="caption" display="block" color="textSecondary">
            Was thrombolytic therapy administered?
          </Typography>
        </Grid>

        {/* Thrombolytic Administration Time */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Thrombolytic Administration Time"
            type="datetime-local"
            value={data.thrombolyticAdminTime || StemiDatetimeService.getCurrentLocalDateTime()}
            onChange={handleChange('thrombolyticAdminTime')}
            InputLabelProps={{ shrink: true }}
            disabled={!data.thrombolyticGiven}
            helperText="When the thrombolytic medication was administered"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default InterventionsAndTreatmentsStep;
