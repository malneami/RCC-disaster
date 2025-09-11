import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import { Patient, CreatePatientData, patientService } from '../../services/patientService';

interface PatientFormProps {
  patient?: Patient | null;
  onPatientCreated?: (patient: Patient) => void;
  onPatientUpdated?: (patient: Patient) => void;
  onCancel: () => void;
  compact?: boolean; // For use in modals/dialogs
  showActions?: boolean; // Whether to show action buttons
}

const PatientForm: React.FC<PatientFormProps> = ({
  patient,
  onPatientCreated,
  onPatientUpdated,
  onCancel,
  compact = false,
  showActions = true,
}) => {
  const [formData, setFormData] = useState<CreatePatientData>({
    firstName: '',
    lastName: '',
    age: undefined,
    gender: 'UNKNOWN',
    privacyLevel: 'PRIVATE',
    consentGiven: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with patient data if editing
  useEffect(() => {
    if (patient) {
      setFormData({
        mrn: patient.mrn || '',
        nationalId: patient.nationalId || '',
        firstName: patient.firstName,
        lastName: patient.lastName,
        middleName: patient.middleName || '',
        age: patient.age || undefined,
        gender: patient.gender,
        maritalStatus: patient.maritalStatus || 'UNKNOWN',
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
        weight: patient.weight,
        height: patient.height,
        privacyLevel: patient.privacyLevel,
        consentGiven: patient.consentGiven,
        dataRetentionPolicy: patient.dataRetentionPolicy || '',
      });
    }
  }, [patient]);

  const handleInputChange = (field: keyof CreatePatientData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.age || formData.age < 0 || formData.age > 150) {
      setError('Age is required and must be between 0 and 150');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare form data for submission
      const formDataForSubmission = {
        ...formData,
        insuranceExpiry: formData.insuranceExpiry ? new Date(formData.insuranceExpiry).toISOString() : undefined,
      };

      if (patient) {
        // Update existing patient
        const updatedPatient = await patientService.updatePatient(patient.id, formDataForSubmission);
        onPatientUpdated?.(updatedPatient);
      } else {
        // Create new patient
        const newPatient = await patientService.createPatient(formDataForSubmission);
        onPatientCreated?.(newPatient);
      }
    } catch (error) {
      console.error('Error saving patient:', error);
      setError('Failed to save patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

    const renderBasicInfo = () => (
    <Card>
      <CardHeader title="Basic Information" />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="First Name *"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Last Name *"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Middle Name"
              value={formData.middleName}
              onChange={(e) => handleInputChange('middleName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Age *"
              type="number"
              value={formData.age || ''}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value) || undefined)}
              inputProps={{ min: 0, max: 150 }}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Gender *</InputLabel>
              <Select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                label="Gender *"
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
              label="National ID"
              value={formData.nationalId}
              onChange={(e) => handleInputChange('nationalId', e.target.value)}
              placeholder="Saudi National ID"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Medical Record Number (MRN)"
              value={formData.mrn}
              onChange={(e) => handleInputChange('mrn', e.target.value)}
            />
          </Grid>
          {!compact && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Marital Status</InputLabel>
                <Select
                  value={formData.maritalStatus}
                  onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                  label="Marital Status"
                >
                  <MenuItem value="SINGLE">Single</MenuItem>
                  <MenuItem value="MARRIED">Married</MenuItem>
                  <MenuItem value="DIVORCED">Divorced</MenuItem>
                  <MenuItem value="WIDOWED">Widowed</MenuItem>
                  <MenuItem value="SEPARATED">Separated</MenuItem>
                  <MenuItem value="UNKNOWN">Unknown</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderContactInfo = () => (
    <Card>
      <CardHeader title="Contact Information" />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </Grid>
          {!compact && (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="State/Province"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Country</InputLabel>
                  <Select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    label="Country"
                  >
                    <MenuItem value="Saudi Arabia">Saudi Arabia</MenuItem>
                    <MenuItem value="United Arab Emirates">United Arab Emirates</MenuItem>
                    <MenuItem value="Kuwait">Kuwait</MenuItem>
                    <MenuItem value="Qatar">Qatar</MenuItem>
                    <MenuItem value="Bahrain">Bahrain</MenuItem>
                    <MenuItem value="Oman">Oman</MenuItem>
                    <MenuItem value="Jordan">Jordan</MenuItem>
                    <MenuItem value="Egypt">Egypt</MenuItem>
                    <MenuItem value="Lebanon">Lebanon</MenuItem>
                    <MenuItem value="Syria">Syria</MenuItem>
                    <MenuItem value="Iraq">Iraq</MenuItem>
                    <MenuItem value="Yemen">Yemen</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderEmergencyContacts = () => (
    <Card>
      <CardHeader title="Emergency Contacts" />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Emergency Contact Name"
              value={formData.emergencyContact}
              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Emergency Contact Phone"
              value={formData.emergencyPhone}
              onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
            />
          </Grid>
          {!compact && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Email"
                  type="email"
                  value={formData.emergencyEmail}
                  onChange={(e) => handleInputChange('emergencyEmail', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Relationship</InputLabel>
                  <Select
                    value={formData.emergencyRelationship}
                    onChange={(e) => handleInputChange('emergencyRelationship', e.target.value)}
                    label="Relationship"
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="SPOUSE">Spouse</MenuItem>
                    <MenuItem value="PARENT">Parent</MenuItem>
                    <MenuItem value="CHILD">Child</MenuItem>
                    <MenuItem value="SIBLING">Sibling</MenuItem>
                    <MenuItem value="GRANDPARENT">Grandparent</MenuItem>
                    <MenuItem value="GUARDIAN">Guardian</MenuItem>
                    <MenuItem value="FRIEND">Friend</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderMedicalInfo = () => (
    <Card>
      <CardHeader title="Medical Information" />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Blood Type</InputLabel>
              <Select
                value={formData.bloodType}
                onChange={(e) => handleInputChange('bloodType', e.target.value)}
                label="Blood Type"
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="A+">A+</MenuItem>
                <MenuItem value="A-">A-</MenuItem>
                <MenuItem value="B+">B+</MenuItem>
                <MenuItem value="B-">B-</MenuItem>
                <MenuItem value="AB+">AB+</MenuItem>
                <MenuItem value="AB-">AB-</MenuItem>
                <MenuItem value="O+">O+</MenuItem>
                <MenuItem value="O-">O-</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {!compact && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>RH Factor</InputLabel>
                <Select
                  value={formData.rhFactor}
                  onChange={(e) => handleInputChange('rhFactor', e.target.value)}
                  label="RH Factor"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="POSITIVE">Positive</MenuItem>
                  <MenuItem value="NEGATIVE">Negative</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
          {!compact && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Weight (kg)"
                  type="number"
                  value={formData.weight || ''}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || undefined)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Height (cm)"
                  type="number"
                  value={formData.height || ''}
                  onChange={(e) => handleInputChange('height', parseFloat(e.target.value) || undefined)}
                />
              </Grid>
            </>
          )}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Allergies"
              value={formData.allergies}
              onChange={(e) => handleInputChange('allergies', e.target.value)}
              multiline
              rows={2}
              placeholder="List any known allergies"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Current Medications"
              value={formData.medications}
              onChange={(e) => handleInputChange('medications', e.target.value)}
              multiline
              rows={2}
              placeholder="List current medications"
            />
          </Grid>
          {!compact && (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Medical History"
                  value={formData.medicalHistory}
                  onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                  multiline
                  rows={3}
                  placeholder="Relevant medical history"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Risk Factors"
                  value={formData.riskFactors}
                  onChange={(e) => handleInputChange('riskFactors', e.target.value)}
                  multiline
                  rows={2}
                  placeholder="Known risk factors"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chronic Conditions"
                  value={formData.chronicConditions}
                  onChange={(e) => handleInputChange('chronicConditions', e.target.value)}
                  multiline
                  rows={2}
                  placeholder="Chronic medical conditions"
                />
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderPrivacyInfo = () => (
    <Card>
      <CardHeader title="Privacy and Consent" />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Privacy Level</InputLabel>
              <Select
                value={formData.privacyLevel}
                onChange={(e) => handleInputChange('privacyLevel', e.target.value)}
                label="Privacy Level"
              >
                <MenuItem value="PUBLIC">Public</MenuItem>
                <MenuItem value="INTERNAL">Internal</MenuItem>
                <MenuItem value="PRIVATE">Private</MenuItem>
                <MenuItem value="RESTRICTED">Restricted</MenuItem>
                <MenuItem value="CONFIDENTIAL">Confidential</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.consentGiven || false}
                  onChange={(e) => handleInputChange('consentGiven', e.target.checked)}
                />
              }
              label="Consent Given for Data Processing"
            />
          </Grid>
          {!compact && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Data Retention Policy"
                value={formData.dataRetentionPolicy}
                onChange={(e) => handleInputChange('dataRetentionPolicy', e.target.value)}
                placeholder="Data retention policy notes"
              />
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ py: compact ? 1 : 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={compact ? 2 : 3}>
        {renderBasicInfo()}
        {renderContactInfo()}
        {renderEmergencyContacts()}
        {renderMedicalInfo()}
        {renderPrivacyInfo()}
      </Grid>

      {showActions && (
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Saving...' : (patient ? 'Update Patient' : 'Create Patient')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PatientForm;
