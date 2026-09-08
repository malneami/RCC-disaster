import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Alert,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Assessment,
  Psychology,
  AccessTime,
  CheckCircle,
} from '@mui/icons-material';
import { NeurosurgicalKPISummary } from '../../../services/neurosurgicalService';
import {
  UnifiedKPICard,
  getTheme,
  getGradients,
  cardStyles,
  getPercentageStatus,
  PortalType,
} from '../../../components/Common/KPI';
import KPIFilterBar from '../../../components/Common/KPI/KPIFilterBar';
import { NEURO_CONFIG } from '../config/neuroConfig';

interface NeurosurgicalKPIDashboardProps {
  kpiSummary: NeurosurgicalKPISummary | null;
  filters?: {
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
  };
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  hospitals?: Array<{ id: string; name: string }>;
  loading?: boolean;
  portalType?: PortalType;
}

const NeurosurgicalKPIDashboard: React.FC<NeurosurgicalKPIDashboardProps> = ({
  kpiSummary,
  filters = {},
  onFilterChange,
  onClearFilters,
  hospitals = [],
  loading = false,
  portalType = 'trauma',
}) => {
  const kpiTheme = getTheme(portalType);
  const kpiGradients = getGradients(kpiTheme);

  if (!kpiSummary) {
    return (
      <Box
        sx={{
          ...cardStyles.page,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Alert severity="info">No KPI data available</Alert>
      </Box>
    );
  }

  const kpiEntries = Object.entries(NEURO_CONFIG.KPI_LABELS) as Array<
    [keyof typeof NEURO_CONFIG.KPI_LABELS, { name: string; target: string }]
  >;

  return (
    <Box sx={{ ...cardStyles.page, minHeight: 'auto' }}>
      <Box mb={3}>
        <Card sx={cardStyles.primary}>
          <Box sx={{ height: 4, background: kpiGradients.header }} />
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Neurosurgical KPI Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Door→CT, neurosurgeon connect, definitive care, and Brain Preservation Rate
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {onFilterChange && onClearFilters && (
        <Box mb={3}>
          <KPIFilterBar
            filters={filters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
            hospitals={hospitals}
            loading={loading}
            portalType={portalType}
          />
        </Box>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Total Cases"
            value={kpiSummary.totalCases}
            subtitle={`${kpiSummary.casesThisWeek} this week`}
            icon={<Assessment />}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Brain Preservation"
            value={`${kpiSummary.brainPreservationRate}%`}
            subtitle="Closed cases preserved"
            percentage={kpiSummary.brainPreservationRate}
            status={getPercentageStatus(kpiSummary.brainPreservationRate)}
            icon={<Psychology />}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Avg Door→CT"
            value={`${kpiSummary.averageTimings.doorToCt || '—'}m`}
            subtitle="≤15 on-site / ≤30 transfer"
            icon={<AccessTime />}
            portalType={portalType}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UnifiedKPICard
            variant="primary"
            title="Avg RCC→Decision"
            value={`${kpiSummary.averageTimings.activationToNeurosurgeon || '—'}m`}
            subtitle={`Target ≤${NEURO_CONFIG.KPI_TARGETS.RCC_TO_NEUROSURGEON_DECISION} min`}
            icon={<CheckCircle />}
            portalType={portalType}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
        KPI Compliance
      </Typography>
      <Grid container spacing={2} mb={3}>
        {kpiEntries.map(([key, meta]) => {
          const perf = kpiSummary.kpiPerformance[key];
          return (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <UnifiedKPICard
                variant="secondary"
                title={meta.name}
                value={`${perf?.percentage ?? 0}%`}
                target={meta.target}
                percentage={perf?.percentage ?? 0}
                status={getPercentageStatus(perf?.percentage ?? 0)}
                casesInfo={`${perf?.met ?? 0}/${perf?.total ?? 0} cases`}
                portalType={portalType}
              />
            </Grid>
          );
        })}
      </Grid>

      <Typography variant="h6" gutterBottom>
        Severity mix
      </Typography>
      <Box display="flex" gap={1} mb={2}>
        <Chip
          color="error"
          label={`Red: ${kpiSummary.severityBreakdown.red}`}
        />
        <Chip
          color="warning"
          label={`Orange: ${kpiSummary.severityBreakdown.orange}`}
        />
      </Box>

      <Typography variant="h6" gutterBottom>
        Closed outcomes
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        <Chip label={`Improved: ${kpiSummary.outcomes.improved}`} size="small" />
        <Chip label={`Stable: ${kpiSummary.outcomes.stable}`} size="small" />
        <Chip label={`Deteriorated: ${kpiSummary.outcomes.deteriorated}`} size="small" />
        <Chip
          label={`Severe disability: ${kpiSummary.outcomes.severeDisability}`}
          size="small"
        />
        <Chip label={`Death: ${kpiSummary.outcomes.death}`} size="small" />
      </Box>
    </Box>
  );
};

export default NeurosurgicalKPIDashboard;
