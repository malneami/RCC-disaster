import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Box,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { Patient, patientService } from '../../services/patientService';

interface PatientSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onPatientSelect: (patient: Patient) => void;
  title?: string;
  excludePatientIds?: string[];
}

const PatientSearchDialog: React.FC<PatientSearchDialogProps> = ({
  open,
  onClose,
  onPatientSelect,
  title = "Search for Patient",
  excludePatientIds = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Clear state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setPatients([]);
      setError(null);
      setSelectedPatient(null);
    }
  }, [open]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setPatients([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const searchResults = await patientService.searchPatients(query);
      
      // Filter out excluded patients
      const filteredResults = searchResults.filter(
        patient => !excludePatientIds.includes(patient.id)
      );
      
      setPatients(filteredResults);
    } catch (err) {
      console.error('Error searching patients:', err);
      setError('Failed to search patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [excludePatientIds]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleSelectPatient = () => {
    if (selectedPatient) {
      onPatientSelect(selectedPatient);
      onClose();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPatients([]);
    setSelectedPatient(null);
  };

  const formatPatientInfo = (patient: Patient) => {
    const info = [];
    if (patient.nationalId) info.push(`National ID: ${patient.nationalId}`);
    if (patient.mrn) info.push(`MRN: ${patient.mrn}`);
    if (patient.dateOfBirth) {
      const dob = new Date(patient.dateOfBirth).toLocaleDateString();
      info.push(`DOB: ${dob}`);
    }
    if (patient.gender && patient.gender !== 'UNKNOWN') {
      info.push(`Gender: ${patient.gender}`);
    }
    return info.join(' • ');
  };

  const renderPatientItem = (patient: Patient) => (
    <ListItem key={patient.id} disablePadding>
      <ListItemButton
        onClick={() => handlePatientClick(patient)}
        selected={selectedPatient?.id === patient.id}
        sx={{ py: 2 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <PersonIcon color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {patient.firstName} {patient.lastName}
              {patient.middleName && ` ${patient.middleName}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatPatientInfo(patient)}
            </Typography>
            {patient.phoneNumber && (
              <Typography variant="body2" color="text.secondary">
                Phone: {patient.phoneNumber}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {patient.nationalId && (
              <Chip
                icon={<BadgeIcon />}
                label={patient.nationalId}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
            {patient.mrn && (
              <Chip
                icon={<AssignmentIcon />}
                label={patient.mrn}
                size="small"
                variant="outlined"
                color="secondary"
              />
            )}
          </Box>
        </Box>
      </ListItemButton>
    </ListItem>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          {title}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by name, National ID, or MRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClearSearch} size="small">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && searchQuery.length >= 2 && patients.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No patients found matching "{searchQuery}"
            </Typography>
          </Box>
        )}

        {!loading && patients.length > 0 && (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {patients.length} patient{patients.length !== 1 ? 's' : ''} found
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {patients.map(renderPatientItem)}
            </List>
          </>
        )}

        {!loading && searchQuery.length < 2 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" color="text.secondary">
              Enter at least 2 characters to search for patients
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSelectPatient}
          variant="contained"
          disabled={!selectedPatient}
        >
          Select Patient
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PatientSearchDialog;
