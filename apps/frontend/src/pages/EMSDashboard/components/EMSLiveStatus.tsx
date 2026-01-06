import React from 'react';
import { Box, Typography, Grid, Chip, LinearProgress } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeartbeat, faClock, faAmbulance, faCheckCircle, faBolt, faUserMd } from '@fortawesome/free-solid-svg-icons';

// Professional muted color palette
const COLORS = {
  primary: '#2563EB',      // Blue-600
  success: '#059669',      // Emerald-600
  warning: '#D97706',      // Amber-600
  accent: '#7C3AED',       // Violet-600
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
  color: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, color, icon }) => (
  <Box
    sx={{
      bgcolor: color,
      borderRadius: 2,
      p: { xs: 1.5, md: 2.5 },
      color: '#fff',
      transition: 'transform 0.2s ease',
      '&:hover': { transform: 'translateY(-2px)' },
      '&:focus-within': {
        outline: '2px solid',
        outlineColor: 'rgba(255,255,255,0.5)',
        outlineOffset: 2,
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 1, md: 1.5 } }}>
      <Box sx={{ 
        width: { xs: 28, md: 36 }, 
        height: { xs: 28, md: 36 }, 
        borderRadius: 1.5, 
        bgcolor: 'rgba(255,255,255,0.2)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        {icon}
      </Box>
    </Box>
    <Typography sx={{ 
      fontSize: { xs: '1.5rem', md: '2rem' }, 
      fontWeight: 700, 
      lineHeight: 1 
    }}>
      {value}
    </Typography>
    <Typography sx={{ 
      fontSize: { xs: '0.7rem', md: '0.8rem' }, 
      fontWeight: 500, 
      opacity: 0.9, 
      mt: 0.5 
    }}>
      {label}
    </Typography>
  </Box>
);

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 }, mb: { xs: 2, md: 3 } }}>
        <Box sx={{ 
          width: { xs: 32, md: 36 }, 
          height: { xs: 32, md: 36 }, 
          borderRadius: 2, 
          bgcolor: COLORS.primary, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: '#fff' 
        }}>
          <FontAwesomeIcon icon={faHeartbeat} />
        </Box>
        <Typography sx={{ 
          fontSize: { xs: '1rem', md: '1.125rem' }, 
          fontWeight: 700, 
          color: COLORS.slate[900] 
        }}>
          Live Status
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        <Grid item xs={6} md={3}>
          <StatCard value={s.totalAmbulances} label="Total Ambulances" color={COLORS.primary} icon={<FontAwesomeIcon icon={faAmbulance} />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard value={s.availableAmbulances} label="Available" color={COLORS.success} icon={<FontAwesomeIcon icon={faCheckCircle} />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard value={s.inUseAmbulances} label="In Use" color={COLORS.warning} icon={<FontAwesomeIcon icon={faBolt} />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard value={s.activeAssignments} label="Active Assignments" color={COLORS.accent} icon={<FontAwesomeIcon icon={faUserMd} />} />
        </Grid>
      </Grid>

      {/* Availability & Response Time */}
      <Box sx={{ 
        mt: { xs: 2, md: 3 }, 
        bgcolor: '#fff', 
        borderRadius: 2, 
        p: { xs: 2, md: 3 }, 
        border: `1px solid ${COLORS.slate[200]}` 
      }}>
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 1, md: 1.5 } }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: COLORS.slate[700], 
                fontSize: { xs: '0.8rem', md: '0.875rem' } 
              }}>
                Fleet Availability
              </Typography>
              <Chip 
                label={`${pct}%`} 
                size="small" 
                sx={{ 
                  fontWeight: 700, 
                  bgcolor: COLORS.success, 
                  color: '#fff', 
                  height: { xs: 22, md: 24 },
                  fontSize: { xs: '0.7rem', md: '0.75rem' },
                }} 
              />
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={pct} 
              sx={{ 
                height: { xs: 6, md: 8 }, 
                borderRadius: 1, 
                bgcolor: COLORS.slate[200], 
                '& .MuiLinearProgress-bar': { borderRadius: 1, bgcolor: COLORS.success } 
              }} 
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1.5, md: 2 }, 
              p: { xs: 1.5, md: 2 }, 
              borderRadius: 2, 
              bgcolor: COLORS.slate[50] 
            }}>
              <Box sx={{ 
                width: { xs: 36, md: 44 }, 
                height: { xs: 36, md: 44 }, 
                borderRadius: 2, 
                bgcolor: COLORS.primary, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#fff',
                flexShrink: 0,
              }}>
                <FontAwesomeIcon icon={faClock} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ 
                  fontSize: { xs: '0.65rem', md: '0.7rem' }, 
                  color: COLORS.slate[500], 
                  fontWeight: 600, 
                  textTransform: 'uppercase' 
                }}>
                  Current Response
                </Typography>
                <Typography sx={{ 
                  fontSize: { xs: '1rem', md: '1.25rem' }, 
                  fontWeight: 700, 
                  color: COLORS.slate[900] 
                }}>
                  {s.responseTime} min
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography sx={{ 
                  fontSize: { xs: '0.65rem', md: '0.7rem' }, 
                  color: COLORS.slate[500], 
                  fontWeight: 600, 
                  textTransform: 'uppercase' 
                }}>
                  Avg Today
                </Typography>
                <Typography sx={{ 
                  fontSize: { xs: '1rem', md: '1.25rem' }, 
                  fontWeight: 700, 
                  color: COLORS.slate[900] 
                }}>
                  {s.averageResponseTime} min
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default EMSLiveStatus;
