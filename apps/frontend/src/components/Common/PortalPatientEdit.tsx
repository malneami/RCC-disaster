import React, { useState, useEffect } from 'react';
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
import * as yup from 'yup';
import { patientService, Patient } from '../../services/patientService';

// Regex patterns supporting Arabic characters (matching other forms)
const NAME_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z\s\u00C0-\u017F-]+$/;
const ALPHANUMERIC_REGEX = /^[A-Za-z0-9]+$/;
const PHONE_REGEX = /^\+?\d{7,15}$/;

const validationSchema = yup.object({
  firstName: yup
    .string()
    .trim()
    .matches(NAME_REGEX, 'First name can only include letters (including Arabic) and spaces.')
    .required('First Name is required'),
  lastName: yup
    .string()
    .trim()
    .matches(NAME_REGEX, 'Last name can only include letters (including Arabic) and spaces.')
    .required('Last Name is required'),
  nationalId: yup
    .string()
    .trim()
    .matches(ALPHANUMERIC_REGEX, 'National ID can only contain letters and numbers.')
    .required('National ID is required'),
  phoneNumber: yup
    .string()
    .nullable()
    .transform((value) => (value ? value.trim() : ''))
    .test('valid-phone', 'Phone numbers can only include digits and may start with +', (value) => {
      if (!value) return true;
      return PHONE_REGEX.test(value);
    }),
  email: yup
    .string()
    .nullable()
    .transform((value) => (value ? value.trim() : ''))
    .email('Please enter a valid email address'),
  emergencyPhone: yup
    .string()
    .nullable()
    .transform((value) => (value ? value.trim() : ''))
    .test('valid-emergency-phone', 'Emergency phone can only include digits and may start with +', (value) => {
      if (!value) return true;
      return PHONE_REGEX.test(value);
    }),
  emergencyEmail: yup
    .string()
    .nullable()
    .transform((value) => (value ? value.trim() : ''))
    .email('Please enter a valid emergency email address'),
});

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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
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
      setValidationErrors({});
      setError(null);
    }
  }, [patient, open]);

  // Fields that require validation
  const propsForValidation = {
    firstName: true,
    lastName: true,
    nationalId: true,
    phoneNumber: true,
    email: true,
    emergencyPhone: true,
    emergencyEmail: true,
  };

  const validateField = async (field: string, value: any) => {
    try {
      await validationSchema.validateAt(field, { [field]: value });
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    } catch (err: any) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: err.message,
      }));
    }
  };

  const handleInputChange = (field: keyof Patient, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Validate field on change if it requires validation
    if (field in propsForValidation) {
      validateField(field, value);
    }
  };

  const handleSave = async () => {
    if (!patient) return;

    // Validate all fields
    try {
      await validationSchema.validate(formData, { abortEarly: false });
    } catch (err: any) {
      const newErrors: Record<string, string> = {};
      if (err.inner) {
        err.inner.forEach((validationError: any) => {
          if (validationError.path) {
            newErrors[validationError.path] = validationError.message;
          }
        });
      }
      setValidationErrors(newErrors);
      setError('Please correct the validation errors before saving.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedPatient = await patientService.updatePatient(patient.id, formData);
      onPatientUpdated(updatedPatient);
      onClose();
    } catch (err: any) {
      console.error('Error updating patient:', err);
      // Extract specific error message if available
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update patient information. Please try again.';
      setError(errorMessage);
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
              error={!!validationErrors.firstName}
              helperText={validationErrors.firstName}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              disabled={isLoading}
              error={!!validationErrors.lastName}
              helperText={validationErrors.lastName}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="National ID"
              value={formData.nationalId || ''}
              onChange={(e) => handleInputChange('nationalId', e.target.value)}
              disabled={isLoading}
              error={!!validationErrors.nationalId}
              helperText={validationErrors.nationalId}
              required
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
              error={!!validationErrors.phoneNumber}
              helperText={validationErrors.phoneNumber}
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
              error={!!validationErrors.email}
              helperText={validationErrors.email}
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
              error={!!validationErrors.emergencyPhone}
              helperText={validationErrors.emergencyPhone}
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
              error={!!validationErrors.emergencyEmail}
              helperText={validationErrors.emergencyEmail}
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
