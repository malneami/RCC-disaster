import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Patient } from '../../../services/patientService';
import { formatAgeForDisplay } from '../../../utils/ageCalculator';

interface ModernPatientListItemProps {
  patient: Patient;
  index: number;
  onViewPatient: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
  onExportPatient: (patient: Patient) => void;
}

// Get privacy level color helper
const getPrivacyLevelColor = (privacyLevel: string) => {
  switch (privacyLevel) {
    case 'CONFIDENTIAL':
      return { bg: '#ffebee', color: '#c62828', border: '#ef5350' };
    case 'RESTRICTED':
      return { bg: '#fff3e0', color: '#e65100', border: '#ff9800' };
    case 'PRIVATE':
      return { bg: '#e3f2fd', color: '#0277bd', border: '#03a9f4' };
    case 'INTERNAL':
      return { bg: '#e8f5e9', color: '#2e7d32', border: '#4caf50' };
    case 'PUBLIC':
      return { bg: '#f5f5f5', color: '#616161', border: '#9e9e9e' };
    default:
      return { bg: '#f5f5f5', color: '#616161', border: '#9e9e9e' };
  }
};

const ModernPatientListItem: React.FC<ModernPatientListItemProps> = ({
  patient,
  index,
  onViewPatient,
  onEditPatient,
  onExportPatient,
}) => {
  const privacyColors = getPrivacyLevelColor(patient.privacyLevel);
  const isEven = index % 2 === 0;
  
  // Warm, cheerful color variations
  const avatarColors = [
    { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: '#b3e5fc' },
    { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', border: '#c8e6c9' },
    { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', border: '#f8bbd0' },
    { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', border: '#b2dfdb' },
    { bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', border: '#ffe0b2' },
    { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: '#ce93d8' },
  ];
  const avatarColor = avatarColors[index % avatarColors.length];

  return (
    <Box
      sx={{
        position: 'relative',
        background: isEven 
          ? 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)'
          : 'linear-gradient(135deg, #fafafa 0%, #f5f7ff 100%)',
        borderRadius: '14px',
        padding: '22px 26px',
        marginBottom: '14px',
        border: '1px solid',
        borderColor: 'rgba(79, 172, 254, 0.12)',
        boxShadow: '0 3px 12px rgba(79, 172, 254, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 8px 24px rgba(79, 172, 254, 0.15), 0 4px 8px rgba(0, 0, 0, 0.06)',
          background: isEven
            ? 'linear-gradient(135deg, #ffffff 0%, #e8f4ff 100%)'
            : 'linear-gradient(135deg, #fafafa 0%, #e3f2fd 100%)',
          borderColor: 'rgba(79, 172, 254, 0.25)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: avatarColor.bg,
          borderRadius: '14px 0 0 14px',
          opacity: 0,
          transition: 'opacity 0.3s ease, width 0.3s ease',
        },
        '&:hover::before': {
          opacity: 1,
          width: '5px',
        },
      }}
      onClick={() => onViewPatient(patient)}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
        }}
      >
        {/* Left Section - Patient Info */}
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

        {/* Right Section - Actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title="View Details" arrow>
            <IconButton
              size="medium"
              onClick={() => onViewPatient(patient)}
              sx={{
                color: '#4facfe',
                background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%)',
                border: '1px solid rgba(79, 172, 254, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)',
                  transform: 'scale(1.08)',
                  boxShadow: '0 4px 12px rgba(79, 172, 254, 0.25)',
                },
                transition: 'all 0.25s ease',
              }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Patient" arrow>
            <IconButton
              size="medium"
              onClick={() => onEditPatient(patient)}
              sx={{
                color: '#43e97b',
                background: 'linear-gradient(135deg, rgba(67, 233, 123, 0.1) 0%, rgba(56, 249, 215, 0.1) 100%)',
                border: '1px solid rgba(67, 233, 123, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(67, 233, 123, 0.2) 0%, rgba(56, 249, 215, 0.2) 100%)',
                  transform: 'scale(1.08)',
                  boxShadow: '0 4px 12px rgba(67, 233, 123, 0.25)',
                },
                transition: 'all 0.25s ease',
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Patient Data" arrow>
            <IconButton
              size="medium"
              onClick={() => onExportPatient(patient)}
              sx={{
                color: '#fa709a',
                background: 'linear-gradient(135deg, rgba(250, 112, 154, 0.1) 0%, rgba(254, 225, 64, 0.1) 100%)',
                border: '1px solid rgba(250, 112, 154, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(250, 112, 154, 0.2) 0%, rgba(254, 225, 64, 0.2) 100%)',
                  transform: 'scale(1.08)',
                  boxShadow: '0 4px 12px rgba(250, 112, 154, 0.25)',
                },
                transition: 'all 0.25s ease',
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export default ModernPatientListItem;

