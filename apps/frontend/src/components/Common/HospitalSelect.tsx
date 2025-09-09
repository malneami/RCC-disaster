/**
 * Common Hospital Selection Component
 * Reusable component for selecting hospitals in forms
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
} from '@mui/material';
import { hospitalService, Hospital } from '../../services/hospitalService';

interface HospitalSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
}

const HospitalSelect: React.FC<HospitalSelectProps> = ({
  value,
  onChange,
  label,
  required = false,
  error = false,
  helperText,
  disabled = false,
  placeholder = "Select a hospital",
}) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const hospitalsData = await hospitalService.getAllHospitals();
        setHospitals(hospitalsData);
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
          Loading hospitals...
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
            <Box>
              <Typography variant="body1" fontWeight="medium">
                {hospital.name}
              </Typography>
              {hospital.address && (
                <Typography variant="caption" color="text.secondary">
                  {hospital.address}
                </Typography>
              )}
              {hospital.cluster && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Cluster: {hospital.cluster}
                </Typography>
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
      {helperText && (
        <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5 }}>
          {helperText}
        </Typography>
      )}
    </FormControl>
  );
};

export default HospitalSelect;
