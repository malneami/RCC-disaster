import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CreateTicketData } from '../../../../services/ticketService';
import { hospitalService } from '../../../../services/hospitalService';

interface HospitalSelectionStepProps {
  formData: Partial<CreateTicketData>;
  onDataChange: (data: Partial<CreateTicketData>) => void;
}

const HospitalSelectionStep: React.FC<HospitalSelectionStepProps> = ({
  formData,
  onDataChange,
}) => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await hospitalService.getAllHospitals();
      setHospitals(response);
    } catch (err) {
      console.error('Error loading hospitals:', err);
      setError('Failed to load hospitals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHospitalChange = (field: 'originHospitalId' | 'destinationHospitalId', value: string) => {
    onDataChange({ [field]: value });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Hospital Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the origin and destination hospitals for this transfer
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!formData.originHospitalId}>
            <InputLabel>Origin Hospital *</InputLabel>
            <Select
              value={formData.originHospitalId || ''}
              label="Origin Hospital *"
              onChange={(e) => handleHospitalChange('originHospitalId', e.target.value)}
            >
              {hospitals.map((hospital) => (
                <MenuItem key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </MenuItem>
              ))}
            </Select>
            {!formData.originHospitalId && (
              <FormHelperText>Origin hospital is required</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Destination Hospital</InputLabel>
            <Select
              value={formData.destinationHospitalId || ''}
              label="Destination Hospital"
              onChange={(e) => handleHospitalChange('destinationHospitalId', e.target.value)}
            >
              <MenuItem value="">
                <em>Select destination hospital (optional)</em>
              </MenuItem>
              {hospitals.map((hospital) => (
                <MenuItem key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Leave empty if destination is not yet determined
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>

      {formData.originHospitalId && formData.destinationHospitalId && 
       formData.originHospitalId === formData.destinationHospitalId && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Origin and destination hospitals are the same. Please verify this is correct.
        </Alert>
      )}
    </Box>
  );
};

export default HospitalSelectionStep;
