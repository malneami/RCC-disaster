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

  if (hospitalError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {hospitalError}
      </Alert>
    );
  }

  return (
    <Grid container spacing={2}>
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
        <TextField
          fullWidth
          label="National ID"
          value={formData.patientInfo?.nationalId || ''}
          onChange={(e) => updateFormData('patientInfo', { 
            ...formData.patientInfo, 
            nationalId: e.target.value 
          })}
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
