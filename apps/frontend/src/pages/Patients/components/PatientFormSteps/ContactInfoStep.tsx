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
import { CreatePatientData } from '../../../../services/patientService';

interface ContactInfoStepProps {
  formData: CreatePatientData;
  onDataChange: (data: Partial<CreatePatientData>) => void;
}

const ContactInfoStep: React.FC<ContactInfoStepProps> = ({ formData, onDataChange }) => {
  const handleChange = (field: keyof CreatePatientData, value: any) => {
    onDataChange({ [field]: value });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Contact Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please provide the patient's contact details and address information.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phoneNumber || ''}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            type="tel"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            type="email"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            value={formData.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            multiline
            rows={2}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="City"
            value={formData.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="State/Province"
            value={formData.state || ''}
            onChange={(e) => handleChange('state', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="ZIP/Postal Code"
            value={formData.zipCode || ''}
            onChange={(e) => handleChange('zipCode', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Country</InputLabel>
            <Select
              value={formData.country || 'Saudi Arabia'}
              onChange={(e) => handleChange('country', e.target.value)}
              label="Country"
            >
              <MenuItem value="Saudi Arabia">Saudi Arabia</MenuItem>
              <MenuItem value="United States">United States</MenuItem>
              <MenuItem value="United Kingdom">United Kingdom</MenuItem>
              <MenuItem value="Canada">Canada</MenuItem>
              <MenuItem value="Australia">Australia</MenuItem>
              <MenuItem value="Germany">Germany</MenuItem>
              <MenuItem value="France">France</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Emergency Contact
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please provide emergency contact information.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Emergency Contact Name"
            value={formData.emergencyContact || ''}
            onChange={(e) => handleChange('emergencyContact', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Emergency Phone"
            value={formData.emergencyPhone || ''}
            onChange={(e) => handleChange('emergencyPhone', e.target.value)}
            type="tel"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Emergency Email"
            value={formData.emergencyEmail || ''}
            onChange={(e) => handleChange('emergencyEmail', e.target.value)}
            type="email"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Relationship</InputLabel>
            <Select
              value={formData.emergencyRelationship || ''}
              onChange={(e) => handleChange('emergencyRelationship', e.target.value)}
              label="Relationship"
            >
              <MenuItem value="SPOUSE">Spouse</MenuItem>
              <MenuItem value="PARENT">Parent</MenuItem>
              <MenuItem value="CHILD">Child</MenuItem>
              <MenuItem value="SIBLING">Sibling</MenuItem>
              <MenuItem value="FRIEND">Friend</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContactInfoStep;
