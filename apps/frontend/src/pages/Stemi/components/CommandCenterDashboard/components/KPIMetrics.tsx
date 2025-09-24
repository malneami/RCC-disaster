import React from 'react';
import {
  Paper,
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import { CommandCenterData, KPIMetric } from '../types';

interface KPIMetricsProps {
  data: CommandCenterData | null;
  language: 'en' | 'ar';
}

const KPIMetrics: React.FC<KPIMetricsProps> = ({ data, language }) => {
  if (!data) return null;

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="success" />;
      case 'down':
        return <TrendingDownIcon color="error" />;
      default:
        return <TrendingFlatIcon color="action" />;
    }
  };

  const getStatusColor = (status: 'met' | 'missed' | 'warning') => {
    switch (status) {
      case 'met':
        return 'success';
      case 'warning':
        return 'warning';
      default:
        return 'error';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') return `${value}%`;
    if (unit === 'min') return `${value} min`;
    if (unit === 'cases') return value.toLocaleString();
    return `${value} ${unit}`;
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        {language === 'ar' ? 'مؤشرات الأداء الرئيسية' : 'Key Performance Indicators'}
      </Typography>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: '#e3f2fd' }}>
                <CardContent>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {data.summary.totalCases}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {language === 'ar' ? 'إجمالي حالات STEMI' : 'Total STEMI Cases'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: '#e8f5e8' }}>
                <CardContent>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {data.summary.totalPCI}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {language === 'ar' ? 'إجمالي عمليات PCI' : 'Total PCI Procedures'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: '#fff3e0' }}>
                <CardContent>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {data.summary.mortalityRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {language === 'ar' ? 'معدل الوفيات' : 'Mortality Rate'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: '#f3e5f5' }}>
                <CardContent>
                  <Typography variant="h4" color="secondary.main" fontWeight="bold">
                    {data.summary.complianceRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {language === 'ar' ? 'معدل الامتثال' : 'Compliance Rate'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Detailed KPI Metrics */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            {language === 'ar' ? 'تفاصيل مؤشرات الأداء' : 'Detailed Performance Metrics'}
          </Typography>
          
          <Grid container spacing={2}>
            {data.kpis.map((kpi: KPIMetric, index: number) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {kpi.name}
                      </Typography>
                      {getTrendIcon(kpi.trend)}
                    </Box>

                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {formatValue(kpi.value, kpi.unit)}
                      </Typography>
                      <Chip
                        label={language === 'ar' ? 'الهدف' : 'Target'}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {formatValue(kpi.target, kpi.unit)}
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={Math.min((kpi.value / kpi.target) * 100, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: kpi.status === 'met' ? '#4caf50' : kpi.status === 'warning' ? '#ff9800' : '#f44336',
                        },
                      }}
                    />

                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <Chip
                        label={kpi.status === 'met' 
                          ? (language === 'ar' ? 'محقق' : 'Met')
                          : kpi.status === 'warning'
                          ? (language === 'ar' ? 'تحذير' : 'Warning')
                          : (language === 'ar' ? 'غير محقق' : 'Missed')
                        }
                        color={getStatusColor(kpi.status) as any}
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {kpi.percentage}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default KPIMetrics;
