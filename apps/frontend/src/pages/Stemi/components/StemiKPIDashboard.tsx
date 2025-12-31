import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
} from '@mui/material';
import {
  Assessment,
  Speed,
  Timer,
  Favorite,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { StemiKpiResponse } from '../services/stemiService';
import apiClient from '../../../services/apiClient';
import { UnifiedKPICard, getTheme, getGradients, cardStyles, getPercentageStatus, PortalType } from '../../../components/Common/KPI';

import KPIFilterBar from '../../../components/Common/KPI/KPIFilterBar';

interface StemiKPIDashboardProps {
  kpiSummary: StemiKpiResponse | null;
  filters?: {
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
  };
  onFilterChange?: (filters: { hospitalId?: string; startDate?: string; endDate?: string }) => void;
  portalType?: PortalType;
}

const StemiKPIDashboard: React.FC<StemiKPIDashboardProps> = ({
  kpiSummary,
  filters = {},
  onFilterChange,
  portalType = 'stemi',
}) => {
  const kpiTheme = getTheme(portalType);
  const kpiGradients = getGradients(kpiTheme);

  const [localFilters, setLocalFilters] = useState(filters);
  const [hospitals, setHospitals] = useState<Array<{ id: string, name: string }>>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);

  // Load hospitals on component mount
  useEffect(() => {
    const loadHospitals = async () => {
      try {
        setHospitalsLoading(true);
        const response = await apiClient.get('/hospitals');
        setHospitals(response.data);
      } catch (error) {
        console.error('Error loading hospitals:', error);
      } finally {
        setHospitalsLoading(false);
      }
    };
    loadHospitals();
  }, []);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = async (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleClearFilters = async () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
  };

  if (!kpiSummary) {
    return (
      <Box sx={{ ...cardStyles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="info" sx={{
          background: 'white',
          borderRadius: 2,
          p: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: `1px solid ${kpiTheme.borderColor}`
        }}>
          No KPI data available
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ ...cardStyles.page, minHeight: 'auto' }}>
      {/* Header */}
      <Box mb={3}>
        <Card sx={cardStyles.primary}>
          <Box sx={{ height: 4, background: kpiGradients.header }} />
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
                <Favorite sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                  STEMI Analytics Center
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Comprehensive performance monitoring and insights
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Filter Section */}
      <Box mb={4}>
        <KPIFilterBar
          filters={localFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          hospitals={hospitals}
          loading={hospitalsLoading}
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
            subtitle="All STEMI cases"
            icon={<Assessment />}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Cases This Month"
            value={kpiSummary.casesThisMonth}
            subtitle="Current month"
            icon={<CalendarIcon />}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Cases This Week"
            value={kpiSummary.casesThisWeek}
            subtitle="Current week"
            icon={<Speed />}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Avg Door-to-Balloon"
            value={kpiSummary.averageDoorToBalloonTime ? `${kpiSummary.averageDoorToBalloonTime.toFixed(1)} min` : 'N/A'}
            subtitle="Target: ≤90 min"
            icon={<Timer />}
            portalType={portalType}
          />
        </Grid>
      </Grid>

      {/* Time-based KPIs */}
      <Typography variant="h5" sx={{ fontWeight: 600, color: kpiTheme.textPrimary, mb: 3 }}>
        Time-based Performance KPIs
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <UnifiedKPICard
            variant="secondary"
            title={kpiSummary.kpi1.name}
            value={`${kpiSummary.kpi1.percentage.toFixed(1)}%`}
            target={kpiSummary.kpi1.target}
            percentage={kpiSummary.kpi1.percentage}
            status={getPercentageStatus(kpiSummary.kpi1.percentage)}
            icon={<Speed />}
            casesInfo={`${kpiSummary.kpi1.withinTarget} of ${kpiSummary.kpi1.totalCases} cases`}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <UnifiedKPICard
            variant="secondary"
            title={kpiSummary.kpi2Direct.name}
            value={`${kpiSummary.kpi2Direct.percentage.toFixed(1)}%`}
            target={kpiSummary.kpi2Direct.target}
            percentage={kpiSummary.kpi2Direct.percentage}
            status={getPercentageStatus(kpiSummary.kpi2Direct.percentage)}
            icon={<Speed />}
            casesInfo={`${kpiSummary.kpi2Direct.withinTarget} of ${kpiSummary.kpi2Direct.totalCases} cases`}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <UnifiedKPICard
            variant="secondary"
            title={kpiSummary.kpi2Transfer.name}
            value={`${kpiSummary.kpi2Transfer.percentage.toFixed(1)}%`}
            target={kpiSummary.kpi2Transfer.target}
            percentage={kpiSummary.kpi2Transfer.percentage}
            status={getPercentageStatus(kpiSummary.kpi2Transfer.percentage)}
            icon={<Speed />}
            casesInfo={`${kpiSummary.kpi2Transfer.withinTarget} of ${kpiSummary.kpi2Transfer.totalCases} cases`}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <UnifiedKPICard
            variant="secondary"
            title={kpiSummary.kpi3.name}
            value={`${kpiSummary.kpi3.percentage.toFixed(1)}%`}
            target={kpiSummary.kpi3.target}
            percentage={kpiSummary.kpi3.percentage}
            status={getPercentageStatus(kpiSummary.kpi3.percentage)}
            icon={<Speed />}
            casesInfo={`${kpiSummary.kpi3.withinTarget} of ${kpiSummary.kpi3.totalCases} cases`}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <UnifiedKPICard
            variant="secondary"
            title={kpiSummary.kpi4.name}
            value={`${kpiSummary.kpi4.percentage.toFixed(1)}%`}
            target={kpiSummary.kpi4.target}
            percentage={kpiSummary.kpi4.percentage}
            status={getPercentageStatus(kpiSummary.kpi4.percentage)}
            icon={<Speed />}
            casesInfo={`${kpiSummary.kpi4.withinTarget} of ${kpiSummary.kpi4.totalCases} cases`}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <UnifiedKPICard
            variant="secondary"
            title={kpiSummary.kpi5.name}
            value={`${kpiSummary.kpi5.percentage.toFixed(1)}%`}
            target={kpiSummary.kpi5.target}
            percentage={kpiSummary.kpi5.percentage}
            status={getPercentageStatus(kpiSummary.kpi5.percentage)}
            icon={<Speed />}
            casesInfo={`${kpiSummary.kpi5.withinTarget} of ${kpiSummary.kpi5.totalCases} cases`}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <UnifiedKPICard
            variant="secondary"
            title={kpiSummary.kpi6.name}
            value={`${kpiSummary.kpi6.percentage.toFixed(1)}%`}
            target={kpiSummary.kpi6.target}
            percentage={kpiSummary.kpi6.percentage}
            status={getPercentageStatus(kpiSummary.kpi6.percentage)}
            icon={<Speed />}
            casesInfo={`${kpiSummary.kpi6.withinTarget} of ${kpiSummary.kpi6.totalCases} cases`}
            portalType={portalType}
          />
        </Grid>
      </Grid>

      {/* Performance Summary */}
      <Typography variant="h5" sx={{ fontWeight: 600, color: kpiTheme.textPrimary, mb: 3 }}>
        Performance Summary
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <UnifiedKPICard
            variant="compact"
            title="Avg Door-to-Balloon"
            value={kpiSummary.averageDoorToBalloonTime ? `${kpiSummary.averageDoorToBalloonTime.toFixed(1)} min` : 'N/A'}
            subtitle="Primary PCI timing"
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <UnifiedKPICard
            variant="compact"
            title="Avg Door-to-Needle"
            value={kpiSummary.averageDoorToNeedleTime ? `${kpiSummary.averageDoorToNeedleTime.toFixed(1)} min` : 'N/A'}
            subtitle="Fibrinolysis timing"
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <UnifiedKPICard
            variant="compact"
            title="Total Cases Analyzed"
            value={kpiSummary.totalCases}
            subtitle="All time"
            portalType={portalType}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default StemiKPIDashboard;
