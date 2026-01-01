import React from 'react';
import {
  Box,
  Typography,
  Grid,
  alpha,
  Chip,
} from '@mui/material';
import { CheckCircle, Business, Badge, Group, CalendarToday } from '@mui/icons-material';
import { format, isAfter, subDays } from 'date-fns';
import { PatientWithDetails } from '../../../../services/patientService';

interface PatientInsuranceCardProps {
  patient: PatientWithDetails;
}

interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  cardColor: string;
  chip?: React.ReactNode;
}

const InfoField: React.FC<InfoFieldProps> = ({ icon, label, value, cardColor, chip }) => (
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
          {chip}
        </Box>
      </Box>
    </Box>
  </Grid>
);

const PatientInsuranceCard: React.FC<PatientInsuranceCardProps> = ({ patient }) => {
  const cardColor = '#66bb6a';
  
  const isExpiringSoon = () => {
    if (!patient.insuranceExpiry) return false;
    try {
      const expiryDate = new Date(patient.insuranceExpiry);
      const thirtyDaysFromNow = subDays(new Date(), -30);
      return isAfter(thirtyDaysFromNow, expiryDate) && isAfter(expiryDate, new Date());
    } catch {
      return false;
    }
  };

  const isExpired = () => {
    if (!patient.insuranceExpiry) return false;
    try {
      const expiryDate = new Date(patient.insuranceExpiry);
      return isAfter(new Date(), expiryDate);
    } catch {
      return false;
    }
  };

  const expiryChip = patient.insuranceExpiry && (
    <>
      {isExpired() && (
        <Chip
          label="Expired"
          size="small"
          sx={{
            backgroundColor: alpha('#f44336', 0.1),
            color: '#f44336',
            fontWeight: 600,
            fontSize: '0.65rem',
            height: '18px',
          }}
        />
      )}
      {isExpiringSoon() && !isExpired() && (
        <Chip
          label="Expiring Soon"
          size="small"
          sx={{
            backgroundColor: alpha('#ff9800', 0.1),
            color: '#ff9800',
            fontWeight: 600,
            fontSize: '0.65rem',
            height: '18px',
          }}
        />
      )}
    </>
  );

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
          boxShadow: '0 4px 16px rgba(102, 187, 106, 0.15)',
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
          <CheckCircle sx={{ color: '#ffffff', fontSize: '22px' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.05rem' }}>
          Insurance Information
        </Typography>
      </Box>

      <Box sx={{ padding: '20px' }}>
        <Grid container spacing={2}>
          <InfoField
            icon={<Business sx={{ color: cardColor, fontSize: '18px' }} />}
            label="Provider"
            value={patient.insuranceProvider || 'N/A'}
            cardColor={cardColor}
          />
          <InfoField
            icon={<Badge sx={{ color: cardColor, fontSize: '18px' }} />}
            label="Policy Number"
            value={patient.insuranceNumber || 'N/A'}
            cardColor={cardColor}
          />
          <InfoField
            icon={<Group sx={{ color: cardColor, fontSize: '18px' }} />}
            label="Group"
            value={patient.insuranceGroup || 'N/A'}
            cardColor={cardColor}
          />
          <InfoField
            icon={<CalendarToday sx={{ color: cardColor, fontSize: '18px' }} />}
            label="Expiry Date"
            value={patient.insuranceExpiry ? format(new Date(patient.insuranceExpiry), 'PPP') : 'N/A'}
            cardColor={cardColor}
            chip={expiryChip}
          />
        </Grid>
      </Box>
    </Box>
  );
};

export default PatientInsuranceCard;
