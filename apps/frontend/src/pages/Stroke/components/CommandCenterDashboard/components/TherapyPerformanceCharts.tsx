import React from 'react';
import {
  Paper,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
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

// Error Boundary Component
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; language: 'en' | 'ar' },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; language: 'en' | 'ar' }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
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
            {this.props.language === 'ar' ? 'مؤشرات الأداء' : 'Performance Metrics'}
          </Typography>
          <Alert severity="error" sx={{ backgroundColor: '#2d1b1b', color: '#ffffff' }}>
            {this.props.language === 'ar' 
              ? 'حدث خطأ في عرض البيانات. يرجى المحاولة مرة أخرى.' 
              : 'An error occurred while displaying data. Please try again.'}
          </Alert>
        </Paper>
      );
    }

    return this.props.children;
  }
}

interface PerformanceChartsProps {
  data: StrokeCommandCenterData | null;
  language: 'en' | 'ar';
}

const TherapyPerformanceChartsComponent: React.FC<PerformanceChartsProps> = ({ data, language }) => {
  // Comprehensive data validation and safeguards
  if (!data || !data.therapyPerformance) {
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
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" sx={{ color: '#b0b0b0' }}>
            {language === 'ar' ? 'لا توجد بيانات متاحة' : 'No data available'}
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Safeguard: Validate therapy performance data structure
  const therapyData = data.therapyPerformance;
  if (!therapyData.thrombolyticTherapy || !therapyData.swallowingScreening) {
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
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" sx={{ color: '#b0b0b0' }}>
            {language === 'ar' ? 'بيانات الأداء غير مكتملة' : 'Incomplete performance data'}
          </Typography>
        </Box>
      </Paper>
    );
  }

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

  // Safeguard: Safe data extraction with fallbacks
  const thrombolyticData = {
    treated: Math.max(0, therapyData.thrombolyticTherapy.treated || 0),
    total: Math.max(0, therapyData.thrombolyticTherapy.total || 0),
    successRate: Math.max(0, Math.min(100, therapyData.thrombolyticTherapy.successRate || 0)),
    target: Math.max(0, therapyData.thrombolyticTherapy.target || 5)
  };

  const swallowingData = {
    screened: Math.max(0, therapyData.swallowingScreening.screened || 0),
    total: Math.max(0, therapyData.swallowingScreening.total || 0),
    successRate: Math.max(0, Math.min(100, therapyData.swallowingScreening.successRate || 0)),
    target: Math.max(0, therapyData.swallowingScreening.target || 85)
  };

  // Safeguard: Prevent negative values in chart data
  const thrombolyticNotTreated = Math.max(0, thrombolyticData.total - thrombolyticData.treated);
  const swallowingNotScreened = Math.max(0, swallowingData.total - swallowingData.screened);

  // Thrombolytic Therapy Performance
  const thrombolyticTherapyData = {
    labels: [
      language === 'ar' ? 'معالج' : 'Treated',
      language === 'ar' ? 'غير معالج' : 'Not Treated'
    ],
    datasets: [
      {
        data: [
          thrombolyticData.treated,
          thrombolyticNotTreated
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
          swallowingData.screened,
          swallowingNotScreened
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
    // Safeguard: Handle invalid inputs
    const safeCurrent = Math.max(0, Math.min(100, current || 0));
    const safeTarget = Math.max(0, target || 0);
    
    if (safeCurrent >= safeTarget) {
      return { status: 'success', label: language === 'ar' ? 'تم تحقيق الهدف' : 'Target Met' };
    } else if (safeCurrent >= safeTarget * 0.8) {
      return { status: 'warning', label: language === 'ar' ? 'قريب من الهدف' : 'Near Target' };
    } else {
      return { status: 'error', label: language === 'ar' ? 'أقل من الهدف' : 'Below Target' };
    }
  };

  const thrombolyticStatus = getTargetStatus(thrombolyticData.successRate, thrombolyticData.target);
  const swallowingStatus = getTargetStatus(swallowingData.successRate, swallowingData.target);

  const charts = [
    {
      title: language === 'ar' ? 'أداء العلاج الخثاري' : 'Thrombolytic Therapy Performance',
      data: thrombolyticTherapyData,
      successRate: thrombolyticData.successRate,
      target: thrombolyticData.target,
      status: thrombolyticStatus,
    },
    {
      title: language === 'ar' ? 'أداء فحص البلع' : 'Swallowing Screening Performance',
      data: swallowingScreeningData,
      successRate: swallowingData.successRate,
      target: swallowingData.target,
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
                  {/* Safeguard: Check if chart has valid data before rendering */}
                  {chart.data.datasets[0].data.some(value => value > 0) ? (
                    <Doughnut data={chart.data} options={chartOptions} />
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%',
                      flexDirection: 'column'
                    }}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0', textAlign: 'center' }}>
                        {language === 'ar' ? 'لا توجد بيانات للعرض' : 'No data to display'}
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
                    {Math.round((chart.successRate || 0) * 10) / 10}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    {language === 'ar' ? 'معدل النجاح' : 'Success Rate'} | {language === 'ar' ? 'الهدف' : 'Target'}: {chart.target || 0}%
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

// Main component wrapped with error boundary
const TherapyPerformanceCharts: React.FC<PerformanceChartsProps> = ({ data, language }) => {
  return (
    <ChartErrorBoundary language={language}>
      <TherapyPerformanceChartsComponent data={data} language={language} />
    </ChartErrorBoundary>
  );
};

export default TherapyPerformanceCharts;
