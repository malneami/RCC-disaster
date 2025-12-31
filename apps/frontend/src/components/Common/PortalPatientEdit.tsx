import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import { Save, Cancel, Person } from '@mui/icons-material';
import { patientService, Patient } from '../../services/patientService';

interface PortalPatientEditProps {
  open: boolean;
  onClose: () => void;
  patient: Patient | null;
  portalType: 'stroke' | 'trauma' | 'stemi';
  onPatientUpdated: (updatedPatient: Patient) => void;
}

export const PortalPatientEdit: React.FC<PortalPatientEditProps> = ({
  open,
  onClose,
  patient,
  portalType,
  onPatientUpdated,
}) => {
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName,
        lastName: patient.lastName,
        nationalId: patient.nationalId,
        mrn: patient.mrn,
        phoneNumber: patient.phoneNumber,
        email: patient.email,
        address: patient.address,
        city: patient.city,
        state: patient.state,
        zipCode: patient.zipCode,
        country: patient.country,
        emergencyContact: patient.emergencyContact,
        emergencyPhone: patient.emergencyPhone,
        emergencyEmail: patient.emergencyEmail,
        emergencyRelationship: patient.emergencyRelationship,
      });
    }
  }, [patient]);

  const handleInputChange = (field: keyof Patient, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!patient) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedPatient = await patientService.updatePatient(patient.id, formData);
      onPatientUpdated(updatedPatient);
      onClose();
    } catch (err) {
      console.error('Error updating patient:', err);
      setError('Failed to update patient information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPortalColor = () => {
    switch (portalType) {
      case 'stroke': return '#1976d2';
      case 'trauma': return '#d32f2f';
      case 'stemi': return '#388e3c';
      default: return '#1976d2';
    }
  };

  const getPortalIcon = () => {
    switch (portalType) {
      case 'stroke': return '🧠';
      case 'trauma': return '🚑';
      case 'stemi': return '❤️';
      default: return '🏥';
    }
  };

  if (!patient) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Person sx={{ color: getPortalColor() }} />
          <Typography variant="h6">
            Edit Patient Information
          </Typography>
          <Chip
            label={`${getPortalIcon()} ${portalType.toUpperCase()} Portal`}
            size="small"
            sx={{
              backgroundColor: getPortalColor(),
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Portal-Specific Editing:</strong> You can only edit contact and emergency information
            from the {portalType.toUpperCase()} portal. Medical history, clinical data, and other sensitive
            information can only be modified by authorized medical staff.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ color: getPortalColor() }}>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName || ''}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="National ID"
              value={formData.nationalId || ''}
              onChange={(e) => handleInputChange('nationalId', e.target.value)}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Medical Record Number (MRN)"
              value={formData.mrn || ''}
              onChange={(e) => handleInputChange('mrn', e.target.value)}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : ''}
              disabled
              helperText="Date of Birth cannot be edited here"
            />
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ color: getPortalColor(), mt: 2 }}>
              Contact Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phoneNumber || ''}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="City"
              value={formData.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="State"
              value={formData.state || ''}
              onChange={(e) => handleInputChange('state', e.target.value)}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="ZIP Code"
              value={formData.zipCode || ''}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              disabled={isLoading}
            />
          </Grid>

          {/* Emergency Contact */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ color: getPortalColor(), mt: 2 }}>
              Emergency Contact
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Emergency Contact Name"
              value={formData.emergencyContact || ''}
              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Emergency Contact Phone"
              value={formData.emergencyPhone || ''}
              onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Emergency Contact Email"
              type="email"
              value={formData.emergencyEmail || ''}
              onChange={(e) => handleInputChange('emergencyEmail', e.target.value)}
              disabled={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Relationship to Patient"
              value={formData.emergencyRelationship || ''}
              onChange={(e) => handleInputChange('emergencyRelationship', e.target.value)}
              disabled={isLoading}
            />
          </Grid>

          {/* Read-only Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ color: getPortalColor(), mt: 2 }}>
              Read-Only Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : ''}
              disabled
              helperText="Contact medical staff to update"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Gender"
              value={patient.gender}
              disabled
              helperText="Contact medical staff to update"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          startIcon={<Cancel />}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save />}
          disabled={isLoading}
          sx={{
            backgroundColor: getPortalColor(),
            '&:hover': {
              backgroundColor: getPortalColor(),
              opacity: 0.9,
            },
          }}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog >
  );
};

export default PortalPatientEdit;
