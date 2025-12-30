import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  TextField,
  MenuItem,
  Paper,
  Collapse,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Assessment,
  Speed,
  Timer,
  Favorite,
} from '@mui/icons-material';
import { StemiKpiResponse } from '../services/stemiService';
import apiClient from '../../../services/apiClient';
import { UnifiedKPICard, kpiColors, kpiGradients, cardStyles, getPercentageStatus } from '../../../components/Common/KPI';

interface StemiKPIDashboardProps {
  kpiSummary: StemiKpiResponse | null;
  filters?: {
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
  };
  onFilterChange?: (filters: { hospitalId?: string; startDate?: string; endDate?: string }) => void;
}

const StemiKPIDashboard: React.FC<StemiKPIDashboardProps> = ({
  kpiSummary,
  filters = {},
  onFilterChange
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [hospitals, setHospitals] = useState<Array<{ id: string, name: string }>>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [dateError, setDateError] = useState<string>('');

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

  const validateDateRange = (startDate?: string, endDate?: string): string => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 'To Date cannot be earlier than From Date';
    return '';
  };

  const handleFilterChange = async (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    const error = validateDateRange(
      key === 'startDate' ? value : newFilters.startDate,
      key === 'endDate' ? value : newFilters.endDate
    );
    setDateError(error);

    if (!error) {
      setLocalFilters(newFilters);
      if (onFilterChange) {
        setIsLoading(true);
        try {
          await onFilterChange(newFilters);
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      setLocalFilters(newFilters);
    }
  };

  const handleClearFilters = async () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    setDateError('');
    if (onFilterChange) {
      setIsLoading(true);
      try {
        await onFilterChange(clearedFilters);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).filter(value => value && value !== '').length;
  };

  const getFilterChips = () => {
    const chips = [];
    if (localFilters.hospitalId) {
      const hospital = hospitals.find(h => h.id === localFilters.hospitalId);
      chips.push({
        label: hospital ? hospital.name : 'Unknown Hospital',
        key: 'hospitalId',
        icon: <LocationIcon fontSize="small" />,
      });
    }
    if (localFilters.startDate) {
      chips.push({
        label: `From: ${new Date(localFilters.startDate).toLocaleDateString()}`,
        key: 'startDate',
        icon: <CalendarIcon fontSize="small" />,
      });
    }
    if (localFilters.endDate) {
      chips.push({
        label: `To: ${new Date(localFilters.endDate).toLocaleDateString()}`,
        key: 'endDate',
        icon: <CalendarIcon fontSize="small" />,
      });
    }
    return chips;
  };

  if (!kpiSummary) {
    return (
      <Box sx={{ ...cardStyles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="info" sx={{
          background: 'white',
          borderRadius: 3,
          p: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: `1px solid ${kpiColors.borderColor}`
        }}>
          No KPI data available
        </Alert>
      </Box>
    );
  }

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
          <Box sx={{ height: 4, background: kpiGradients.primary }} />
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
                <Favorite sx={{ color: 'white', fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: kpiColors.textPrimary, mb: 0.5 }}>
                  STEMI Analytics Center
                </Typography>
                <Typography variant="body1" sx={{ color: kpiColors.textSecondary }}>
                  Comprehensive performance monitoring and insights
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Filter Section */}
      <Card sx={{ ...cardStyles.secondary, mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: kpiColors.textPrimary }}>
              KPI Filters
            </Typography>
            <Box display="flex" gap={1}>
              {getActiveFiltersCount() > 0 && (
                <Chip
                  label={`${getActiveFiltersCount()} active`}
                  size="small"
                  sx={{
                    background: `${kpiColors.accent}15`,
                    color: kpiColors.accent,
                    fontWeight: 600
                  }}
                />
              )}
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                size="small"
                sx={{
                  borderColor: kpiColors.borderColor,
                  color: kpiColors.textPrimary,
                  '&:hover': { borderColor: kpiColors.accent }
                }}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </Box>
          </Box>

          {getActiveFiltersCount() > 0 && (
            <Box mb={2}>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {getFilterChips().map((chip) => (
                  <Chip
                    key={chip.key}
                    icon={chip.icon}
                    label={chip.label}
                    onDelete={() => handleFilterChange(chip.key, '')}
                    size="small"
                    sx={{
                      background: `${kpiColors.gradientStart}10`,
                      color: kpiColors.gradientStart,
                      border: `1px solid ${kpiColors.gradientStart}30`,
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Collapse in={showFilters}>
            <Paper sx={{ p: 2, background: kpiColors.pageBg, border: `1px solid ${kpiColors.borderColor}` }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="Hospital"
                    value={localFilters.hospitalId || ''}
                    onChange={(e) => handleFilterChange('hospitalId', e.target.value)}
                    disabled={hospitalsLoading || isLoading}
                    InputProps={{
                      startAdornment: hospitalsLoading ? (
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                      ) : (
                        <LocationIcon sx={{ mr: 1, color: kpiColors.textSecondary }} />
                      ),
                    }}
                  >
                    <MenuItem value="">All Hospitals</MenuItem>
                    {hospitals.map((hospital) => (
                      <MenuItem key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    type="date"
                    fullWidth
                    label="From Date"
                    value={localFilters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    disabled={isLoading}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: localFilters.endDate || undefined }}
                    InputProps={{
                      startAdornment: <CalendarIcon sx={{ mr: 1, color: kpiColors.textSecondary }} />,
                    }}
                    helperText={dateError && localFilters.startDate && localFilters.endDate ? dateError : ''}
                    error={!!(dateError && localFilters.startDate && localFilters.endDate)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    type="date"
                    fullWidth
                    label="To Date"
                    value={localFilters.endDate || ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    disabled={isLoading}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: localFilters.startDate || undefined }}
                    InputProps={{
                      startAdornment: <CalendarIcon sx={{ mr: 1, color: kpiColors.textSecondary }} />,
                    }}
                    helperText={dateError && localFilters.startDate && localFilters.endDate ? dateError : ''}
                    error={!!(dateError && localFilters.startDate && localFilters.endDate)}
                  />
                </Grid>
              </Grid>
              <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  disabled={isLoading || getActiveFiltersCount() === 0}
                  sx={{
                    borderColor: kpiColors.borderColor,
                    color: kpiColors.textSecondary,
                  }}
                >
                  Clear All
                </Button>
                {isLoading && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      Applying filters...
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Collapse>
        </CardContent>
      </Card>

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
            subtitle="All STEMI cases"
            icon={<Assessment />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Cases This Month"
            value={kpiSummary.casesThisMonth}
            subtitle="Current month"
            icon={<CalendarIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Cases This Week"
            value={kpiSummary.casesThisWeek}
            subtitle="Current week"
            icon={<Speed />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Avg Door-to-Balloon"
            value={kpiSummary.averageDoorToBalloonTime ? `${kpiSummary.averageDoorToBalloonTime.toFixed(1)} min` : 'N/A'}
            subtitle="Target: ≤90 min"
            icon={<Timer />}
          />
        </Grid>
      </Grid>

      {/* Time-based KPIs */}
      <Typography variant="h5" sx={{ fontWeight: 600, color: kpiColors.textPrimary, mb: 3 }}>
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
          />
        </Grid>
      </Grid>

      {/* Performance Summary */}
      <Typography variant="h5" sx={{ fontWeight: 600, color: kpiColors.textPrimary, mb: 3 }}>
        Performance Summary
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <UnifiedKPICard
            variant="compact"
            title="Avg Door-to-Balloon"
            value={kpiSummary.averageDoorToBalloonTime ? `${kpiSummary.averageDoorToBalloonTime.toFixed(1)} min` : 'N/A'}
            subtitle="Primary PCI timing"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <UnifiedKPICard
            variant="compact"
            title="Avg Door-to-Needle"
            value={kpiSummary.averageDoorToNeedleTime ? `${kpiSummary.averageDoorToNeedleTime.toFixed(1)} min` : 'N/A'}
            subtitle="Fibrinolysis timing"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <UnifiedKPICard
            variant="compact"
            title="Total Cases Analyzed"
            value={kpiSummary.totalCases}
            subtitle="All time"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default StemiKPIDashboard;
