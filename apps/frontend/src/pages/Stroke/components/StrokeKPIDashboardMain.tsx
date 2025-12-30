import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  AccessTime,
  CheckCircle,
  Speed,
} from '@mui/icons-material';

import { StrokeKPISummary } from '../../../services/strokeService';
import { UnifiedKPICard, kpiColors, kpiGradients, cardStyles, getPercentageStatus } from '../../../components/Common/KPI';

interface StrokeKPIDashboardProps {
  kpiSummary: StrokeKPISummary | null;
}

const StrokeKPIDashboard: React.FC<StrokeKPIDashboardProps> = ({ kpiSummary }) => {
  if (!kpiSummary) {
    return (
      <Box sx={{
        ...cardStyles.page,
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
          border: `1px solid ${kpiColors.borderColor}`
        }}>
          No KPI data available. Please ensure stroke cases have been created.
        </Alert>
      </Box>
    );
  }

  // Calculate KPI1 percentage
  const kpi1Percentage = kpiSummary.kpiPerformance?.kpi1
    ? (kpiSummary.kpiPerformance.kpi1.met / kpiSummary.kpiPerformance.kpi1.total) * 100
    : 0;

  // KPI definitions
  const kpiNames: { [key: string]: { name: string; target: string; category: string } } = {
    kpi1: { name: 'Door to Physician', target: '≤15 min', category: 'Timing' },
    kpi2: { name: 'Door to CT Scan', target: '≤20 min', category: 'Timing' },
    kpi3: { name: 'Door to Needle', target: '≤60 min', category: 'Treatment' },
    kpi4: { name: 'Registration to IV', target: '≤60 min', category: 'Treatment' },
    kpi5: { name: 'IV Thrombolysis Rate', target: '≥5%', category: 'Treatment' },
    kpi6: { name: 'Stroke Unit Admission', target: '≥80%', category: 'Care' },
    kpi8: { name: 'Door to Thrombectomy', target: '≤120 min', category: 'Treatment' },
    kpi9: { name: 'SRCA Call to Arrival', target: '≤60 min', category: 'Transfer' },
    kpi10: { name: 'Swallowing Pass Rate', target: '≥85%', category: 'Assessment' },
    kpi11: { name: '3-Month Follow-up', target: '≥80%', category: 'Follow-up' },
  };

  return (
    <Box sx={{ ...cardStyles.page, minHeight: 'auto' }}>
      {/* Header */}
      <Box mb={4}>
        <Card sx={{
          background: '#ffffff',
          borderRadius: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: `1px solid ${kpiColors.borderColor}`,
          overflow: 'hidden',
        }}>
          <Box sx={{
            height: 4,
            background: kpiGradients.primary,
          }} />
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" gap={3}>
              <Box sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                background: kpiGradients.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(15, 76, 117, 0.3)',
              }}>
                <Assessment sx={{ color: 'white', fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: kpiColors.textPrimary, mb: 0.5 }}>
                  Stroke Analytics Center
                </Typography>
                <Typography variant="body1" sx={{ color: kpiColors.textSecondary }}>
                  Comprehensive performance monitoring and insights
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Primary KPI Cards */}
      <Typography variant="h5" sx={{ fontWeight: 600, color: kpiColors.textPrimary, mb: 3 }}>
        Key Performance Metrics
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Total Cases"
            value={kpiSummary.totalCases}
            subtitle="All stroke cases processed"
            icon={<Assessment />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Performance Rate"
            value={`${kpi1Percentage.toFixed(1)}%`}
            subtitle="KPI1 compliance"
            icon={<TrendingUp />}
            percentage={kpi1Percentage}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Avg Door-to-Physician"
            value={`${kpiSummary.averageTimings?.doorToPhysician?.toFixed(0) || 'N/A'}m`}
            subtitle="Target: ≤15 min"
            icon={<AccessTime />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Success Rate"
            value={`${kpiSummary.outcomes?.successRate?.toFixed(1) || '0.0'}%`}
            subtitle="Treatment outcomes"
            icon={<CheckCircle />}
            percentage={kpiSummary.outcomes?.successRate || 0}
          />
        </Grid>
      </Grid>

      {/* Performance Indicators */}
      <Typography variant="h5" sx={{ fontWeight: 600, color: kpiColors.textPrimary, mb: 3 }}>
        Performance Indicators
      </Typography>
      <Grid container spacing={3} mb={4}>
        {kpiSummary.kpiPerformance && Object.entries(kpiSummary.kpiPerformance).map(([kpiId, kpiData]) => {
          const kpiInfo = kpiNames[kpiId];
          if (!kpiInfo) return null;

          return (
            <Grid item xs={12} sm={6} md={4} key={kpiId}>
              <UnifiedKPICard
                variant="secondary"
                title={kpiInfo.name}
                value={`${kpiData.percentage.toFixed(1)}%`}
                target={kpiInfo.target}
                percentage={kpiData.percentage}
                status={getPercentageStatus(kpiData.percentage)}
                icon={<Speed />}
                casesInfo={`${kpiData.met} of ${kpiData.total} cases`}
              />
            </Grid>
          );
        })}
      </Grid>

      {/* Stroke Type Distribution */}
      <Typography variant="h5" sx={{ fontWeight: 600, color: kpiColors.textPrimary, mb: 3 }}>
        Stroke Type Distribution
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <UnifiedKPICard
            variant="compact"
            title="Ischemic Strokes"
            value={kpiSummary.strokeTypeBreakdown?.ischemic || 0}
            subtitle={`${kpiSummary.strokeTypeBreakdown?.ischemic && kpiSummary.totalCases
              ? ((kpiSummary.strokeTypeBreakdown.ischemic / kpiSummary.totalCases) * 100).toFixed(1)
              : '0.0'}% of total`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <UnifiedKPICard
            variant="compact"
            title="Hemorrhagic Strokes"
            value={kpiSummary.strokeTypeBreakdown?.hemorrhagic || 0}
            subtitle={`${kpiSummary.strokeTypeBreakdown?.hemorrhagic && kpiSummary.totalCases
              ? ((kpiSummary.strokeTypeBreakdown.hemorrhagic / kpiSummary.totalCases) * 100).toFixed(1)
              : '0.0'}% of total`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <UnifiedKPICard
            variant="compact"
            title="TIA Cases"
            value={kpiSummary.strokeTypeBreakdown?.tia || 0}
            subtitle={`${kpiSummary.strokeTypeBreakdown?.tia && kpiSummary.totalCases
              ? ((kpiSummary.strokeTypeBreakdown.tia / kpiSummary.totalCases) * 100).toFixed(1)
              : '0.0'}% of total`}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default StrokeKPIDashboard;