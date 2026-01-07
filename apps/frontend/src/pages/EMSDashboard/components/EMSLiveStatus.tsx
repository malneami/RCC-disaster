import React from 'react';
import { Box, Typography, Grid, Chip, LinearProgress } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeartbeat, faClock, faAmbulance, faCheckCircle, faBolt, faUserMd } from '@fortawesome/free-solid-svg-icons';

// Clean Arctic Glassmorphic Palette
const COLORS = {
  actionable: '#FF9F1C',   // Actionable Orange
  success: '#2EC4B6',      // Success Green
  critical: '#011627',     // Critical Blue
  violet: '#8B5CF6',       // Neutral Violet
  primary: '#2563EB',      // Blue (legacy)
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    500: '#64748B',
    700: '#334155',
    900: '#0F172A',
  },
};

interface LiveStatusData {
  totalAmbulances: number;
  activeAmbulances: number;
  availableAmbulances: number;
  inUseAmbulances: number;
  activeAssignments: number;
  responseTime: number;
  averageResponseTime: number;
}

interface EMSLiveStatusProps {
  data?: LiveStatusData;
  isLoading?: boolean;
}

interface StatCardProps {
  value: number;
  label: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, icon }) => {
  // Determine gradient based on label
  let gradient = 'linear-gradient(to bottom right, #3B82F6, #6366F1)'; // Default blue

  if (label === 'Total Ambulances') {
    gradient = 'linear-gradient(to bottom right, #3B82F6, #6366F1)'; // Blue
  } else if (label === 'Available') {
    gradient = 'linear-gradient(to bottom right, #10B981, #14B8A6)'; // Green
  } else if (label === 'In Use') {
    gradient = 'linear-gradient(to bottom right, #F59E0B, #EF4444)'; // Amber to Red
  } else if (label === 'Active Assignments') {
    gradient = 'linear-gradient(to bottom right, #8B5CF6, #D946EF)'; // Purple
  }

  return (
    <Box
      sx={{
        background: gradient,
        borderRadius: 3,
        p: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          bgcolor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          flexShrink: 0
        }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: '#FFFFFF', fontFamily: 'Inter, sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.2)', mb: 0.5 }}>{value}</Typography>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', fontFamily: 'Inter, sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{label}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

const EMSLiveStatus: React.FC<EMSLiveStatusProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Box sx={{ bgcolor: COLORS.slate[100], borderRadius: 2, p: 3 }}>
        <Typography sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, color: COLORS.primary }}>
          <FontAwesomeIcon icon={faHeartbeat} /> Live Status
        </Typography>
        <LinearProgress sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  const s = data || { totalAmbulances: 0, activeAmbulances: 0, availableAmbulances: 0, inUseAmbulances: 0, activeAssignments: 0, responseTime: 0, averageResponseTime: 0 };
  const pct = s.totalAmbulances > 0 ? Math.round((s.availableAmbulances / s.totalAmbulances) * 100) : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: `${COLORS.critical}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLORS.critical
        }}>
          <FontAwesomeIcon icon={faHeartbeat} />
        </Box>
        <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: COLORS.slate[900], fontFamily: 'Inter, sans-serif' }}>Live Status</Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        <Grid item xs={6} md={3}>
          <StatCard value={s.totalAmbulances} label="Total Ambulances" icon={<FontAwesomeIcon icon={faAmbulance} />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard value={s.availableAmbulances} label="Available" icon={<FontAwesomeIcon icon={faCheckCircle} />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard value={s.inUseAmbulances} label="In Use" icon={<FontAwesomeIcon icon={faBolt} />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard value={s.activeAssignments} label="Active Assignments" icon={<FontAwesomeIcon icon={faUserMd} />} />
        </Grid>
      </Grid>

      {/* Availability & Response Time */}
      <Box sx={{
        mt: 3,
        bgcolor: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(12px)',
        borderRadius: 4,
        p: 3,
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
      }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography sx={{ fontWeight: 600, color: COLORS.slate[700], fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>Fleet Availability</Typography>
              <Chip label={`${pct}%`} size="small" sx={{ fontWeight: 700, bgcolor: '#10B981', color: '#fff', height: 26, fontFamily: 'Inter, sans-serif', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }} />
            </Box>
            <LinearProgress variant="determinate" value={pct} sx={{
              height: 12,
              borderRadius: '9999px',
              bgcolor: COLORS.slate[200],
              '& .MuiLinearProgress-bar': {
                borderRadius: '9999px',
                background: 'linear-gradient(90deg, #10B981 0%, #14B8A6 100%)'
              }
            }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5, borderRadius: 3, bgcolor: COLORS.slate[50], border: '1px solid #E2E8F0' }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: `${COLORS.critical}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.critical }}>
                <FontAwesomeIcon icon={faClock} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.7rem', color: COLORS.slate[500], fontWeight: 600, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Current Response</Typography>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: COLORS.slate[900], fontFamily: 'Inter, sans-serif' }}>{s.responseTime} min</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.7rem', color: COLORS.slate[500], fontWeight: 600, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Avg Today</Typography>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: COLORS.slate[900], fontFamily: 'Inter, sans-serif' }}>{s.averageResponseTime} min</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default EMSLiveStatus;
