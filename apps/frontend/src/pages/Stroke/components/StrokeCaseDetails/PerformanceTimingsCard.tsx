import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  LinearProgress,
} from '@mui/material';

import { StrokeCase } from '../../../../services/strokeService';

interface PerformanceTimingsCardProps {
  strokeCase: StrokeCase;
}

const PerformanceTimingsCard: React.FC<PerformanceTimingsCardProps> = ({
  strokeCase,
}) => {
  const formatDuration = (minutes: number | null | undefined): string => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTimingColor = (minutes: number | null | undefined, target: number): 'success' | 'warning' | 'error' => {
    if (!minutes) return 'error';
    if (minutes <= target) return 'success';
    if (minutes <= target * 1.5) return 'warning';
    return 'error';
  };

  const getProgressValue = (minutes: number | null | undefined, target: number): number => {
    if (!minutes) return 0;
    return Math.min((minutes / target) * 100, 100);
  };

  const timingMetrics = [
    {
      label: 'Door to CT Scan',
      value: strokeCase.doorToCtScanMinutes,
      target: 25, // 25 minutes target
    },
    {
      label: 'Door to Needle',
      value: strokeCase.doorToNeedleMinutes,
      target: 60, // 60 minutes target
    },
    {
      label: 'Door to Mechanical Thrombectomy',
      value: strokeCase.doorToMechanicalThrombectomyMinutes,
      target: 90, // 90 minutes target
    },
    {
      label: 'Symptom to Hospital',
      value: strokeCase.symptomToHospitalMinutes,
      target: 240, // 4 hours target
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Performance Timings
        </Typography>
        <Grid container spacing={3}>
          {timingMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Box>
                <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
                <Typography variant="h6">
                  {formatDuration(metric.value)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={getProgressValue(metric.value, metric.target)}
                  color={getTimingColor(metric.value, metric.target)}
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Target: {formatDuration(metric.target)}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PerformanceTimingsCard;
