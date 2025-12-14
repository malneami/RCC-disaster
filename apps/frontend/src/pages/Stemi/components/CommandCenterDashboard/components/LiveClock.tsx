import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import {
  AccessTime as ClockIcon,
  Autorenew as RefreshIcon,
} from '@mui/icons-material';

interface LiveClockProps {
  language: 'en' | 'ar';
}

const LiveClock: React.FC<LiveClockProps> = ({ language }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box 
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(42, 63, 95, 0.5)',
        borderRadius: '8px',
        px: 2.5,
        py: 1.5,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Date and Time */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ClockIcon sx={{ color: '#64b5f6', fontSize: 22 }} />
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
          <Typography 
            variant="h6" 
            component="span" 
            sx={{ 
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            {formatDate(currentTime)}
          </Typography>
          <Typography 
            variant="h5" 
            component="span" 
            sx={{ 
              color: '#64b5f6',
              fontWeight: 700,
              fontFamily: 'monospace',
              fontSize: '1.25rem',
            }}
          >
            {formatTime(currentTime)}
          </Typography>
        </Box>
      </Box>
      
      {/* Auto-refresh indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RefreshIcon 
          sx={{ 
            color: 'rgba(255,255,255,0.5)', 
            fontSize: 16,
            animation: 'spin 2s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }} 
        />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
          {language === 'ar' ? 'تحديث تلقائي' : 'Auto-refresh'}
        </Typography>
      </Box>
    </Box>
  );
};

export default LiveClock;
