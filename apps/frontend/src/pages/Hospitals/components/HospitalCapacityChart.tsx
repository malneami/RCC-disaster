import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Hospital } from '../../../services/hospitalService';

interface HospitalCapacityChartProps {
  hospitals: Hospital[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const HospitalCapacityChart: React.FC<HospitalCapacityChartProps> = ({ hospitals }) => {
  const getAvailabilityPercentage = (hospital: Hospital) => {
    const totalBeds = hospital.icuBeds + hospital.picuBeds + hospital.maleBeds + 
                     hospital.femaleBeds + hospital.pediatricBeds + hospital.standardBeds;
    const availableBeds = hospital.icuBedsAvailable + hospital.picuBedsAvailable + 
                         hospital.maleBedsAvailable + hospital.femaleBedsAvailable + 
                         hospital.pediatricBedsAvailable + hospital.standardBedsAvailable;
    
    return totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0;
  };

  // Prepare data for charts
  const availabilityData = hospitals.map(hospital => ({
    name: hospital.name,
    availability: getAvailabilityPercentage(hospital),
    totalBeds: hospital.icuBeds + hospital.picuBeds + hospital.maleBeds + 
               hospital.femaleBeds + hospital.pediatricBeds + hospital.standardBeds,
    availableBeds: hospital.icuBedsAvailable + hospital.picuBedsAvailable + 
                   hospital.maleBedsAvailable + hospital.femaleBedsAvailable + 
                   hospital.pediatricBedsAvailable + hospital.standardBedsAvailable,
  }));

  const bedTypeData = hospitals.reduce((acc, hospital) => {
    acc.ICU += hospital.icuBeds;
    acc.PICU += hospital.picuBeds;
    acc.Male += hospital.maleBeds;
    acc.Female += hospital.femaleBeds;
    acc.Pediatric += hospital.pediatricBeds;
    acc.Standard += hospital.standardBeds;
    return acc;
  }, { ICU: 0, PICU: 0, Male: 0, Female: 0, Pediatric: 0, Standard: 0 });

  const bedTypeChartData = Object.entries(bedTypeData).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  const serviceData = hospitals.reduce((acc, hospital) => {
    if (hospital.hasStemiService) acc.STEMI++;
    if (hospital.hasStrokeService) acc.Stroke++;
    if (hospital.hasTraumaService) acc.Trauma++;
    return acc;
  }, { STEMI: 0, Stroke: 0, Trauma: 0 });

  const serviceChartData = Object.entries(serviceData).map(([service, count]) => ({
    name: service,
    value: count,
  }));

  const criticalHospitals = hospitals.filter(h => getAvailabilityPercentage(h) <= 10);
  const warningHospitals = hospitals.filter(h => getAvailabilityPercentage(h) > 10 && getAvailabilityPercentage(h) <= 25);
  const healthyHospitals = hospitals.filter(h => getAvailabilityPercentage(h) > 25);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Hospital Capacity Overview
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Hospitals
              </Typography>
              <Typography variant="h4">
                {hospitals.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Critical (≤10%)
              </Typography>
              <Typography variant="h4" color="error">
                {criticalHospitals.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Warning (10-25%)
              </Typography>
              <Typography variant="h4" color="warning.main">
                {warningHospitals.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Healthy ({'>'}25%)
              </Typography>
              <Typography variant="h4" color="success.main">
                {healthyHospitals.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Availability Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Hospital Availability
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={availabilityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="availability" 
                  fill="#8884d8"
                  name="Availability %"
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Bed Types Chart */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Bed Types Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bedTypeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bedTypeChartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Services Chart */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Service Availability
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" name="Hospitals" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Hospital List */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Hospital Status
            </Typography>
            <Box maxHeight={300} overflow="auto">
              {hospitals.map((hospital) => {
                const availability = getAvailabilityPercentage(hospital);
                return (
                  <Box key={hospital.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                      {hospital.name}
                    </Typography>
                    <Chip 
                      label={`${availability}%`}
                      color={availability <= 10 ? 'error' : availability <= 25 ? 'warning' : 'success'}
                      size="small"
                    />
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HospitalCapacityChart;
