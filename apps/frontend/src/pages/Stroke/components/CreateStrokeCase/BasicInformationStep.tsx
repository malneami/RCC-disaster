import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Card,
  CardContent,
} from '@mui/material';

import { CreateStrokeCaseData, StrokeType } from '../../../../services/strokeService';
import { hospitalService, Hospital } from '../../../../services/hospitalService';
import PatientSelector from '../../../../components/Common/PatientSelector';
import { Patient } from '../../../../services/patientService';

interface BasicInformationStepProps {
  formData: CreateStrokeCaseData;
  updateFormData: (field: keyof CreateStrokeCaseData, value: any) => void;
}

const BasicInformationStep: React.FC<BasicInformationStepProps> = ({
  formData,
  updateFormData,
}) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [hospitalError, setHospitalError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoadingHospitals(true);
        // Filter for hospitals with stroke services
        const hospitalsData = await hospitalService.getAllHospitals({
          hasStrokeService: true,
          status: 'ACTIVE'
        });
        setHospitals(hospitalsData);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
        setHospitalError('Failed to load hospitals');
      } finally {
        setLoadingHospitals(false);
      }
    };

    fetchHospitals();
  }, []);

  const handlePatientChange = (patient: Patient | null) => {
    setSelectedPatient(patient);
    if (patient) {
      // Update form data with selected patient
      updateFormData('patientId', patient.id);
      updateFormData('patientInfo', {
        firstName: patient.firstName,
        lastName: patient.lastName,
        nationalId: patient.nationalId || '',
        mrn: patient.mrn || '',
        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
        gender: patient.gender,
        phoneNumber: patient.phoneNumber || '',
        email: patient.email || '',
      });
    } else {
      // Clear patient data
      updateFormData('patientId', '');
      updateFormData('patientInfo', {
        firstName: '',
        lastName: '',
        nationalId: '',
        mrn: '',
        dateOfBirth: '',
        gender: 'UNKNOWN',
        phoneNumber: '',
        email: '',
      });
    }
  };

  if (hospitalError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {hospitalError}
      </Alert>
    );
  }

  return (
    <Grid container spacing={2}>
      {/* Patient Selection */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Patient Information
        </Typography>
        <PatientSelector
          value={selectedPatient}
          onChange={handlePatientChange}
          label="Select Patient"
          helperText="Search for an existing patient or create a new one"
          required
        />
      </Grid>

      {/* Selected Patient Information Display */}
      {selectedPatient && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Selected Patient Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedPatient.firstName} {selectedPatient.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>National ID:</strong> {selectedPatient.nationalId || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>MRN:</strong> {selectedPatient.mrn || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Gender:</strong> {selectedPatient.gender}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
      <Grid item xs={12}>
        <FormControl fullWidth required>
          <InputLabel>Origin Hospital</InputLabel>
          <Select
            value={formData.originHospitalId || ''}
            onChange={(e) => updateFormData('originHospitalId', e.target.value)}
            disabled={loadingHospitals}
          >
            {loadingHospitals ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading hospitals...
              </MenuItem>
            ) : (
              hospitals.map((hospital) => (
                <MenuItem key={hospital.id} value={hospital.id}>
                  <Box>
                    <Typography variant="body1">{hospital.name}</Typography>
                    {hospital.address && (
                      <Typography variant="caption" color="text.secondary">
                        {hospital.address}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      {hospital.hasStrokeUnit && (
                        <Typography variant="caption" color="success.main">
                          Stroke Unit
                        </Typography>
                      )}
                      {hospital.hasStrokeService && (
                        <Typography variant="caption" color="info.main">
                          Stroke Service
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Destination Hospital (Optional)</InputLabel>
          <Select
            value={formData.destinationHospitalId || ''}
            onChange={(e) => updateFormData('destinationHospitalId', e.target.value)}
            disabled={loadingHospitals}
          >
            <MenuItem value="">
              <em>No destination hospital</em>
            </MenuItem>
            {loadingHospitals ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading hospitals...
              </MenuItem>
            ) : (
              hospitals.map((hospital) => (
                <MenuItem key={hospital.id} value={hospital.id}>
                  <Box>
                    <Typography variant="body1">{hospital.name}</Typography>
                    {hospital.address && (
                      <Typography variant="caption" color="text.secondary">
                        {hospital.address}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      {hospital.hasStrokeUnit && (
                        <Typography variant="caption" color="success.main">
                          Stroke Unit
                        </Typography>
                      )}
                      {hospital.hasStrokeService && (
                        <Typography variant="caption" color="info.main">
                          Stroke Service
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Stroke Type</InputLabel>
          <Select
            value={formData.strokeType}
            label="Stroke Type"
            onChange={(e) => updateFormData('strokeType', e.target.value as StrokeType)}
          >
            <MenuItem value="ISCHEMIC">Ischemic</MenuItem>
            <MenuItem value="HEMORRHAGIC">Hemorrhagic</MenuItem>
            <MenuItem value="TIA">TIA</MenuItem>
            <MenuItem value="UNKNOWN">Unknown</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Stroke Subtype (Optional)"
          value={formData.strokeSubtype || ''}
          onChange={(e) => updateFormData('strokeSubtype', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Presenting Symptoms"
          multiline
          rows={3}
          value={formData.presentingSymptoms || ''}
          onChange={(e) => updateFormData('presentingSymptoms', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Symptom Onset"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          value={formData.symptomOnset || ''}
          onChange={(e) => updateFormData('symptomOnset', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Last Known Well"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          value={formData.lastKnownWell || ''}
          onChange={(e) => updateFormData('lastKnownWell', e.target.value)}
        />
      </Grid>
    </Grid>
  );
};

export default BasicInformationStep;
