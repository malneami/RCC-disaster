import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  InputAdornment,
} from '@mui/material';
import {
  HealthAndSafety as InsuranceIcon,
  Lock as PrivacyIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { CreatePatientData } from '../../../../services/patientService';
import PersonalInfoFormField from './PersonalInfoFormField';

interface InsurancePrivacyStepProps {
  formData: CreatePatientData;
  onDataChange: (data: Partial<CreatePatientData>) => void;
}

const InsurancePrivacyStep: React.FC<InsurancePrivacyStepProps> = ({ formData, onDataChange }) => {
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
              background: 'linear-gradient(135deg, #66bb6a 0%, #81c784 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(102, 187, 106, 0.3)',
            }}
          >
            <InsuranceIcon sx={{ fontSize: '24px' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', fontSize: '1.25rem' }}>
              Insurance Information
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem', mt: 0.25 }}>
              Provide insurance details
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="Insurance Provider"
              value={formData.insuranceProvider || ''}
              onChange={(e) => handleChange('insuranceProvider', e.target.value)}
              icon={
                <InputAdornment position="start">
                  <InsuranceIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="Policy Number"
              value={formData.insuranceNumber || ''}
              onChange={(e) => handleChange('insuranceNumber', e.target.value)}
              icon={
                <InputAdornment position="start">
                  <InsuranceIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="Group Number"
              value={formData.insuranceGroup || ''}
              onChange={(e) => handleChange('insuranceGroup', e.target.value)}
              icon={
                <InputAdornment position="start">
                  <InsuranceIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="Insurance Expiry Date"
              type="date"
              value={formData.insuranceExpiry || ''}
              onChange={(e) => handleChange('insuranceExpiry', e.target.value)}
              InputLabelProps={{ shrink: true }}
              icon={
                <InputAdornment position="start">
                  <CalendarIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
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
              background: 'linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(66, 165, 245, 0.3)',
            }}
          >
            <PrivacyIcon sx={{ fontSize: '24px' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', fontSize: '1.25rem' }}>
              Privacy & Consent
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem', mt: 0.25 }}>
              Set privacy levels and consent preferences
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={formControlSx}>
              <InputLabel>Privacy Level</InputLabel>
              <Select
                value={formData.privacyLevel || 'PRIVATE'}
                onChange={(e) => handleChange('privacyLevel', e.target.value)}
                label="Privacy Level"
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <PrivacyIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="PUBLIC">Public</MenuItem>
                <MenuItem value="INTERNAL">Internal</MenuItem>
                <MenuItem value="PRIVATE">Private</MenuItem>
                <MenuItem value="RESTRICTED">Restricted</MenuItem>
                <MenuItem value="CONFIDENTIAL">Confidential</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="Data Retention Policy"
              value={formData.dataRetentionPolicy || ''}
              onChange={(e) => handleChange('dataRetentionPolicy', e.target.value)}
              placeholder="e.g., 7 years, lifetime, etc."
              icon={
                <InputAdornment position="start">
                  <InfoIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.08) 0%, rgba(100, 181, 246, 0.08) 100%)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(66, 165, 245, 0.2)',
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.consentGiven || false}
                    onChange={(e) => handleChange('consentGiven', e.target.checked)}
                    sx={{
                      color: '#42a5f5',
                      '&.Mui-checked': {
                        color: '#42a5f5',
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.875rem' }}>
                    Patient has given consent for data processing and sharing
                  </Typography>
                }
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Box
        sx={{
          mt: 2,
          p: 2.5,
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(66, 165, 245, 0.08) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(33, 150, 243, 0.25)',
          boxShadow: '0 2px 8px rgba(33, 150, 243, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <InfoIcon sx={{ color: '#2196f3', fontSize: '20px', mt: 0.25 }} />
          <Typography variant="body2" sx={{ color: '#1976d2', fontSize: '0.875rem', lineHeight: 1.6 }}>
            <strong>Privacy Notice:</strong> All patient information is protected under HIPAA regulations. Access to this data is logged and monitored for security purposes. By proceeding, you confirm that you have the necessary authorization to view and modify this patient's information.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default InsurancePrivacyStep;
