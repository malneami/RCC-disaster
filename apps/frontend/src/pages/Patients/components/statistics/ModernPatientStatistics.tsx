import React, { useState, useEffect } from 'react';
import { Box, Grid, CircularProgress, Alert, Fade } from '@mui/material';
import { patientService } from '../../../../services/patientService';

import StatisticFilters from './StatisticFilters';
import StatisticsSummaryCards from './StatisticsSummaryCards';
import DonutChartCard from './DonutChartCard';

import PrivacyLevelChart from './charts/PrivacyLevelChart';
import InsuranceCoverageChart from './charts/InsuranceCoverageChart';
import BloodTypeChart from './charts/BloodTypeChart';
import AgeGroupChart from './charts/AgeGroupChart';
import CaseTypeChart from './charts/CaseTypeChart';

import { CHART_COLORS } from './StatisticsConstants';

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
        <StatisticsSummaryCards
          totalPatients={totalPatients}
          recentActivity={statistics.recentActivity || 0}
          withInsurance={withInsurance}
          withoutInsurance={withoutInsurance}
          insurancePercentage={insurancePercentage}
        />

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

          {/* Privacy Level Distribution */}
          <Grid item xs={12} md={6}>
            <PrivacyLevelChart data={privacyData} />
          </Grid>
        </Grid>

        {/* Charts Row 2 */}
        <Grid container spacing={2} sx={{ mb: 2 }} alignItems="stretch">
          {/* Insurance Coverage */}
          <Grid item xs={12} md={6}>
            <InsuranceCoverageChart
              withInsurance={withInsurance}
              withoutInsurance={withoutInsurance}
            />
          </Grid>

          {/* Blood Type Distribution */}
          <Grid item xs={12} md={6}>
            <BloodTypeChart data={bloodTypeData} />
          </Grid>
        </Grid>

        {/* Charts Row 3 */}
        <Grid container spacing={2} alignItems="stretch">
          {/* Age Group Distribution */}
          <Grid item xs={12} md={6}>
            <AgeGroupChart data={ageGroupData} />
          </Grid>

          {/* Case Type Distribution */}
          <Grid item xs={12} md={6}>
            <CaseTypeChart data={caseTypeData} />
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};

export default ModernPatientStatistics;
