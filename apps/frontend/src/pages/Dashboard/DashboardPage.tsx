import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  // Button,
  Chip,
  LinearProgress,
  Avatar,
  Stack,
  Paper,
  alpha,
  CircularProgress,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Image as ImageIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faHeart,
  faBrain,
  faChartLine,
  faAmbulance,
} from '@fortawesome/free-solid-svg-icons';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { useFullscreen } from '../../contexts/FullscreenContext';
import PerformanceComparison from './PerformanceComparison';
import GlobalCriticalCaseTracker from '../../components/Dashboard/GlobalCriticalCaseTracker';
import { dashboardService, DashboardMetrics, PathwayPerformanceMetrics, DashboardFilters } from '../../services/dashboardService';
import { useHospitals } from '../Hospitals/hooks/useHospitals';
import html2canvas from 'html2canvas';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isFullscreen, setIsFullscreen } = useFullscreen();
  const { hospitals } = useHospitals();
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [pathwayMetrics, setPathwayMetrics] = useState<PathwayPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true); // Initial load
  const [manualLoading, setManualLoading] = useState(false); // Loading for manual actions only
  const [error, setError] = useState<string | null>(null);
  
  // Filter states - start with null dates to return all data initially
  const [selectedHospital, setSelectedHospital] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Create filters object
  const getFilters = (): DashboardFilters => ({
    hospitalId: selectedHospital !== 'all' ? selectedHospital : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  // Track if this is a manual filter change
  const isManualFilterChangeRef = React.useRef(false);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (isManual: boolean = false) => {
    try {
      // Only show loading state for manual actions (filter changes, manual refresh)
      if (isManual) {
        setManualLoading(true);
      }
      setError(null);
      
      const filters = getFilters();
      
      const [metricsData, pathwayData] = await Promise.all([
        dashboardService.getDashboardMetrics(filters),
        dashboardService.getPathwayPerformanceMetrics(filters),
      ]);
      
      setDashboardMetrics(metricsData);
      setPathwayMetrics(pathwayData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      if (isManual) {
        setManualLoading(false);
      }
      setLoading(false); // Initial load only
    }
  }, [selectedHospital, startDate, endDate]);

  // Initial load
  useEffect(() => {
    fetchDashboardData(false);
  }, []); // Only run on mount

  // Handle filter changes - fetch immediately if manual change
  useEffect(() => {
    if (isManualFilterChangeRef.current) {
      isManualFilterChangeRef.current = false;
      fetchDashboardData(true); // Manual filter change, show loading
    }
  }, [selectedHospital, startDate, endDate, fetchDashboardData]);

  // Auto-refresh every 30 seconds (without loading state)
  // Use current filter values directly to preserve user's filter selections
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-refresh if not currently manually loading
      if (!manualLoading) {
        // Use current filter values directly, not the memoized function
        const currentFilters = {
          hospitalId: selectedHospital !== 'all' ? selectedHospital : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        };
        
        Promise.all([
          dashboardService.getDashboardMetrics(currentFilters),
          dashboardService.getPathwayPerformanceMetrics(currentFilters),
        ]).then(([metricsData, pathwayData]) => {
          setDashboardMetrics(metricsData);
          setPathwayMetrics(pathwayData);
        }).catch((err) => {
          console.error('Error auto-refreshing dashboard data:', err);
          // Don't show error for auto-refresh failures
        });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedHospital, startDate, endDate, manualLoading]); // Depend on filter values, not the function

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

  // Fullscreen handler
  const handleFullscreenToggle = async () => {
    try {
      if (!isFullscreen) {
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Download PNG handler
  const handleDownloadPNG = async () => {
    try {
      const element = document.getElementById('dashboard-content');
      if (element) {
        const canvas = await html2canvas(element, {
          background: '#121212',
          useCORS: true,
          allowTaint: true,
        });
        
        const link = document.createElement('a');
        link.download = 'rcc-dashboard.png';
        link.href = canvas.toDataURL();
        link.click();
      }
    } catch (error) {
      console.error('Error downloading PNG:', error);
    }
  };

  // Refresh handler - manual action, show loading
  const handleRefresh = () => {
    fetchDashboardData(true); // Manual refresh, show loading
  };

  // Filter handlers - manual actions, mark as manual and trigger fetch via useEffect
  const handleHospitalChange = (hospitalId: string) => {
    isManualFilterChangeRef.current = true;
    setSelectedHospital(hospitalId);
  };

  const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
    isManualFilterChangeRef.current = true;
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const clearFilters = () => {
    isManualFilterChangeRef.current = true;
    setSelectedHospital('all');
    setStartDate('');
    setEndDate('');
  };


  // Main KPI Cards - now using dynamic data
  const kpiCards = [
    {
      title: 'Total Transfers',
      value: dashboardMetrics?.activeTransfers?.toString() || '0',
      subtitle: 'Currently in progress',
      color: '#2196f3',
      bgColor: alpha('#2196f3', 0.1),
    },
    {
      title: 'Urgent Pathway Cases',
      value: dashboardMetrics?.urgentPathwayCases?.toString() || '0',
      subtitle: 'Requiring immediate attention',
      icon: <FontAwesomeIcon icon={faExclamationTriangle} />,
      color: '#ff5722',
      bgColor: alpha('#ff5722', 0.1),
    },
    {
      title: 'Completed Cases',
      value: dashboardMetrics?.completedToday?.toString() || '0',
      subtitle: 'Successfully transferred',
      icon: <FontAwesomeIcon icon={faCheckCircle} />,
      color: '#4caf50',
      bgColor: alpha('#4caf50', 0.1),
    },
    {
      title: 'Delayed Transfers',
      value: dashboardMetrics?.delayedTransfers?.toString() || '0',
      subtitle: 'Exceeding target time',
      icon: <FontAwesomeIcon icon={faClock} />,
      color: '#ff9800',
      bgColor: alpha('#ff9800', 0.1),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard - RCC Healthcare Platform</title>
      </Helmet>

      <Box sx={{ 
        p: isFullscreen ? 0 : 3,
        backgroundColor: '#121212',
        minHeight: '100vh',
        color: '#ffffff'
      }}>
        {/* Command Center Header */}
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 2,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            {/* Logo and Title */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img 
                src="/jazan-health-cluster-logo.png" 
                alt="Jazan Health Cluster Logo" 
                style={{ 
                  height: '40px', 
                  marginRight: '16px',
                  objectFit: 'contain'
                }} 
              />
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: { xs: '1.5rem', md: '2rem' },
                }}
              >
                RCC Command Center Dashboard
              </Typography>
            </Box>

            {/* Filters */}
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              {/* Hospital Filter */}
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel sx={{ color: '#ffffff' }}>Hospital</InputLabel>
                <Select
                  value={selectedHospital}
                  onChange={(e) => handleHospitalChange(e.target.value)}
                  label="Hospital"
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#555',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#777',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2196f3',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#ffffff',
                    },
                  }}
                >
                  <MenuItem value="all">All Hospitals</MenuItem>
                  {hospitals.map((hospital) => (
                    <MenuItem key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Date Range Filters */}
              <TextField
                size="small"
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  const newEndDate = endDate;
                  handleDateRangeChange(newStartDate, newEndDate);
                }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: '#555',
                    },
                    '&:hover fieldset': {
                      borderColor: '#777',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196f3',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#ffffff',
                  },
                }}
              />

              <TextField
                size="small"
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => {
                  const newStartDate = startDate;
                  const newEndDate = e.target.value;
                  handleDateRangeChange(newStartDate, newEndDate);
                }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: '#555',
                    },
                    '&:hover fieldset': {
                      borderColor: '#777',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2196f3',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#ffffff',
                  },
                }}
              />

              {/* Clear Filters Button */}
              <Button
                variant="outlined"
                size="small"
                onClick={clearFilters}
                sx={{
                  color: '#ffffff',
                  borderColor: '#555',
                  '&:hover': {
                    borderColor: '#777',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Clear
              </Button>
            </Stack>

            {/* Action Buttons */}
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh Data">
                <IconButton
                  onClick={handleRefresh}
                  sx={{
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
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
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <ImageIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                <IconButton
                  onClick={handleFullscreenToggle}
                  sx={{
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Paper>

        {/* Welcome Message */}
        {!isFullscreen && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#ffffff' }}>
              Welcome back, {user?.firstName}
            </Typography>
            <Typography variant="body1" sx={{ color: '#b0b0b0' }}>
              Regional Coordination Center Dashboard
            </Typography>
          </Box>
        )}

        {(loading || manualLoading) && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress sx={{ mr: 2, color: '#2196f3' }} />
            <Typography sx={{ color: '#ffffff' }}>Loading dashboard data...</Typography>
          </Box>
        )}

        {error && (
          <Box p={3} mb={3} sx={{ backgroundColor: '#2d1b1b', border: '1px solid #d32f2f', borderRadius: 2 }}>
            <Typography sx={{ color: '#f44336' }} variant="h6">
              Error: {error}
            </Typography>
            <Typography sx={{ color: '#b0b0b0' }}>
              Please refresh the page or try again later.
            </Typography>
          </Box>
        )}

        {!loading && !manualLoading && !error && (
          <Box id="dashboard-content">
            <Grid container spacing={3}>
          {/* Main KPI Cards */}
          {kpiCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  background: `linear-gradient(135deg, ${alpha(card.color, 0.15)} 0%, ${alpha(card.color, 0.05)} 100%)`,
                  border: `1px solid ${alpha(card.color, 0.3)}`,
                  borderRadius: 3,
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  backgroundColor: '#1e1e1e',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${alpha(card.color, 0.25)}`,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: card.color,
                        width: 56,
                        height: 56,
                        boxShadow: `0 4px 14px ${alpha(card.color, 0.3)}`,
                      }}
                    >
                      {card.icon}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h3"
                        sx={{
                          color: card.color,
                          fontWeight: 700,
                          fontSize: '2.5rem',
                          lineHeight: 1,
                        }}
                      >
                        {card.value}
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#ffffff' }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    {card.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Global Critical Case Tracker */}
          <Grid item xs={12}>
            <GlobalCriticalCaseTracker 
              selectedHospital={selectedHospital}
              onHospitalChange={setSelectedHospital}
            />
          </Grid>

          {/* Critical Performance Metrics */}
          <Grid item xs={12}>
            <Card sx={{ 
              borderRadius: 3, 
              border: '1px solid #333', 
              backgroundColor: '#1e1e1e',
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <FontAwesomeIcon icon={faChartLine} style={{ color: '#2196f3', marginRight: '16px', fontSize: '28px' }} />
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#ffffff' }}>
                    Critical Performance Metrics
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2, color: '#b0b0b0' }}>
                    Real-time pathway performance indicators
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  {(pathwayMetrics?.pathways || []).map((pathway, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          borderRadius: 3,
                          background: `linear-gradient(135deg, ${alpha(pathway.color, 0.15)} 0%, ${alpha(pathway.color, 0.05)} 100%)`,
                          border: `1px solid ${alpha(pathway.color, 0.3)}`,
                          backgroundColor: '#2a2a2a',
                          height: '100%',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          {pathway.pathway === 'Stroke Pathway' && <FontAwesomeIcon icon={faBrain} style={{ color: pathway.color, marginRight: '8px' }} />}
                          {pathway.pathway === 'STEMI Pathway' && <FontAwesomeIcon icon={faHeart} style={{ color: pathway.color, marginRight: '8px' }} />}
                          {pathway.pathway === 'Trauma Pathway' && <FontAwesomeIcon icon={faAmbulance} style={{ color: pathway.color, marginRight: '8px' }} />}
                          <Typography variant="h6" sx={{ fontWeight: 600, color: pathway.color }}>
                            {pathway.pathway}
                          </Typography>
                        </Box>
                        
                        <Chip
                          label={`${pathway.activeCount} Cases`}
                          size="small"
                          sx={{
                            bgcolor: pathway.color,
                            color: 'white',
                            fontWeight: 600,
                            mb: 3,
                          }}
                        />

                        <Stack spacing={2.5}>
                          {pathway.metrics.map((metric, metricIndex) => (
                            <Box key={metricIndex}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#ffffff' }}>
                                  {metric.label}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600, color: metric.color }}
                                >
                                  {metric.value}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={metric.progress}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: alpha(metric.color, 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: metric.color,
                                    borderRadius: 4,
                                  },
                                }}
                              />
                            </Box>
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Comparison */}
          <Grid item xs={12}>
            <PerformanceComparison filters={getFilters()} />
          </Grid>

        
          {/* Recent Activity */}
          {/* <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Recent Transfer Requests
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {recentTickets.map((ticket, index) => (
                    <Box
                      key={ticket.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 2.5,
                        px: 2,
                        borderRadius: 2,
                        backgroundColor: index % 2 === 0 ? alpha('#f5f5f5', 0.3) : 'transparent',
                        mb: 1,
                        transition: 'background-color 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha('#f5f5f5', 0.5),
                        },
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {ticket.id} - {ticket.patient}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {ticket.pathway} • {ticket.time}
                        </Typography>
                      </Box>
                      <Chip
                        label={ticket.priority}
                        size="small"
                        color={getPriorityColor(ticket.priority) as any}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  ))}
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Button variant="outlined" size="medium" sx={{ borderRadius: 2 }}>
                    View All Tickets
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid> */}
        </Grid>
          </Box>
        )}
      </Box>
    </>
  );
};

export default DashboardPage;