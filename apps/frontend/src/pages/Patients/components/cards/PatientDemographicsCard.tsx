import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Alert,
  alpha,
} from '@mui/material';
import {
  Person,
  CalendarToday,
  Event,
  People,
  Favorite,
  LocalHospital,
} from '@mui/icons-material';
import { PatientWithDetails } from '../../../../services/patientService';
import { formatAgeForDisplay } from '../../../../utils/ageCalculator';

interface PatientDemographicsCardProps {
  patient: PatientWithDetails;
}

interface DemographicsFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  cardColor: string;
}

const DemographicsField: React.FC<DemographicsFieldProps> = ({ icon, label, value, cardColor }) => (
  <Grid item xs={6}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <Box
        sx={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: alpha(cardColor, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'block',
            mb: 0.25,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            fontSize: '0.95rem',
            lineHeight: 1.3,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  </Grid>
);

const PatientDemographicsCard: React.FC<PatientDemographicsCardProps> = ({ patient }) => {
  const validateDateOfBirth = (dateOfBirth: string | undefined): { isValid: boolean; error?: string } => {
    if (!dateOfBirth) {
      return { isValid: true };
    }
    
    try {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const minDate = new Date('1900-01-01');
      
      if (dob > today) {
        return { isValid: false, error: 'Date of birth is in the future' };
      }
      if (dob < minDate) {
        return { isValid: false, error: 'Date of birth is before 1900' };
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid date format' };
    }
  };

  const dobValidation = validateDateOfBirth(patient.dateOfBirth);
  const cardColor = '#42a5f5';

  const formatDateOfBirth = () => {
    if (!patient.dateOfBirth) return 'N/A';
    try {
      return new Date(patient.dateOfBirth).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Box
      sx={{
        background: '#ffffff',
        borderRadius: '16px',
        border: `1px solid ${alpha(cardColor, 0.2)}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(66, 165, 245, 0.15)',
          borderColor: alpha(cardColor, 0.35),
        },
      }}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(cardColor, 0.1)} 0%, ${alpha(cardColor, 0.05)} 100%)`,
          padding: '16px 20px',
          borderBottom: `1px solid ${alpha(cardColor, 0.15)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${cardColor} 0%, ${alpha(cardColor, 0.8)} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 8px ${alpha(cardColor, 0.3)}`,
          }}
        >
          <Person sx={{ color: '#ffffff', fontSize: '22px' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.05rem' }}>
          Demographics
        </Typography>
      </Box>

      <Box sx={{ padding: '20px' }}>
        {!dobValidation.isValid && patient.dateOfBirth && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: '8px' }}>
            Date of Birth Validation: {dobValidation.error}
          </Alert>
        )}
        
        <Grid container spacing={2}>
          <DemographicsField
            icon={<CalendarToday sx={{ color: cardColor, fontSize: '18px' }} />}
            label="Age"
            value={formatAgeForDisplay(patient.age, patient.dateOfBirth, patient.ageMonths, patient.ageDays)}
            cardColor={cardColor}
          />
          <DemographicsField
            icon={<Event sx={{ color: cardColor, fontSize: '18px' }} />}
            label="Date of Birth"
            value={formatDateOfBirth()}
            cardColor={cardColor}
          />
          <DemographicsField
            icon={<People sx={{ color: cardColor, fontSize: '18px' }} />}
            label="Gender"
            value={patient.gender}
            cardColor={cardColor}
          />
          <DemographicsField
            icon={<Favorite sx={{ color: cardColor, fontSize: '18px' }} />}
            label="Marital Status"
            value={patient.maritalStatus || 'N/A'}
            cardColor={cardColor}
          />
          <DemographicsField
            icon={<LocalHospital sx={{ color: cardColor, fontSize: '18px' }} />}
            label="Blood Type"
            value={patient.bloodType || 'N/A'}
            cardColor={cardColor}
          />
          <DemographicsField
            icon={<LocalHospital sx={{ color: cardColor, fontSize: '18px' }} />}
            label="RH Factor"
            value={patient.rhFactor || 'N/A'}
            cardColor={cardColor}
          />
        </Grid>
      </Box>
    </Box>
  );
};

export default PatientDemographicsCard;
