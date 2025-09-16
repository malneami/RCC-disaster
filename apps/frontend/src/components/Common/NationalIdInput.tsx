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
  const [latestCaseInfo, setLatestCaseInfo] = useState<{
    caseType: 'stroke' | 'trauma' | 'stemi' | null;
    caseId: string | null;
    createdAt: string | null;
    status: string | null;
  } | null>(null);

  const getPortalColor = () => {
    switch (portalType) {
      case 'stroke': return '#1976d2';
      case 'trauma': return '#d32f2f';
      case 'stemi': return '#388e3c';
      default: return '#1976d2';
    }
  };


  // Function to get latest case info for a patient
  const getLatestCaseInfo = useCallback(async (nationalId: string) => {
    try {
      const caseInfo = await patientService.getLatestCaseInfo(nationalId);
      setLatestCaseInfo(caseInfo);
    } catch (error) {
      console.error('Error getting latest case info:', error);
      setLatestCaseInfo(null);
    }
  }, []);

  // Debounced search function
  const searchPatients = useCallback(async (nationalId: string) => {
    if (nationalId.length < 4) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLatestCaseInfo(null);
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
      
      // Get latest case info for the first matching patient
      if (matchingPatients.length > 0) {
        await getLatestCaseInfo(matchingPatients[0].nationalId!);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setSuggestions([]);
      setShowSuggestions(false);
      setLatestCaseInfo(null);
    } finally {
      setLoading(false);
    }
  }, [getLatestCaseInfo]);

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
    if (patient.gender) parts.push(patient.gender);
    return parts.join(' • ');
  };

  const getLatestCaseColor = (caseType: string | null): string => {
    switch (caseType) {
      case 'stroke': return '#1976d2';
      case 'trauma': return '#d32f2f';
      case 'stemi': return '#388e3c';
      default: return '#666666';
    }
  };

  const getLatestCaseIcon = (caseType: string | null): string => {
    switch (caseType) {
      case 'stroke': return '🧠';
      case 'trauma': return '🚑';
      case 'stemi': return '❤️';
      default: return '📋';
    }
  };

  const getLatestCaseLabel = (): string => {
    if (!latestCaseInfo || !latestCaseInfo.caseType) {
      return 'No previous cases';
    }
    
    const caseType = latestCaseInfo.caseType.toUpperCase();
    const date = latestCaseInfo.createdAt ? new Date(latestCaseInfo.createdAt).toLocaleDateString() : '';
    return `Latest: ${caseType} (${date})`;
  };

  const formatCaseStatus = (status: string | null): string => {
    if (!status) return '';
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
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
                    label={getLatestCaseLabel()}
                    size="small" 
                    sx={{ 
                      color: getLatestCaseColor(latestCaseInfo?.caseType || null),
                      borderColor: getLatestCaseColor(latestCaseInfo?.caseType || null),
                    }}
                    variant="outlined"
                  />
                  {latestCaseInfo?.status && (
                    <Chip 
                      label={formatCaseStatus(latestCaseInfo.status)}
                      size="small" 
                      sx={{ 
                        backgroundColor: getLatestCaseColor(latestCaseInfo.caseType),
                        color: 'white',
                        fontSize: '0.7rem',
                      }}
                    />
                  )}
                  <Chip 
                    label={`${getLatestCaseIcon(latestCaseInfo?.caseType || null)} ${latestCaseInfo?.caseType?.toUpperCase() || 'NEW'}`}
                    size="small" 
                    sx={{ 
                      backgroundColor: latestCaseInfo?.caseType ? getLatestCaseColor(latestCaseInfo.caseType) : getPortalColor(),
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