import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';

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
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        gap={2}
        sx={{ backgroundColor: '#121212' }}
      >
        <CircularProgress sx={{ color: '#64b5f6' }} size={48} />
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
          {language === 'ar' ? 'جاري تحميل لوحة القيادة...' : 'Loading Command Center...'}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        p={4} 
        sx={{ 
          backgroundColor: '#121212', 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box 
          sx={{ 
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            borderRadius: '12px',
            p: 3,
            maxWidth: '500px',
            textAlign: 'center',
          }}
        >
          <Typography sx={{ color: '#f44336', fontSize: '1.1rem', fontWeight: 500 }}>
            {language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading dashboard data'}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', mt: 1 }}>
            {error}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: isFullscreen ? 2 : 3,
      backgroundColor: '#121212',
      minHeight: '100vh',
      direction: language === 'ar' ? 'rtl' : 'ltr',
      color: '#ffffff',
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

      {/* Live Clock - More compact */}
      <Box sx={{ mb: 3, mt: 2 }}>
        <LiveClock language={language} />
      </Box>

      {/* Dashboard Content */}
      <Box id="dashboard-content">
        {/* Overview KPI Cards */}
        <KPIMetrics
          data={data}
          language={language}
        />

        {/* Performance Indicators */}
        <TrafficLightSystem
          data={data}
          language={language}
        />

        {/* Analytics Charts */}
        <VisualAnalytics
          data={data}
          language={language}
        />

        {/* Hospital Performance Matrix */}
        <Box sx={{ mb: 4 }}>
          {/* Section Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <HospitalIcon sx={{ color: '#64b5f6', fontSize: 28 }} />
            <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 600 }}>
              {language === 'ar' ? 'أداء المستشفيات' : 'Hospital Performance'}
            </Typography>
          </Box>
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
