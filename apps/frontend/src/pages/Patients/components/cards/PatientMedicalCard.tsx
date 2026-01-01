import React from 'react';
import {
  Box,
  Typography,
  Grid,
  alpha,
} from '@mui/material';
import { MedicalServices, History, LocalPharmacy, Warning, Favorite, HealthAndSafety } from '@mui/icons-material';
import { format } from 'date-fns';
import { PatientWithDetails } from '../../../../services/patientService';
import { parseJsonArray } from '../../../../utils/jsonUtils';

interface PatientMedicalCardProps {
  patient: PatientWithDetails;
}

interface CardHeaderProps {
  icon: React.ReactNode;
  title: string;
  color: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ icon, title, color }) => (
  <Box
    sx={{
      background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
      padding: '16px 20px',
      borderBottom: `1px solid ${alpha(color, 0.15)}`,
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
        background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 2px 8px ${alpha(color, 0.3)}`,
      }}
    >
      {icon}
    </Box>
    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.05rem' }}>
      {title}
    </Typography>
  </Box>
);

interface MedicalFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  fullWidth?: boolean;
}

const MedicalField: React.FC<MedicalFieldProps> = ({ icon, label, value, color, fullWidth = false }) => (
  <Grid item xs={12} md={fullWidth ? 12 : 6}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <Box
        sx={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: alpha(color, 0.1),
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
            lineHeight: fullWidth ? 1.5 : 1.3,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  </Grid>
);

interface AuditFieldProps {
  label: string;
  value: string;
}

const AuditField: React.FC<AuditFieldProps> = ({ label, value }) => (
  <Grid item xs={12} sm={6} md={3}>
    <Box>
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
      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.95rem', lineHeight: 1.3 }}>
        {value}
      </Typography>
    </Box>
  </Grid>
);

const PatientMedicalCard: React.FC<PatientMedicalCardProps> = ({ patient }) => {
  const formatArrayField = (field: string | null | undefined) => {
    if (!field) return 'None';
    try {
      const array = parseJsonArray(field);
      return array.length > 0 ? array.join(', ') : 'None';
    } catch {
      return field;
    }
  };

  const medicalColor = '#9c27b0';
  const auditColor = '#607d8b';

  const cardStyle = (color: string) => ({
    background: '#ffffff',
    borderRadius: '16px',
    border: `1px solid ${alpha(color, 0.2)}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 4px 16px ${alpha(color, 0.15)}`,
      borderColor: alpha(color, 0.35),
    },
  });

  return (
    <>
      <Box sx={{ ...cardStyle(medicalColor), mb: 2.5 }}>
        <CardHeader
          icon={<MedicalServices sx={{ color: '#ffffff', fontSize: '22px' }} />}
          title="Medical Information"
          color={medicalColor}
        />
        <Box sx={{ padding: '20px' }}>
          <Grid container spacing={2}>
            <MedicalField
              icon={<Warning sx={{ color: medicalColor, fontSize: '18px' }} />}
              label="Allergies"
              value={formatArrayField(patient.allergies)}
              color={medicalColor}
            />
            <MedicalField
              icon={<LocalPharmacy sx={{ color: medicalColor, fontSize: '18px' }} />}
              label="Current Medications"
              value={formatArrayField(patient.medications)}
              color={medicalColor}
            />
            <MedicalField
              icon={<Favorite sx={{ color: medicalColor, fontSize: '18px' }} />}
              label="Risk Factors"
              value={formatArrayField(patient.riskFactors)}
              color={medicalColor}
            />
            <MedicalField
              icon={<HealthAndSafety sx={{ color: medicalColor, fontSize: '18px' }} />}
              label="Chronic Conditions"
              value={formatArrayField(patient.chronicConditions)}
              color={medicalColor}
            />
            <MedicalField
              icon={<History sx={{ color: medicalColor, fontSize: '18px' }} />}
              label="Medical History"
              value={patient.medicalHistory || 'No medical history recorded'}
              color={medicalColor}
              fullWidth
            />
          </Grid>
        </Box>
      </Box>

      <Box sx={cardStyle(auditColor)}>
        <CardHeader
          icon={<History sx={{ color: '#ffffff', fontSize: '22px' }} />}
          title="Audit Information"
          color={auditColor}
        />
        <Box sx={{ padding: '20px' }}>
          <Grid container spacing={2}>
            <AuditField
              label="Created By"
              value={`${patient.createdBy?.firstName || ''} ${patient.createdBy?.lastName || ''}`.trim() || 'N/A'}
            />
            <AuditField label="Created Date" value={format(new Date(patient.createdAt), 'PPP')} />
            <AuditField
              label="Last Accessed"
              value={patient.lastAccessedAt ? format(new Date(patient.lastAccessedAt), 'PPP') : 'Never'}
            />
            <AuditField
              label="Last Accessed By"
              value={
                patient.lastAccessedByUser
                  ? `${patient.lastAccessedByUser.firstName} ${patient.lastAccessedByUser.lastName}`
                  : 'N/A'
              }
            />
          </Grid>
        </Box>
      </Box>
    </>
  );
};

export default PatientMedicalCard;
