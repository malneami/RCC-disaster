import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { strokeOutcomeFormService, StrokeOutcomeFormStats } from '../services/strokeOutcomeFormService';

const OutcomeFormDashboard: React.FC = () => {
  const [stats, setStats] = useState<StrokeOutcomeFormStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await strokeOutcomeFormService.getOutcomeFormStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching outcome form stats:', err);
      setError('Failed to load outcome form statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={fetchStats}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert severity="info">
        No outcome form statistics available.
      </Alert>
    );
  }

  const completionRate = stats.completionRate;
  const highCompletenessRate = stats.totalCases > 0 
    ? Math.round((stats.completenessDistribution.high / stats.totalCases) * 100)
    : 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h2">
          Stroke Outcome Form Dashboard
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchStats}
          variant="outlined"
          size="small"
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Overall Completion Rate */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Overall Completion Rate
              </Typography>
              <Typography variant="h4" component="div">
                {completionRate}%
              </Typography>
              <Box mt={1}>
                <LinearProgress
                  variant="determinate"
                  value={completionRate}
                  color={completionRate >= 80 ? 'success' : completionRate >= 50 ? 'warning' : 'error'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {stats.completedForms} of {stats.totalCases} forms completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Cases */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Stroke Cases
              </Typography>
              <Typography variant="h4" component="div">
                {stats.totalCases}
              </Typography>
              <Box mt={1} display="flex" gap={1}>
                <Chip
                  label={`${stats.completedForms} Completed`}
                  color="success"
                  size="small"
                />
                <Chip
                  label={`${stats.incompleteForms} Incomplete`}
                  color="warning"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* High Completeness Rate */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                High Completeness Rate
              </Typography>
              <Typography variant="h4" component="div">
                {highCompletenessRate}%
              </Typography>
              <Box mt={1}>
                <LinearProgress
                  variant="determinate"
                  value={highCompletenessRate}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {stats.completenessDistribution.high} cases with ≥80% completeness
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Completeness Distribution */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Completeness Distribution
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="success.main">
                      {stats.completenessDistribution.high}
                    </Typography>
                    <Typography color="textSecondary">
                      High (≥80%)
                    </Typography>
                    <Chip
                      label="High Completeness"
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="warning.main">
                      {stats.completenessDistribution.medium}
                    </Typography>
                    <Typography color="textSecondary">
                      Medium (50-79%)
                    </Typography>
                    <Chip
                      label="Medium Completeness"
                      color="warning"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="h3" color="error.main">
                      {stats.completenessDistribution.low}
                    </Typography>
                    <Typography color="textSecondary">
                      Low (<50%)
                    </Typography>
                    <Chip
                      label="Low Completeness"
                      color="error"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary */}
        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Outcome Form Status:</strong> {stats.completedForms} forms are marked as completed, 
              while {stats.incompleteForms} forms still need completion. 
              {stats.completenessDistribution.high} cases have high completeness (≥80%), 
              {stats.completenessDistribution.medium} have medium completeness (50-79%), 
              and {stats.completenessDistribution.low} have low completeness (<50%).
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OutcomeFormDashboard;
