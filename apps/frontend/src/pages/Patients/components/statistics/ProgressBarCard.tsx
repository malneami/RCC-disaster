import React from 'react';
import { Box, Typography } from '@mui/material';

interface ProgressItem {
  label: string;
  value: number;
  total: number;
  color: string;
}

interface ProgressBarCardProps {
  title: string;
  items: ProgressItem[];
}

const ProgressBarCard: React.FC<ProgressBarCardProps> = ({ title, items }) => {
  return (
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
        justifyContent: 'flex-start',
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
          mb: 1.5,
          fontSize: '1.125rem',
          flexShrink: 0,
        }}
      >
        {title}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flexShrink: 0 }}>
        {items.map((item, index) => {
          const percentage = item.total > 0 ? (item.value / item.total) * 100 : 0;
          return (
            <Box key={index}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 0.75,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                    fontSize: '0.9375rem',
                  }}
                >
                  {item.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: item.color,
                      fontSize: '1rem',
                    }}
                  >
                    {item.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      fontSize: '0.875rem',
                    }}
                  >
                    / {item.total}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                    color: '#6ec6ff',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    ml: 1,
                  }}
                >
                  ({percentage.toFixed(1)}%)
                </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  position: 'relative',
                  height: '12px',
                  borderRadius: '6px',
                  background: 'rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}dd 100%)`,
                    borderRadius: '6px',
                    transition: 'width 1s ease-out',
                    boxShadow: `0 2px 8px ${item.color}40`,
                    animation: 'progressAnimation 1s ease-out',
                    '@keyframes progressAnimation': {
                      from: { width: '0%' },
                      to: { width: `${percentage}%` },
                    },
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ProgressBarCard;

