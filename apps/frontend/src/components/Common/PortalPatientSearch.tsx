import React, { useState, useEffect } from 'react';
import {
  TextField,
  Box,
  IconButton,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  Person,
  LocalHospital,
  Assignment,
  Warning,
} from '@mui/icons-material';
import { Patient, patientService } from '../../services/patientService';

export interface PatientSearchFilter {
  type: 'all' | 'patient' | 'hospital' | 'case';
  value: string;
}

export interface PortalPatientSearchProps {
  placeholder?: string;
  onPatientSelect: (patient: Patient) => void;
  onClear?: () => void;
  portalType: 'stroke' | 'trauma' | 'stemi' | 'patients';
  disabled?: boolean;
  showFilters?: boolean;
  showDuplicates?: boolean;
  onViewDuplicate?: (patient: Patient) => void;
}

export const PortalPatientSearch: React.FC<PortalPatientSearchProps> = ({
  placeholder = 'Search by patient name, MRN, or National ID...',
  onPatientSelect,
  onClear,
  portalType,
  disabled = false,
  showFilters = true,
  showDuplicates = true,
  onViewDuplicate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<PatientSearchFilter>({
    type: 'all',
    value: 'All',
  });
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [duplicates, setDuplicates] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const getPortalColor = () => {
    switch (portalType) {
      case 'stroke': return '#1976d2';
      case 'trauma': return '#d32f2f';
      case 'stemi': return '#388e3c';
      case 'patients': return '#7b1fa2';
      default: return '#1976d2';
    }
  };

  const getPortalIcon = () => {
    switch (portalType) {
      case 'stroke': return '🧠';
      case 'trauma': return '🚑';
      case 'stemi': return '❤️';
      case 'patients': return '👥';
      default: return '🏥';
    }
  };

  const filterOptions = [
    { type: 'all', value: 'All', icon: <Search /> },
    { type: 'patient', value: 'Patient', icon: <Person /> },
    { type: 'hospital', value: 'Hospital', icon: <LocalHospital /> },
    { type: 'case', value: 'Case', icon: <Assignment /> },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setShowResults(true);

      // Search for patients
      const results = await patientService.searchPatients(searchQuery.trim());
      setSearchResults(results);

      // Check for duplicates if enabled
      if (showDuplicates && results.length > 0) {
        // Check for potential duplicates based on National ID
        const nationalIdDuplicates = results.filter(patient => 
          patient.nationalId && results.some(other => 
            other.id !== patient.id && other.nationalId === patient.nationalId
          )
        );
        setDuplicates(nationalIdDuplicates);
      }
    } catch (err) {
      console.error('Error searching patients:', err);
      setError('Failed to search patients');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setDuplicates([]);
    setShowResults(false);
    setError(null);
    onClear?.();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterSelect = (filter: typeof filterOptions[0]) => {
    setSelectedFilter({ type: filter.type as any, value: filter.value });
    setFilterAnchorEl(null);
  };

  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const handlePatientClick = (patient: Patient) => {
    onPatientSelect(patient);
    setShowResults(false);
  };

  const handleViewDuplicate = (patient: Patient) => {
    if (onViewDuplicate) {
      onViewDuplicate(patient);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Search Input */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          fullWidth
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: getPortalColor() }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClear}
                  size="small"
                  sx={{ color: 'text.secondary' }}
                >
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: getPortalColor(),
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: getPortalColor(),
              },
            },
          }}
        />

        {/* Filter Dropdown */}
        {showFilters && (
          <>
            <Chip
              icon={selectedFilter.type === 'all' ? <Search /> : 
                    selectedFilter.type === 'patient' ? <Person /> :
                    selectedFilter.type === 'hospital' ? <LocalHospital /> : <Assignment />}
              label={selectedFilter.value}
              onClick={handleFilterMenuOpen}
              variant="outlined"
              sx={{
                borderColor: getPortalColor(),
                color: getPortalColor(),
                '&:hover': {
                  backgroundColor: `${getPortalColor()}10`,
                },
                minWidth: 120,
              }}
            />

            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterMenuClose}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  boxShadow: 3,
                  mt: 1,
                },
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {getPortalIcon()} Filter by Type
                </Typography>
              </Box>
              <Divider />
              {filterOptions.map((filter) => (
                <MenuItem
                  key={filter.type}
                  onClick={() => handleFilterSelect(filter)}
                  selected={selectedFilter.type === filter.type}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: `${getPortalColor()}10`,
                      '&:hover': {
                        backgroundColor: `${getPortalColor()}20`,
                      },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {filter.icon}
                    <Typography variant="body2">{filter.value}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        {/* Search Button */}
        <IconButton
          onClick={handleSearch}
          disabled={disabled || !searchQuery.trim()}
          sx={{
            backgroundColor: getPortalColor(),
            color: 'white',
            '&:hover': {
              backgroundColor: getPortalColor(),
              opacity: 0.9,
            },
            '&:disabled': {
              backgroundColor: 'grey.300',
              color: 'grey.500',
            },
            borderRadius: 2,
            p: 1.5,
          }}
        >
          <Search />
        </IconButton>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Searching patients...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Duplicate Warning */}
      {duplicates.length > 0 && showDuplicates && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          icon={<Warning />}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Potential Duplicate Patients Found ({duplicates.length})
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            We found {duplicates.length} patient(s) that may be duplicates. Please review before proceeding.
          </Typography>
          <Box sx={{ mt: 1 }}>
            {duplicates.map((patient) => (
              <Box key={patient.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Person fontSize="small" />
                <Typography variant="body2">
                  {patient.firstName} {patient.lastName} - MRN: {patient.mrn} | ID: {patient.nationalId}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleViewDuplicate(patient)}
                  sx={{ ml: 'auto' }}
                >
                  <Typography variant="caption" color="primary">
                    View
                  </Typography>
                </IconButton>
              </Box>
            ))}
          </Box>
        </Alert>
      )}

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Search Results ({searchResults.length})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {searchResults.map((patient) => (
              <Box
                key={patient.id}
                onClick={() => handlePatientClick(patient)}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: `${getPortalColor()}05`,
                    borderColor: getPortalColor(),
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Person sx={{ color: getPortalColor() }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="medium">
                      {patient.firstName} {patient.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      MRN: {patient.mrn} | National ID: {patient.nationalId}
                    </Typography>
                    {patient.dateOfBirth && (
                      <Typography variant="caption" color="text.secondary">
                        DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* No Results */}
      {showResults && searchResults.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            No patients found matching your search criteria.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default PortalPatientSearch;
