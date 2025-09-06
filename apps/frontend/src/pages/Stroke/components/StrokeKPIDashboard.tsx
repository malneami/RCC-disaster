import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Alert,
} from '@mui/material';

import { StrokeKPISummary } from '../../../services/strokeService';
import SummaryCards from './StrokeKPIDashboard/SummaryCards';
import StrokeTypeBreakdown from './StrokeKPIDashboard/StrokeTypeBreakdown';
import KPIPerformanceTable from './StrokeKPIDashboard/KPIPerformanceTable';
import ClinicalOutcomes from './StrokeKPIDashboard/ClinicalOutcomes';

interface StrokeKPIDashboardProps {
  kpiSummary: StrokeKPISummary | null;
}

const StrokeKPIDashboard: React.FC<StrokeKPIDashboardProps> = ({ kpiSummary }) => {
  if (!kpiSummary) {
    return (
      <Alert severity="info">
        No KPI data available
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Stroke Care Performance Dashboard
      </Typography>

      {/* Summary Cards */}
      <SummaryCards kpiSummary={kpiSummary} />

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Stroke Type Breakdown */}
        <Grid item xs={12} md={6}>
          <StrokeTypeBreakdown kpiSummary={kpiSummary} />
        </Grid>

        {/* Clinical Outcomes */}
        <Grid item xs={12} md={6}>
          <ClinicalOutcomes kpiSummary={kpiSummary} />
        </Grid>

        {/* KPI Performance Table */}
        <Grid item xs={12}>
          <KPIPerformanceTable kpiSummary={kpiSummary} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default StrokeKPIDashboard;