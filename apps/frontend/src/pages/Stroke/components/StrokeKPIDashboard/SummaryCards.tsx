import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from '@mui/material';
import { 
  Assessment, 
  CheckCircle, 
  TrendingUp,
  AccessTime
} from '@mui/icons-material';

import { StrokeKPISummary } from '../../../../services/strokeService';

interface SummaryCardsProps {
  kpiSummary: StrokeKPISummary;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ kpiSummary }) => {
  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const getOverallKPIPerformance = () => {
    const kpis = [
      kpiSummary.kpiPerformance.kpi1.percentage,
      kpiSummary.kpiPerformance.kpi2.percentage,
      kpiSummary.kpiPerformance.kpi3.percentage,
      kpiSummary.kpiPerformance.kpi4.percentage,
      kpiSummary.kpiPerformance.kpi5.percentage,
      kpiSummary.kpiPerformance.kpi6.percentage,
      kpiSummary.kpiPerformance.kpi7.percentage,
      kpiSummary.kpiPerformance.kpi8.percentage,
    ];
    return kpis.reduce((sum, kpi) => sum + kpi, 0) / kpis.length;
  };

  const overallPerformance = getOverallKPIPerformance();

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Total Cases */}
      <Grid item xs={12} sm={6} md={3}>
        <Card 
          sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Assessment sx={{ fontSize: 40, opacity: 0.8 }} />
              <Chip 
                label="Total" 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  fontWeight: 'bold'
                }} 
              />
            </Box>
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 1, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              {kpiSummary.totalCases}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Stroke Cases This Month
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Overall KPI Performance */}
      <Grid item xs={12} sm={6} md={3}>
        <Card 
          sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
              <Chip 
                label={getPerformanceColor(overallPerformance)} 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  fontWeight: 'bold'
                }} 
              />
            </Box>
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 1, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              {Math.round(overallPerformance)}%
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Overall KPI Performance
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={overallPerformance} 
              sx={{ 
                mt: 2, 
                height: 6, 
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'white'
                }
              }} 
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Average Door to Imaging */}
      <Grid item xs={12} sm={6} md={3}>
        <Card 
          sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <AccessTime sx={{ fontSize: 40, opacity: 0.8 }} />
              <Chip 
                label={kpiSummary.averageTimings.doorToImaging <= 25 ? 'Good' : 'Needs Improvement'} 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  fontWeight: 'bold'
                }} 
              />
            </Box>
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 1, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              {Math.round(kpiSummary.averageTimings.doorToImaging)}m
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Avg Door-to-Imaging Time
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
              Target: ≤25 minutes
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Success Rate */}
      <Grid item xs={12} sm={6} md={3}>
        <Card 
          sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <CheckCircle sx={{ fontSize: 40, opacity: 0.8 }} />
              <Chip 
                label={getPerformanceColor(kpiSummary.outcomes.successRate)} 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  fontWeight: 'bold'
                }} 
              />
            </Box>
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 1, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              {Math.round(kpiSummary.outcomes.successRate)}%
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Treatment Success Rate
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={kpiSummary.outcomes.successRate} 
              sx={{ 
                mt: 2, 
                height: 6, 
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'white'
                }
              }} 
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SummaryCards;
