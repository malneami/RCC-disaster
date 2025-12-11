/**
 * Common Hospital Selection Component
 * Reusable component for selecting hospitals in forms
 */

import React, { useState, useEffect, useMemo } from 'react';
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
import { SelectChangeEvent } from '@mui/material/Select';
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
  onHospitalSelect?: (hospital: Hospital | null) => void;
  showServiceBadges?: boolean;
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
  onHospitalSelect,
  showServiceBadges = false,
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

  const selectedHospital = useMemo(() => {
    if (!value) {
      return null;
    }
    return hospitals.find((hospital) => hospital.id === value) || null;
  }, [hospitals, value]);

  useEffect(() => {
    if (onHospitalSelect) {
      onHospitalSelect(selectedHospital);
    }
  }, [onHospitalSelect, selectedHospital]);

  const getServiceBadges = (hospital: Hospital) => {
    if (!showServiceBadges) {
      return null;
    }

    const badges: React.ReactNode[] = [];

    if (hospital.hasStemiService) {
      badges.push(
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

    if (hospital.hasStrokeService) {
      badges.push(
        <Chip
          key="stroke"
          label="Stroke"
          size="small"
          color="secondary"
          variant="outlined"
          sx={{ mr: 0.5, mb: 0.5 }}
        />
      );
    }

    if (hospital.hasTraumaService) {
      badges.push(
        <Chip
          key="trauma"
          label="Trauma"
          size="small"
          color="warning"
          variant="outlined"
          sx={{ mr: 0.5, mb: 0.5 }}
        />
      );
    }

    if (!badges.length) {
      return null;
    }

    return (
      <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap' }}>
        {badges}
      </Box>
    );
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue);

    if (onHospitalSelect) {
      if (!selectedValue) {
        onHospitalSelect(null);
        return;
      }

      const hospital = hospitals.find((item) => item.id === selectedValue) || null;
      onHospitalSelect(hospital);
    }
  };

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
        onChange={handleSelectChange}
        label={label}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 200,
            },
          },
        }}
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
              {getServiceBadges(hospital)}
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
