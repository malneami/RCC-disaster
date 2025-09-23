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
  Divider,
} from '@mui/material';

import { CreateStrokeCaseData } from '../../../../services/strokeService';
import { hospitalService, Hospital } from '../../../../services/hospitalService';
import NationalIdInput from '../../../../components/Common/NationalIdInput';
import PortalPatientEdit from '../../../../components/Common/PortalPatientEdit';
import { Patient } from '../../../../services/patientService';

interface PatientInformationStepProps {
  formData: CreateStrokeCaseData;
  updateFormData: (field: keyof CreateStrokeCaseData, value: any) => void;
}

const PatientStep: React.FC<PatientInformationStepProps> = ({
  formData,
  updateFormData,
}) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [hospitalError, setHospitalError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editPatientDialogOpen, setEditPatientDialogOpen] = useState(false);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoadingHospitals(true);
        const hospitalsData = await hospitalService.getAllHospitals();
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
    
    updateFormData('patientId', patient.id);
    updateFormData('patientInfo', {
      firstName: patient.firstName,
      lastName: patient.lastName,
      nationalId: patient.nationalId,
      mrn: patient.mrn,
      age: patient.age || undefined,
      gender: patient.gender,
      phoneNumber: patient.phoneNumber || '',
      email: patient.email || '',
    });
  };

  const handlePatientUpdate = (updatedPatient: Patient) => {
    setSelectedPatient(updatedPatient);
    
    updateFormData('patientInfo', {
      firstName: updatedPatient.firstName,
      lastName: updatedPatient.lastName,
      nationalId: updatedPatient.nationalId,
      mrn: updatedPatient.mrn,
      age: updatedPatient.age || undefined,
      gender: updatedPatient.gender,
      phoneNumber: updatedPatient.phoneNumber || '',
      email: updatedPatient.email || '',
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
    <Grid container spacing={3}>
      {/* Patient Information Section */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Patient Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter patient details below. The system will automatically check for existing patients using the National ID.
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
          portalType="stroke"
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
          label="Age"
          type="number"
          inputProps={{ min: 0, max: 150 }}
          value={formData.patientInfo?.age || ''}
          onChange={(e) => updateFormData('patientInfo', { 
            ...formData.patientInfo, 
            age: parseInt(e.target.value) || undefined 
          })}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Gender</InputLabel>
          <Select
            value={formData.patientInfo?.gender || ''}
            onChange={(e) => updateFormData('patientInfo', { 
              ...formData.patientInfo, 
              gender: e.target.value 
            })}
          >
            <MenuItem value="MALE">Male</MenuItem>
            <MenuItem value="FEMALE">Female</MenuItem>
            <MenuItem value="UNKNOWN">Unknown</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone Number"
          value={formData.patientInfo?.phoneNumber || ''}
          onChange={(e) => updateFormData('patientInfo', { 
            ...formData.patientInfo, 
            phoneNumber: e.target.value 
          })}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Email"
          value={formData.patientInfo?.email || ''}
          onChange={(e) => updateFormData('patientInfo', { 
            ...formData.patientInfo, 
            email: e.target.value 
          })}
        />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
      </Grid>

      {/* Hospital Information Section */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Hospital Information
        </Typography>
      </Grid>
      
      <Grid item xs={12} sm={6}>
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
      <Grid item xs={12} sm={6}>
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
        <FormControl fullWidth>
          <InputLabel>Mode of Arrival</InputLabel>
          <Select
            value={formData.modeOfArrival || ''}
            onChange={(e) => updateFormData('modeOfArrival', e.target.value)}
          >
            <MenuItem value="AMBULANCE">Ambulance</MenuItem>
            <MenuItem value="PRIVATE_VEHICLE">Private Vehicle</MenuItem>
            <MenuItem value="AIR_TRANSPORT">Air Transport</MenuItem>
            <MenuItem value="WALK_IN">Walk In</MenuItem>
            <MenuItem value="POLICE">Police</MenuItem>
            <MenuItem value="TRANSFERRED_FROM_HOSPITAL">Transferred from Hospital</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
          </Select>
        </FormControl>
      </Grid>


      {/* Patient Edit Dialog */}
      <PortalPatientEdit
        open={editPatientDialogOpen}
        onClose={() => setEditPatientDialogOpen(false)}
        patient={selectedPatient}
        portalType="stroke"
        onPatientUpdated={handlePatientUpdate}
      />
    </Grid>
  );
};

export default PatientStep;
