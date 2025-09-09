import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Autocomplete,
  Box,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { patientService, Patient } from '../../services/patientService';

interface NationalIdInputProps {
  value: string;
  onChange: (value: string) => void;
  onPatientSelect?: (patient: Patient) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  portalType?: 'stroke' | 'trauma' | 'stemi' | 'patient';
}

const NationalIdInput: React.FC<NationalIdInputProps> = ({
  value,
  onChange,
  onPatientSelect,
  label = "National ID",
  required = false,
  error = false,
  helperText,
  portalType = 'patient',
}) => {
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const getPortalColor = () => {
    switch (portalType) {
      case 'stroke': return '#1976d2';
      case 'trauma': return '#d32f2f';
      case 'stemi': return '#388e3c';
      default: return '#1976d2';
    }
  };

  const getPortalIcon = () => {
    switch (portalType) {
      case 'stroke': return '🧠';
      case 'trauma': return '🚑';
      case 'stemi': return '❤️';
      default: return '🏥';
    }
  };

  // Debounced search function
  const searchPatients = useCallback(async (nationalId: string) => {
    if (nationalId.length < 4) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoading(true);
      const results = await patientService.searchPatients(nationalId);
      
      // Filter results that match the National ID pattern
      const matchingPatients = results.filter(patient => 
        patient.nationalId && 
        patient.nationalId.toLowerCase().includes(nationalId.toLowerCase())
      );
      
      setSuggestions(matchingPatients);
      setShowSuggestions(matchingPatients.length > 0);
    } catch (error) {
      console.error('Error searching patients:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce the search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value && value.length >= 4) {
        searchPatients(value);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, searchPatients]);


  const handlePatientSelect = (patient: Patient) => {
    onChange(patient.nationalId || '');
    setShowSuggestions(false);
    onPatientSelect?.(patient);
  };

  const getPatientDisplayName = (patient: Patient): string => {
    return `${patient.firstName} ${patient.lastName}`;
  };

  const getPatientSubtitle = (patient: Patient): string => {
    const parts = [];
    if (patient.nationalId) parts.push(`ID: ${patient.nationalId}`);
    if (patient.mrn) parts.push(`MRN: ${patient.mrn}`);
    if (patient.gender !== 'UNKNOWN') parts.push(patient.gender);
    return parts.join(' • ');
  };

  const getPortalCaseCount = (patient: Patient): number => {
    switch (portalType) {
      case 'stroke': return patient.strokeCasesCount || 0;
      case 'trauma': return patient.traumaCasesCount || 0;
      case 'stemi': return patient.stemiCasesCount || 0;
      default: return (patient.strokeCasesCount || 0) + (patient.traumaCasesCount || 0) + (patient.stemiCasesCount || 0);
    }
  };

  const getPortalCaseLabel = (count: number): string => {
    const portalName = portalType === 'stemi' ? 'STEMI' : portalType.toUpperCase();
    return `${count} ${portalName.toLowerCase()} case${count > 1 ? 's' : ''}`;
  };

  return (
    <Box>
      <Autocomplete
        freeSolo
        options={suggestions}
        getOptionLabel={(option) => 
          typeof option === 'string' ? option : option.nationalId || ''
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
        loadingText="Searching patients..."
        noOptionsText={
          value.length >= 4 
            ? "No patients found with this National ID"
            : "Enter at least 4 digits to search"
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            required={required}
            error={error}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: getPortalColor(),
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: getPortalColor(),
                },
              },
            }}
          />
        )}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;
          return (
            <Box component="li" key={key} {...otherProps}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <PersonIcon sx={{ color: getPortalColor() }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Typography variant="body1" fontWeight="medium">
                  {getPatientDisplayName(option)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getPatientSubtitle(option)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Chip 
                    label={getPortalCaseLabel(getPortalCaseCount(option))}
                    size="small" 
                    sx={{ 
                      color: getPortalColor(),
                      borderColor: getPortalColor(),
                    }}
                    variant="outlined"
                  />
                  <Chip 
                    label={`${getPortalIcon()} ${portalType.toUpperCase()}`}
                    size="small" 
                    sx={{ 
                      backgroundColor: getPortalColor(),
                      color: 'white',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
          );
        }}
        open={showSuggestions && suggestions.length > 0}
        onClose={() => setShowSuggestions(false)}
        onOpen={() => {
          if (value.length >= 4 && suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
      />
    </Box>
  );
};

export default NationalIdInput;