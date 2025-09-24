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
import ViewSwitcher, { ChartType } from './ViewSwitcher';
import FlexibleChart from './FlexibleChart';
import HeatmapChartComponent from './charts/HeatmapChartComponent';

interface VisualAnalyticsProps {
  data: CommandCenterData | null;
  language: 'en' | 'ar';
}

const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({ data, language }) => {
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  if (!data) return null;

  const handleChartTypeChange = (newChartType: ChartType) => {
    setChartType(newChartType);
  };

  const handleTimePeriodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTimePeriod: 'daily' | 'weekly' | 'monthly' | null,
  ) => {
    if (newTimePeriod !== null) {
      setTimePeriod(newTimePeriod);
    }
  };


  // Transform chart data for Recharts
  const transformChartData = (chartData: any) => {
    if (!chartData || !chartData.labels || !chartData.datasets) return [];
    
    return chartData.labels.map((label: string, index: number) => ({
      name: label,
      value: chartData.datasets[0]?.data[index] || 0,
      color: chartData.datasets[0]?.backgroundColor?.[index] || '#2196f3',
    }));
  };

  const transformTrendData = (chartData: any) => {
    if (!chartData || !chartData.labels || !chartData.datasets) return [];
    
    return chartData.labels.map((label: string, index: number) => ({
      name: label,
      value: chartData.datasets[0]?.data[index] || 0,
      target: 90, // D2B target
    }));
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          {language === 'ar' ? 'التحليلات المرئية' : 'Visual Analytics'}
        </Typography>
        
        <Box display="flex" gap={2} alignItems="center">
          <ViewSwitcher
            chartType={chartType}
            onChartTypeChange={handleChartTypeChange}
            language={language}
          />

          <ToggleButtonGroup
            value={timePeriod}
            exclusive
            onChange={handleTimePeriodChange}
            size="small"
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
          <FlexibleChart
            data={transformChartData(data?.charts.referralSource)}
            title={language === 'ar' ? 'توزيع حالات STEMI حسب مصدر الإحالة' : 'STEMI Cases by Referral Source'}
            chartType={chartType}
            colors={['#4caf50', '#2196f3']}
          />
        </Grid>

        {/* PCI Cases Breakdown */}
        <Grid item xs={12} md={6}>
          <FlexibleChart
            data={transformChartData(data?.charts.pciBreakdown)}
            title={language === 'ar' ? 'توزيع حالات PCI' : 'PCI Cases Breakdown'}
            chartType={chartType}
            colors={['#ff9800', '#9c27b0', '#607d8b']}
          />
        </Grid>

        {/* DIDO Compliance */}
        <Grid item xs={12} md={6}>
          <FlexibleChart
            data={transformChartData(data?.charts.didoCompliance)}
            title={language === 'ar' ? 'امتثال DIDO لعمليات PCI الأولية' : 'DIDO Compliance for Primary PCI Transfers'}
            chartType={chartType}
            colors={['#4caf50', '#f44336']}
          />
        </Grid>

        {/* Treatment Distribution */}
        <Grid item xs={12} md={6}>
          <FlexibleChart
            data={transformChartData(data?.charts.treatmentDistribution)}
            title={language === 'ar' ? 'توزيع العلاج المدمج' : 'Combined Treatment Distribution'}
            chartType={chartType}
            colors={['#2196f3', '#ff9800', '#4caf50', '#9e9e9e']}
          />
        </Grid>

        {/* Patient Outcomes */}
        <Grid item xs={12} md={6}>
          <FlexibleChart
            data={transformChartData(data?.charts.outcomes)}
            title={language === 'ar' ? 'توزيع نتائج المرضى' : 'Patient Outcomes Distribution'}
            chartType={chartType}
            colors={['#4caf50', '#8bc34a', '#ffc107', '#ff9800', '#f44336']}
          />
        </Grid>

        {/* Hospital Performance */}
        <Grid item xs={12} md={6}>
          <FlexibleChart
            data={transformChartData(data?.charts.hospitalPerformance)}
            title={language === 'ar' ? 'توزيع أداء المستشفيات' : 'Hospital Performance Distribution'}
            chartType={chartType}
            colors={['#2196f3']}
          />
        </Grid>

        {/* Trends Chart */}
        <Grid item xs={12}>
          <FlexibleChart
            data={transformTrendData(data?.charts.trends)}
            title={language === 'ar' ? `اتجاهات ${timePeriod} مع مقارنة الأهداف` : `${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Trends vs Targets`}
            chartType="line"
            showTarget={true}
          />
        </Grid>

        {/* Hospital Performance Heatmap */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <HeatmapChartComponent
                data={transformChartData(data?.charts.heatmap)}
                title={language === 'ar' ? 'خريطة حرارية لأداء مستشفيات المنطقة الأولى - امتثال D2B' : 'Zone 1 Hospital D2B Compliance Heatmap'}
                threshold={90}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={3} p={2} sx={{ backgroundColor: '#e3f2fd', borderRadius: 1 }}>
        <Typography variant="body2" color="primary" textAlign="center">
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
