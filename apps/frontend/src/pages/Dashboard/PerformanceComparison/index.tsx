import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  Grid,
  Stack,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';

import { usePerformanceComparison } from './hooks';
import DailySummary from './DailySummary';
import ChangeAnalysis from './ChangeAnalysis';
import PerformanceChart from './PerformanceChart';

export type TimePeriod = 'daily' | 'weekly' | 'monthly';

const PerformanceComparison: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('monthly');
  const { data, isLoading, error } = usePerformanceComparison(selectedPeriod);

  if (isLoading) {
    return (
      <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography>Loading performance data...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography color="error">
            Error loading performance data: {(error as Error)?.message || 'Unknown error'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const globalMetrics = data?.globalMetrics || {
    current: 0,
    previousChange: 0,
    averageChange: 0,
  };

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FontAwesomeIcon 
              icon={faChartLine} 
              style={{ color: '#1976d2', marginRight: '16px', fontSize: '28px' }} 
            />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Performance Comparison
            </Typography>
          </Box>

          {/* Global Metrics */}
          <Stack direction="row" spacing={3} sx={{ mr: 3 }}>
            <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 500 }}>
              Current: {globalMetrics.current} cases
            </Typography>
            <Typography variant="body2" sx={{ color: '#2196f3', fontWeight: 500 }}>
              vs Previous: {globalMetrics.previousChange >= 0 ? '+' : ''}{globalMetrics.previousChange}% increase
            </Typography>
            <Typography variant="body2" sx={{ color: '#9c27b0', fontWeight: 500 }}>
              vs Average: {globalMetrics.averageChange >= 0 ? '+' : ''}{globalMetrics.averageChange}%
            </Typography>
          </Stack>

          {/* Time Period Selection */}
          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={selectedPeriod === 'daily' ? 'contained' : 'outlined'}
              onClick={() => setSelectedPeriod('daily')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                ...(selectedPeriod === 'daily' && {
                  bgcolor: '#1976d2',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#1565c0',
                  },
                }),
              }}
            >
              Daily
            </Button>
            <Button
              variant={selectedPeriod === 'weekly' ? 'contained' : 'outlined'}
              onClick={() => setSelectedPeriod('weekly')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                ...(selectedPeriod === 'weekly' && {
                  bgcolor: '#1976d2',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#1565c0',
                  },
                }),
              }}
            >
              Weekly
            </Button>
            <Button
              variant={selectedPeriod === 'monthly' ? 'contained' : 'outlined'}
              onClick={() => setSelectedPeriod('monthly')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                ...(selectedPeriod === 'monthly' && {
                  bgcolor: '#1976d2',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#1565c0',
                  },
                }),
              }}
            >
              Monthly
            </Button>
          </ButtonGroup>
        </Box>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Daily Summary Section */}
          <Grid item xs={12} md={6}>
            <DailySummary data={data?.dailySummary} />
          </Grid>

          {/* Change Analysis Section */}
          <Grid item xs={12} md={6}>
            <ChangeAnalysis data={data?.changeAnalysis} />
          </Grid>

          {/* Performance Chart Section */}
          <Grid item xs={12}>
            <PerformanceChart data={data?.chartData} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PerformanceComparison;
