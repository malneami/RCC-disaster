import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  InputAdornment,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  LocationCity as CityIcon,
  Public as CountryIcon,
  ContactEmergency as EmergencyIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { CreatePatientData } from '../../../../services/patientService';
import PersonalInfoFormField from './PersonalInfoFormField';

interface ContactInfoStepProps {
  formData: CreatePatientData;
  onDataChange: (data: Partial<CreatePatientData>) => void;
}

const ContactInfoStep: React.FC<ContactInfoStepProps> = ({ formData, onDataChange }) => {
  const handleChange = (field: keyof CreatePatientData, value: any) => {
    onDataChange({ [field]: value });
  };

  const formControlSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      background: '#ffffff',
      transition: 'all 0.3s ease',
      '&:hover': {
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(66, 165, 245, 0.5)',
        },
      },
      '&.Mui-focused': {
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#42a5f5',
          borderWidth: '2px',
        },
        boxShadow: '0 0 0 4px rgba(66, 165, 245, 0.1)',
      },
    },
  };

  return (
    <Box>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(66, 165, 245, 0.25)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(66, 165, 245, 0.3)',
            }}
          >
            <PhoneIcon sx={{ fontSize: '24px' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', fontSize: '1.25rem' }}>
              Contact Information
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem', mt: 0.25 }}>
              Provide contact details and address information
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 600, mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Contact Details
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="Phone Number"
              value={formData.phoneNumber || ''}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              type="tel"
              icon={
                <InputAdornment position="start">
                  <PhoneIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="Email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              type="email"
              icon={
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>

          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 600, mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Address Information
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <PersonalInfoFormField
              fullWidth
              label="Address"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              multiline
              rows={2}
              icon={
                <InputAdornment position="start">
                  <HomeIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="City"
              value={formData.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              icon={
                <InputAdornment position="start">
                  <CityIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="State/Province"
              value={formData.state || ''}
              onChange={(e) => handleChange('state', e.target.value)}
              icon={
                <InputAdornment position="start">
                  <CityIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="ZIP/Postal Code"
              value={formData.zipCode || ''}
              onChange={(e) => handleChange('zipCode', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={formControlSx}>
              <InputLabel>Country</InputLabel>
              <Select
                value={formData.country || 'Saudi Arabia'}
                onChange={(e) => handleChange('country', e.target.value)}
                label="Country"
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <CountryIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                  </InputAdornment>
                }
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
      </Box>

      <Box
        sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(66, 165, 245, 0.25)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ffa726 0%, #ffb74d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(255, 167, 38, 0.3)',
            }}
          >
            <EmergencyIcon sx={{ fontSize: '24px' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', fontSize: '1.25rem' }}>
              Emergency Contact
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem', mt: 0.25 }}>
              Provide emergency contact information
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="Emergency Contact Name"
              value={formData.emergencyContact || ''}
              onChange={(e) => handleChange('emergencyContact', e.target.value)}
              icon={
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="Emergency Phone"
              value={formData.emergencyPhone || ''}
              onChange={(e) => handleChange('emergencyPhone', e.target.value)}
              type="tel"
              icon={
                <InputAdornment position="start">
                  <PhoneIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="Emergency Email"
              value={formData.emergencyEmail || ''}
              onChange={(e) => handleChange('emergencyEmail', e.target.value)}
              type="email"
              icon={
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={formControlSx}>
              <InputLabel>Relationship</InputLabel>
              <Select
                value={formData.emergencyRelationship || ''}
                onChange={(e) => handleChange('emergencyRelationship', e.target.value)}
                label="Relationship"
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <PersonIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                  </InputAdornment>
                }
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
    </Box>
  );
};

export default ContactInfoStep;
