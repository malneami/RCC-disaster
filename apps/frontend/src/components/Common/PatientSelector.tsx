import React, { useState, useEffect, useCallback } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { format } from 'date-fns';

import { Patient, CreatePatientData, patientService } from '../../services/patientService';
import PatientForm from './PatientForm';

interface PatientSelectorProps {
  value?: Patient | null;
  onChange: (patient: Patient | null) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  compact?: boolean; // For use in modals/dialogs
}

const PatientSelector: React.FC<PatientSelectorProps> = ({
  value,
  onChange,
  error = false,
  helperText,
  required = false,
  label = required ? "Patient *" : "Patient",
  disabled = false,
  compact = false,
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Load initial patients
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await patientService.getPatients(1, 50);
      setPatients(response.data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPatients([]);
      return;
    }

    try {
      setLoading(true);
      const searchResults = await patientService.searchPatients(query);
      setPatients(searchResults);
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreatePatient = async (patientData: CreatePatientData) => {
    try {
      setCreateLoading(true);
      setCreateError(null);
      
      const newPatient = await patientService.createPatient(patientData);
      onChange(newPatient);
      setCreateDialogOpen(false);
      
      // Refresh the patients list
      await loadPatients();
    } catch (error: any) {
      console.error('Error creating patient:', error);
      setCreateError(error.response?.data?.message || 'Failed to create patient');
    } finally {
      setCreateLoading(false);
    }
  };

  const getPatientDisplayName = (patient: Patient): string => {
    const name = `${patient.firstName} ${patient.lastName}`;
    const identifiers = [];
    if (patient.nationalId) identifiers.push(`ID: ${patient.nationalId}`);
    if (patient.mrn) identifiers.push(`MRN: ${patient.mrn}`);
    return `${name}${identifiers.length > 0 ? ` (${identifiers.join(', ')})` : ''}`;
  };

  const getPatientSubtitle = (patient: Patient) => {
    const parts = [];
    if (patient.gender !== 'UNKNOWN') parts.push(patient.gender);
    if (patient.dateOfBirth) parts.push(format(new Date(patient.dateOfBirth), 'MMM dd, yyyy'));
    if (patient.phoneNumber) parts.push(patient.phoneNumber);
    return parts.join(' • ');
  };

  return (
    <Box>
      <Autocomplete
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        options={patients}
        getOptionLabel={(option) => getPatientDisplayName(option)}
        loading={loading}
        disabled={disabled}
        filterOptions={(x) => x}
        onInputChange={(_, newInputValue) => {
          setSearchQuery(newInputValue);
          handleSearch(newInputValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
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
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Typography variant="body1" fontWeight="medium">
                {getPatientDisplayName(option)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getPatientSubtitle(option)}
              </Typography>
            </Box>
          </Box>
        )}
        noOptionsText={
          searchQuery.length > 0 
            ? "No patients found. Click 'New Patient' to create one."
            : "Start typing to search patients..."
        }
      />

      {!compact && (
        <Box sx={{ mt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            size="small"
            disabled={disabled}
          >
            New Patient
          </Button>
        </Box>
      )}

      {/* Create Patient Dialog */}
      <Dialog 
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Patient</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}
          <PatientForm
            onPatientCreated={handleCreatePatient}
            onCancel={() => setCreateDialogOpen(false)}
            compact={true}
            showActions={false}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientSelector;
