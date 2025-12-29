/**
 * Disposition Step Component
 * Fifth step of the trauma case creation form
 */

import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
} from '@mui/material';
import { DISPOSITION_OPTIONS } from '../../constants/traumaConstants';
import { DispositionFormData } from '../../types/traumaTypes';

interface DispositionStepProps {
  data: DispositionFormData;
  onChange: (data: Partial<DispositionFormData>) => void;
  errors: Record<string, string>;
  validationErrors?: Record<string, string>;
}

const DispositionStep: React.FC<DispositionStepProps> = ({
  data,
  onChange,
  errors,
  validationErrors = {},
}) => {
  const handleChange = (field: keyof DispositionFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    onChange({ [field]: event.target.value });
  };

  const handleDispositionChange = (field: keyof DispositionFormData['disposition']) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange({
      disposition: {
        ...data.disposition,
        [field]: event.target.type === 'checkbox' 
          ? (event.target as any).checked 
          : event.target.value,
      },
    });
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <h3>Disposition & Follow-up</h3>
        <p>Determine the patient's disposition and follow-up requirements.</p>
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required error={!!errors.edDisposition || !!validationErrors?.['disposition.edDisposition']}>
          <InputLabel>ED Disposition</InputLabel>
          <Select
            value={data.edDisposition}
            onChange={handleChange('edDisposition')}
            label="ED Disposition"
          >
            {DISPOSITION_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {(errors.edDisposition || validationErrors?.['disposition.edDisposition']) && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
              {errors.edDisposition || validationErrors?.['disposition.edDisposition']}
            </Typography>
          )}
        </FormControl>
      </Grid>
      

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Discharge Instructions"
          multiline
          rows={3}
          value={data.disposition.dischargeInstructions}
          onChange={handleDispositionChange('dischargeInstructions')}
          error={!!errors.dischargeInstructions}
          helperText={errors.dischargeInstructions || 'Instructions for patient care after discharge'}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Switch
              checked={data.disposition.followUpRequired}
              onChange={handleDispositionChange('followUpRequired')}
            />
          }
          label="Follow-up Required"
        />
      </Grid>
      
      {data.disposition.followUpRequired && (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Follow-up Date"
            type="date"
            value={data.disposition.followUpDate}
            onChange={handleDispositionChange('followUpDate')}
            InputLabelProps={{ shrink: true }}
            error={!!errors.followUpDate}
            helperText={errors.followUpDate}
          />
        </Grid>
      )}
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Medications Prescribed"
          multiline
          rows={2}
          value={data.disposition.medicationsPrescribed}
          onChange={handleDispositionChange('medicationsPrescribed')}
          error={!!errors.medicationsPrescribed}
          helperText={errors.medicationsPrescribed || 'List of prescribed medications'}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Activity Restrictions"
          multiline
          rows={2}
          value={data.disposition.restrictions}
          onChange={handleDispositionChange('restrictions')}
          error={!!errors.restrictions}
          helperText={errors.restrictions || 'Any activity restrictions or limitations'}
        />
      </Grid>
      
      <Grid item xs={12}>
        <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
          <Typography variant="body2">
            <strong>Important:</strong> Ensure all required fields are completed before submitting the trauma case. 
            This information will be used for patient care coordination and follow-up.
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

export default DispositionStep;
