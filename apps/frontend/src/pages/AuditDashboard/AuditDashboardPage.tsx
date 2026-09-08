import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Button,
  TextField,
  MenuItem,
  Chip,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useSnackbar } from 'notistack';
import { Assessment, Refresh, TrendingUp, TrendingDown, Remove } from '@mui/icons-material';
import { mcpAuditService, getDimensionLabel, getSeverityColor, DashboardData } from '../../services/mcpAuditService';
import { format } from 'date-fns';

const AuditDashboardPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await mcpAuditService.getDashboard({
        startDate,
        endDate,
      });
      setDashboardData(data);
    } catch (error: any) {
      console.error('Failed to fetch dashboard:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to load dashboard', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    fetchDashboard();
  };

  if (loading && !dashboardData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load dashboard data</Alert>
      </Box>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 75) return '#FF9800';
    return '#F44336';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp sx={{ color: '#4CAF50' }} />;
    if (trend === 'down') return <TrendingDown sx={{ color: '#F44336' }} />;
    return <Remove sx={{ color: '#757575' }} />;
  };

  return (
    <>
      <Helmet>
        <title>Data Quality Audit Dashboard - RCC</title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight={600}>
              Data Quality Audit Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Overall Score */}
        <Card sx={{ mb: 3, bgcolor: getScoreColor(dashboardData.overallScore) + '15' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Overall Data Quality Score
                </Typography>
                <Typography variant="h2" fontWeight={700} sx={{ color: getScoreColor(dashboardData.overallScore) }}>
                  {dashboardData.overallScore.toFixed(1)}%
                </Typography>
              </Box>
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  width: 120,
                  height: 120,
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={dashboardData.overallScore}
                  size={120}
                  thickness={5}
                  sx={{
                    color: getScoreColor(dashboardData.overallScore),
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h5" component="div" color="text.secondary" fontWeight={600}>
                    {Math.round(dashboardData.overallScore)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Dimension Scores */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Object.entries(dashboardData.dimensionScores).map(([dimension, score]) => {
            const trend = dashboardData.trends.find((t) => t.dimension === dimension);
            return (
              <Grid item xs={12} sm={6} md={4} key={dimension}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {getDimensionLabel(dimension)}
                      </Typography>
                      {trend && getTrendIcon(trend.trend)}
                    </Box>
                    <Typography variant="h4" fontWeight={700} sx={{ color: getScoreColor(score) }}>
                      {score.toFixed(1)}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Box
                        sx={{
                          width: '100%',
                          height: 6,
                          bgcolor: '#E0E0E0',
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${score}%`,
                            height: '100%',
                            bgcolor: getScoreColor(score),
                            transition: 'width 0.3s',
                          }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Severity Breakdown */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Issues by Severity
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {Object.entries(dashboardData.severityBreakdown).map(([severity, count]) => (
                    <Grid item xs={6} key={severity}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography
                          variant="h4"
                          fontWeight={700}
                          sx={{ color: getSeverityColor(severity) }}
                        >
                          {count}
                        </Typography>
                        <Chip
                          label={severity}
                          size="small"
                          sx={{
                            bgcolor: getSeverityColor(severity) + '20',
                            color: getSeverityColor(severity),
                            fontWeight: 600,
                            mt: 0.5,
                          }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Events */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Audit Events
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {dashboardData.recentEvents.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No recent events
                    </Typography>
                  ) : (
                    dashboardData.recentEvents.slice(0, 5).map((event) => (
                      <Box
                        key={event.id}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          borderLeft: `4px solid ${getSeverityColor(event.severity)}`,
                          bgcolor: '#f5f5f5',
                          borderRadius: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" fontWeight={600}>
                            {getDimensionLabel(event.dimension)}
                          </Typography>
                          <Chip
                            label={event.severity}
                            size="small"
                            sx={{
                              bgcolor: getSeverityColor(event.severity) + '20',
                              color: getSeverityColor(event.severity),
                              fontSize: '0.65rem',
                              height: 20,
                            }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          {event.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          {format(new Date(event.createdAt), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default AuditDashboardPage;
