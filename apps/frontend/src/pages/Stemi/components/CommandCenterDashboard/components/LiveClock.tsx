import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';

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
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Paper elevation={1} sx={{ p: 2, backgroundColor: '#1976d2', color: 'white' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h3" component="div" fontWeight="bold" fontFamily="monospace">
            {formatTime(currentTime)}
          </Typography>
          <Typography variant="h6" component="div" sx={{ opacity: 0.9 }}>
            {formatDate(currentTime)}
          </Typography>
        </Box>
        
        <Box textAlign="right">
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {language === 'ar' ? 'الوقت الحالي' : 'Current Time'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {language === 'ar' ? 'تحديث تلقائي كل 30 ثانية' : 'Auto-refresh every 30s'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default LiveClock;
