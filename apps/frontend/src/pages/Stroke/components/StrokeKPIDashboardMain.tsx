import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Alert,
  Card,
  CardContent,
  Chip,
  LinearProgress,
} from '@mui/material';
import { 
  Assessment, 
  TrendingUp, 
  AccessTime, 
  CheckCircle,
  Warning,
  Error
} from '@mui/icons-material';

import { StrokeKPISummary } from '../../../services/strokeService';

interface StrokeKPIDashboardProps {
  kpiSummary: StrokeKPISummary | null;
}

const StrokeKPIDashboard: React.FC<StrokeKPIDashboardProps> = ({ kpiSummary }) => {
  if (!kpiSummary) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Alert severity="info" sx={{ 
          background: 'white',
          borderRadius: 3,
          p: 4,
          fontSize: '1.1rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          No KPI data available. Please ensure stroke cases have been created.
      </Alert>
      </Box>
    );
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981'; // Green for good performance
    if (percentage >= 60) return '#f59e0b'; // Yellow for moderate
    if (percentage >= 40) return '#f97316'; // Orange for poor
    return '#ef4444'; // Red for very poor
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle sx={{ color: '#10b981' }} />;
    if (percentage >= 60) return <Warning sx={{ color: '#f59e0b' }} />;
    if (percentage >= 40) return <Warning sx={{ color: '#f97316' }} />;
    return <Error sx={{ color: '#ef4444' }} />;
  };

  const getTimingColor = (minutes: number, targetMinutes: number) => {
    const ratio = minutes / targetMinutes;
    if (ratio <= 0.8) return '#10b981'; // Green: within 80% of target
    if (ratio <= 1.0) return '#f59e0b'; // Yellow: within target
    if (ratio <= 1.5) return '#f97316'; // Orange: 50% over target
    return '#ef4444'; // Red: significantly over target
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      p: 3
    }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{
          background: 'white',
          borderRadius: 4,
          p: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={3}>
              <Box sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <Assessment sx={{ color: 'white', fontSize: 32 }} />
              </Box>
    <Box>
                <Typography variant="h3" sx={{ 
                  fontWeight: 'bold', 
                  color: '#1e293b',
                  mb: 1
                }}>
                  Stroke Analytics Center
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: '#64748b',
                  fontWeight: 400
                }}>
                  Comprehensive performance monitoring and insights
      </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Key Metrics Overview */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold', 
          color: '#1e293b', 
          mb: 3
        }}>
          Key Performance Metrics
        </Typography>
      <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              }
            }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)'
                }}>
                  <Typography sx={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
                    {kpiSummary.totalCases}
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
                  Total Cases
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  All stroke cases processed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              }
            }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${getPerformanceColor(kpiSummary.kpiPerformance?.kpi1 ? (kpiSummary.kpiPerformance.kpi1.met / kpiSummary.kpiPerformance.kpi1.total) * 100 : 0)} 0%, ${getPerformanceColor(kpiSummary.kpiPerformance?.kpi1 ? (kpiSummary.kpiPerformance.kpi1.met / kpiSummary.kpiPerformance.kpi1.total) * 100 : 0)}CC 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: `0 10px 30px ${getPerformanceColor(kpiSummary.kpiPerformance?.kpi1 ? (kpiSummary.kpiPerformance.kpi1.met / kpiSummary.kpiPerformance.kpi1.total) * 100 : 0)}33`
                }}>
                  <TrendingUp sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
                  Performance Rate
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: getPerformanceColor(kpiSummary.kpiPerformance?.kpi1 ? (kpiSummary.kpiPerformance.kpi1.met / kpiSummary.kpiPerformance.kpi1.total) * 100 : 0) }}>
                  {kpiSummary.kpiPerformance?.kpi1 ? ((kpiSummary.kpiPerformance.kpi1.met / kpiSummary.kpiPerformance.kpi1.total) * 100).toFixed(1) : '0.0'}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              }
            }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${getTimingColor(kpiSummary.averageTimings?.doorToPhysician || 0, 15)} 0%, ${getTimingColor(kpiSummary.averageTimings?.doorToPhysician || 0, 15)}CC 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: `0 10px 30px ${getTimingColor(kpiSummary.averageTimings?.doorToPhysician || 0, 15)}33`
                }}>
                  <AccessTime sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
                  Avg Door-to-Physician
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: getTimingColor(kpiSummary.averageTimings?.doorToPhysician || 0, 15) }}>
                  {kpiSummary.averageTimings?.doorToPhysician ? kpiSummary.averageTimings.doorToPhysician.toFixed(0) : 'N/A'}m
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              }
            }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${getPerformanceColor(kpiSummary.outcomes?.successRate || 0)} 0%, ${getPerformanceColor(kpiSummary.outcomes?.successRate || 0)}CC 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: `0 10px 30px ${getPerformanceColor(kpiSummary.outcomes?.successRate || 0)}33`
                }}>
                  <CheckCircle sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
                  Success Rate
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: getPerformanceColor(kpiSummary.outcomes?.successRate || 0) }}>
                  {kpiSummary.outcomes?.successRate ? kpiSummary.outcomes.successRate.toFixed(1) : '0.0'}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* KPI Performance Grid */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold', 
          color: '#1e293b', 
          mb: 3
        }}>
          Performance Indicators
        </Typography>
        <Grid container spacing={3}>
          {kpiSummary.kpiPerformance ? Object.entries(kpiSummary.kpiPerformance).map(([kpiId, kpiData]) => {
            const kpiNames: { [key: string]: { name: string; description: string; target: number; category: string } } = {
              kpi1: { name: 'Door to CT Scan', description: 'Time from arrival to CT scan', target: 20, category: 'Timing' },
              kpi2: { name: 'Door to Needle', description: 'Time from arrival to thrombolysis', target: 60, category: 'Treatment' },
              kpi3: { name: 'Door to Mechanical Thrombectomy', description: 'Time from arrival to thrombectomy', target: 120, category: 'Treatment' },
              kpi4: { name: 'Stroke Unit Admission', description: 'Admission to stroke unit', target: 24, category: 'Care' },
              kpi5: { name: 'Dysphagia Screening', description: 'Dysphagia screening completion', target: 4, category: 'Assessment' },
              kpi6: { name: 'Early Mobilization', description: 'Early mobilization within 24h', target: 24, category: 'Rehabilitation' },
              kpi7: { name: 'Speech Therapy', description: 'Speech therapy initiation', target: 48, category: 'Rehabilitation' },
              kpi8: { name: 'Physiotherapy', description: 'Physiotherapy initiation', target: 48, category: 'Rehabilitation' }
            };
            
            const kpiInfo = kpiNames[kpiId];
            if (!kpiInfo) return null;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={kpiId}>
                <Card sx={{
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          background: `${getPerformanceColor(kpiData.percentage)}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: getPerformanceColor(kpiData.percentage)
                        }}>
                          {getPerformanceIcon(kpiData.percentage)}
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                            {kpiInfo.name}
                          </Typography>
                          <Chip
                            label={kpiInfo.category}
                            size="small"
                            sx={{ 
                              background: `${getPerformanceColor(kpiData.percentage)}20`,
                              color: getPerformanceColor(kpiData.percentage),
                              fontWeight: 'bold',
                              fontSize: '0.75rem'
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="h4" sx={{ 
                        fontWeight: 'bold', 
                        color: getPerformanceColor(kpiData.percentage) 
                      }}>
                        {kpiData.percentage.toFixed(1)}%
                      </Typography>
                    </Box>
                    
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                          Target: {kpiInfo.target}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {kpiData.met} of {kpiData.total} cases
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={kpiData.percentage}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: '#f1f5f9',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: `linear-gradient(135deg, ${getPerformanceColor(kpiData.percentage)} 0%, ${getPerformanceColor(kpiData.percentage)}CC 100%)`,
                          }
                        }}
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {kpiInfo.description}
                      </Typography>
                      <Chip
                        label={kpiData.percentage >= 80 ? 'Met' : 'Not Met'}
                        size="small"
                        sx={{ 
                          background: getPerformanceColor(kpiData.percentage),
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          }) : []}
        </Grid>
      </Box>

      {/* Stroke Type Breakdown */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold', 
          color: '#1e293b', 
          mb: 3
        }}>
          Stroke Type Distribution
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
              }
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h1" sx={{ 
                  fontWeight: 'bold', 
                  color: '#3b82f6',
                  mb: 2
                }}>
                  {kpiSummary.strokeTypeBreakdown?.ischemic || 0}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
                  Ischemic Strokes
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {kpiSummary.strokeTypeBreakdown?.ischemic && kpiSummary.totalCases ? 
                    ((kpiSummary.strokeTypeBreakdown.ischemic / kpiSummary.totalCases) * 100).toFixed(1) : '0.0'}% of total cases
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
              }
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h1" sx={{ 
                  fontWeight: 'bold', 
                  color: '#ef4444',
                  mb: 2
                }}>
                  {kpiSummary.strokeTypeBreakdown?.hemorrhagic || 0}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
                  Hemorrhagic Strokes
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {kpiSummary.strokeTypeBreakdown?.hemorrhagic && kpiSummary.totalCases ? 
                    ((kpiSummary.strokeTypeBreakdown.hemorrhagic / kpiSummary.totalCases) * 100).toFixed(1) : '0.0'}% of total cases
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
              }
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h1" sx={{ 
                  fontWeight: 'bold', 
                  color: '#f59e0b',
                  mb: 2
                }}>
                  {kpiSummary.strokeTypeBreakdown?.tia || 0}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
                  TIA Cases
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {kpiSummary.strokeTypeBreakdown?.tia && kpiSummary.totalCases ? 
                    ((kpiSummary.strokeTypeBreakdown.tia / kpiSummary.totalCases) * 100).toFixed(1) : '0.0'}% of total cases
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default StrokeKPIDashboard;