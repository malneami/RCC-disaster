/**
 * STEMI Destination Hospital Selection Component
 * Filters hospitals that have either STEMI service or cardiology center
 */

import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { hospitalService, Hospital } from '../../services/hospitalService';

interface StemiDestinationHospitalSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
}

const StemiDestinationHospitalSelect: React.FC<StemiDestinationHospitalSelectProps> = ({
  value,
  onChange,
  label,
  required = false,
  error = false,
  helperText,
  disabled = false,
  placeholder = "Select a destination hospital",
}) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        // Fetch all hospitals first
        const allHospitals = await hospitalService.getAllHospitals();
        
        // Filter hospitals that have either STEMI service or cardiology center
        const eligibleHospitals = allHospitals.filter(hospital => 
          hospital.hasStemiService || hospital.hasCardiologyCenter
        );
        
        setHospitals(eligibleHospitals);
      } catch (err) {
        console.error('Error fetching hospitals:', err);
        setFetchError('Failed to load hospitals');
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Loading eligible hospitals...
        </Typography>
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {fetchError}
      </Alert>
    );
  }

  const getServiceChips = (hospital: Hospital) => {
    const chips = [];
    if (hospital.hasStemiService) {
      chips.push(
        <Chip 
          key="stemi" 
          label="STEMI" 
          size="small" 
          color="primary" 
          variant="outlined"
          sx={{ mr: 0.5, mb: 0.5 }}
        />
      );
    }
    if (hospital.hasCardiologyCenter) {
      chips.push(
        <Chip 
          key="cardiology" 
          label="Cardiology" 
          size="small" 
          color="secondary" 
          variant="outlined"
          sx={{ mr: 0.5, mb: 0.5 }}
        />
      );
    }
    return chips;
  };

  return (
    <FormControl fullWidth required={required} error={error} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        label={label}
      >
        {!required && (
          <MenuItem value="">
            <em>{placeholder}</em>
          </MenuItem>
        )}
        {hospitals.map((hospital) => (
          <MenuItem key={hospital.id} value={hospital.id}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="body1" fontWeight="medium">
                {hospital.name}
              </Typography>
              {hospital.address && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {hospital.address}
                </Typography>
              )}
              {hospital.cluster && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Cluster: {hospital.cluster}
                </Typography>
              )}
              <Box sx={{ mt: 0.5 }}>
                {getServiceChips(hospital)}
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
      {helperText && (
        <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5 }}>
          {helperText}
        </Typography>
      )}
      {!loading && hospitals.length === 0 && (
        <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
          No hospitals with STEMI or Cardiology services found
        </Typography>
      )}
    </FormControl>
  );
};

export default StemiDestinationHospitalSelect;
