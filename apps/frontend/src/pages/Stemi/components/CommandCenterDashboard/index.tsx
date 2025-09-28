import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Language as LanguageIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import html2canvas from 'html2canvas';

import LiveClock from './components/LiveClock';
import FilterPanel from './components/FilterPanel';
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
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [filters, setFilters] = useState<CommandCenterFilters>({
    hospitalId: 'all',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data, loading, error, refreshData } = useCommandCenterData(filters);

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

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleLanguageToggle = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const handleFiltersChange = (newFilters: CommandCenterFilters) => {
    setFilters(newFilters);
  };

  const handleExport = () => {
    setShowExportDialog(true);
  };

  const handleDownloadPNG = async () => {
    try {
      const dashboardElement = document.getElementById('dashboard-content');
      if (!dashboardElement) return;

      const canvas = await html2canvas(dashboardElement, {
        background: '#121212',
        useCORS: true,
        allowTaint: true,
      });

      const link = document.createElement('a');
      link.download = `stemi-command-center-dashboard-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating PNG:', error);
    }
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
      {/* Header Controls - Hidden in fullscreen */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2, 
            mb: 3,
            backgroundColor: '#1e1e1e', // Dark paper background
            color: '#ffffff',
            border: '1px solid #333333'
          }}
        >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight="bold"
            sx={{ color: '#ffffff' }}
          >
            STEMI Command Center Dashboard
          </Typography>
          
          <Box display="flex" gap={1}>
            <Tooltip title="Toggle Language">
              <IconButton 
                onClick={handleLanguageToggle} 
                sx={{ 
                  color: '#ffffff',
                  '&:hover': { backgroundColor: '#333333' }
                }}
              >
                <LanguageIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Refresh Data">
              <IconButton 
                onClick={refreshData}
                sx={{ 
                  color: '#ffffff',
                  '&:hover': { backgroundColor: '#333333' }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Download PNG">
              <IconButton 
                onClick={handleDownloadPNG}
                sx={{ 
                  color: '#ffffff',
                  '&:hover': { backgroundColor: '#333333' }
                }}
              >
                <ImageIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Export Dashboard">
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={handleExport}
                sx={{
                  color: '#ffffff',
                  borderColor: '#ffffff',
                  '&:hover': {
                    borderColor: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Export
              </Button>
            </Tooltip>
            
            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
              <IconButton 
                onClick={handleFullscreenToggle}
                sx={{ 
                  color: '#ffffff',
                  '&:hover': { backgroundColor: '#333333' }
                }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Box mt={2}>
          <LiveClock language={language} />
        </Box>
        </Paper>

      {/* Dashboard Content */}
      <Box id="dashboard-content" sx={{ p: isFullscreen ? 2 : 0 }}>
        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          language={language}
        />
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
