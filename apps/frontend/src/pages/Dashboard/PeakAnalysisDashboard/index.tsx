import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine,
  faArrowUp,
} from '@fortawesome/free-solid-svg-icons';

import { usePeakAnalysisData } from './hooks';

const PeakAnalysisDashboard: React.FC = () => {
  const { data, isLoading, error } = usePeakAnalysisData();

  if (isLoading) {
    return (
      <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography>Loading peak analysis data...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography color="error">
            Error loading peak analysis data: {(error as Error)?.message || 'Unknown error'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const analysisData = data || {
    todaysCases: 0,
    yesterdaysCases: 0,
    weeklyAverage: 0,
    vsYesterday: 0,
    vsLastWeek: 0,
    peakHours: '19:00-20:00',
  };

  const caseMetrics = [
    {
      label: "Today's Cases",
      value: analysisData.todaysCases.toString(),
      color: '#2196f3',
    },
    {
      label: "Yesterday's Cases",
      value: analysisData.yesterdaysCases.toString(),
      color: '#2196f3',
    },
    {
      label: 'Weekly Average',
      value: analysisData.weeklyAverage.toString(),
      color: '#2196f3',
    },
  ];

  const comparisonMetrics = [
    {
      label: 'vs Yesterday',
      value: `${analysisData.vsYesterday >= 0 ? '+' : ''}${analysisData.vsYesterday}%`,
      color: '#4caf50',
      icon: faArrowUp,
    },
    {
      label: 'vs Last Week',
      value: `${analysisData.vsLastWeek >= 0 ? '+' : ''}${analysisData.vsLastWeek}%`,
      color: '#4caf50',
      icon: faArrowUp,
    },
  ];

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <FontAwesomeIcon 
            icon={faChartLine} 
            style={{ color: '#1976d2', marginRight: '16px', fontSize: '28px' }} 
          />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Peak Analysis Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Traffic patterns and trend analysis
            </Typography>
          </Box>
        </Box>

        {/* Case Metrics */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          {caseMetrics.map((metric, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {metric.label}:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: metric.color,
                }}
              >
                {metric.value}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* Divider */}
        <Divider sx={{ my: 2 }} />

        {/* Comparison Metrics */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          {comparisonMetrics.map((metric, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {metric.label}:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: metric.color,
                    mr: 1,
                  }}
                >
                  {metric.value}
                </Typography>
                {metric.icon && (
                  <FontAwesomeIcon 
                    icon={metric.icon} 
                    style={{ 
                      color: metric.color, 
                      fontSize: '12px' 
                    }} 
                  />
                )}
              </Box>
            </Box>
          ))}
        </Stack>

        {/* Peak Hours Section */}
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            p: 2,
            mt: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Peak Hours
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: '#4caf50',
            }}
          >
            {analysisData.peakHours}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PeakAnalysisDashboard;
