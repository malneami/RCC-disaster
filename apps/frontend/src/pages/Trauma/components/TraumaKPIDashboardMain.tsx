import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Schedule,
  TransferWithinAStation,
  Assessment,
  Refresh,
} from '@mui/icons-material';

import { TraumaKPISummary } from '../../../services/traumaService';

interface TraumaKPIDashboardMainProps {
  kpiSummary: TraumaKPISummary | null;
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = '#1976d2',
  icon,
  loading = false,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp color="success" />;
      case 'down':
        return <TrendingDown color="error" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'success.main';
      case 'down':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="h6">
              {title}
            </Typography>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="h4" component="div" sx={{ color, fontWeight: 'bold' }}>
                {value}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box sx={{ color, opacity: 0.8 }}>
              {icon}
            </Box>
          )}
        </Box>
        {trend && trendValue && (
          <Box display="flex" alignItems="center" gap={1}>
            {getTrendIcon()}
            <Typography variant="body2" color={getTrendColor()}>
              {trendValue}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const TraumaKPIDashboardMain: React.FC<TraumaKPIDashboardMainProps> = ({ kpiSummary }) => {

  if (!kpiSummary) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }


  // Calculate additional metrics
  const criticalCaseRate = kpiSummary.totalCases > 0 
    ? ((kpiSummary.criticalCases / kpiSummary.totalCases) * 100).toFixed(1)
    : '0.0';

  const transferCaseRate = kpiSummary.totalCases > 0 
    ? ((kpiSummary.transferCases / kpiSummary.totalCases) * 100).toFixed(1)
    : '0.0';

  const averageResponseTime = kpiSummary.averageResponseTime 
    ? Math.round(kpiSummary.averageResponseTime)
    : 0;

  const mortalityRate = kpiSummary.mortalityRate 
    ? kpiSummary.mortalityRate.toFixed(1)
    : '0.0';

  const averageLengthOfStay = 0; // This field doesn't exist in the interface yet

  // Performance indicators
  const responseTimeStatus = averageResponseTime <= 15 ? 'excellent' : 
                           averageResponseTime <= 30 ? 'good' : 
                           averageResponseTime <= 60 ? 'fair' : 'poor';

  const mortalityStatus = parseFloat(mortalityRate) <= 5 ? 'excellent' :
                         parseFloat(mortalityRate) <= 10 ? 'good' :
                         parseFloat(mortalityRate) <= 20 ? 'fair' : 'poor';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#4caf50';
      case 'good': return '#8bc34a';
      case 'fair': return '#ff9800';
      case 'poor': return '#f44336';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle color="success" />;
      case 'good': return <CheckCircle color="success" />;
      case 'fair': return <Warning color="warning" />;
      case 'poor': return <Warning color="error" />;
      default: return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Trauma KPI Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive performance metrics and analytics
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </Box>

      {/* Main KPI Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Cases"
            value={kpiSummary.totalCases}
            subtitle="All trauma cases"
            icon={<Assessment />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Critical Cases"
            value={kpiSummary.criticalCases}
            subtitle={`${criticalCaseRate}% of total`}
            icon={<Warning />}
            color="#d32f2f"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Transfer Cases"
            value={kpiSummary.transferCases}
            subtitle={`${transferCaseRate}% of total`}
            icon={<TransferWithinAStation />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Avg Response Time"
            value={`${averageResponseTime} min`}
            subtitle="Time to arrival"
            icon={<Schedule />}
            color={getStatusColor(responseTimeStatus)}
          />
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response Time Performance
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h4" sx={{ color: getStatusColor(responseTimeStatus) }}>
                  {averageResponseTime} min
                </Typography>
                {getStatusIcon(responseTimeStatus)}
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((averageResponseTime / 60) * 100, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getStatusColor(responseTimeStatus),
                  },
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Target: ≤15 min | Good: ≤30 min | Fair: ≤60 min
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Mortality Rate
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h4" sx={{ color: getStatusColor(mortalityStatus) }}>
                  {mortalityRate}%
                </Typography>
                {getStatusIcon(mortalityStatus)}
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(parseFloat(mortalityRate), 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getStatusColor(mortalityStatus),
                  },
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Target: ≤5% | Good: ≤10% | Fair: ≤20%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Length of Stay
              </Typography>
              <Typography variant="h4" color="primary">
                {averageLengthOfStay} days
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hospital stay duration
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Glasgow Score
              </Typography>
              <Typography variant="h4" color="primary">
                {kpiSummary.averageGlasgowScore ? kpiSummary.averageGlasgowScore.toFixed(1) : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Neurological assessment
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cases This Month
              </Typography>
              <Typography variant="h4" color="primary">
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cases This Week
              </Typography>
              <Typography variant="h4" color="primary">
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Summary Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Summary
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell>Current Value</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Trend</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Response Time</TableCell>
                  <TableCell>{averageResponseTime} min</TableCell>
                  <TableCell>≤15 min</TableCell>
                  <TableCell>
                    <Chip
                      label={responseTimeStatus.toUpperCase()}
                      color={responseTimeStatus === 'excellent' || responseTimeStatus === 'good' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {averageResponseTime <= 15 ? <TrendingDown color="success" /> : <TrendingUp color="error" />}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Mortality Rate</TableCell>
                  <TableCell>{mortalityRate}%</TableCell>
                  <TableCell>≤5%</TableCell>
                  <TableCell>
                    <Chip
                      label={mortalityStatus.toUpperCase()}
                      color={mortalityStatus === 'excellent' || mortalityStatus === 'good' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {parseFloat(mortalityRate) <= 5 ? <TrendingDown color="success" /> : <TrendingUp color="error" />}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Critical Case Rate</TableCell>
                  <TableCell>{criticalCaseRate}%</TableCell>
                  <TableCell>≤20%</TableCell>
                  <TableCell>
                    <Chip
                      label={parseFloat(criticalCaseRate) <= 20 ? 'GOOD' : 'NEEDS ATTENTION'}
                      color={parseFloat(criticalCaseRate) <= 20 ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {parseFloat(criticalCaseRate) <= 20 ? <TrendingDown color="success" /> : <TrendingUp color="error" />}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Transfer Rate</TableCell>
                  <TableCell>{transferCaseRate}%</TableCell>
                  <TableCell>≤30%</TableCell>
                  <TableCell>
                    <Chip
                      label={parseFloat(transferCaseRate) <= 30 ? 'GOOD' : 'HIGH'}
                      color={parseFloat(transferCaseRate) <= 30 ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {parseFloat(transferCaseRate) <= 30 ? <TrendingDown color="success" /> : <TrendingUp color="error" />}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TraumaKPIDashboardMain;
