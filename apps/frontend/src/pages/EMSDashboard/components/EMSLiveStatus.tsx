import React from 'react';
import { Box, Typography, Grid, Chip, LinearProgress } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeartbeat, faClock, faAmbulance, faCheckCircle, faBolt, faUserMd } from '@fortawesome/free-solid-svg-icons';

// Vibrant Solid Colors - No Gradients
const COLORS = {
  skyBlue: '#0EA5E9',
  emerald: '#10B981',
  amber: '#F59E0B',
  violet: '#8B5CF6',
  slate: '#64748B',
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

// Vibrant Stat Card - Solid Colors
interface StatCardProps {
  value: number;
  label: string;
  color: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, color, icon }) => (
  <Box
    sx={{
      bgcolor: color,
      borderRadius: 4,
      p: 3,
      color: '#fff',
      boxShadow: `0 8px 24px ${color}50`,
      transition: 'all 0.3s ease',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 12px 32px ${color}60` },
    }}
  >
    <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, fontSize: '1.1rem' }}>
      {icon}
    </Box>
    <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{value}</Typography>
    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9, mt: 0.5 }}>{label}</Typography>
  </Box>
);

const EMSLiveStatus: React.FC<EMSLiveStatusProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Box sx={{ bgcolor: '#E0F2FE', borderRadius: 4, p: 4 }}>
        <Typography sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, color: COLORS.skyBlue }}>
          <FontAwesomeIcon icon={faHeartbeat} /> Live Status
        </Typography>
        <LinearProgress sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  const s = data || { totalAmbulances: 0, activeAmbulances: 0, availableAmbulances: 0, inUseAmbulances: 0, activeAssignments: 0, responseTime: 0, averageResponseTime: 0 };
  const pct = s.totalAmbulances > 0 ? Math.round((s.availableAmbulances / s.totalAmbulances) * 100) : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: COLORS.skyBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 6px 20px ${COLORS.skyBlue}40` }}>
          <FontAwesomeIcon icon={faHeartbeat} />
        </Box>
        <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>Live Status</Typography>
      </Box>

      {/* Stat Cards - Vibrant Solid Colors */}
      <Grid container spacing={3}>
        <Grid item xs={6} md={3}>
          <StatCard value={s.totalAmbulances} label="Total Ambulances" color={COLORS.skyBlue} icon={<FontAwesomeIcon icon={faAmbulance} />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard value={s.availableAmbulances} label="Available" color={COLORS.emerald} icon={<FontAwesomeIcon icon={faCheckCircle} />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard value={s.inUseAmbulances} label="In Use" color={COLORS.amber} icon={<FontAwesomeIcon icon={faBolt} />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard value={s.activeAssignments} label="Active Assignments" color={COLORS.violet} icon={<FontAwesomeIcon icon={faUserMd} />} />
        </Grid>
      </Grid>

      {/* Availability & Response Time */}
      <Box sx={{ mt: 4, bgcolor: '#fff', borderRadius: 4, p: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontWeight: 700, color: '#334155' }}>Fleet Availability</Typography>
              <Chip label={`${pct}%`} sx={{ fontWeight: 800, bgcolor: COLORS.emerald, color: '#fff' }} />
            </Box>
            <LinearProgress variant="determinate" value={pct} sx={{ height: 12, borderRadius: 6, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { borderRadius: 6, bgcolor: COLORS.emerald } }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3, borderRadius: 4, bgcolor: '#E0F2FE' }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: COLORS.skyBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', boxShadow: `0 6px 20px ${COLORS.skyBlue}40` }}>
                <FontAwesomeIcon icon={faClock} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', color: COLORS.skyBlue, fontWeight: 700 }}>Current Response Time</Typography>
                <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A' }}>{s.responseTime} min</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.8rem', color: COLORS.skyBlue, fontWeight: 700 }}>Avg Today</Typography>
                <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A' }}>{s.averageResponseTime} min</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default EMSLiveStatus;
