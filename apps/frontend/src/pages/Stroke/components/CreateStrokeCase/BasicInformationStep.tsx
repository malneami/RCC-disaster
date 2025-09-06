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
} from '@mui/material';

import { CreateStrokeCaseData, StrokeType } from '../../../../services/strokeService';
import { hospitalService, Hospital } from '../../../../services/hospitalService';
import NationalIdInput from '../../../../components/Common/NationalIdInput';
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

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    
    // Auto-fill form with selected patient data
    updateFormData('patientId', patient.id);
    updateFormData('patientInfo', {
      firstName: patient.firstName,
      lastName: patient.lastName,
      nationalId: patient.nationalId,
      mrn: patient.mrn,
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
      gender: patient.gender,
      phoneNumber: patient.phoneNumber || '',
      email: patient.email || '',
    });
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
      {/* Patient Information */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Patient Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter patient details below. The system will automatically check for existing patients using the National ID 
          and prevent duplicate patient creation across all hospitals.
        </Typography>
      </Grid>

      {/* Selected Patient Display */}
      {selectedPatient && (
        <Grid item xs={12}>
          <Box sx={{ 
            p: 2, 
            border: '2px solid', 
            borderColor: 'success.main', 
            borderRadius: 2, 
            bgcolor: 'success.light', 
            color: 'success.contrastText' 
          }}>
            <Typography variant="h6" gutterBottom>
              ✅ Existing Patient Selected: {selectedPatient.firstName} {selectedPatient.lastName}
            </Typography>
            <Typography variant="body2">
              Patient information has been auto-filled. You can modify the details below if needed.
            </Typography>
          </Box>
        </Grid>
      )}
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Patient Name"
          value={formData.patientInfo?.firstName || ''}
          onChange={(e) => updateFormData('patientInfo', { 
            ...formData.patientInfo, 
            firstName: e.target.value 
          })}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Patient Last Name"
          value={formData.patientInfo?.lastName || ''}
          onChange={(e) => updateFormData('patientInfo', { 
            ...formData.patientInfo, 
            lastName: e.target.value 
          })}
          required
        />
      </Grid>
        <Grid item xs={12} sm={6}>
          <NationalIdInput
            value={formData.patientInfo?.nationalId || ''}
            onChange={(value) => updateFormData('patientInfo', { 
              ...formData.patientInfo, 
              nationalId: value 
            })}
            onPatientSelect={handlePatientSelect}
            label="National ID"
            required
          />
        </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Medical Record Number (MRN)"
          value={formData.patientInfo?.mrn || ''}
          onChange={(e) => updateFormData('patientInfo', { 
            ...formData.patientInfo, 
            mrn: e.target.value 
          })}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Birth Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={formData.patientInfo?.dateOfBirth || ''}
          onChange={(e) => updateFormData('patientInfo', { 
            ...formData.patientInfo, 
            dateOfBirth: e.target.value 
          })}
          required
        />
      </Grid>
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
                      {hospital.hasThrombolysis && (
                        <Typography variant="caption" color="info.main">
                          Thrombolysis
                        </Typography>
                      )}
                      {hospital.hasThrombectomy && (
                        <Typography variant="caption" color="warning.main">
                          Thrombectomy
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
                      {hospital.hasThrombolysis && (
                        <Typography variant="caption" color="info.main">
                          Thrombolysis
                        </Typography>
                      )}
                      {hospital.hasThrombectomy && (
                        <Typography variant="caption" color="warning.main">
                          Thrombectomy
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
