import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  ButtonGroup,
  Button,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { StrokeCommandCenterData } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceTrendProps {
  data: StrokeCommandCenterData | null;
  language: 'en' | 'ar';
}

type TimePeriod = 'daily' | 'weekly' | 'monthly';

const PerformanceTrendChart: React.FC<PerformanceTrendProps> = ({ data, language }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('daily');

  if (!data) return null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#ffffff',
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
    scales: {
      x: {
        ticks: {
          color: '#ffffff',
          font: {
            size: 12,
          },
        },
        grid: {
          color: '#333333',
        },
        border: {
          color: '#333333',
        },
      },
      y: {
        ticks: {
          color: '#ffffff',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return value + '%';
          }
        },
        grid: {
          color: '#333333',
        },
        border: {
          color: '#333333',
        },
      },
    },
  };

  const getChartData = () => {
    const periodData = data.performanceTrend[selectedPeriod];
    const labels = periodData.map((item: any) => 
      selectedPeriod === 'daily' ? item.date.split('-')[2] : 
      selectedPeriod === 'weekly' ? item.week : 
      item.month
    );
    
    return {
      labels,
      datasets: [
        {
          label: language === 'ar' ? 'الأداء' : 'Performance',
          data: periodData.map((item: any) => item.performance),
          borderColor: '#64b5f6',
          backgroundColor: '#64b5f620',
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 8,
          tension: 0.4,
          fill: false,
        },
      ],
    };
  };

  const chartData = getChartData();

  const periodButtons = [
    {
      key: 'daily' as TimePeriod,
      label: language === 'ar' ? 'يومي' : 'Daily',
    },
    {
      key: 'weekly' as TimePeriod,
      label: language === 'ar' ? 'أسبوعي' : 'Weekly',
    },
    {
      key: 'monthly' as TimePeriod,
      label: language === 'ar' ? 'شهري' : 'Monthly',
    },
  ];

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3,
        backgroundColor: '#1e1e1e',
        color: '#ffffff',
        border: '1px solid #333333'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#ffffff' }}>
          {language === 'ar' ? 'اتجاه الأداء' : 'Performance Trend'}
        </Typography>
        
        <ButtonGroup variant="outlined" size="small">
          {periodButtons.map((button) => (
            <Button
              key={button.key}
              variant={selectedPeriod === button.key ? 'contained' : 'outlined'}
              onClick={() => setSelectedPeriod(button.key)}
              sx={{
                color: selectedPeriod === button.key ? '#121212' : '#ffffff',
                backgroundColor: selectedPeriod === button.key ? '#64b5f6' : 'transparent',
                borderColor: '#64b5f6',
                '&:hover': {
                  backgroundColor: selectedPeriod === button.key ? '#64b5f6' : 'rgba(100, 181, 246, 0.1)',
                  borderColor: '#64b5f6',
                },
              }}
            >
              {button.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      <Card sx={{ 
        backgroundColor: '#2a2a2a',
        border: '1px solid #444444',
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ height: 400, position: 'relative' }}>
            <Line data={chartData} options={chartOptions} />
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {chartData.datasets.map((dataset, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  backgroundColor: '#1e1e1e',
                  borderRadius: 1,
                  border: '1px solid #444444',
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: dataset.borderColor,
                    borderRadius: '50%',
                  }}
                />
                <Typography variant="body2" sx={{ color: '#ffffff' }}>
                  {dataset.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Paper>
  );
};

export default PerformanceTrendChart;
