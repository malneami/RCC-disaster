import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Autocomplete,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Person as PersonIcon, Badge as BadgeIcon } from '@mui/icons-material';
import { format } from 'date-fns';

interface PatientSuggestion {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  mrn: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber?: string;
  email?: string;
  strokeCasesCount: number;
  lastVisit?: string;
}

interface NationalIdInputProps {
  value: string;
  onChange: (value: string) => void;
  onPatientSelect?: (patient: PatientSuggestion) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

const NationalIdInput: React.FC<NationalIdInputProps> = ({
  value,
  onChange,
  onPatientSelect,
  label = "National ID",
  required = false,
  error = false,
  helperText,
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState<PatientSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search function
  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 4) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoading(true);
      setSearchError(null);

      const response = await fetch(`/api/patients/search/national-id?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search patients');
      }

      const results = await response.json();
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchError('Failed to search patients');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce the search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value.trim()) {
        searchPatients(value.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [value, searchPatients]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onChange(newValue);
  };

  const handlePatientSelect = (patient: PatientSuggestion) => {
    onChange(patient.nationalId);
    setShowSuggestions(false);
    onPatientSelect?.(patient);
  };

  const getPatientDisplayName = (patient: PatientSuggestion): string => {
    return `${patient.firstName} ${patient.lastName}`;
  };

  const getPatientSubtitle = (patient: PatientSuggestion): string => {
    const parts = [];
    if (patient.gender !== 'UNKNOWN') parts.push(patient.gender);
    if (patient.dateOfBirth) parts.push(format(new Date(patient.dateOfBirth), 'MMM dd, yyyy'));
    if (patient.strokeCasesCount > 0) parts.push(`${patient.strokeCasesCount} stroke case${patient.strokeCasesCount > 1 ? 's' : ''}`);
    return parts.join(' • ');
  };

  return (
    <Box>
      <Autocomplete
        freeSolo
        options={suggestions}
        getOptionLabel={(option) => 
          typeof option === 'string' ? option : option.nationalId
        }
        value={value}
        onInputChange={(_, newInputValue) => {
          onChange(newInputValue);
        }}
        onChange={(_, newValue) => {
          if (typeof newValue === 'object' && newValue) {
            handlePatientSelect(newValue);
          }
        }}
        loading={loading}
        disabled={disabled}
        open={showSuggestions && suggestions.length > 0}
        onClose={() => setShowSuggestions(false)}
        filterOptions={(x) => x} // Disable default filtering since we're doing server-side search
        renderInput={(params) => (
          <TextField
            {...params}
            label={required ? `${label} *` : label}
            value={value}
            onChange={handleInputChange}
            error={error}
            helperText={helperText || (value.length >= 4 && suggestions.length === 0 && !loading ? 'No existing patients found with this National ID' : '')}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', py: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <PersonIcon fontSize="small" color="primary" />
                <Typography variant="body1" fontWeight="medium">
                  {getPatientDisplayName(option)}
                </Typography>
                <Chip 
                  label={option.nationalId} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {getPatientSubtitle(option)}
              </Typography>
              {option.mrn && (
                <Typography variant="caption" color="text.secondary">
                  MRN: {option.mrn}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        noOptionsText={
          value.length >= 4 
            ? "No existing patients found with this National ID"
            : "Enter at least 4 digits to search for existing patients"
        }
      />

      {searchError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {searchError}
        </Alert>
      )}

      {value.length >= 4 && suggestions.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Found {suggestions.length} existing patient{suggestions.length > 1 ? 's' : ''} with this National ID
        </Typography>
      )}
    </Box>
  );
};

export default NationalIdInput;
