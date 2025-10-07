import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Stack,
} from '@mui/material';

export interface DailySummaryData {
  currentPeriod: number;
  previousPeriod: number;
  average: number;
}

interface DailySummaryProps {
  data?: DailySummaryData;
}

const DailySummary: React.FC<DailySummaryProps> = ({ data }) => {
  const summaryData = data || {
    currentPeriod: 0,
    previousPeriod: 0,
    average: 0,
  };

  // Calculate max value for progress bar scaling
  const maxValue = Math.max(summaryData.currentPeriod, summaryData.previousPeriod, summaryData.average, 1);
  
  const currentProgress = (summaryData.currentPeriod / maxValue) * 100;
  const previousProgress = (summaryData.previousPeriod / maxValue) * 100;
  const averageProgress = (summaryData.average / maxValue) * 100;

  const summaryItems = [
    {
      label: 'Current Period',
      value: summaryData.currentPeriod,
      progress: currentProgress,
      color: '#4caf50',
    },
    {
      label: 'Previous Period',
      value: summaryData.previousPeriod,
      progress: previousProgress,
      color: '#2196f3',
    },
    {
      label: 'Average',
      value: summaryData.average,
      progress: averageProgress,
      color: '#9c27b0',
    },
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
        Daily Summary
      </Typography>
      
      <Stack spacing={3}>
        {summaryItems.map((item, index) => (
          <Box key={index}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                {item.label}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                {item.value}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={item.progress}
              sx={{
                height: 12,
                borderRadius: 6,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: item.color,
                  borderRadius: 6,
                },
              }}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default DailySummary;
