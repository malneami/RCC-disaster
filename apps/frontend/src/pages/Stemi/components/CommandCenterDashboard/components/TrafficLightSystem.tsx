import React from 'react';
import {
  Paper,
  Grid,
  Box,
  Typography,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { CommandCenterData } from '../types';

interface TrafficLightSystemProps {
  data: CommandCenterData | null;
  language: 'en' | 'ar';
}

const TrafficLightSystem: React.FC<TrafficLightSystemProps> = ({
  data,
  language,
}) => {
  if (!data) return null;

  const getComplianceStatus = (percentage: number) => {
    if (percentage >= 90) return { color: 'success', icon: CheckIcon, label: language === 'ar' ? 'ممتاز' : 'Excellent' };
    if (percentage >= 75) return { color: 'warning', icon: WarningIcon, label: language === 'ar' ? 'جيد' : 'Good' };
    return { color: 'error', icon: ErrorIcon, label: language === 'ar' ? 'يحتاج تحسين' : 'Needs Improvement' };
  };

  const complianceMetrics = data.kpis
    .filter(kpi => kpi.id !== 'mortality') // Exclude mortality KPI
    .map(kpi => ({
      name: kpi.name,
      value: kpi.value,
      target: kpi.target,
      status: kpi.status,
    }));

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3, 
        mb: 3,
        backgroundColor: '#1e1e1e',
        color: '#ffffff',
        border: '1px solid #333333'
      }}
    >
      <Grid container spacing={3}>
        {complianceMetrics.map((metric, index) => {
          const status = getComplianceStatus(metric.value);
          const IconComponent = status.icon;
          const isMet = metric.value >= metric.target;

          return (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box
                sx={{
                  p: 2,
                  border: `2px solid ${
                    isMet ? '#4caf50' : metric.value >= metric.target * 0.8 ? '#ff9800' : '#f44336'
                  }`,
                  borderRadius: 2,
                  backgroundColor: isMet ? '#2d4a2d' : metric.value >= metric.target * 0.8 ? '#4a3c2a' : '#4a2d2d',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 2,
                  },
                }}
              >
                <Box display="flex" justifyContent="center" mb={1}>
                  <IconComponent
                    sx={{
                      fontSize: 40,
                      color: isMet ? '#4caf50' : metric.value >= metric.target * 0.8 ? '#ff9800' : '#f44336',
                    }}
                  />
                </Box>

                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#ffffff' }}>
                  {metric.name}
                </Typography>

                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#64b5f6' }}>
                  {Math.round(metric.value * 10) / 10}%
                </Typography>

                <Typography variant="body2" gutterBottom sx={{ color: '#b0b0b0' }}>
                  {language === 'ar' ? 'الهدف' : 'Target'}: {Math.round(metric.target * 10) / 10}%
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={(metric.value / metric.target) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#444444',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: isMet ? '#4caf50' : metric.value >= metric.target * 0.8 ? '#ff9800' : '#f44336',
                    },
                  }}
                />

                <Box mt={1}>
                  <Chip
                    label={status.label}
                    size="small"
                    sx={{ 
                      fontWeight: 'bold',
                      backgroundColor: isMet ? '#2e7d32' : metric.value >= metric.target * 0.8 ? '#f57c00' : '#d32f2f',
                      color: '#ffffff'
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      <Box mt={3} p={2} sx={{ backgroundColor: '#2a2a2a', borderRadius: 1, border: '1px solid #444444' }}>
        <Typography variant="body2" textAlign="center" sx={{ color: '#b0b0b0' }}>
          {language === 'ar' 
            ? '🟢 ممتاز (90.0%+) | 🟡 جيد (75.0-89.9%) | 🔴 يحتاج تحسين (<75.0%)'
            : '🟢 Excellent (90.0%+) | 🟡 Good (75.0-89.9%) | 🔴 Needs Improvement (<75.0%)'
          }
        </Typography>
      </Box>
    </Paper>
  );
};

export default TrafficLightSystem;
