import React from 'react';
import { Box, Typography, Chip, Avatar } from '@mui/material';
import { Person as PersonIcon, Phone as PhoneIcon, Email as EmailIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { Patient } from '../../../../services/patientService';
import { formatAgeForDisplay } from '../../../../utils/ageCalculator';

interface PatientInfoSectionProps {
  patient: Patient;
  avatarColor: { bg: string; border: string };
  privacyColors: { bg: string; color: string; border: string };
}

const PatientInfoSection: React.FC<PatientInfoSectionProps> = ({
  patient,
  avatarColor,
  privacyColors,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
      {/* Avatar */}
      <Avatar
        sx={{
          width: 60,
          height: 60,
          background: avatarColor.bg,
          fontSize: '1.375rem',
          fontWeight: 600,
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(79, 172, 254, 0.25)',
          border: `3px solid ${avatarColor.border}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 6px 16px rgba(79, 172, 254, 0.35)',
          },
        }}
      >
        {patient.firstName.charAt(0).toUpperCase()}
        {patient.lastName.charAt(0).toUpperCase()}
      </Avatar>

      {/* Patient Details */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '1.1875rem',
              color: '#1a237e',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}
          >
            {patient.firstName} {patient.middleName && `${patient.middleName} `}
            {patient.lastName}
          </Typography>
        </Box>

        {/* Secondary Info Row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            mt: 1,
          }}
        >
          {/* MRN */}
          {patient.mrn && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#757575',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                MRN:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  color: '#424242',
                  fontSize: '0.8125rem',
                }}
              >
                {patient.mrn}
              </Typography>
            </Box>
          )}

          {/* National ID */}
          {patient.nationalId && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#757575',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                ID:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  color: '#424242',
                  fontSize: '0.8125rem',
                }}
              >
                {patient.nationalId}
              </Typography>
            </Box>
          )}

          {/* Age/Gender Badge */}
          <Chip
            icon={<PersonIcon sx={{ fontSize: '14px !important' }} />}
            label={`${formatAgeForDisplay(
              patient.age,
              patient.dateOfBirth,
              patient.ageMonths,
              patient.ageDays
            )} • ${patient.gender === 'MALE' ? 'M' : 'F'}`}
            size="small"
            sx={{
              height: '26px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              color: '#1565c0',
              border: '1px solid rgba(79, 172, 254, 0.3)',
              boxShadow: '0 2px 4px rgba(79, 172, 254, 0.1)',
              transition: 'all 0.2s ease',
              '& .MuiChip-icon': {
                color: '#1976d2',
              },
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 3px 6px rgba(79, 172, 254, 0.15)',
              },
            }}
          />

          {/* Privacy Level Badge */}
          <Chip
            label={patient.privacyLevel}
            size="small"
            sx={{
              height: '24px',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: privacyColors.bg,
              color: privacyColors.color,
              border: `1px solid ${privacyColors.border}`,
            }}
          />
        </Box>

        {/* Contact Info Row */}
        {(patient.phoneNumber || patient.email) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mt: 1,
              flexWrap: 'wrap',
            }}
          >
            {patient.phoneNumber && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: '#616161',
                }}
              >
                <PhoneIcon sx={{ fontSize: '14px' }} />
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.75rem', color: '#616161' }}
                >
                  {patient.phoneNumber}
                </Typography>
              </Box>
            )}
            {patient.email && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: '#616161',
                }}
              >
                <EmailIcon sx={{ fontSize: '14px' }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    color: '#616161',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '200px',
                  }}
                >
                  {patient.email}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Last Accessed */}
        {patient.lastAccessedAt && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              color: '#9e9e9e',
              fontSize: '0.7rem',
            }}
          >
            Last accessed: {format(new Date(patient.lastAccessedAt), 'MMM dd, yyyy HH:mm')}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default PatientInfoSection;

