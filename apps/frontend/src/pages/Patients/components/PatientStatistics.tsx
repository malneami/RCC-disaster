import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Paper,
  Button,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { patientService } from '@/services/patientService';

const COLORS = ['#1976d2', '#4caf50', '#ff9800', '#9c27b0', '#f44336', '#00bcd4', '#ffc107'];

const PatientStatistics: React.FC = () => {
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!statistics) {
    return (
      <Alert severity="info" sx={{ m: 3 }}>
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header with Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Patient Statistics Dashboard
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{ mt: 0.5 }}
                fullWidth
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Patients
                </Typography>
                <Typography variant="h4">{statistics.total || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Recent Activity (30 days)
                </Typography>
                <Typography variant="h4">{statistics.recentActivity || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  With Insurance
                </Typography>
                <Typography variant="h4">
                  {statistics.insurance?.with || 0}
                  <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                    ({statistics.insurance?.percentage || '0'}%)
                  </Typography>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Without Insurance
                </Typography>
                <Typography variant="h4">{statistics.insurance?.without || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Gender Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Gender Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Privacy Level Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Privacy Level Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={privacyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Blood Type Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Blood Type Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bloodTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#4caf50" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Age Group Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Age Group Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ageGroupData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#ff9800" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Case Type Distribution */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Patients by Case Type
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={caseTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#9c27b0" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default PatientStatistics;
