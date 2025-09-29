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
  Person as PersonIcon,
  Scanner as ScannerIcon,
  Assignment as AssignmentIcon,
  Medication as MedicationIcon,
  Settings as SettingsIcon,
  LocalHospital as HospitalIcon,
  Psychology,
} from '@mui/icons-material';
import { StrokeCommandCenterData } from '../types';

interface TrafficLightSystemProps {
  data: StrokeCommandCenterData | null;
  language: 'en' | 'ar';
}

const StrokeTrafficLightSystem: React.FC<TrafficLightSystemProps> = ({
  data,
  language,
}) => {
  if (!data) return null;

  const getComplianceStatus = (percentage: number) => {
    if (percentage >= 90) return { color: 'success', icon: CheckIcon, label: language === 'ar' ? 'ممتاز' : 'Excellent' };
    if (percentage >= 75) return { color: 'warning', icon: WarningIcon, label: language === 'ar' ? 'جيد' : 'Good' };
    return { color: 'error', icon: ErrorIcon, label: language === 'ar' ? 'يحتاج تحسين' : 'Needs Improvement' };
  };

  const strokeKPIs = data.kpis.map(kpi => {
    const iconMap: { [key: string]: React.ReactElement } = {
      doorToPhysician: <PersonIcon />,
      doorToCT: <ScannerIcon />,
      doorToNeedle: <MedicationIcon />,
      doorToMechanicalThrombectomy: <SettingsIcon />,
      strokeUnitAdmission: <HospitalIcon />,
      doorToCTReport: <AssignmentIcon />,
      swallowingScreening: <Psychology sx={{ fontSize: 24 }} />,
    };

    const nameMap: { [key: string]: { en: string; ar: string } } = {
      doorToPhysician: { en: 'Door to Physician', ar: 'من الباب إلى الطبيب' },
      doorToCT: { en: 'Door to CT Scan', ar: 'من الباب إلى الأشعة المقطعية' },
      doorToNeedle: { en: 'Door to Needle', ar: 'من الباب إلى الإبرة' },
      doorToMechanicalThrombectomy: { en: 'Door to Mechanical Thrombectomy', ar: 'من الباب إلى استئصال الخثرة الميكانيكي' },
      strokeUnitAdmission: { en: 'Stroke Unit Admission', ar: 'قبول وحدة السكتة الدماغية' },
      doorToCTReport: { en: 'Door to CT Report', ar: 'من الباب إلى تقرير الأشعة' },
      swallowingScreening: { en: 'Swallowing Screening', ar: 'فحص البلع' },
    };

      const targetMap: { [key: string]: string } = {
        doorToPhysician: '≤15min',
        doorToCT: '≤25min', 
        doorToNeedle: '≤60min',
        doorToMechanicalThrombectomy: '≤120min',
        strokeUnitAdmission: '≥80%',
        doorToCTReport: '≤45min',
        swallowingScreening: '≥85%',
      };

      return {
        id: kpi.id,
        name: language === 'ar' ? nameMap[kpi.id]?.ar || kpi.name : nameMap[kpi.id]?.en || kpi.name,
        icon: iconMap[kpi.id] || <PersonIcon />,
        target: targetMap[kpi.id] || kpi.target,
        value: kpi.currentValue,
        targetValue: kpi.targetValue,
        percentage: kpi.percentage,
        status: kpi.status,
      };
  });

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
      <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#ffffff' }}>
        {language === 'ar' ? 'نظام إشارات المرور للكفاءات' : 'Traffic Light System for KPIs'}
      </Typography>

      <Grid container spacing={3}>
        {strokeKPIs.map((kpi, index) => {
          const isTargetMet = kpi.status === 'GREEN';
          const performancePercentage = kpi.percentage;

          const status = getComplianceStatus(performancePercentage);

          return (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Box
                sx={{
                  p: 3,
                  border: `2px solid ${
                    isTargetMet ? '#4caf50' : performancePercentage >= 75 ? '#ff9800' : '#f44336'
                  }`,
                  borderRadius: 2,
                  backgroundColor: isTargetMet ? '#2d4a2d' : performancePercentage >= 75 ? '#4a3c2a' : '#4a2d2d',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 2,
                  },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Box display="flex" justifyContent="center" mb={2}>
                    <Box
                      sx={{
                        backgroundColor: `${isTargetMet ? '#4caf50' : performancePercentage >= 75 ? '#ff9800' : '#f44336'}20`,
                        borderRadius: '50%',
                        width: 60,
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isTargetMet ? '#4caf50' : performancePercentage >= 75 ? '#ff9800' : '#f44336',
                      }}
                    >
                      {React.cloneElement(kpi.icon, { sx: { fontSize: 30 } })}
                    </Box>
                  </Box>

                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#ffffff', mb: 2 }}>
                    {kpi.name}
                  </Typography>

                  <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#64b5f6' }}>
                    {Math.round(performancePercentage * 10) / 10}%
                  </Typography>

                  <Typography variant="body2" gutterBottom sx={{ color: '#b0b0b0', mb: 2 }}>
                    {language === 'ar' ? 'الهدف' : 'Target'}: {kpi.target}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(performancePercentage, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#444444',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: isTargetMet ? '#4caf50' : performancePercentage >= 75 ? '#ff9800' : '#f44336',
                        },
                      }}
                    />
                  </Box>
                </Box>

                <Box>
                  <Chip
                    label={status.label}
                    size="small"
                    sx={{ 
                      fontWeight: 'bold',
                      backgroundColor: isTargetMet ? '#2e7d32' : performancePercentage >= 75 ? '#f57c00' : '#d32f2f',
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

export default StrokeTrafficLightSystem;
