import React from 'react';
import {
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Print,
  Download,
  LocalHospital as TicketsIcon,
  MedicalServices as MedicalRecordsIcon,
  Security as AccessLogsIcon,
  Lock as PrivacyIcon,
  Badge as BadgeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { PatientWithDetails } from '../../../services/patientService';
import PatientHeaderStatCard from './PatientHeaderStatCard';
import PatientHeaderActionButton from './PatientHeaderActionButton';

interface PatientHeaderProps {
  patient: PatientWithDetails;
  onBack: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onExport: () => void;
  colorIndex?: number;
}

const getPrivacyLevelColor = (privacyLevel: string) => {
  switch (privacyLevel) {
    case 'CONFIDENTIAL':
      return { bg: 'linear-gradient(135deg, #ef5350 0%, #e57373 100%)', color: '#ffffff', border: 'rgba(239, 83, 80, 0.3)' };
    case 'RESTRICTED':
      return { bg: 'linear-gradient(135deg, #ffa726 0%, #ffb74d 100%)', color: '#ffffff', border: 'rgba(255, 167, 38, 0.3)' };
    case 'PRIVATE':
      return { bg: 'linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)', color: '#ffffff', border: 'rgba(66, 165, 245, 0.3)' };
    case 'INTERNAL':
      return { bg: 'linear-gradient(135deg, #66bb6a 0%, #81c784 100%)', color: '#ffffff', border: 'rgba(102, 187, 106, 0.3)' };
    case 'PUBLIC':
      return { bg: 'linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)', color: '#ffffff', border: 'rgba(158, 158, 158, 0.3)' };
    default:
      return { bg: 'linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)', color: '#ffffff', border: 'rgba(158, 158, 158, 0.3)' };
  }
};

const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  onBack,
  onEdit,
  onPrint,
  onExport,
  colorIndex,
}) => {
  // Use the same color array as list view
  const avatarColors = [
    { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: '#b3e5fc' },
    { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', border: '#c8e6c9' },
    { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', border: '#f8bbd0' },
    { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', border: '#b2dfdb' },
    { bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', border: '#ffe0b2' },
    { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: '#ce93d8' },
  ];
  
  // Use colorIndex from URL if available (matches list view), otherwise fallback to patient ID hash
  let selectedIndex: number;
  if (colorIndex !== undefined) {
    selectedIndex = colorIndex % avatarColors.length;
  } else {
    // Fallback: hash patient ID for consistent color when accessed directly
    let hash = 0;
    for (let i = 0; i < patient.id.length; i++) {
      const char = patient.id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    selectedIndex = Math.abs(hash) % avatarColors.length;
  }
  
  const avatarColor = avatarColors[selectedIndex];
  const avatarGradient = avatarColor.bg;
  const privacyColors = getPrivacyLevelColor(patient.privacyLevel);

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '24px',
        border: '1px solid rgba(66, 165, 245, 0.25)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '5px',
          background: avatarGradient,
          opacity: 1,
          transition: 'width 0.3s ease',
        },
        '&:hover': {
          boxShadow: '0 8px 24px rgba(66, 165, 245, 0.15), 0 4px 8px rgba(0, 0, 0, 0.08)',
          borderColor: 'rgba(66, 165, 245, 0.4)',
          '&::before': {
            width: '6px',
          },
        },
      }}
    >
      {/* Header Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <IconButton
            onClick={onBack}
            sx={{
              color: '#1976d2',
              background: 'rgba(25, 118, 210, 0.1)',
              '&:hover': {
                background: 'rgba(25, 118, 210, 0.2)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowBack />
          </IconButton>
          
          <Avatar
            sx={{
              width: 72,
              height: 72,
              background: avatarGradient,
              fontSize: '1.8rem',
              fontWeight: 700,
              boxShadow: `0 4px 12px ${avatarColor.border}80`,
              border: `3px solid ${avatarColor.border}`,
            }}
          >
            {patient.firstName?.charAt(0)?.toUpperCase() || 'P'}
            {patient.lastName?.charAt(0)?.toUpperCase() || ''}
          </Avatar>
          
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                color: '#1a237e',
                fontSize: '1.75rem',
                mb: 0.5,
              }}
            >
              {patient.firstName} {patient.middleName && `${patient.middleName} `}
              {patient.lastName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              {patient.mrn && (
                <Chip
                  icon={<BadgeIcon sx={{ fontSize: '16px !important' }} />}
                  label={`MRN: ${patient.mrn}`}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.15) 0%, rgba(100, 181, 246, 0.15) 100%)',
                    color: '#1976d2',
                    fontWeight: 600,
                    border: '1px solid rgba(66, 165, 245, 0.3)',
                    fontSize: '0.8125rem',
                    height: '28px',
                  }}
                />
              )}
              {patient.nationalId && (
                <Chip
                  icon={<PersonIcon sx={{ fontSize: '16px !important' }} />}
                  label={`National ID: ${patient.nationalId}`}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(129, 199, 132, 0.15) 100%)',
                    color: '#388e3c',
                    fontWeight: 600,
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    fontSize: '0.8125rem',
                    height: '28px',
                    fontFamily: 'monospace',
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <PatientHeaderActionButton
            startIcon={<Edit />}
            onClick={onEdit}
            gradient="linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)"
            hoverGradient="linear-gradient(135deg, #1e88e5 0%, #42a5f5 100%)"
            shadowColor="rgba(66, 165, 245, 0.35)"
          >
            Edit
          </PatientHeaderActionButton>
          <PatientHeaderActionButton
            startIcon={<Print />}
            onClick={onPrint}
            gradient="linear-gradient(135deg, #66bb6a 0%, #81c784 100%)"
            hoverGradient="linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)"
            shadowColor="rgba(102, 187, 106, 0.35)"
          >
            Print
          </PatientHeaderActionButton>
          <PatientHeaderActionButton
            startIcon={<Download />}
            onClick={onExport}
            gradient="linear-gradient(135deg, #ffa726 0%, #ffb74d 100%)"
            hoverGradient="linear-gradient(135deg, #fb8c00 0%, #ffa726 100%)"
            shadowColor="rgba(255, 167, 38, 0.35)"
          >
            Export
          </PatientHeaderActionButton>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <PatientHeaderStatCard
          icon={<TicketsIcon sx={{ fontSize: '18px' }} />}
          value={patient._count?.tickets || 0}
          label="Total Tickets"
          color="#42a5f5"
          gradient="linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)"
        />
        <PatientHeaderStatCard
          icon={<MedicalRecordsIcon sx={{ fontSize: '18px' }} />}
          value={patient._count?.medicalRecords || 0}
          label="Medical Records"
          color="#66bb6a"
          gradient="linear-gradient(135deg, #66bb6a 0%, #81c784 100%)"
        />
        <PatientHeaderStatCard
          icon={<AccessLogsIcon sx={{ fontSize: '18px' }} />}
          value={patient._count?.accessLogs || 0}
          label="Access Logs"
          color="#26a69a"
          gradient="linear-gradient(135deg, #26a69a 0%, #4db6ac 100%)"
        />
        <PatientHeaderStatCard
          icon={<PrivacyIcon sx={{ fontSize: '18px' }} />}
          value=""
          label="Privacy Level"
          color={privacyColors.color === '#ffffff' ? '#42a5f5' : privacyColors.color}
          gradient={privacyColors.bg}
          chip={
            <Chip
              label={patient.privacyLevel}
              size="small"
              sx={{
                backgroundColor: alpha(privacyColors.color === '#ffffff' ? '#42a5f5' : privacyColors.color, 0.15),
                color: privacyColors.color === '#ffffff' ? '#42a5f5' : privacyColors.color,
                fontWeight: 600,
                border: `1px solid ${alpha(privacyColors.color === '#ffffff' ? '#42a5f5' : privacyColors.color, 0.3)}`,
                fontSize: '0.7rem',
                height: '20px',
                borderRadius: 2,
              }}
            />
          }
        />
      </Box>
    </Box>
  );
};

export default PatientHeader;
