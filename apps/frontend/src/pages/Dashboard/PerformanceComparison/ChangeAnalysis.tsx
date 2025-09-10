import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faMinus } from '@fortawesome/free-solid-svg-icons';

export interface ChangeAnalysisData {
  vsPreviousPeriod: number;
  vsAverage: number;
  trend: 'up' | 'down' | 'stable';
}

interface ChangeAnalysisProps {
  data?: ChangeAnalysisData;
}

const ChangeAnalysis: React.FC<ChangeAnalysisProps> = ({ data }) => {
  const analysisData = data || {
    vsPreviousPeriod: 0,
    vsAverage: 0,
    trend: 'stable' as const,
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <FontAwesomeIcon icon={faArrowUp} style={{ color: '#4caf50' }} />;
      case 'down':
        return <FontAwesomeIcon icon={faArrowDown} style={{ color: '#f44336' }} />;
      default:
        return <FontAwesomeIcon icon={faMinus} style={{ color: '#9e9e9e' }} />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'Trending Up';
      case 'down':
        return 'Trending Down';
      default:
        return 'Stable';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return '#4caf50';
      case 'down':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const analysisCards = [
    {
      value: `${analysisData.vsPreviousPeriod >= 0 ? '+' : ''}${analysisData.vsPreviousPeriod}%`,
      label: 'vs Previous Period',
      color: analysisData.vsPreviousPeriod >= 0 ? '#4caf50' : '#f44336',
    },
    {
      value: `${analysisData.vsAverage >= 0 ? '+' : ''}${analysisData.vsAverage}%`,
      label: 'vs Average',
      color: analysisData.vsAverage >= 0 ? '#4caf50' : '#f44336',
    },
    {
      value: getTrendText(analysisData.trend),
      label: 'Trend',
      color: getTrendColor(analysisData.trend),
      icon: getTrendIcon(analysisData.trend),
    },
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'white' }}>
        Change Analysis
      </Typography>
      
      <Stack spacing={2}>
        {analysisCards.map((card, index) => (
          <Card
            key={index}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {card.icon && (
                    <Box sx={{ mr: 1 }}>
                      {card.icon}
                    </Box>
                  )}
                  <Typography
                    variant="h6"
                    sx={{
                      color: card.color,
                      fontWeight: 600,
                      fontSize: '1.1rem',
                    }}
                  >
                    {card.value}
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.875rem',
                  mt: 0.5,
                }}
              >
                {card.label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default ChangeAnalysis;
