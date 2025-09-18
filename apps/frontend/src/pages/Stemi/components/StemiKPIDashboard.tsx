import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import { StemiKpiResponse } from '../services/stemiService';

interface StemiKPIDashboardProps {
  kpiSummary: StemiKpiResponse | null;
}

const StemiKPIDashboard: React.FC<StemiKPIDashboardProps> = ({ kpiSummary }) => {
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

