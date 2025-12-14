import React from 'react';
import {
  Box,
  Grid,
  Typography,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Cancel as ErrorIcon,
  Speed as PerformanceIcon,
} from '@mui/icons-material';
import { CommandCenterData } from '../types';

interface TrafficLightSystemProps {
  data: CommandCenterData | null;
  language: 'en' | 'ar';
}

// Shared styling constants
const CARD_STYLES = {
  borderRadius: '12px',
  padding: '20px',
  minHeight: '160px',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
  },
};

const TrafficLightSystem: React.FC<TrafficLightSystemProps> = ({
  data,
  language,
}) => {
  if (!data) return null;

  // Short names for cleaner display
  const getShortName = (id: string, fullName: string): string => {
    const shortNames: Record<string, string> = {
      'd2b-direct': 'D2B Direct',
      'd2b-transfer': 'D2B Transfer',
      'd2ecg': 'Door-to-ECG',
      'd2n': 'Door-to-Needle',
      'dido': 'DIDO',
      'rcc-activation': 'RCC Activation',
      'mortality': 'Mortality',
      'follow-up-call': 'Follow-up Call',
    };
    return shortNames[id] || fullName;
  };

  // Target descriptions for tooltips
  const getTargetDescription = (id: string, target: number, isLowerBetter: boolean): string => {
    const descriptions: Record<string, string> = {
      'd2b-direct': language === 'ar' ? 'وقت الباب إلى البالون للحالات المباشرة ≤90 دقيقة' : 'Door-to-Balloon time for direct cases ≤90 minutes',
      'd2b-transfer': language === 'ar' ? 'وقت الباب إلى البالون للحالات المحولة ≤120 دقيقة' : 'Door-to-Balloon time for transfer cases ≤120 minutes',
      'd2ecg': language === 'ar' ? 'وقت الباب إلى رسم القلب ≤10 دقائق' : 'Door-to-ECG time ≤10 minutes',
      'd2n': language === 'ar' ? 'وقت الباب إلى الإبرة ≤30 دقيقة' : 'Door-to-Needle time ≤30 minutes',
      'dido': language === 'ar' ? 'وقت الدخول إلى الخروج ≤30 دقيقة' : 'Door-In-Door-Out time ≤30 minutes',
      'rcc-activation': language === 'ar' ? 'وقت التفعيل إلى الخروج ≤15 دقيقة' : 'Activation to Door-Out ≤15 minutes',
      'mortality': language === 'ar' ? 'معدل الوفيات ≤5%' : 'Mortality rate ≤5%',
      'follow-up-call': language === 'ar' ? 'معدل إكمال مكالمات المتابعة' : 'Follow-up call completion rate',
    };
    return descriptions[id] || `Target: ${isLowerBetter ? '≤' : '≥'}${target}%`;
  };

  const complianceMetrics = data.kpis
    .filter(kpi => kpi.id !== 'pciSuccess')
    .map(kpi => ({
      id: kpi.id,
      name: getShortName(kpi.id, kpi.name),
      fullName: kpi.name,
      value: kpi.value,
      target: kpi.target,
      status: kpi.status,
      isLowerBetter: kpi.id === 'mortality',
    }));

  return (
    <Box sx={{ mb: 4 }}>
      {/* Section Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <PerformanceIcon sx={{ color: '#64b5f6', fontSize: 28 }} />
        <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 600 }}>
          {language === 'ar' ? 'مؤشرات الامتثال' : 'Performance Indicators'}
        </Typography>
      </Box>

      {/* Uniform 4-column Grid */}
      <Grid container spacing={2.5}>
        {complianceMetrics.map((metric) => {
          const isMet = metric.status === 'met';
          const isWarning = metric.status === 'warning';
          
          // Calculate progress bar value
          const progressValue = metric.isLowerBetter 
            ? Math.max(0, Math.min(100, 100 - (metric.value / (metric.target * 2)) * 100))
            : Math.min(100, (metric.value / metric.target) * 100);

          // Colors based on status
          const statusColor = isMet ? '#4caf50' : isWarning ? '#ff9800' : '#f44336';
          const bgGradient = isMet 
            ? 'linear-gradient(135deg, #1a3c1a 0%, #2d4a2d 100%)'
            : isWarning 
              ? 'linear-gradient(135deg, #3c3a1a 0%, #4a3c2a 100%)'
              : 'linear-gradient(135deg, #3c1a1a 0%, #4a2d2d 100%)';

          const StatusIcon = isMet ? CheckIcon : isWarning ? WarningIcon : ErrorIcon;

          return (
            <Grid item xs={12} sm={6} md={3} key={metric.id}>
              <Tooltip 
                title={getTargetDescription(metric.id, metric.target, metric.isLowerBetter)} 
                arrow 
                placement="top"
              >
                <Box
                  sx={{
                    ...CARD_STYLES,
                    background: bgGradient,
                    border: `2px solid ${statusColor}`,
                    cursor: 'pointer',
                  }}
                >
                  {/* Header with Icon and Status */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        color: '#ffffff', 
                        fontWeight: 600,
                        fontSize: '1rem',
                        lineHeight: 1.3,
                      }}
                    >
                      {metric.name}
                    </Typography>
                    <StatusIcon sx={{ color: statusColor, fontSize: 24, flexShrink: 0, ml: 1 }} />
                  </Box>

                  {/* Value */}
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      color: statusColor, 
                      fontWeight: 700,
                      fontSize: '2.25rem',
                      lineHeight: 1.1,
                      mb: 1,
                    }}
                  >
                    {Math.round(metric.value * 10) / 10}%
                  </Typography>

                  {/* Target */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.85rem',
                      mb: 1.5,
                    }}
                  >
                    {language === 'ar' ? 'الهدف' : 'Target'}: {metric.isLowerBetter ? '≤' : '≥'}{Math.round(metric.target)}%
                  </Typography>

                  {/* Progress Bar */}
                  <LinearProgress
                    variant="determinate"
                    value={progressValue}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: statusColor,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>

      {/* Legend */}
      <Box 
        sx={{ 
          mt: 3, 
          p: 2, 
          backgroundColor: 'rgba(255,255,255,0.03)', 
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'center',
          gap: 4,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#4caf50' }} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {language === 'ar' ? 'ممتاز (≥90%)' : 'Excellent (≥90%)'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff9800' }} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {language === 'ar' ? 'يحتاج تحسين (75-89%)' : 'Needs Work (75-89%)'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f44336' }} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {language === 'ar' ? 'ضعيف (<75%)' : 'Below Target (<75%)'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default TrafficLightSystem;
