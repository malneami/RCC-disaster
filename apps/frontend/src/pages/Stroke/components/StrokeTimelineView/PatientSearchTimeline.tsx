import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Button,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
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

interface TimelineEvent {
  id: string;
  eventTimestamp: string;
  eventType: string;
  eventDescription: string;
  strokeCase: {
    id: string;
    strokeType: string;
    currentStatus: string;
    createdAt: string;
    originHospital: {
      id: string;
      name: string;
    };
    destinationHospital?: {
      id: string;
      name: string;
    };
  };
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    mrn: string;
  };
}

const PatientSearchTimeline: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'nationalId' | 'name'>('nationalId');
  const [suggestions, setSuggestions] = useState<PatientSuggestion[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientSuggestion | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search function
  const searchPatients = useCallback(async (query: string, type: 'nationalId' | 'name') => {
    if (!query || query.trim().length < (type === 'nationalId' ? 4 : 2)) {
      setSuggestions([]);
      return;
    }

    try {
      setSearchLoading(true);
      const endpoint = type === 'nationalId' 
        ? `/api/patients/search/national-id?q=${encodeURIComponent(query)}`
        : `/api/patients/search/name?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to search patients');
      }

      const results = await response.json();
      setSuggestions(results);
    } catch (error) {
      console.error('Error searching patients:', error);
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounce the search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchPatients(searchQuery.trim(), searchType);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchType, searchPatients]);

  const loadPatientTimeline = async (patientId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/patients/timeline/${patientId}`);
      if (!response.ok) {
        throw new Error('Failed to load patient timeline');
      }

      const timelineData = await response.json();
      setTimeline(timelineData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load timeline data';
      setError(errorMessage);
      console.error('Error loading timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: PatientSuggestion) => {
    setSelectedPatient(patient);
    setSuggestions([]);
    setSearchQuery(`${patient.firstName} ${patient.lastName} (${patient.nationalId})`);
    loadPatientTimeline(patient.id);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedPatient(null);
    setTimeline([]);
    setSuggestions([]);
    setError(null);
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

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'ARRIVAL': return 'primary';
      case 'TRIAGE': return 'info';
      case 'ASSESSMENT': return 'info';
      case 'IMAGING': return 'warning';
      case 'LABORATORY': return 'warning';
      case 'TREATMENT_START': return 'success';
      case 'TREATMENT_COMPLETE': return 'success';
      case 'TRANSFER': return 'secondary';
      case 'DISCHARGE': return 'default';
      case 'COMPLICATION': return 'error';
      case 'FOLLOWUP': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Search Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Patient Timeline Search
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Search for patients by National ID or name to view their complete stroke unit visit history
        </Typography>

        {/* Search Controls */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Autocomplete
            freeSolo
            options={suggestions}
            getOptionLabel={(option) => 
              typeof option === 'string' ? option : getPatientDisplayName(option)
            }
            value={searchQuery}
            onInputChange={(_, newInputValue) => {
              setSearchQuery(newInputValue);
            }}
            onChange={(_, newValue) => {
              if (typeof newValue === 'object' && newValue) {
                handlePatientSelect(newValue);
              }
            }}
            loading={searchLoading}
            filterOptions={(x) => x}
            renderInput={(params) => (
              <TextField
                {...params}
                label={`Search by ${searchType === 'nationalId' ? 'National ID' : 'Name'}`}
                placeholder={searchType === 'nationalId' ? 'Enter National ID (min 4 digits)' : 'Enter patient name (min 2 characters)'}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{ minWidth: 300 }}
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
              searchQuery.length >= (searchType === 'nationalId' ? 4 : 2)
                ? "No patients found"
                : `Enter at least ${searchType === 'nationalId' ? '4 digits' : '2 characters'} to search`
            }
          />

          <Button
            variant="outlined"
            onClick={() => setSearchType(searchType === 'nationalId' ? 'name' : 'nationalId')}
            sx={{ minWidth: 120 }}
          >
            {searchType === 'nationalId' ? 'Search by Name' : 'Search by National ID'}
          </Button>

          {selectedPatient && (
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearSearch}
              color="secondary"
            >
              Clear
            </Button>
          )}
        </Box>

        {/* Selected Patient Info */}
        {selectedPatient && (
          <Card variant="outlined" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <PersonIcon />
                <Typography variant="h6">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={`National ID: ${selectedPatient.nationalId}`} size="small" />
                {selectedPatient.mrn && (
                  <Chip label={`MRN: ${selectedPatient.mrn}`} size="small" />
                )}
                <Chip label={`Gender: ${selectedPatient.gender}`} size="small" />
                <Chip label={`${selectedPatient.strokeCasesCount} stroke case${selectedPatient.strokeCasesCount > 1 ? 's' : ''}`} size="small" />
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Timeline Display */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : timeline.length > 0 ? (
        <Box>
          <Typography variant="h6" gutterBottom>
            Complete Patient Timeline ({timeline.length} events)
          </Typography>
          
          {timeline.map((event, index) => (
            <Card key={event.id} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip 
                    label={event.eventType} 
                    color={getEventTypeColor(event.eventType) as any}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(event.eventTimestamp), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Box>
                
                <Typography variant="body1" gutterBottom>
                  {event.eventDescription}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <Chip 
                    label={`Stroke Case: ${event.strokeCase.strokeType}`} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`Status: ${event.strokeCase.currentStatus}`} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`Hospital: ${event.strokeCase.originHospital.name}`} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`Case Created: ${format(new Date(event.strokeCase.createdAt), 'MMM dd, yyyy')}`} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : selectedPatient ? (
        <Alert severity="info">
          No timeline events found for this patient.
        </Alert>
      ) : (
        <Alert severity="info">
          Search for a patient to view their stroke unit visit timeline.
        </Alert>
      )}
    </Box>
  );
};

export default PatientSearchTimeline;
