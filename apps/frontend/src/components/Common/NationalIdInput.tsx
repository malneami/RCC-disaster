import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  Box,
  Typography,
  Chip,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { patientService, Patient } from '../../services/patientService';

interface NationalIdInputProps {
  value: string;
  onChange: (value: string) => void;
  onPatientSelect?: (patient: Patient) => void;
  onBlur?: () => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  portalType?: 'stroke' | 'trauma' | 'stemi' | 'patient';
  notAvailable?: boolean;
  onNotAvailableChange?: (checked: boolean) => void;
}

const NationalIdInput: React.FC<NationalIdInputProps> = ({
  value,
  onChange,
  onPatientSelect,
  onBlur,
  label = "National ID",
  required = false,
  error = false,
  helperText,
  portalType = 'patient',
  notAvailable = false,
  onNotAvailableChange,
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
  const inputRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!showSuggestions) return;

    const handleScroll = () => {
      if (!inputRef.current) {
        setShowSuggestions(false);
        return;
      }

      const inputElement = inputRef.current;
      const rect = inputElement.getBoundingClientRect();

      const isVisible =
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
        rect.left < (window.innerWidth || document.documentElement.clientWidth);

      if (!isVisible) {
        setShowSuggestions(false);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    document.addEventListener('scroll', handleScroll, true);
    document.body.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
      document.removeEventListener('scroll', handleScroll, true);
      document.body.removeEventListener('scroll', handleScroll, true);
    };
  }, [showSuggestions]);


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
    <Box ref={inputRef}>
      <Autocomplete
        freeSolo
        options={suggestions}
        getOptionLabel={(option) =>
          typeof option === 'string' ? option : option.nationalId || ''
        }
        value={value}
        onInputChange={(_, newInputValue) => {
          // Don't trigger onChange when disabled - the parent already handles value clearing
          // via onNotAvailableChange, and calling onChange here would use stale closure data
          if (notAvailable) return;
          // Only allow numeric input
          const numericValue = newInputValue.replace(/\D/g, '');
          onChange(numericValue);
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
        disablePortal={true}
        componentsProps={{
          popper: {
            placement: 'bottom-start' as const,
            modifiers: [
              {
                name: 'preventOverflow',
                enabled: true,
                options: {
                  rootBoundary: 'viewport',
                  tether: false,
                  altAxis: true,
                },
              },
              {
                name: 'flip',
                enabled: true,
                options: {
                  fallbackPlacements: ['bottom', 'top'],
                },
              },
            ],
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            required={required}
            error={error}
            helperText={helperText}
            onBlur={onBlur}
            inputProps={{
              ...params.inputProps,
              inputMode: 'numeric',
              pattern: '[0-9]*',
            }}
            FormHelperTextProps={{
              sx: { color: error ? 'error.main' : undefined }
            }}
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
        open={showSuggestions && suggestions.length > 0 && !notAvailable}
        onClose={() => setShowSuggestions(false)}
        onOpen={() => {
          if (value.length >= 4 && suggestions.length > 0 && !notAvailable) {
            setShowSuggestions(true);
          }
        }}
        disabled={notAvailable}
      />

      {/* Checkbox for "National ID not available" */}
      <FormControlLabel
        control={
          <Checkbox
            checked={notAvailable}
            onChange={(e) => {
              onNotAvailableChange?.(e.target.checked);
              // Clear local state when checked - BUT don't call onChange('')
              // because the parent already handles clearing nationalId in the onNotAvailableChange callback
              if (e.target.checked) {
                setSuggestions([]);
                setShowSuggestions(false);
                setLatestCaseInfo(null);
              }
            }}
            size="small"
            sx={{
              color: getPortalColor(),
              '&.Mui-checked': {
                color: getPortalColor(),
              },
              py: 0,
            }}
          />
        }
        label={
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            National ID not available
          </Typography>
        }
        sx={{ mt: 0.25, ml: 0 }}
      />
    </Box>
  );
};

export default NationalIdInput;