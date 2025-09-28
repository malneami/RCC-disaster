 import React, { useState } from 'react';
import {
  Paper,
  Grid,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
} from '@mui/material';
import { CommandCenterData } from '../types';
import DonutChartComponent from './charts/DonutChartComponent';
import HeatmapChartComponent from './charts/HeatmapChartComponent';

interface VisualAnalyticsProps {
  data: CommandCenterData | null;
  language: 'en' | 'ar';
}

const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({ data, language }) => {
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  if (!data) return null;

  const handleTimePeriodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTimePeriod: 'daily' | 'weekly' | 'monthly' | null,
  ) => {
    if (newTimePeriod !== null) {
      setTimePeriod(newTimePeriod);
    }
  };


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

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3,
        backgroundColor: '#1e1e1e',
        color: '#ffffff',
        border: '1px solid #333333'
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" sx={{ color: '#ffffff' }}>
          {language === 'ar' ? 'التحليلات المرئية' : 'Visual Analytics'}
        </Typography>
        
        <Box display="flex" gap={2} alignItems="center">
          <ToggleButtonGroup
            value={timePeriod}
            exclusive
            onChange={handleTimePeriodChange}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: '#ffffff',
                borderColor: '#555555',
                '&.Mui-selected': {
                  backgroundColor: '#1976d2',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              },
            }}
          >
            <ToggleButton value="daily">
              {language === 'ar' ? 'يومي' : 'Daily'}
            </ToggleButton>
            <ToggleButton value="weekly">
              {language === 'ar' ? 'أسبوعي' : 'Weekly'}
            </ToggleButton>
            <ToggleButton value="monthly">
              {language === 'ar' ? 'شهري' : 'Monthly'}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Referral Source Distribution */}
        <Grid item xs={12} md={6}>
          <DonutChartComponent
            data={transformChartData(data?.charts.referralSource)}
            title={language === 'ar' ? 'توزيع حالات STEMI حسب مصدر الإحالة' : 'STEMI Cases by Referral Source'}
            colors={['#4caf50', '#2196f3']}
          />
        </Grid>

        {/* PCI Cases Breakdown */}
        <Grid item xs={12} md={6}>
          <DonutChartComponent
            data={transformChartData(data?.charts.pciBreakdown)}
            title={language === 'ar' ? 'توزيع حالات PCI' : 'PCI Cases Breakdown'}
            colors={['#ff9800', '#9c27b0', '#607d8b']}
          />
        </Grid>

        {/* DIDO Compliance */}
        <Grid item xs={12} md={6}>
          <DonutChartComponent
            data={transformChartData(data?.charts.didoCompliance)}
            title={language === 'ar' ? 'امتثال DIDO لعمليات PCI الأولية' : 'DIDO Compliance for Primary PCI Transfers'}
            colors={['#4caf50', '#f44336']}
          />
        </Grid>

        {/* Treatment Distribution */}
        <Grid item xs={12} md={6}>
          <DonutChartComponent
            data={transformChartData(data?.charts.treatmentDistribution)}
            title={language === 'ar' ? 'توزيع العلاج' : 'Treatment Distribution'}
            colors={['#2196f3', '#ff9800']}
          />
        </Grid>

        {/* Patient Outcomes */}
        <Grid item xs={12} md={6}>
          <DonutChartComponent
            data={transformChartData(data?.charts.outcomes)}
            title={language === 'ar' ? 'توزيع نتائج المرضى' : 'Patient Outcomes Distribution'}
            colors={['#4caf50', '#f44336']}
          />
        </Grid>

        {/* Hospital Performance */}
        <Grid item xs={12} md={6}>
          <DonutChartComponent
            data={transformChartData(data?.charts.hospitalPerformance)}
            title={language === 'ar' ? 'توزيع أداء المستشفيات' : 'Hospital Performance Distribution'}
            // colors={['#4caf50', '#4caf50', '#ff9800', '#9c27b0', '#f44336', '#607d8b', '#795548', '#009688']}
          />
        </Grid>

        {/* Hospital Performance Heatmap */}
        <Grid item xs={12}>
          <Card sx={{ 
            backgroundColor: '#1a1a1a',
            border: '1px solid #333333'
          }}>
            <CardContent sx={{ backgroundColor: '#1a1a1a' }}>
              <HeatmapChartComponent
                data={transformChartData(data?.charts.heatmap)}
                title={language === 'ar' ? 'خريطة حرارية لأداء مستشفيات المنطقة الأولى - امتثال D2B' : 'Zone 1 Hospital D2B Compliance Heatmap'}
                threshold={90}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={3} p={2} sx={{ 
        backgroundColor: '#2a3f5f', 
        borderRadius: 1,
        border: '1px solid #444444'
      }}>
        <Typography variant="body2" sx={{ 
          color: '#64b5f6', 
          textAlign: 'center' 
        }}>
          {language === 'ar' 
            ? '💡 جميع الرسوم البيانية تفاعلية مع إمكانية التمرير والتفاصيل عند النقر'
            : '💡 All charts are interactive with hover tooltips and clickable details'
          }
        </Typography>
      </Box>
    </Paper>
  );
};

export default VisualAnalytics;
