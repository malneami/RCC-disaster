import React from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { format } from 'date-fns';

import PatientSelector from '../../../../components/Common/PatientSelector';
import { Patient } from '../../../../services/patientService';

interface PatientInformationSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
  isAdmin?: boolean;
  strokeCase?: any; // The current stroke case being edited
}

const PatientInformationSection: React.FC<PatientInformationSectionProps> = ({
  formData,
  handleInputChange,
  isAdmin = false,
  strokeCase,
}) => {
  const currentPatient = strokeCase?.patient;

  const handlePatientChange = (patient: Patient | null) => {
    // Update the stroke case to reference the new patient
    // This would require updating the stroke case's patientId
    // For now, we'll just show the patient information
    console.log('Patient changed:', patient);
  };

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Patient Information
        </Typography>
      </Grid>

      {/* Patient Selection */}
      <Grid item xs={12}>
        <PatientSelector
          value={currentPatient}
          onChange={handlePatientChange}
          label="Select Patient"
          helperText="Search for an existing patient or create a new one"
          compact={true}
        />
      </Grid>

      {/* Current Patient Information Display */}
      {currentPatient && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6">
                  {currentPatient.firstName} {currentPatient.lastName}
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>National ID:</strong> {currentPatient.nationalId || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>MRN:</strong> {currentPatient.mrn || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Date of Birth:</strong> {currentPatient.dateOfBirth ? format(new Date(currentPatient.dateOfBirth), 'MMM dd, yyyy') : 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Gender:</strong> 
                    <Chip 
                      label={currentPatient.gender} 
                      size="small" 
                      sx={{ ml: 1 }}
                      color={currentPatient.gender === 'UNKNOWN' ? 'default' : 'primary'}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Phone:</strong> {currentPatient.phoneNumber || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Email:</strong> {currentPatient.email || 'Not provided'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Note about patient editing */}
      <Grid item xs={12}>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          <strong>Note:</strong> Patient information should be updated through the Patient Management system. 
          Changes to patient details will not be saved through this stroke case edit form.
        </Typography>
      </Grid>
    </>
  );
};

export default PatientInformationSection;
