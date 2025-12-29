import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  Button,
  TextField,
  MenuItem,
  Paper,
  Collapse,
  CircularProgress,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { StemiKpiResponse } from '../services/stemiService';
import apiClient from '../../../services/apiClient';

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

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const validateDateRange = (startDate?: string, endDate?: string): string => {
    if (!startDate || !endDate) return '';

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return 'To Date cannot be earlier than From Date';
    }

    return '';
  };

  const handleFilterChange = async (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };

    // Validate date range
    const error = validateDateRange(
      key === 'startDate' ? value : newFilters.startDate,
      key === 'endDate' ? value : newFilters.endDate
    );

    setDateError(error);

    // Only apply filters if there's no date error
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
      // Update local state even with error for UI feedback
      setLocalFilters(newFilters);
    }
  };

  const handleClearFilters = async () => {
    // Clear local state first
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    setDateError('');

    // Then apply the cleared filters
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
      <Alert severity="info">
        No KPI data available
      </Alert>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GREEN':
        return 'success';
      case 'YELLOW':
        return 'warning';
      case 'RED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getProgressValue = (percentage: number) => {
    return Math.min(percentage, 100);
  };

  const KpiCard: React.FC<{
    title: string;
    target: string;
    totalCases: number;
    withinTarget: number;
    percentage: number;
    status: string;
    additionalInfo?: string;
  }> = ({ title, target, totalCases, withinTarget, percentage, status, additionalInfo }) => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          <Chip
            label={status}
            color={getStatusColor(status) as any}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          Target: {target}
        </Typography>

        <Box mb={2}>
          <Typography variant="h4" component="div">
            {percentage.toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {withinTarget} of {totalCases} cases
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={getProgressValue(percentage)}
          color={getStatusColor(status) as any}
          sx={{ height: 8, borderRadius: 4 }}
        />

        {additionalInfo && (
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            {additionalInfo}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // const InfoCard: React.FC<{
  //   title: string;
  //   total: number;
  //   subset: number;
  //   percentage: number;
  //   status: string;
  //   subsetLabel: string;
  // }> = ({ title, total, subset, percentage, status, subsetLabel }) => (
  //   <Card>
  //     <CardContent>
  //       <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
  //         <Typography variant="h6" component="div">
  //           {title}
  //         </Typography>
  //         <Chip
  //           label={status}
  //           color={getStatusColor(status) as any}
  //           size="small"
  //         />
  //       </Box>

  //       <Box mb={2}>
  //         <Typography variant="h4" component="div">
  //           {percentage.toFixed(1)}%
  //         </Typography>
  //         <Typography variant="body2" color="textSecondary">
  //           {subset} {subsetLabel} of {total} total
  //         </Typography>
  //       </Box>

  //       <LinearProgress
  //         variant="determinate"
  //         value={getProgressValue(percentage)}
  //         color={getStatusColor(status) as any}
  //         sx={{ height: 8, borderRadius: 4 }}
  //       />
  //     </CardContent>
  //   </Card>
  // );

  return (
    <Box>
      {/* Filter Section */}
      <Box sx={{ mb: 3 }}>
        {/* Filter Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">KPI Filters</Typography>
          <Box display="flex" gap={1}>
            {getActiveFiltersCount() > 0 && (
              <Chip
                label={`${getActiveFiltersCount()} active`}
                color="primary"
                size="small"
              />
            )}
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              size="small"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Box>
        </Box>

        {/* Active Filter Chips */}
        {getActiveFiltersCount() > 0 && (
          <Box mb={2}>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {getFilterChips().map((chip) => (
                <Chip
                  key={chip.key}
                  icon={chip.icon}
                  label={chip.label}
                  onDelete={() => handleFilterChange(chip.key, '')}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Filter Controls */}
        <Collapse in={showFilters}>
          <Paper sx={{ p: 2 }}>
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
                      <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
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
                  inputProps={{
                    max: localFilters.endDate || undefined,
                  }}
                  InputProps={{
                    startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />,
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
                  inputProps={{
                    min: localFilters.startDate || undefined,
                  }}
                  InputProps={{
                    startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  helperText={dateError && localFilters.startDate && localFilters.endDate ? dateError : ''}
                  error={!!(dateError && localFilters.startDate && localFilters.endDate)}
                />
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                disabled={isLoading || getActiveFiltersCount() === 0}
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
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Cases
              </Typography>
              <Typography variant="h4" component="div">
                {kpiSummary.totalCases}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Cases This Month
              </Typography>
              <Typography variant="h4" component="div">
                {kpiSummary.casesThisMonth}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Cases This Week
              </Typography>
              <Typography variant="h4" component="div">
                {kpiSummary.casesThisWeek}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Door-to-Balloon
              </Typography>
              <Typography variant="h4" component="div">
                {kpiSummary.averageDoorToBalloonTime ? `${kpiSummary.averageDoorToBalloonTime.toFixed(1)} min` : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Time-based KPIs */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Time-based Performance KPIs
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <KpiCard
            title={kpiSummary.kpi1.name}
            target={kpiSummary.kpi1.target}
            totalCases={kpiSummary.kpi1.totalCases}
            withinTarget={kpiSummary.kpi1.withinTarget}
            percentage={kpiSummary.kpi1.percentage}
            status={kpiSummary.kpi1.status}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <KpiCard
            title={kpiSummary.kpi2Direct.name}
            target={kpiSummary.kpi2Direct.target}
            totalCases={kpiSummary.kpi2Direct.totalCases}
            withinTarget={kpiSummary.kpi2Direct.withinTarget}
            percentage={kpiSummary.kpi2Direct.percentage}
            status={kpiSummary.kpi2Direct.status}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <KpiCard
            title={kpiSummary.kpi2Transfer.name}
            target={kpiSummary.kpi2Transfer.target}
            totalCases={kpiSummary.kpi2Transfer.totalCases}
            withinTarget={kpiSummary.kpi2Transfer.withinTarget}
            percentage={kpiSummary.kpi2Transfer.percentage}
            status={kpiSummary.kpi2Transfer.status}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <KpiCard
            title={kpiSummary.kpi3.name}
            target={kpiSummary.kpi3.target}
            totalCases={kpiSummary.kpi3.totalCases}
            withinTarget={kpiSummary.kpi3.withinTarget}
            percentage={kpiSummary.kpi3.percentage}
            status={kpiSummary.kpi3.status}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <KpiCard
            title={kpiSummary.kpi4.name}
            target={kpiSummary.kpi4.target}
            totalCases={kpiSummary.kpi4.totalCases}
            withinTarget={kpiSummary.kpi4.withinTarget}
            percentage={kpiSummary.kpi4.percentage}
            status={kpiSummary.kpi4.status}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <KpiCard
            title={kpiSummary.kpi5.name}
            target={kpiSummary.kpi5.target}
            totalCases={kpiSummary.kpi5.totalCases}
            withinTarget={kpiSummary.kpi5.withinTarget}
            percentage={kpiSummary.kpi5.percentage}
            status={kpiSummary.kpi5.status}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <KpiCard
            title={kpiSummary.kpi6.name}
            target={kpiSummary.kpi6.target}
            totalCases={kpiSummary.kpi6.totalCases}
            withinTarget={kpiSummary.kpi6.withinTarget}
            percentage={kpiSummary.kpi6.percentage}
            status={kpiSummary.kpi6.status}
          />
        </Grid>
      </Grid>

      {/* Transfer and Outcome KPIs */}
      {/* <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Transfer and Outcome KPIs
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <InfoCard
            title={kpiSummary.kpi7.name}
            total={kpiSummary.kpi7.totalTransfers}
            subset={kpiSummary.kpi7.postFibrinolysis}
            percentage={kpiSummary.kpi7.percentage}
            status={kpiSummary.kpi7.status}
            subsetLabel="post-fibrinolysis"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <InfoCard
            title={kpiSummary.kpi8.name}
            total={kpiSummary.kpi8.totalTransfers}
            subset={kpiSummary.kpi8.primaryPci}
            percentage={kpiSummary.kpi8.percentage}
            status={kpiSummary.kpi8.status}
            subsetLabel="for primary PCI"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <InfoCard
            title={kpiSummary.kpi9.name}
            total={kpiSummary.kpi9.totalAdmissions}
            subset={kpiSummary.kpi9.deaths}
            percentage={kpiSummary.kpi9.percentage}
            status={kpiSummary.kpi9.status}
            subsetLabel="deaths"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <InfoCard
            title={kpiSummary.kpi10.name}
            total={kpiSummary.kpi10.totalDischarges}
            subset={kpiSummary.kpi10.readmissions}
            percentage={kpiSummary.kpi10.percentage}
            status={kpiSummary.kpi10.status}
            subsetLabel="readmissions"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <InfoCard
            title={kpiSummary.kpi11.name}
            total={kpiSummary.kpi11.totalDischarges}
            subset={kpiSummary.kpi11.followupCallsCompleted}
            percentage={kpiSummary.kpi11.percentage}
            status={kpiSummary.kpi11.status}
            subsetLabel="follow-up calls completed"
          />
        </Grid>
      </Grid> */}

      {/* Performance Summary */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="textSecondary">
                Average Door-to-Balloon Time
              </Typography>
              <Typography variant="h6">
                {kpiSummary.averageDoorToBalloonTime ? `${kpiSummary.averageDoorToBalloonTime.toFixed(1)} minutes` : 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="textSecondary">
                Average Door-to-Needle Time
              </Typography>
              <Typography variant="h6">
                {kpiSummary.averageDoorToNeedleTime ? `${kpiSummary.averageDoorToNeedleTime.toFixed(1)} minutes` : 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="textSecondary">
                Total Cases Analyzed
              </Typography>
              <Typography variant="h6">
                {kpiSummary.totalCases}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StemiKPIDashboard;

