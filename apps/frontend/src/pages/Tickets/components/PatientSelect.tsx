import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Person as PersonIcon,
} from '@mui/icons-material';
import { Patient, CreatePatientData, patientService } from '../../../services/patientService';
import { format } from 'date-fns';

interface PatientSelectProps {
  value: string | null;
  onChange: (patientId: string | null) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
}

const PatientSelect: React.FC<PatientSelectProps> = ({
  value,
  onChange,
  error = false,
  helperText,
  required = false,
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [newPatient, setNewPatient] = useState<CreatePatientData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'UNKNOWN',
  });

  // Load initial patients
  useEffect(() => {
    loadPatients();
  }, []);

  // Load selected patient if value is provided
  useEffect(() => {
    if (value && !selectedPatient) {
      loadSelectedPatient(value);
    }
  }, [value]);

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

  const loadSelectedPatient = async (patientId: string) => {
    try {
      const patient = await patientService.getPatient(patientId);
      setSelectedPatient(patient);
    } catch (error) {
      console.error('Error loading selected patient:', error);
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

  const handleCreatePatient = async () => {
    try {
      setCreateLoading(true);
      setCreateError(null);

      // Validate required fields
      if (!newPatient.firstName || !newPatient.lastName || !newPatient.dateOfBirth) {
        setCreateError('First name, last name, and date of birth are required');
        return;
      }

      const createdPatient = await patientService.createPatient(newPatient);
      
      // Add to patients list
      setPatients(prev => [createdPatient, ...prev]);
      
      // Select the new patient
      setSelectedPatient(createdPatient);
      onChange(createdPatient.id);
      
      // Close dialog and reset form
      setCreateDialogOpen(false);
      setNewPatient({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'UNKNOWN',
      });
    } catch (error) {
      console.error('Error creating patient:', error);
      setCreateError('Failed to create patient. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handlePatientChange = (patient: Patient | null) => {
    setSelectedPatient(patient);
    onChange(patient?.id || null);
  };

  const getPatientDisplayName = (patient: Patient) => {
    const age = patient.dateOfBirth 
      ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;
    
    const fullName = `${patient.firstName} ${patient.lastName}`;
    const identifiers = [];
    
    if (patient.nationalId) identifiers.push(`ID: ${patient.nationalId}`);
    if (patient.mrn) identifiers.push(`MRN: ${patient.mrn}`);
    if (age) identifiers.push(`${age}y`);
    
    return `${fullName}${identifiers.length > 0 ? ` (${identifiers.join(', ')})` : ''}`;
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
        value={selectedPatient}
        onChange={(_, newValue) => handlePatientChange(newValue)}
        options={patients}
        getOptionLabel={(option) => getPatientDisplayName(option)}
        loading={loading}
        filterOptions={(x) => x}
        onInputChange={(_, newInputValue) => {
          setSearchQuery(newInputValue);
          handleSearch(newInputValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={required ? "Patient *" : "Patient"}
            error={error}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
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
            ? "No patients found. Click 'New' to create a patient."
            : "Start typing to search patients..."
        }
      />

      {/* Create Patient Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            <Typography variant="h6">Create New Patient</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name *"
                value={newPatient.firstName}
                onChange={(e) => setNewPatient(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name *"
                value={newPatient.lastName}
                onChange={(e) => setNewPatient(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date of Birth *"
                type="date"
                value={newPatient.dateOfBirth}
                onChange={(e) => setNewPatient(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={newPatient.gender}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, gender: e.target.value as any }))}
                  label="Gender"
                >
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                  <MenuItem value="UNKNOWN">Unknown</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Medical Record Number (MRN)"
                value={newPatient.mrn || ''}
                onChange={(e) => setNewPatient(prev => ({ ...prev, mrn: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={newPatient.phoneNumber || ''}
                onChange={(e) => setNewPatient(prev => ({ ...prev, phoneNumber: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={newPatient.address || ''}
                onChange={(e) => setNewPatient(prev => ({ ...prev, address: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                value={newPatient.city || ''}
                onChange={(e) => setNewPatient(prev => ({ ...prev, city: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                value={newPatient.state || ''}
                onChange={(e) => setNewPatient(prev => ({ ...prev, state: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={newPatient.zipCode || ''}
                onChange={(e) => setNewPatient(prev => ({ ...prev, zipCode: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Contact"
                value={newPatient.emergencyContact || ''}
                onChange={(e) => setNewPatient(prev => ({ ...prev, emergencyContact: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Phone"
                value={newPatient.emergencyPhone || ''}
                onChange={(e) => setNewPatient(prev => ({ ...prev, emergencyPhone: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Blood Type"
                value={newPatient.bloodType || ''}
                onChange={(e) => setNewPatient(prev => ({ ...prev, bloodType: e.target.value }))}
                placeholder="e.g., A+, B-, O+, AB+"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Weight (kg)"
                type="number"
                value={newPatient.weight || ''}
                onChange={(e) => setNewPatient(prev => ({ ...prev, weight: parseFloat(e.target.value) || undefined }))}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Allergies"
                value={newPatient.allergies || ''}
                onChange={(e) => setNewPatient(prev => ({ ...prev, allergies: e.target.value }))}
                multiline
                rows={2}
                placeholder="List any known allergies"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Medications"
                value={newPatient.medications || ''}
                onChange={(e) => setNewPatient(prev => ({ ...prev, medications: e.target.value }))}
                multiline
                rows={2}
                placeholder="List current medications"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medical History"
                value={newPatient.medicalHistory || ''}
                onChange={(e) => setNewPatient(prev => ({ ...prev, medicalHistory: e.target.value }))}
                multiline
                rows={3}
                placeholder="Relevant medical history"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            disabled={createLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreatePatient}
            variant="contained"
            disabled={createLoading}
            startIcon={createLoading ? <CircularProgress size={20} /> : null}
          >
            {createLoading ? 'Creating...' : 'Create Patient'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientSelect;
