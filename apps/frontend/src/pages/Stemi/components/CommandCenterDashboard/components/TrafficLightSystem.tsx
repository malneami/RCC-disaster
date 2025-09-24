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

  const complianceMetrics = data.kpis.map(kpi => ({
    name: kpi.name,
    value: kpi.value,
    target: kpi.target,
    status: kpi.status,
  }));

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        {language === 'ar' ? 'نظام إشارات المرور للامتثال' : 'Traffic Light Compliance System'}
      </Typography>

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
                  backgroundColor: isMet ? '#e8f5e8' : metric.value >= metric.target * 0.8 ? '#fff3e0' : '#ffebee',
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

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {metric.name}
                </Typography>

                <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                  {metric.value}%
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {language === 'ar' ? 'الهدف' : 'Target'}: {metric.target}%
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={(metric.value / metric.target) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: isMet ? '#4caf50' : metric.value >= metric.target * 0.8 ? '#ff9800' : '#f44336',
                    },
                  }}
                />

                <Box mt={1}>
                  <Chip
                    label={status.label}
                    color={status.color as any}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      <Box mt={3} p={2} sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {language === 'ar' 
            ? '🟢 ممتاز (90%+) | 🟡 جيد (75-89%) | 🔴 يحتاج تحسين (<75%)'
            : '🟢 Excellent (90%+) | 🟡 Good (75-89%) | 🔴 Needs Improvement (<75%)'
          }
        </Typography>
      </Box>
    </Paper>
  );
};

export default TrafficLightSystem;
