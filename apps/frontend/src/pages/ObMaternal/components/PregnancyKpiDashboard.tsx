import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Skeleton,
  Alert,
  Chip,
  LinearProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Assessment,
  PregnantWoman,
  Warning,
  TrendingUp,
  Description,
  ChildCare,
} from '@mui/icons-material';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format } from 'date-fns';
import type { ObMaternalKpiSummary } from '../../../services/obMaternalTransferService';
import {
  UnifiedKPICard,
  getTheme,
  getGradients,
  getCardStyles,
  getPercentageStatus,
  PortalType,
} from '../../../components/Common/KPI';
import KPIFilterBar from '../../../components/Common/KPI/KPIFilterBar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
);

const portalType: PortalType = 'ob';

const formatPct = (v?: number | null) =>
  v != null ? `${(v * 100).toFixed(1)}%` : '—';

interface PregnancyKpiDashboardProps {
  kpiSummary: ObMaternalKpiSummary | null;
  filters?: {
    hospitalId?: string;
    startDate?: string;
    endDate?: string;
  };
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  hospitals?: Array<{ id: string; name: string }>;
  loading?: boolean;
}

const PregnancyKpiDashboard: React.FC<PregnancyKpiDashboardProps> = ({
  kpiSummary,
  filters = {},
  onFilterChange = () => {},
  onClearFilters = () => {},
  hospitals = [],
  loading = false,
}) => {
  const kpiTheme = getTheme(portalType);
  const kpiGradients = getGradients(kpiTheme);
  const cardStyles = getCardStyles(kpiTheme);

  const getComplianceStatus = (percentage: number) => {
    if (percentage >= 90) return { color: 'success' as const, label: 'Excellent' };
    if (percentage >= 75) return { color: 'warning' as const, label: 'Good' };
    return { color: 'error' as const, label: 'Needs Improvement' };
  };

  if (!kpiSummary && !loading) {
    return (
      <Box sx={{ ...cardStyles.page, minHeight: 'auto' }}>
        <Alert
          severity="info"
          sx={{
            background: 'white',
            borderRadius: 2,
            p: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: `1px solid ${kpiTheme.borderColor}`,
          }}
        >
          No KPI data available. Create OB maternal transfers to see metrics.
        </Alert>
      </Box>
    );
  }

  const kpiNames: Record<string, { name: string; target: string; icon: React.ReactNode }> = {
    documentation: {
      name: 'Documentation Completeness',
      target: '≥90%',
      icon: <Description />,
    },
    maternalMortality: {
      name: 'Maternal Mortality',
      target: '<2%',
      icon: <PregnantWoman />,
    },
    nicuRate: {
      name: 'NICU Rate',
      target: '<15%',
      icon: <ChildCare />,
    },
  };

  const trafficLightKpis =
    (kpiSummary?.kpiPerformance &&
      Object.entries(kpiSummary.kpiPerformance)
        .map(([id, data]) => {
          const info = kpiNames[id];
          if (!info) return null;
          const status = getComplianceStatus(data.percentage);
          return {
            id,
            ...info,
            ...data,
            status,
          };
        })
        .filter(Boolean)) ??
    [];

  return (
    <Box sx={{ ...cardStyles.page, minHeight: 'auto' }}>
      {/* Header */}
      <Box mb={3}>
        <Card sx={cardStyles.primary}>
          <Box sx={{ height: 4, background: kpiGradients.header }} />
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={3}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <PregnantWoman sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                  Pregnancy Analytics Center
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Hospital-based performance monitoring and insights
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Filter Bar */}
      <Box mb={4}>
        <KPIFilterBar
          filters={filters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          hospitals={hospitals}
          loading={loading}
          portalType={portalType}
        />
      </Box>

      {loading ? (
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
      ) : kpiSummary ? (
        <>
          {/* Primary KPI Cards */}
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: kpiTheme.textPrimary, mb: 3 }}
          >
            Key Performance Metrics
          </Typography>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <UnifiedKPICard
                variant="primary"
                title="Total Cases"
                value={kpiSummary.totalCases}
                subtitle="All maternal transfers in period"
                icon={<Assessment />}
                portalType={portalType}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <UnifiedKPICard
                variant="primary"
                title="Maternal Red"
                value={kpiSummary.maternalRedCount}
                subtitle="High-acuity activations"
                icon={<Warning />}
                portalType={portalType}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <UnifiedKPICard
                variant="primary"
                title="Maternal Orange"
                value={kpiSummary.maternalOrangeCount}
                subtitle="Moderate-acuity activations"
                icon={<TrendingUp />}
                portalType={portalType}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <UnifiedKPICard
                variant="primary"
                title="Maternal Mortality Rate"
                value={formatPct(kpiSummary.maternalMortalityRate)}
                subtitle="Target: <2%"
                icon={<PregnantWoman />}
                portalType={portalType}
              />
            </Grid>
          </Grid>

          {/* Traffic Light System */}
          {trafficLightKpis.length > 0 && (
            <>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: kpiTheme.textPrimary, mb: 3 }}
              >
                KPI Target Compliance
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 4,
                  background: 'white',
                  border: `1px solid ${kpiTheme.borderColor}`,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <Grid container spacing={3}>
                  {trafficLightKpis.map((kpi: any) => {
                    const pct = kpi.percentage ?? 0;
                    const borderColor =
                      kpi.status.color === 'success'
                        ? '#4caf50'
                        : kpi.status.color === 'warning'
                          ? '#ff9800'
                          : '#f44336';

                    return (
                      <Grid item xs={12} sm={6} md={4} key={kpi.id}>
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {kpi.name}
                              </Typography>
                              <Typography variant="body2">
                                {kpi.met}/{kpi.total} cases ({pct.toFixed(1)}%)
                              </Typography>
                              <Typography variant="caption">
                                Target: {kpi.target}
                              </Typography>
                            </Box>
                          }
                          arrow
                        >
                          <Box
                            sx={{
                              p: 2.5,
                              border: `2px solid ${borderColor}`,
                              borderRadius: 2,
                              backgroundColor: `${borderColor}08`,
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              '&:hover': { transform: 'scale(1.02)', boxShadow: 2 },
                              height: '100%',
                              cursor: 'pointer',
                            }}
                          >
                            <Box
                              sx={{
                                color: borderColor,
                                mb: 1,
                                '& .MuiSvgIcon-root': { fontSize: 32 },
                              }}
                            >
                              {kpi.icon}
                            </Box>
                            <Typography
                              variant="subtitle2"
                              fontWeight={600}
                              sx={{ color: kpiTheme.textPrimary, mb: 1 }}
                            >
                              {kpi.name}
                            </Typography>
                            <Typography
                              variant="h5"
                              fontWeight={700}
                              sx={{ color: kpiTheme.primary, mb: 1 }}
                            >
                              {pct.toFixed(1)}%
                            </Typography>
                            <Typography variant="caption" sx={{ color: kpiTheme.textSecondary }}>
                              Target: {kpi.target}
                            </Typography>
                            <Box sx={{ mt: 1.5 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(pct, 100)}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: kpiTheme.borderColor,
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    backgroundColor: borderColor,
                                  },
                                }}
                              />
                            </Box>
                            <Chip
                              label={kpi.status.label}
                              size="small"
                              sx={{
                                mt: 1.5,
                                fontWeight: 600,
                                backgroundColor: borderColor,
                                color: '#fff',
                              }}
                            />
                          </Box>
                        </Tooltip>
                      </Grid>
                    );
                  })}
                </Grid>
                <Box
                  mt={2}
                  p={1.5}
                  sx={{
                    backgroundColor: `${kpiTheme.primary}08`,
                    borderRadius: 1,
                    border: `1px solid ${kpiTheme.borderColor}`,
                  }}
                >
                  <Typography variant="body2" textAlign="center" sx={{ color: kpiTheme.textSecondary }}>
                    Excellent (90%+) | Good (75–89%) | Needs Improvement (&lt;75%)
                  </Typography>
                </Box>
              </Paper>
            </>
          )}

          {/* Secondary KPI Cards with targets */}
          {kpiSummary.kpiPerformance && Object.keys(kpiSummary.kpiPerformance).length > 0 && (
            <>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: kpiTheme.textPrimary, mb: 3 }}
              >
                Performance Indicators
              </Typography>
              <Grid container spacing={3} mb={4}>
                {Object.entries(kpiSummary.kpiPerformance).map(([kpiId, kpiData]) => {
                  const info = kpiNames[kpiId];
                  if (!info) return null;
                  const status = getPercentageStatus(kpiData.percentage);

                  return (
                    <Grid item xs={12} sm={6} md={4} key={kpiId}>
                      <UnifiedKPICard
                        variant="secondary"
                        title={info.name}
                        value={`${kpiData.percentage.toFixed(1)}%`}
                        target={info.target}
                        percentage={kpiData.percentage}
                        status={status}
                        icon={info.icon}
                        casesInfo={`${kpiData.met} of ${kpiData.total} cases`}
                        portalType={portalType}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </>
          )}

          {/* Charts */}
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: kpiTheme.textPrimary, mb: 3 }}
          >
            Visual Analytics
          </Typography>
          <Grid container spacing={3} mb={4}>
            {/* Cases by Hospital - Bar Chart */}
            {kpiSummary.byHospital && kpiSummary.byHospital.length > 0 && (
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: `1px solid ${kpiTheme.borderColor}`,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: kpiTheme.textPrimary }}>
                    Cases by Hospital
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Bar
                      data={{
                        labels: kpiSummary.byHospital.map((h) => h.hospitalName),
                        datasets: [
                          {
                            label: 'Total Cases',
                            data: kpiSummary.byHospital.map((h) => h.totalCases),
                            backgroundColor: kpiTheme.primary,
                            borderColor: kpiTheme.gradientStart,
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (ctx: any) =>
                                `Cases: ${ctx.parsed.y} (Red: ${kpiSummary.byHospital![ctx.dataIndex].maternalRed}, Orange: ${kpiSummary.byHospital![ctx.dataIndex].maternalOrange})`,
                            },
                          },
                        },
                        scales: {
                          x: {
                            ticks: { color: kpiTheme.textSecondary, maxRotation: 45 },
                            grid: { color: kpiTheme.borderColor },
                          },
                          y: {
                            ticks: { color: kpiTheme.textSecondary },
                            grid: { color: kpiTheme.borderColor },
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            )}

            {/* Activation Level Distribution - Doughnut */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: `1px solid ${kpiTheme.borderColor}`,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: kpiTheme.textPrimary }}>
                  Activation Level Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Doughnut
                    data={{
                      labels: ['Maternal Red', 'Maternal Orange', 'Other'],
                      datasets: [
                        {
                          data: [
                            kpiSummary.maternalRedCount,
                            kpiSummary.maternalOrangeCount,
                            Math.max(
                              0,
                              kpiSummary.totalCases -
                                kpiSummary.maternalRedCount -
                                kpiSummary.maternalOrangeCount,
                            ),
                          ],
                          backgroundColor: ['#dc2626', '#ea580c', kpiTheme.accentLight],
                          borderColor: 'white',
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                          callbacks: {
                            label: (ctx: any) => {
                              const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
                              const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0';
                              return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Daily Trend - Line Chart */}
            {kpiSummary.dailyTrend && kpiSummary.dailyTrend.length > 0 && (
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: `1px solid ${kpiTheme.borderColor}`,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: kpiTheme.textPrimary }}>
                    Daily Trend
                  </Typography>
                  <Box sx={{ height: 280 }}>
                    <Line
                      data={{
                        labels: kpiSummary.dailyTrend.map((d) =>
                          format(new Date(d.date), 'dd/MM'),
                        ),
                        datasets: [
                          {
                            label: 'Total',
                            data: kpiSummary.dailyTrend.map((d) => d.total),
                            borderColor: kpiTheme.primary,
                            backgroundColor: `${kpiTheme.primary}20`,
                            fill: true,
                            tension: 0.3,
                          },
                          {
                            label: 'Red',
                            data: kpiSummary.dailyTrend.map((d) => d.red),
                            borderColor: '#dc2626',
                            backgroundColor: 'transparent',
                            tension: 0.3,
                          },
                          {
                            label: 'Orange',
                            data: kpiSummary.dailyTrend.map((d) => d.orange),
                            borderColor: '#ea580c',
                            backgroundColor: 'transparent',
                            tension: 0.3,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'top' },
                        },
                        scales: {
                          x: {
                            ticks: { color: kpiTheme.textSecondary },
                            grid: { color: kpiTheme.borderColor },
                          },
                          y: {
                            ticks: { color: kpiTheme.textSecondary },
                            grid: { color: kpiTheme.borderColor },
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>

          {/* By Hospital Table */}
          {kpiSummary.byHospital && kpiSummary.byHospital.length > 0 && (
            <>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: kpiTheme.textPrimary, mb: 3 }}
              >
                By Hospital
              </Typography>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${kpiTheme.borderColor}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: `${kpiTheme.primary}08` }}>
                      <TableCell sx={{ fontWeight: 600, color: kpiTheme.textPrimary }}>
                        Hospital
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: kpiTheme.textPrimary }}>
                        Total
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: kpiTheme.textPrimary }}>
                        Red
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: kpiTheme.textPrimary }}>
                        Orange
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: kpiTheme.textPrimary }}>
                        MMR
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: kpiTheme.textPrimary }}>
                        NICU %
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {kpiSummary.byHospital.map((h) => (
                      <TableRow key={h.hospitalId} sx={{ '&:hover': { bgcolor: `${kpiTheme.accentLight}20` } }}>
                        <TableCell>{h.hospitalName}</TableCell>
                        <TableCell align="right">{h.totalCases}</TableCell>
                        <TableCell align="right">{h.maternalRed}</TableCell>
                        <TableCell align="right">{h.maternalOrange}</TableCell>
                        <TableCell align="right">{formatPct(h.maternalMortalityRate)}</TableCell>
                        <TableCell align="right">{formatPct(h.nicuRate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </>
      ) : null}
    </Box>
  );
};

export default PregnancyKpiDashboard;
