import React from 'react';
import {
  Paper,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { StrokeCommandCenterData } from '../types';

interface AdmissionOutcomesProps {
  data: StrokeCommandCenterData | null;
  language: 'en' | 'ar';
}

const AdmissionFollowupCharts: React.FC<AdmissionOutcomesProps> = ({ data, language }) => {
  if (!data) return null;

  const getTargetStatus = (current: number, target: number) => {
    if (current >= target) {
      return { status: 'success', label: language === 'ar' ? 'تم تحقيق الهدف' : 'Target Met' };
    } else if (current >= target * 0.8) {
      return { status: 'warning', label: language === 'ar' ? 'قريب من الهدف' : 'Near Target' };
    } else {
      return { status: 'error', label: language === 'ar' ? 'أقل من الهدف' : 'Below Target' };
    }
  };

  const strokeUnitStatus = getTargetStatus(
    data.admissionFollowup.strokeUnitAdmission.successRate,
    data.admissionFollowup.strokeUnitAdmission.target
  );

  const followUpStatus = getTargetStatus(
    data.admissionFollowup.followUpOutcomes.successRate,
    data.admissionFollowup.followUpOutcomes.target
  );

  const strokeUnitPercentage = data.admissionFollowup.strokeUnitAdmission.successRate;
  const followUpPercentage = data.admissionFollowup.followUpOutcomes.successRate;

  const metrics = [
    {
      title: language === 'ar' ? 'أداء قبول وحدة السكتة الدماغية' : 'Stroke Unit Admission Performance',
      icon: <HospitalIcon sx={{ fontSize: 40, color: '#64b5f6' }} />,
      percentage: strokeUnitPercentage,
      target: data.admissionFollowup.strokeUnitAdmission.target,
      status: strokeUnitStatus,
      details: {
        total: data.admissionFollowup.strokeUnitAdmission.total,
        achieved: data.admissionFollowup.strokeUnitAdmission.admitted,
        unit: language === 'ar' ? 'مرضى حاد' : 'acute patients',
      },
      color: '#64b5f6',
      bgColor: '#2a3f5f',
    },
    {
      title: language === 'ar' ? 'أداء متابعة النتائج' : 'Follow-Up Outcomes Performance',
      icon: <AssignmentIcon sx={{ fontSize: 40, color: '#81c784' }} />,
      percentage: followUpPercentage,
      target: data.admissionFollowup.followUpOutcomes.target,
      status: followUpStatus,
      details: {
        total: data.admissionFollowup.followUpOutcomes.total,
        achieved: data.admissionFollowup.followUpOutcomes.completed,
        unit: language === 'ar' ? 'مرضى' : 'patients',
      },
      color: '#81c784',
      bgColor: '#2d4a2d',
    },
  ];

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
        {language === 'ar' ? 'القبول والنتائج' : 'Admission & Outcomes'}
      </Typography>

      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ 
              backgroundColor: metric.bgColor,
              border: '1px solid #444444',
              height: '100%',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        backgroundColor: `${metric.color}20`,
                        borderRadius: '50%',
                        width: 60,
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {metric.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                        {metric.title}
                      </Typography>
                      <Chip
                        label={metric.status.label}
                        color={metric.status.status as any}
                        size="small"
                        sx={{ fontWeight: 'bold', mt: 1 }}
                      />
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h3" sx={{ color: metric.color, fontWeight: 'bold' }}>
                      {Math.round(metric.percentage * 10) / 10}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      {language === 'ar' ? 'الهدف' : 'Target'}: {metric.target}%
                    </Typography>
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((metric.percentage / metric.target) * 100, 100)}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: '#444444',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: metric.status.status === 'success' ? '#4caf50' : 
                                         metric.status.status === 'warning' ? '#ff9800' : '#f44336',
                      },
                    }}
                  />
                </Box>

                <Box sx={{ 
                  backgroundColor: '#2a2a2a', 
                  p: 2, 
                  borderRadius: 1,
                  border: '1px solid #444444'
                }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                    {language === 'ar' ? 'التفاصيل' : 'Details'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#ffffff' }}>
                      {language === 'ar' ? 'إجمالي' : 'Total'}: {metric.details.total} {metric.details.unit}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ffffff' }}>
                      {language === 'ar' ? 'محقق' : 'Achieved'}: {metric.details.achieved}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default AdmissionFollowupCharts;
