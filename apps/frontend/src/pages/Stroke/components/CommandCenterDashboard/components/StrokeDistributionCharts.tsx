import React from 'react';
import {
  Paper,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { StrokeCommandCenterData } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DistributionChartsProps {
  data: StrokeCommandCenterData | null;
  language: 'en' | 'ar';
}

const StrokeDistributionCharts: React.FC<DistributionChartsProps> = ({ data, language }) => {
  if (!data) return null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff',
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: '#1e1e1e',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#333333',
        borderWidth: 1,
      },
    },
  };

  const ageDistributionData = {
    labels: data.distributionData.ageDistribution.map(item => item.ageGroup),
    datasets: [
      {
        data: data.distributionData.ageDistribution.map(item => item.count),
        backgroundColor: [
          '#64b5f6',
          '#81c784',
          '#ffb74d',
          '#ba68c8',
          '#f06292',
        ],
        borderColor: '#1e1e1e',
        borderWidth: 2,
      },
    ],
  };

  const genderDistributionData = {
    labels: data.distributionData.genderDistribution.map(item => item.gender),
    datasets: [
      {
        data: data.distributionData.genderDistribution.map(item => item.count),
        backgroundColor: [
          '#64b5f6',
          '#f06292',
        ],
        borderColor: '#1e1e1e',
        borderWidth: 2,
      },
    ],
  };

  const modeOfArrivalData = {
    labels: data.distributionData.modeOfArrival.map(item => item.mode),
    datasets: [
      {
        data: data.distributionData.modeOfArrival.map(item => item.count),
        backgroundColor: [
          '#64b5f6',
          '#81c784',
          '#ffb74d',
          '#ba68c8',
          '#f06292',
        ],
        borderColor: '#1e1e1e',
        borderWidth: 2,
      },
    ],
  };

  const charts = [
    {
      title: language === 'ar' ? 'توزيع العمر' : 'Age Distribution',
      data: ageDistributionData,
    },
    {
      title: language === 'ar' ? 'توزيع الجنس' : 'Gender Distribution',
      data: genderDistributionData,
    },
    {
      title: language === 'ar' ? 'طريقة الوصول' : 'Mode of Arrival',
      data: modeOfArrivalData,
    },
  ];

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3, 
        mb: 3,
        backgroundColor: '#1e1e1e',
        color: '#ffffff',
        border: '1px solid #333333'
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#ffffff' }}>
        {language === 'ar' ? 'توزيعات البيانات' : 'Data Distributions'}
      </Typography>

      <Grid container spacing={3}>
        {charts.map((chart, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ 
              backgroundColor: '#2a2a2a',
              border: '1px solid #444444',
              height: '100%',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', textAlign: 'center' }}>
                  {chart.title}
                </Typography>
                <Box sx={{ height: 300, position: 'relative' }}>
                  <Doughnut data={chart.data} options={chartOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default StrokeDistributionCharts;
