import React from 'react';
import {
  Box,
  Typography,
  Grid,
  alpha,
} from '@mui/material';
import { Warning, Person, Phone, Email, People } from '@mui/icons-material';
import { PatientWithDetails } from '../../../../services/patientService';

interface PatientEmergencyCardProps {
  patient: PatientWithDetails;
}

interface EmergencyFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  cardColor: string;
}

const EmergencyField: React.FC<EmergencyFieldProps> = ({ icon, label, value, cardColor }) => (
  <Grid item xs={12} sm={6}>
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

const PatientEmergencyCard: React.FC<PatientEmergencyCardProps> = ({ patient }) => {
  const cardColor = '#7e57c2';

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
          boxShadow: '0 4px 16px rgba(126, 87, 194, 0.15)',
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
          <Warning sx={{ color: '#ffffff', fontSize: '22px' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.05rem' }}>
          Emergency Contact
        </Typography>
      </Box>

      <Box sx={{ padding: '20px' }}>
        <Grid container spacing={2}>
          <EmergencyField
            icon={<Person sx={{ color: cardColor, fontSize: '18px' }} />}
            label="Contact Name"
            value={patient.emergencyContact || 'N/A'}
            cardColor={cardColor}
          />
          <EmergencyField
            icon={<Phone sx={{ color: cardColor, fontSize: '18px' }} />}
            label="Phone"
            value={patient.emergencyPhone || 'N/A'}
            cardColor={cardColor}
          />
          <EmergencyField
            icon={<Email sx={{ color: cardColor, fontSize: '18px' }} />}
            label="Email"
            value={patient.emergencyEmail || 'N/A'}
            cardColor={cardColor}
          />
          <EmergencyField
            icon={<People sx={{ color: cardColor, fontSize: '18px' }} />}
            label="Relationship"
            value={patient.emergencyRelationship || 'N/A'}
            cardColor={cardColor}
          />
        </Grid>
      </Box>
    </Box>
  );
};

export default PatientEmergencyCard;
