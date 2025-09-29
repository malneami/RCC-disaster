import React from 'react';
import {
  Paper,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { StrokeCommandCenterData } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PerformanceChartsProps {
  data: StrokeCommandCenterData | null;
  language: 'en' | 'ar';
}

const TherapyPerformanceCharts: React.FC<PerformanceChartsProps> = ({ data, language }) => {
  if (!data) return null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff',
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: '#1e1e1e',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#333333',
        borderWidth: 1,
      },
    },
  };

  // Thrombolytic Therapy Performance
  const thrombolyticTherapyData = {
    labels: [
      language === 'ar' ? 'معالج' : 'Treated',
      language === 'ar' ? 'غير معالج' : 'Not Treated'
    ],
    datasets: [
      {
        data: [
          data.therapyPerformance.thrombolyticTherapy.treated,
          data.therapyPerformance.thrombolyticTherapy.total - data.therapyPerformance.thrombolyticTherapy.treated
        ],
        backgroundColor: [
          '#81c784', // Green for treated
          '#f06292', // Pink for not treated
        ],
        borderColor: '#1e1e1e',
        borderWidth: 2,
      },
    ],
  };

  // Swallowing Screening Performance
  const swallowingScreeningData = {
    labels: [
      language === 'ar' ? 'مفحوص' : 'Screened',
      language === 'ar' ? 'غير مفحوص' : 'Not Screened'
    ],
    datasets: [
      {
        data: [
          data.therapyPerformance.swallowingScreening.screened,
          data.therapyPerformance.swallowingScreening.total - data.therapyPerformance.swallowingScreening.screened
        ],
        backgroundColor: [
          '#64b5f6', // Blue for screened
          '#ffb74d', // Orange for not screened
        ],
        borderColor: '#1e1e1e',
        borderWidth: 2,
      },
    ],
  };

  const getTargetStatus = (current: number, target: number) => {
    if (current >= target) {
      return { status: 'success', label: language === 'ar' ? 'تم تحقيق الهدف' : 'Target Met' };
    } else if (current >= target * 0.8) {
      return { status: 'warning', label: language === 'ar' ? 'قريب من الهدف' : 'Near Target' };
    } else {
      return { status: 'error', label: language === 'ar' ? 'أقل من الهدف' : 'Below Target' };
    }
  };

  const thrombolyticStatus = getTargetStatus(data.therapyPerformance.thrombolyticTherapy.successRate, data.therapyPerformance.thrombolyticTherapy.target);
  const swallowingStatus = getTargetStatus(data.therapyPerformance.swallowingScreening.successRate, data.therapyPerformance.swallowingScreening.target);

  const charts = [
    {
      title: language === 'ar' ? 'أداء العلاج الخثاري' : 'Thrombolytic Therapy Performance',
      data: thrombolyticTherapyData,
      successRate: data.therapyPerformance.thrombolyticTherapy.successRate,
      target: data.therapyPerformance.thrombolyticTherapy.target,
      status: thrombolyticStatus,
    },
    {
      title: language === 'ar' ? 'أداء فحص البلع' : 'Swallowing Screening Performance',
      data: swallowingScreeningData,
      successRate: data.therapyPerformance.swallowingScreening.successRate,
      target: data.therapyPerformance.swallowingScreening.target,
      status: swallowingStatus,
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
        {language === 'ar' ? 'مؤشرات الأداء' : 'Performance Metrics'}
      </Typography>

      <Grid container spacing={3}>
        {charts.map((chart, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ 
              backgroundColor: '#2a2a2a',
              border: '1px solid #444444',
              height: '100%',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#ffffff' }}>
                    {chart.title}
                  </Typography>
                  <Chip
                    label={chart.status.label}
                    color={chart.status.status as any}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
                
                <Box sx={{ height: 250, position: 'relative', mb: 2 }}>
                  <Doughnut data={chart.data} options={chartOptions} />
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
                    {Math.round(chart.successRate * 10) / 10}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    {language === 'ar' ? 'معدل النجاح' : 'Success Rate'} | {language === 'ar' ? 'الهدف' : 'Target'}: {chart.target}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default TherapyPerformanceCharts;
