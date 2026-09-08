import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CrossIcon,
  RemoveCircleOutline as NaIcon,
} from '@mui/icons-material';
import { NeurosurgicalCase } from '../../../../services/neurosurgicalService';
import { NEURO_CONFIG, getNeuroCtTargets } from '../../config/neuroConfig';

interface KPIPerformanceCardProps {
  neuroCase: NeurosurgicalCase;
}

const KPIPerformanceCard: React.FC<KPIPerformanceCardProps> = ({ neuroCase }) => {
  const ctTargets = getNeuroCtTargets(neuroCase.ctLocation);

  const kpiItems = [
    {
      label: ctTargets
        ? `Door → CT start ≤${ctTargets.doorToCt} min`
        : 'Door → CT start (N/A — set CT location)',
      met: neuroCase.metKpi1,
    },
    {
      label: ctTargets
        ? `Door → CT report ≤${ctTargets.doorToCtReport} min`
        : 'Door → CT report (N/A — set CT location)',
      met: neuroCase.metKpi2,
    },
    {
      label: `${NEURO_CONFIG.KPI_LABELS.kpi3.name} ${NEURO_CONFIG.KPI_LABELS.kpi3.target}`,
      met: neuroCase.metKpi3,
    },
    {
      label: `${NEURO_CONFIG.KPI_LABELS.kpi4.name} ${NEURO_CONFIG.KPI_LABELS.kpi4.target}`,
      met: neuroCase.metKpi4,
    },
    {
      label: NEURO_CONFIG.KPI_LABELS.kpi5.name,
      met: neuroCase.metKpi5,
    },
    {
      label: NEURO_CONFIG.KPI_LABELS.kpi6.name,
      met: neuroCase.metKpi6,
    },
  ];

  const applicable = kpiItems.filter((i) => i.met !== null && i.met !== undefined);
  const metCount = applicable.filter((i) => i.met === true).length;
  const totalCount = applicable.length;
  const percentage = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          KPI Performance
        </Typography>
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant="h3" color="primary" gutterBottom>
            {percentage}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {metCount} of {totalCount || 0} applicable KPIs met
          </Typography>
        </Box>
        <Grid container spacing={1}>
          {kpiItems.map((item) => {
            const isNa = item.met === null || item.met === undefined;
            return (
              <Grid item xs={12} sm={6} key={item.label}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isNa ? (
                    <NaIcon fontSize="small" color="disabled" />
                  ) : item.met ? (
                    <CheckIcon fontSize="small" color="success" />
                  ) : (
                    <CrossIcon fontSize="small" color="error" />
                  )}
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {item.label}
                  </Typography>
                  <Chip
                    label={isNa ? 'N/A' : item.met ? 'Met' : 'Miss'}
                    color={isNa ? 'default' : item.met ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default KPIPerformanceCard;
