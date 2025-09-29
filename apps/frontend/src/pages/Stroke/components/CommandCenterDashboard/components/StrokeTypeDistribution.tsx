import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { StrokeCommandCenterData } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface StrokeTypeChartProps {
  data: StrokeCommandCenterData | null;
  language: 'en' | 'ar';
}

const StrokeTypeDistribution: React.FC<StrokeTypeChartProps> = ({ data, language }) => {
  if (!data) return null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e1e1e',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#333333',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed.y} ${language === 'ar' ? 'مريض' : 'patients'}`;
          }
        }
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
            return value + ' ' + (language === 'ar' ? 'مريض' : 'patients');
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

  const chartData = {
    labels: data.strokeTypeDistribution.strokeTypes.map(item => item.type),
    datasets: [
      {
        label: language === 'ar' ? 'عدد المرضى' : 'Number of Patients',
        data: data.strokeTypeDistribution.strokeTypes.map(item => item.count),
        backgroundColor: [
          '#64b5f6',
          '#81c784',
          '#ffb74d',
          '#ba68c8',
          '#f06292',
          '#4db6ac',
        ],
        borderColor: '#1e1e1e',
        borderWidth: 1,
      },
    ],
  };

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
      <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#ffffff' }}>
        {language === 'ar' ? 'توزيع أنواع السكتة الدماغية' : 'Stroke Type Distribution'}
      </Typography>

      <Card sx={{ 
        backgroundColor: '#2a2a2a',
        border: '1px solid #444444',
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ height: 400, position: 'relative' }}>
            <Bar data={chartData} options={chartOptions} />
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {data.strokeTypeDistribution.strokeTypes.map((item, index) => (
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
                    backgroundColor: chartData.datasets[0].backgroundColor[index],
                    borderRadius: '50%',
                  }}
                />
                <Typography variant="body2" sx={{ color: '#ffffff' }}>
                  {item.type}: {item.count}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Paper>
  );
};

export default StrokeTypeDistribution;
