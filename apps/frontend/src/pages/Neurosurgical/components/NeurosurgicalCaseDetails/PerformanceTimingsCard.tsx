import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  LinearProgress,
} from '@mui/material';
import { NeurosurgicalCase } from '../../../../services/neurosurgicalService';
import { NEURO_CONFIG, getNeuroCtTargets } from '../../config/neuroConfig';

interface PerformanceTimingsCardProps {
  neuroCase: NeurosurgicalCase;
}

const PerformanceTimingsCard: React.FC<PerformanceTimingsCardProps> = ({
  neuroCase,
}) => {
  const formatDuration = (minutes: number | null | undefined): string => {
    if (minutes === null || minutes === undefined) return 'N/A';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTimingColor = (
    minutes: number | null | undefined,
    target: number | null,
  ): 'success' | 'warning' | 'error' => {
    if (target === null || minutes === null || minutes === undefined) return 'error';
    if (minutes <= target) return 'success';
    if (minutes <= target * 1.5) return 'warning';
    return 'error';
  };

  const getProgressValue = (
    minutes: number | null | undefined,
    target: number | null,
  ): number => {
    if (target === null || minutes === null || minutes === undefined) return 0;
    return Math.min((minutes / target) * 100, 100);
  };

  const ctTargets = getNeuroCtTargets(neuroCase.ctLocation);
  const doorOutMinutes =
    neuroCase.doorOutToDefinitiveCareMinutes ??
    neuroCase.activationToDefinitiveCareMinutes;

  const timingMetrics = [
    {
      label: ctTargets
        ? `Door → CT start (${ctTargets.label})`
        : 'Door → CT start (set CT location)',
      value: neuroCase.doorToCtMinutes,
      target: ctTargets?.doorToCt ?? null,
    },
    {
      label: ctTargets
        ? `Door → CT report (${ctTargets.label})`
        : 'Door → CT report (set CT location)',
      value: neuroCase.doorToCtReportMinutes,
      target: ctTargets?.doorToCtReport ?? null,
    },
    {
      label: 'RCC call → Neurosurgeon decision',
      value: neuroCase.activationToNeurosurgeonMinutes,
      target: NEURO_CONFIG.KPI_TARGETS.RCC_TO_NEUROSURGEON_DECISION,
    },
    {
      label: 'Door out → Definitive care',
      value: doorOutMinutes,
      target: NEURO_CONFIG.KPI_TARGETS.DOOR_OUT_TO_DEFINITIVE_CARE,
    },
  ];

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Performance Timings
        </Typography>
        {!ctTargets && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            CT KPIs are N/A until CT location is set (origin hospital with CT vs
            destination).
          </Typography>
        )}
        <Grid container spacing={3}>
          {timingMetrics.map((metric) => (
            <Grid item xs={12} sm={6} key={metric.label}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="h6">{formatDuration(metric.value)}</Typography>
                {metric.target !== null ? (
                  <>
                    <LinearProgress
                      variant="determinate"
                      value={getProgressValue(metric.value, metric.target)}
                      color={getTimingColor(metric.value, metric.target)}
                      sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Target: ≤{metric.target} min
                    </Typography>
                  </>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Target: N/A
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PerformanceTimingsCard;
