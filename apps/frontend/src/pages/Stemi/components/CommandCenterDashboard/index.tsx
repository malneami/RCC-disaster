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
} from '@mui/icons-material';

import LiveClock from './components/LiveClock';
import FilterPanel from './components/FilterPanel';
import KPIMetrics from './components/KPIMetrics';
import VisualAnalytics from './components/VisualAnalytics';
import TrafficLightSystem from './components/TrafficLightSystem';
import ExportDialog from './components/ExportDialog';
import { useCommandCenterData } from './hooks/useCommandCenterData';
import { CommandCenterFilters } from './types';

const CommandCenterDashboard: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
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
      p: isFullscreen ? 2 : 3,
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      direction: language === 'ar' ? 'rtl' : 'ltr'
    }}>
      {/* Header Controls */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1" fontWeight="bold">
            STEMI Command Center Dashboard
          </Typography>
          
          <Box display="flex" gap={1}>
            <Tooltip title="Toggle Language">
              <IconButton onClick={handleLanguageToggle} color="primary">
                <LanguageIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Refresh Data">
              <IconButton onClick={refreshData} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Export Dashboard">
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={handleExport}
              >
                Export
              </Button>
            </Tooltip>
            
            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
              <IconButton onClick={handleFullscreenToggle} color="primary">
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Box mt={2}>
          <LiveClock language={language} />
        </Box>
      </Paper>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        language={language}
      />

      {/* Traffic Light System */}
      <TrafficLightSystem
        data={data}
        language={language}
      />

      {/* KPI Metrics */}
      <KPIMetrics
        data={data}
        language={language}
      />

      {/* Visual Analytics */}
      <VisualAnalytics
        data={data}
        language={language}
      />

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
