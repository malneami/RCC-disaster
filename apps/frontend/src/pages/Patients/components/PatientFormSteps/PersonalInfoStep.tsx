import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import { CreatePatientData, Patient } from '../../../../services/patientService';
import NationalIdInput from '../../../../components/common/NationalIdInput';

interface PersonalInfoStepProps {
  formData: CreatePatientData;
  onDataChange: (data: Partial<CreatePatientData>) => void;
  onViewDuplicate?: (patient: Patient) => void;
  onPatientSelected?: (patient: Patient) => void; // New callback for when patient is selected from suggestions
  isEditing?: boolean; // Add this prop to indicate if we're editing
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ formData, onDataChange, onViewDuplicate, onPatientSelected, isEditing = false }) => {
  const handleChange = (field: keyof CreatePatientData, value: any) => {
    onDataChange({ [field]: value });
  };

  const handlePatientSelect = (patient: Patient) => {
    // Auto-fill form with selected patient data
    onDataChange({
      firstName: patient.firstName,
      lastName: patient.lastName,
      nationalId: patient.nationalId,
      mrn: patient.mrn,
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
      gender: patient.gender,
      phoneNumber: patient.phoneNumber || '',
      email: patient.email || '',
      address: patient.address || '',
      city: patient.city || '',
      state: patient.state || '',
      zipCode: patient.zipCode || '',
      country: patient.country || 'Saudi Arabia',
      emergencyContact: patient.emergencyContact || '',
      emergencyPhone: patient.emergencyPhone || '',
      emergencyEmail: patient.emergencyEmail || '',
      emergencyRelationship: patient.emergencyRelationship || '',
      insuranceProvider: patient.insuranceProvider || '',
      insuranceNumber: patient.insuranceNumber || '',
      insuranceGroup: patient.insuranceGroup || '',
      insuranceExpiry: patient.insuranceExpiry ? new Date(patient.insuranceExpiry).toISOString().split('T')[0] : '',
      bloodType: patient.bloodType || '',
      rhFactor: patient.rhFactor || '',
      allergies: patient.allergies || '',
      medications: patient.medications || '',
      medicalHistory: patient.medicalHistory || '',
      riskFactors: patient.riskFactors || '',
      chronicConditions: patient.chronicConditions || '',
      weight: patient.weight || undefined,
      height: patient.height || undefined,
      privacyLevel: patient.privacyLevel,
      consentGiven: patient.consentGiven,
    });
    
    // Notify parent component that a patient was selected for editing
    onPatientSelected?.(patient);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Personal Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please provide the patient's basic personal information. The system will automatically check for existing patients using the National ID 
        and prevent duplicate patient creation across all hospitals.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            value={formData.firstName || ''}
            onChange={(e) => handleChange('firstName', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            value={formData.lastName || ''}
            onChange={(e) => handleChange('lastName', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Middle Name"
            value={formData.middleName || ''}
            onChange={(e) => handleChange('middleName', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth || ''}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            required
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Gender</InputLabel>
            <Select
              value={formData.gender || 'UNKNOWN'}
              onChange={(e) => handleChange('gender', e.target.value)}
              label="Gender"
            >
              <MenuItem value="MALE">Male</MenuItem>
              <MenuItem value="FEMALE">Female</MenuItem>
              <MenuItem value="UNKNOWN">Unknown</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Marital Status</InputLabel>
            <Select
              value={formData.maritalStatus || 'UNKNOWN'}
              onChange={(e) => handleChange('maritalStatus', e.target.value)}
              label="Marital Status"
            >
              <MenuItem value="SINGLE">Single</MenuItem>
              <MenuItem value="MARRIED">Married</MenuItem>
              <MenuItem value="DIVORCED">Divorced</MenuItem>
              <MenuItem value="WIDOWED">Widowed</MenuItem>
              <MenuItem value="UNKNOWN">Unknown</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <NationalIdInput
            value={formData.nationalId || ''}
            onChange={(value) => handleChange('nationalId', value)}
            onPatientSelect={handlePatientSelect}
            label="National ID"
            required
            portalType="patient"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="MRN (Medical Record Number)"
            value={formData.mrn || ''}
            onChange={(e) => handleChange('mrn', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default PersonalInfoStep;
