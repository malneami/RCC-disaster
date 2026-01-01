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
  LocalHospital as MedicalIcon,
  Favorite as BloodIcon,
  MonitorWeight as WeightIcon,
  Height as HeightIcon,
  Warning as AllergyIcon,
  Medication as MedicationIcon,
  HealthAndSafety as HealthIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { CreatePatientData } from '../../../../services/patientService';
import PersonalInfoFormField from './PersonalInfoFormField';

interface MedicalInfoStepProps {
  formData: CreatePatientData;
  onDataChange: (data: Partial<CreatePatientData>) => void;
}

const MedicalInfoStep: React.FC<MedicalInfoStepProps> = ({ formData, onDataChange }) => {
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
              background: 'linear-gradient(135deg, #ef5350 0%, #e57373 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(239, 83, 80, 0.3)',
            }}
          >
            <MedicalIcon sx={{ fontSize: '24px' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', fontSize: '1.25rem' }}>
              Medical Information
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem', mt: 0.25 }}>
              Provide medical details and history
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 600, mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Vital Information
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={formControlSx}>
              <InputLabel>Blood Type</InputLabel>
              <Select
                value={formData.bloodType || ''}
                onChange={(e) => handleChange('bloodType', e.target.value)}
                label="Blood Type"
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <BloodIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="A+">A+</MenuItem>
                <MenuItem value="A-">A-</MenuItem>
                <MenuItem value="B+">B+</MenuItem>
                <MenuItem value="B-">B-</MenuItem>
                <MenuItem value="AB+">AB+</MenuItem>
                <MenuItem value="AB-">AB-</MenuItem>
                <MenuItem value="O+">O+</MenuItem>
                <MenuItem value="O-">O-</MenuItem>
                <MenuItem value="UNKNOWN">Unknown</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={formControlSx}>
              <InputLabel>RH Factor</InputLabel>
              <Select
                value={formData.rhFactor || ''}
                onChange={(e) => handleChange('rhFactor', e.target.value)}
                label="RH Factor"
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <BloodIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="POSITIVE">Positive</MenuItem>
                <MenuItem value="NEGATIVE">Negative</MenuItem>
                <MenuItem value="UNKNOWN">Unknown</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="Weight (kg)"
              type="number"
              value={formData.weight || ''}
              onChange={(e) => handleChange('weight', parseFloat(e.target.value) || null)}
              inputProps={{ min: 0, step: 0.1 }}
              icon={
                <InputAdornment position="start">
                  <WeightIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PersonalInfoFormField
              fullWidth
              label="Height (cm)"
              type="number"
              value={formData.height || ''}
              onChange={(e) => handleChange('height', parseFloat(e.target.value) || null)}
              inputProps={{ min: 0, step: 0.1 }}
              icon={
                <InputAdornment position="start">
                  <HeightIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>

          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 600, mb: 1.5, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Medical History
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <PersonalInfoFormField
              fullWidth
              label="Allergies"
              value={formData.allergies || ''}
              onChange={(e) => handleChange('allergies', e.target.value)}
              multiline
              rows={2}
              placeholder="Enter allergies separated by commas"
              icon={
                <InputAdornment position="start">
                  <AllergyIcon sx={{ color: '#ffa726', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12}>
            <PersonalInfoFormField
              fullWidth
              label="Current Medications"
              value={formData.medications || ''}
              onChange={(e) => handleChange('medications', e.target.value)}
              multiline
              rows={2}
              placeholder="Enter current medications separated by commas"
              icon={
                <InputAdornment position="start">
                  <MedicationIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12}>
            <PersonalInfoFormField
              fullWidth
              label="Risk Factors"
              value={formData.riskFactors || ''}
              onChange={(e) => handleChange('riskFactors', e.target.value)}
              multiline
              rows={2}
              placeholder="Enter risk factors separated by commas"
              icon={
                <InputAdornment position="start">
                  <HealthIcon sx={{ color: '#ef5350', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12}>
            <PersonalInfoFormField
              fullWidth
              label="Chronic Conditions"
              value={formData.chronicConditions || ''}
              onChange={(e) => handleChange('chronicConditions', e.target.value)}
              multiline
              rows={2}
              placeholder="Enter chronic conditions separated by commas"
              icon={
                <InputAdornment position="start">
                  <HealthIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item xs={12}>
            <PersonalInfoFormField
              fullWidth
              label="Medical History"
              value={formData.medicalHistory || ''}
              onChange={(e) => handleChange('medicalHistory', e.target.value)}
              multiline
              rows={4}
              placeholder="Enter detailed medical history"
              icon={
                <InputAdornment position="start">
                  <HistoryIcon sx={{ color: '#42a5f5', fontSize: '20px' }} />
                </InputAdornment>
              }
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default MedicalInfoStep;
