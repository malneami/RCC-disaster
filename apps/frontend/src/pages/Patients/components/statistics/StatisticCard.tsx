import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface StatisticCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  gradient: string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  sx?: SxProps<Theme>;
}

const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  icon,
  gradient,
  subtitle,
  trend,
  sx,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseFloat(value.toString()) || 0;

  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000;
      const steps = 60;
      const increment = numericValue / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setDisplayValue(numericValue);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    } else {
      setDisplayValue(numericValue);
    }
  }, [value, numericValue]);

  return (
    <Box
      sx={{
        position: 'relative',
        background: gradient,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '160px',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(255, 255, 255, 0.3)',
        },
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)',
        },
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flex: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              mb: 1,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h3"
            sx={{
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '2.5rem',
              lineHeight: 1.2,
              mb: subtitle ? 0.5 : 0,
            }}
          >
            {typeof value === 'number' ? displayValue.toLocaleString() : value}
          </Typography>
          {subtitle ? (
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.875rem',
                mt: 0.5,
              }}
            >
              {subtitle}
            </Typography>
          ) : (
            <Box sx={{ height: '20px' }} />
          )}
        </Box>
        {icon && (
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              flexShrink: 0,
              ml: 2,
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      {trend && (
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.75rem',
            }}
          >
            {trend.label}: {trend.value > 0 ? '+' : ''}{trend.value}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StatisticCard;

