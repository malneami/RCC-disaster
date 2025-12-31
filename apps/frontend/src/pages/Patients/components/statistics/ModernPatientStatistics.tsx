import React, { useState, useEffect } from 'react';
import { Box, Grid, CircularProgress, Alert, Fade, Typography } from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  LocalHospital as HospitalIcon,
  HealthAndSafety as InsuranceIcon,
} from '@mui/icons-material';
import { patientService } from '../../../../services/patientService';
import StatisticCard from './StatisticCard';
import DonutChartCard from './DonutChartCard';
import ProgressBarCard from './ProgressBarCard';
import StatisticFilters from './StatisticFilters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const GRADIENT_COLORS = {
  blue: 'linear-gradient(135deg, #6ec6ff 0%, #a5d8ff 100%)',
  green: 'linear-gradient(135deg, #8dd88f 0%, #b8e6b9 100%)',
  teal: 'linear-gradient(135deg, #6dd5c4 0%, #9ee5d6 100%)',
  navy: 'linear-gradient(135deg, #7bb3ff 0%, #a5d8ff 100%)',
  cyan: 'linear-gradient(135deg, #6dd5ed 0%, #9ee5f5 100%)',
  emerald: 'linear-gradient(135deg, #8dd88f 0%, #b8e6b9 100%)',
};

const CHART_COLORS = [
  '#6ec6ff',
  '#8dd88f',
  '#6dd5c4',
  '#7bb3ff',
  '#6dd5ed',
  '#8dd88f',
  '#a5d8ff',
];

const ModernPatientStatistics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (startDate) {
        filters.startDate = startDate.toISOString().split('T')[0];
      }
      if (endDate) {
        filters.endDate = endDate.toISOString().split('T')[0];
      }
      const data = await patientService.getPatientStatistics(filters);
      setStatistics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [startDate, endDate]);

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
  };

  if (loading && !statistics) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '500px',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e3f2fd 100%)',
          borderRadius: '16px',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress
            size={56}
            thickness={4}
            sx={{
              color: '#6ec6ff',
              mb: 2.5,
            }}
          />
          <Box
            sx={{
              color: '#6ec6ff',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Loading statistics...
          </Box>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
        }}
      >
        {error}
      </Alert>
    );
  }

  if (!statistics) {
    return (
      <Alert
        severity="info"
        sx={{
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        }}
      >
        No statistics data available. Statistics will appear once patients are added to the system.
      </Alert>
    );
  }

  // Prepare chart data
  const genderData = Object.entries(statistics.byGender || {}).map(([name, value]) => ({
    name,
    value: Number(value) || 0,
  }));

  const privacyData = Object.entries(statistics.byPrivacyLevel || {}).map(([name, value]) => ({
    name,
    value: Number(value) || 0,
  }));

  const bloodTypeData = Object.entries(statistics.byBloodType || {}).map(([name, value]) => ({
    name,
    value: Number(value) || 0,
  }));

  const ageGroupData = Object.entries(statistics.byAgeGroup || {}).map(([name, value]) => ({
    name,
    value: Number(value) || 0,
  }));

  const caseTypeData = [
    { name: 'Stroke', value: Number(statistics.byCaseType?.stroke) || 0 },
    { name: 'Trauma', value: Number(statistics.byCaseType?.trauma) || 0 },
    { name: 'STEMI', value: Number(statistics.byCaseType?.stemi) || 0 },
  ];

  const totalPatients = statistics.total || 0;
  const withInsurance = statistics.insurance?.with || 0;
  const withoutInsurance = statistics.insurance?.without || 0;
  const insuranceTotal = withInsurance + withoutInsurance;
  const insurancePercentage = insuranceTotal > 0 ? ((withInsurance / insuranceTotal) * 100).toFixed(1) : '0';

  return (
    <Fade in={true} timeout={400}>
      <Box sx={{ p: 2 }}>
        {/* Filters */}
        <StatisticFilters
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onReset={handleReset}
        />

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatisticCard
              title="Total Patients"
              value={totalPatients}
              icon={<PeopleIcon sx={{ color: '#ffffff', fontSize: '28px' }} />}
              gradient={GRADIENT_COLORS.blue}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatisticCard
              title="Recent Activity"
              value={statistics.recentActivity || 0}
              icon={<TrendingUpIcon sx={{ color: '#ffffff', fontSize: '28px' }} />}
              gradient={GRADIENT_COLORS.green}
              subtitle="Last 30 days"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatisticCard
              title="With Insurance"
              value={withInsurance}
              icon={<InsuranceIcon sx={{ color: '#ffffff', fontSize: '28px' }} />}
              gradient={GRADIENT_COLORS.teal}
              subtitle={`${insurancePercentage}% coverage`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatisticCard
              title="Without Insurance"
              value={withoutInsurance}
              icon={<HospitalIcon sx={{ color: '#ffffff', fontSize: '28px' }} />}
              gradient={GRADIENT_COLORS.navy}
            />
          </Grid>
        </Grid>

        {/* Charts Row 1 */}
        <Grid container spacing={2} sx={{ mb: 2 }} alignItems="stretch">
          {/* Gender Distribution - Donut Chart */}
          <Grid item xs={12} md={6}>
            <DonutChartCard
              title="Gender Distribution"
              data={genderData}
              colors={CHART_COLORS}
              centerValue={totalPatients}
              centerLabel="Total"
            />
          </Grid>

          {/* Privacy Level Distribution - Enhanced Bar Chart */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(110, 198, 255, 0.25)',
                transition: 'all 0.3s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(110, 198, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.06)',
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#1a237e',
                  mb: 2,
                  fontSize: '1.125rem',
                }}
              >
                Privacy Level Distribution
              </Typography>
              <Box sx={{ flex: 1, minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={privacyData}>
                    <defs>
                      <linearGradient id="privacyLevelGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7bb3ff" stopOpacity={1} />
                        <stop offset="100%" stopColor="#a5d8ff" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
                    <XAxis
                      dataKey="name"
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 0, 0]}
                      animationDuration={800}
                      fill="url(#privacyLevelGradient)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Charts Row 2 */}
        <Grid container spacing={2} sx={{ mb: 2 }} alignItems="stretch">
          {/* Insurance Coverage - Horizontal Bar Chart */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(110, 198, 255, 0.25)',
                transition: 'all 0.3s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(110, 198, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.06)',
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#1a237e',
                  mb: 2,
                  fontSize: '1.125rem',
                }}
              >
                Insurance Coverage
              </Typography>
              <Box sx={{ flex: 1, minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'With Insurance', value: withInsurance, color: '#8dd88f' },
                      { name: 'Without Insurance', value: withoutInsurance, color: '#ff9a9a' },
                    ]}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="insuranceWithGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8dd88f" stopOpacity={1} />
                        <stop offset="100%" stopColor="#b8e6b9" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="insuranceWithoutGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ff9a9a" stopOpacity={1} />
                        <stop offset="100%" stopColor="#ffb3b3" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
                    <XAxis type="number" stroke="#666" fontSize={12} tickLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[0, 8, 8, 0]}
                      animationDuration={800}
                      shape={(props: any) => {
                        const { payload, x, y, width, height } = props;
                        const fillColor =
                          payload.name === 'With Insurance'
                            ? 'url(#insuranceWithGradient)'
                            : 'url(#insuranceWithoutGradient)';
                        return (
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill={fillColor}
                            rx={8}
                            ry={8}
                          />
                        );
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Grid>

          {/* Blood Type Distribution - Enhanced Bar Chart */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(110, 198, 255, 0.25)',
                transition: 'all 0.3s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(110, 198, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.06)',
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#1a237e',
                  mb: 2,
                  fontSize: '1.125rem',
                }}
              >
                Blood Type Distribution
              </Typography>
              <Box sx={{ flex: 1, minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bloodTypeData}>
                    <defs>
                      <linearGradient id="bloodTypeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6ec6ff" stopOpacity={1} />
                        <stop offset="100%" stopColor="#a5d8ff" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
                    <XAxis
                      dataKey="name"
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 0, 0]}
                      animationDuration={800}
                      fill="url(#bloodTypeGradient)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Charts Row 3 */}
        <Grid container spacing={2} alignItems="stretch">
          {/* Age Group Distribution - Enhanced Bar Chart */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(110, 198, 255, 0.25)',
                transition: 'all 0.3s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(110, 198, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.06)',
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#1a237e',
                  mb: 2,
                  fontSize: '1.125rem',
                }}
              >
                Age Group Distribution
              </Typography>
              <Box sx={{ flex: 1, minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageGroupData}>
                    <defs>
                      <linearGradient id="ageGroupGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8dd88f" stopOpacity={1} />
                        <stop offset="100%" stopColor="#b8e6b9" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
                    <XAxis
                      dataKey="name"
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 0, 0]}
                      animationDuration={800}
                      fill="url(#ageGroupGradient)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Grid>

          {/* Case Type Distribution - Enhanced Bar Chart */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(110, 198, 255, 0.25)',
                transition: 'all 0.3s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(110, 198, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.06)',
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#1a237e',
                  mb: 2,
                  fontSize: '1.125rem',
                }}
              >
                Patients by Case Type
              </Typography>
              <Box sx={{ flex: 1, minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={caseTypeData}>
                    <defs>
                      <linearGradient id="caseTypeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6dd5c4" stopOpacity={1} />
                        <stop offset="100%" stopColor="#9ee5d6" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
                    <XAxis
                      dataKey="name"
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 0, 0]}
                      animationDuration={800}
                      fill="url(#caseTypeGradient)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};

export default ModernPatientStatistics;

