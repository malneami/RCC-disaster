import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
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
import PerformanceComparison from './PerformanceComparison';
import GlobalCriticalCaseTracker from '../../components/Dashboard/GlobalCriticalCaseTracker';
import { dashboardService, DashboardMetrics, PathwayPerformanceMetrics } from '../../services/dashboardService';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [pathwayMetrics, setPathwayMetrics] = useState<PathwayPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [metricsData, pathwayData] = await Promise.all([
          dashboardService.getDashboardMetrics(),
          dashboardService.getPathwayPerformanceMetrics(),
        ]);
        
        setDashboardMetrics(metricsData);
        setPathwayMetrics(pathwayData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Main KPI Cards - now using dynamic data
  const kpiCards = [
    {
      title: 'Active Transfers',
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
      title: 'Completed Today',
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

      <Box>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Welcome back, {user?.firstName}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Regional Coordination Center Dashboard
        </Typography>

        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress sx={{ mr: 2 }} />
            <Typography>Loading dashboard data...</Typography>
          </Box>
        )}

        {error && (
          <Box p={3} mb={3}>
            <Typography color="error" variant="h6">
              Error: {error}
            </Typography>
            <Typography color="text.secondary">
              Please refresh the page or try again later.
            </Typography>
          </Box>
        )}

        {!loading && !error && (
          <>
            <Grid container spacing={3}>
          {/* Main KPI Cards */}
          {kpiCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  background: `linear-gradient(135deg, ${card.bgColor} 0%, ${alpha(card.color, 0.05)} 100%)`,
                  border: `1px solid ${alpha(card.color, 0.2)}`,
                  borderRadius: 3,
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${alpha(card.color, 0.15)}`,
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
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Global Critical Case Tracker */}
          <Grid item xs={12}>
            <GlobalCriticalCaseTracker />
          </Grid>

          {/* Critical Performance Metrics */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <FontAwesomeIcon icon={faChartLine} style={{ color: '#1976d2', marginRight: '16px', fontSize: '28px' }} />
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Critical Performance Metrics
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
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
                          background: `linear-gradient(135deg, ${alpha(pathway.color, 0.08)} 0%, ${alpha(pathway.color, 0.02)} 100%)`,
                          border: `1px solid ${alpha(pathway.color, 0.15)}`,
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
                          label={`${pathway.activeCount} Active`}
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
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
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
            <PerformanceComparison />
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
          </>
        )}
      </Box>
    </>
  );
};

export default DashboardPage;