import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
} from '@mui/material';

import { CommandCenterHeader } from '../../../../components/Common/CommandCenterHeader';
import LiveClock from './components/LiveClock';
import KPIMetrics from './components/KPIMetrics';
import VisualAnalytics from './components/VisualAnalytics';
import TrafficLightSystem from './components/TrafficLightSystem';
import HospitalPerformanceHeatmap from './components/HospitalPerformanceHeatmap';
import ExportDialog from './components/ExportDialog';
import { useCommandCenterData } from './hooks/useCommandCenterData';
import { useFullscreen } from '../../../../contexts/FullscreenContext';
import { CommandCenterFilters } from './types';

const CommandCenterDashboard: React.FC = () => {
  const { isFullscreen, setIsFullscreen } = useFullscreen();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [language] = useState<'en' | 'ar'>('en');
  const [filters, setFilters] = useState<CommandCenterFilters>({
    hospitalId: 'all',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data, loading, error, refreshData, hospitals } = useCommandCenterData(filters);

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

  const handleDownloadPNG = async () => {
    // This will be handled by the CommandCenterHeader component
  };

  const handleHospitalChange = (hospitalId: string) => {
    setFilters(prev => ({ ...prev, hospitalId }));
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Loading Command Center Dashboard...</Typography>
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
        title="STEMI Command Center"
        dashboardContentId="dashboard-content"
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
      <Box id="dashboard-content" sx={{ p: isFullscreen ? 2 : 0 }}>
        {/* KPI Metrics */}
        <KPIMetrics
          data={data}
          language={language}
        />

        {/* Traffic Light System */}
        <TrafficLightSystem
          data={data}
          language={language}
        />

        {/* Visual Analytics */}
        <VisualAnalytics
          data={data}
          language={language}
        />

        {/* Hospital Performance Heatmap */}
        <Box mt={3}>
          <HospitalPerformanceHeatmap
            data={data?.hospitalPerformanceHeatmap}
            loading={loading}
            error={error || undefined}
            language={language}
          />
        </Box>
      </Box>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        data={data}
        language={language}
      />
    </Box>
  );
};

export default CommandCenterDashboard;
