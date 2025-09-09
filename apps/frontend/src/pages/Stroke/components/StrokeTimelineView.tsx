import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  InputAdornment, 
  Typography, 
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider
} from '@mui/material';
import { Search as SearchIcon, Person as PersonIcon } from '@mui/icons-material';

import { StrokeCase, StrokeTimeline, StrokeService } from '../../../services/strokeService';
import { patientService, Patient } from '../../../services/patientService';
import CaseSelector from './StrokeTimelineView/CaseSelector';
import TimelineStepper from './StrokeTimelineView/TimelineStepper';

interface StrokeTimelineViewProps {
  cases: StrokeCase[];
}

const StrokeTimelineView: React.FC<StrokeTimelineViewProps> = ({ cases }) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [timeline, setTimeline] = useState<StrokeTimeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientCases, setPatientCases] = useState<StrokeCase[]>([]);

  useEffect(() => {
    if (selectedCaseId) {
      loadTimeline(selectedCaseId);
    } else {
      setTimeline([]);
    }
  }, [selectedCaseId]);

  // Search for patients
  useEffect(() => {
    const searchPatients = async () => {
      if (searchQuery.length < 3) {
        setSearchResults([]);
        return;
      }

      try {
        setSearchLoading(true);
        const results = await patientService.searchPatients(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching patients:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(searchPatients, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadTimeline = async (caseId: string) => {
    try {
      setLoading(true);
      setError(null);
      const timelineData = await StrokeService.getStrokeTimelineForCase(caseId);
      setTimeline(timelineData || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load timeline data';
      setError(errorMessage);
      console.error('Error loading timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseSelect = (caseId: string) => {
    setSelectedCaseId(caseId);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
    setSearchResults([]);
    
    // Filter cases for this patient
    const patientCases = cases.filter(case_ => case_.patientId === patient.id);
    setPatientCases(patientCases);
    
    // If patient has cases, select the first one
    if (patientCases.length > 0) {
      setSelectedCaseId(patientCases[0].id);
    } else {
      setSelectedCaseId('');
      setTimeline([]);
    }
  };

  const clearPatientSelection = () => {
    setSelectedPatient(null);
    setPatientCases([]);
    setSelectedCaseId('');
    setTimeline([]);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <Box>
      {/* Patient Search Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Search Patient Timeline
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Search by National ID or patient name to view all stroke cases and timeline for a patient
          </Typography>
          
          <TextField
            fullWidth
            placeholder="Enter National ID or patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchLoading && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ),
            }}
          />

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Search Results:
              </Typography>
              {searchResults.map((patient) => (
                <Card 
                  key={patient.id} 
                  sx={{ 
                    mb: 1, 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <CardContent sx={{ py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PersonIcon color="primary" />
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {patient.firstName} {patient.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          National ID: {patient.nationalId || 'N/A'} • MRN: {patient.mrn || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Selected Patient Display */}
          {selectedPatient && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ 
                p: 2, 
                bgcolor: 'success.light', 
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PersonIcon color="primary" />
                  <Box>
                    <Typography variant="h6">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </Typography>
                    <Typography variant="body2">
                      National ID: {selectedPatient.nationalId} • MRN: {selectedPatient.mrn || 'N/A'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={`${patientCases.length} stroke case${patientCases.length > 1 ? 's' : ''}`} 
                        size="small" 
                        color="primary" 
                      />
                    </Box>
                  </Box>
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={clearPatientSelection}
                >
                  Clear Selection
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Case Selector - Only show if patient is selected */}
      {selectedPatient && patientCases.length > 0 && (
        <CaseSelector
          cases={patientCases}
          selectedCaseId={selectedCaseId}
          onCaseSelect={handleCaseSelect}
        />
      )}
      
      {/* Timeline */}
      {selectedCaseId && (
        <TimelineStepper
          timeline={timeline}
          loading={loading}
          error={error}
        />
      )}

      {/* No Selection Message */}
      {!selectedPatient && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Select a patient to view timeline
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the search above to find a patient by National ID or name
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default StrokeTimelineView;