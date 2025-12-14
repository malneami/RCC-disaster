import React from 'react';
import {
  Grid,
  Box,
  Typography,
} from '@mui/material';
import {
  PieChart as AnalyticsIcon,
} from '@mui/icons-material';
import { CommandCenterData } from '../types';
import DonutChartComponent from './charts/DonutChartComponent';

interface VisualAnalyticsProps {
  data: CommandCenterData | null;
  language: 'en' | 'ar';
}

const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({ data, language }) => {
  if (!data) return null;

  // Transform chart data for DonutChartComponent
  const transformChartData = (chartData: any) => {
    if (!chartData || !chartData.labels || !chartData.datasets) {
      return [];
    }
    
    return chartData.labels.map((label: string, index: number) => ({
      name: label,
      value: chartData.datasets[0]?.data[index] || 0,
      color: chartData.datasets[0]?.backgroundColor?.[index] || '#2196f3',
    }));
  };

  // Selected 4 most important charts for 2x2 grid
  const chartConfigs = [
    {
      id: 'referralSource',
      data: transformChartData(data?.charts.referralSource),
      title: language === 'ar' ? 'مصدر الإحالة' : 'Referral Source',
      colors: ['#4caf50', '#2196f3'],
    },
    {
      id: 'treatmentDistribution',
      data: transformChartData(data?.charts.treatmentDistribution),
      title: language === 'ar' ? 'توزيع العلاج' : 'Treatment Distribution',
      colors: ['#2196f3', '#ff9800', '#9c27b0'],
    },
    {
      id: 'outcomes',
      data: transformChartData(data?.charts.outcomes),
      title: language === 'ar' ? 'نتائج المرضى' : 'Patient Outcomes',
      colors: ['#4caf50', '#f44336'],
    },
    {
      id: 'didoCompliance',
      data: transformChartData(data?.charts.didoCompliance),
      title: language === 'ar' ? 'امتثال DIDO' : 'DIDO Compliance',
      colors: ['#4caf50', '#f44336'],
    },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      {/* Section Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <AnalyticsIcon sx={{ color: '#64b5f6', fontSize: 28 }} />
        <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 600 }}>
          {language === 'ar' ? 'التحليلات' : 'Analytics'}
        </Typography>
      </Box>

      {/* 2x2 Chart Grid */}
      <Grid container spacing={3}>
        {chartConfigs.map((config) => (
          <Grid item xs={12} sm={6} key={config.id}>
            <DonutChartComponent
              data={config.data}
              title={config.title}
              colors={config.colors}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default VisualAnalytics;
