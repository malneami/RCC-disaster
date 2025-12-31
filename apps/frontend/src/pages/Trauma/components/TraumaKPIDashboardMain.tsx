import React from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  Assessment,
  Warning,
  TransferWithinAStation,
  Schedule,
  LocalHospital,
  TrendingUp,
} from '@mui/icons-material';

import { TraumaKPIsResponse } from '../types/traumaTypes';
import { UnifiedKPICard, getTheme, getGradients, cardStyles, PortalType } from '../../../components/Common/KPI';
import KPIFilterBar from '../../../components/Common/KPI/KPIFilterBar';

interface TraumaKPIDashboardMainProps {
  kpiSummary: TraumaKPIsResponse | null;
  filters?: {
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
  };
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  hospitals?: Array<{ id: string; name: string }>;
  loading?: boolean;
  portalType?: PortalType;
}

const TraumaKPIDashboardMain: React.FC<TraumaKPIDashboardMainProps> = ({
  kpiSummary,
  filters = {},
  onFilterChange,
  onClearFilters,
  hospitals = [],
  loading = false,
  portalType = 'trauma',
}) => {
  const kpiTheme = getTheme(portalType);
  const kpiGradients = getGradients(kpiTheme);

  if (!kpiSummary) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} sx={{ color: kpiTheme.gradientStart }} />
      </Box>
    );
  }

  // Calculate metrics
  const criticalCaseRate = kpiSummary.totalCases > 0
    ? (kpiSummary.criticalCases / kpiSummary.totalCases) * 100
    : 0;

  const transferCaseRate = kpiSummary.totalCases > 0
    ? (kpiSummary.transferCases / kpiSummary.totalCases) * 100
    : 0;

  const averageResponseTime = kpiSummary.averageResponseTime
    ? Math.round(kpiSummary.averageResponseTime)
    : 0;

  const mortalityRate = kpiSummary.mortalityRate
    ? kpiSummary.mortalityRate
    : 0;

  // Get response time status
  const getResponseTimeStatus = (time: number) => {
    if (time <= 15) return 'excellent';
    if (time <= 30) return 'good';
    if (time <= 60) return 'fair';
    return 'poor';
  };

  const getMortalityStatus = (rate: number) => {
    if (rate <= 5) return 'excellent';
    if (rate <= 10) return 'good';
    if (rate <= 20) return 'fair';
    return 'poor';
  };

  return (
    <Box sx={{ ...cardStyles.page, minHeight: 'auto' }}>
      {/* Header */}
      <Box mb={3}>
        <Card sx={cardStyles.primary}>
          <Box sx={{ height: 4, background: kpiGradients.primary }} />
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={3}>
              <Box sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
              }}>
                <LocalHospital sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                  Trauma Analytics Center
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Comprehensive performance monitoring and insights
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Filter Bar */}
      <Box mb={4}>
        <KPIFilterBar
          filters={filters}
          onFilterChange={onFilterChange || (() => { })}
          onClearFilters={onClearFilters || (() => { })}
          hospitals={hospitals}
          loading={loading}
          portalType={portalType}
        />
      </Box>

      {/* Primary KPI Cards */}
      <Typography variant="h5" sx={{ fontWeight: 600, color: kpiTheme.textPrimary, mb: 3 }}>
        Key Performance Metrics
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Total Cases"
            value={kpiSummary.totalCases}
            subtitle="All trauma cases"
            icon={<Assessment />}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Critical Cases"
            value={kpiSummary.criticalCases}
            subtitle={`${criticalCaseRate.toFixed(1)}% of total`}
            icon={<Warning />}
            percentage={criticalCaseRate}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Transfer Cases"
            value={kpiSummary.transferCases}
            subtitle={`${transferCaseRate.toFixed(1)}% of total`}
            icon={<TransferWithinAStation />}
            percentage={transferCaseRate}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Avg Response Time"
            value={`${averageResponseTime} min`}
            subtitle="Time to arrival"
            icon={<Schedule />}
            portalType={portalType}
          />
        </Grid>
      </Grid>

      {/* Performance Indicators */}
      <Typography variant="h5" sx={{ fontWeight: 600, color: kpiTheme.textPrimary, mb: 3 }}>
        Performance Indicators
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <UnifiedKPICard
            variant="secondary"
            title="Response Time Performance"
            value={`${averageResponseTime} min`}
            target="≤15 min"
            percentage={Math.min((15 / Math.max(averageResponseTime, 1)) * 100, 100)}
            status={getResponseTimeStatus(averageResponseTime)}
            icon={<Schedule />}
            casesInfo="Time from dispatch to arrival"
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <UnifiedKPICard
            variant="secondary"
            title="Mortality Rate"
            value={`${mortalityRate.toFixed(1)}%`}
            target="≤5%"
            percentage={100 - Math.min(mortalityRate, 100)}
            status={getMortalityStatus(mortalityRate)}
            icon={<TrendingUp />}
            casesInfo="Overall mortality"
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <UnifiedKPICard
            variant="secondary"
            title="Critical Case Rate"
            value={`${criticalCaseRate.toFixed(1)}%`}
            target="≤20%"
            percentage={Math.min((20 / Math.max(criticalCaseRate, 1)) * 100, 100)}
            status={criticalCaseRate <= 20 ? 'good' : 'fair'}
            icon={<Warning />}
            casesInfo={`${kpiSummary.criticalCases} of ${kpiSummary.totalCases} cases`}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <UnifiedKPICard
            variant="secondary"
            title="Transfer Rate"
            value={`${transferCaseRate.toFixed(1)}%`}
            target="≤30%"
            percentage={Math.min((30 / Math.max(transferCaseRate, 1)) * 100, 100)}
            status={transferCaseRate <= 30 ? 'good' : 'fair'}
            icon={<TransferWithinAStation />}
            casesInfo={`${kpiSummary.transferCases} of ${kpiSummary.totalCases} cases`}
            portalType={portalType}
          />
        </Grid>
      </Grid>

      {/* Additional Stats */}
      <Typography variant="h5" sx={{ fontWeight: 600, color: kpiTheme.textPrimary, mb: 3 }}>
        Additional Statistics
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="compact"
            title="Glasgow Score"
            value={kpiSummary.averageGlasgowScore ? kpiSummary.averageGlasgowScore.toFixed(1) : 'N/A'}
            subtitle="Avg neurological assessment"
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="compact"
            title="Cases This Month"
            value={kpiSummary.casesThisMonth || 0}
            subtitle="Current month"
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="compact"
            title="Cases This Week"
            value={kpiSummary.casesThisWeek || 0}
            subtitle="Current week"
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="compact"
            title="Mortality Rate"
            value={`${mortalityRate.toFixed(1)}%`}
            subtitle="Overall outcome"
            status={getMortalityStatus(mortalityRate)}
            portalType={portalType}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TraumaKPIDashboardMain;
