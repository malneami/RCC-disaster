import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
} from '@mui/material';

import { CommandCenterHeader } from '../../../../components/common/CommandCenterHeader';
import LiveClock from './components/LiveClock';
import StrokeKPICards from './components/StrokeKPICards';
import StrokeDistributionCharts from './components/StrokeDistributionCharts';
import TherapyPerformanceCharts from './components/TherapyPerformanceCharts';
import AdmissionFollowupCharts from './components/AdmissionFollowupCharts';
import StrokeTypeDistribution from './components/StrokeTypeDistribution';
import PerformanceTrendChart from './components/PerformanceTrendChart';
import StrokeTrafficLightSystem from './components/StrokeTrafficLightSystem';
import HospitalPerformanceTable from './components/HospitalPerformanceTable';
import { useStrokeCommandCenterData } from './hooks/useStrokeCommandCenterData';
import { useFullscreen } from '../../../../contexts/FullscreenContext';
import { StrokeCommandCenterFilters } from './types';

const StrokeCommandCenterDashboard: React.FC = () => {
  const { isFullscreen, setIsFullscreen } = useFullscreen();
  const [language] = useState<'en' | 'ar'>('en');
  const [filters, setFilters] = useState<StrokeCommandCenterFilters>({
    hospitalId: 'all',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data, loading, error, refreshData, hospitals } = useStrokeCommandCenterData(filters);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshData]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [setIsFullscreen]);

  const handleRefresh = () => {
    refreshData();
  };

  const handleHospitalChange = (hospitalId: string) => {
    setFilters(prev => ({ ...prev, hospitalId }));
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleDownloadPNG = async () => {
    // This will be handled by the CommandCenterHeader component
  };

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#2196f3' }} />
        <Typography sx={{ ml: 2, color: '#ffffff' }}>
          Loading Stroke Command Center Dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error loading dashboard data: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: isFullscreen ? 0 : 3,
      backgroundColor: '#121212', // Dark background
      minHeight: '100vh',
      direction: language === 'ar' ? 'rtl' : 'ltr',
      color: '#ffffff' // White text for dark mode
    }}>
      {/* Common Header */}
      <CommandCenterHeader
        title="Stroke Command Center"
        dashboardContentId="stroke-dashboard-content"
        onDownloadPNG={handleDownloadPNG}
        onRefresh={handleRefresh}
        filters={{
          hospitalId: filters.hospitalId,
          startDate: filters.startDate,
          endDate: filters.endDate,
          onHospitalChange: handleHospitalChange,
          onDateRangeChange: handleDateRangeChange,
        }}
        hospitals={hospitals}
      />

      {/* Live Clock */}
      <Box mb={2}>
        <LiveClock language={language} />
      </Box>

      {/* Dashboard Content */}
      <Box id="stroke-dashboard-content" sx={{ p: isFullscreen ? 2 : 0 }}>
        {/* KPI Cards */}
        <StrokeKPICards
          data={data}
          language={language}
        />

        {/* Distribution Charts */}
        <Box mt={3}>
          <StrokeDistributionCharts
            data={data}
            language={language}
          />
        </Box>

        {/* Therapy Performance Charts */}
        <Box mt={3}>
          <TherapyPerformanceCharts
            data={data}
            language={language}
          />
        </Box>

        {/* Admission & Follow-up Performance */}
        <Box mt={3}>
          <AdmissionFollowupCharts
            data={data}
            language={language}
          />
        </Box>

        {/* Stroke Type Distribution & Performance Trend */}
        <Box mt={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StrokeTypeDistribution
                data={data}
                language={language}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <PerformanceTrendChart
                data={data}
                language={language}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Traffic Light System */}
        <Box mt={3}>
          <StrokeTrafficLightSystem
            data={data}
            language={language}
          />
        </Box>

        {/* Hospital Performance Table */}
        {data?.hospitalPerformance && (
          <Box mt={3}>
            <HospitalPerformanceTable data={data.hospitalPerformance as any} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default StrokeCommandCenterDashboard;