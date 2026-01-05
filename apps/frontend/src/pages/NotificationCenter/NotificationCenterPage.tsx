import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faRefresh,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';

import GenericPageHeader from '../../components/Common/GenericPageHeader';
import NotificationSummaryCards from './components/NotificationSummaryCards';
import NotificationList from './components/NotificationList';
import NotificationFilters from './components/NotificationFilters';
import EmptyState from '../../components/Common/EmptyState';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorBoundary from '../../components/Common/ErrorBoundary';
import { notificationService, NotificationFilter, NotificationCategory } from '../../services/notificationService';
import { useDebouncedCallback } from '../../hooks/useDebounce';
import { useNotificationSocket } from '../../contexts/NotificationSocketContext';


const NotificationCenterPage: React.FC = () => {
  // Get socket connection from context
  const { socket, isConnected } = useNotificationSocket();

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<NotificationFilter>({});
  const [categories, setCategories] = useState<NotificationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Debounced refresh function to prevent multiple rapid refreshes
  const debouncedRefresh = useDebouncedCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, 500);

  // Debounced category load function
  const debouncedLoadCategories = useDebouncedCallback(async () => {
    try {
      const categoriesData = await notificationService.getNotificationCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }, 500);

  // Memoized event handlers using useCallback
  const handleNotificationCreated = useCallback(() => {
    debouncedRefresh();
    debouncedLoadCategories();
  }, [debouncedRefresh, debouncedLoadCategories]);

  const handleNotificationRead = useCallback(() => {
    debouncedRefresh();
  }, [debouncedRefresh]);

  const handleNotificationDeleted = useCallback(() => {
    debouncedRefresh();
    debouncedLoadCategories();
  }, [debouncedRefresh, debouncedLoadCategories]);

  // Load categories on mount and set up interval
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await notificationService.getNotificationCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };

    loadCategories();
    const interval = setInterval(loadCategories, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Listen to socket events using context hook
  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    // Listen for notification events from WebSocket
    socket.on('notification-created', handleNotificationCreated);
    socket.on('notification-read', handleNotificationRead);
    socket.on('notification-deleted', handleNotificationDeleted);

    return () => {
      socket.off('notification-created', handleNotificationCreated);
      socket.off('notification-read', handleNotificationRead);
      socket.off('notification-deleted', handleNotificationDeleted);
    };
  }, [socket, isConnected, handleNotificationCreated, handleNotificationRead, handleNotificationDeleted]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesData] = await Promise.all([
        notificationService.getNotificationCategories(),
      ]);

      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading notification data:', err);
      setError('Failed to load notification data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Map tab index to caseType filter
    const tabCaseTypes = ['ALL', 'EMERGENCY', 'STEMI', 'STROKE', 'TRAUMA'];
    const selectedTab = tabCaseTypes[newValue];
    
    if (selectedTab === 'ALL') {
      // Remove caseType filter for ALL tab
      const { caseType: _, ...rest } = filters;
      setFilters(rest);
    } else if (selectedTab === 'EMERGENCY') {
      // Set priority filter for EMERGENCY tab
      setFilters({ ...filters, priority: 'HIGH', caseType: undefined });
    } else {
      // Set caseType filter for STEMI, STROKE, TRAUMA tabs
      // Clear priority filter to show all priorities for portal-specific notifications
      const { priority: _, ...rest } = filters;
      setFilters({ ...rest, caseType: selectedTab });
    }
  };

  const handleFilterChange = (newFilters: NotificationFilter) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    loadInitialData();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleNotificationChange = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handlePriorityFilter = (priority: string) => {
    if (priority === 'All') {
      const { priority: _, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({ ...filters, priority: priority as any });
    }
  };


  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Box>
        <GenericPageHeader
          title="Notification Center"
          subtitle="View and manage all notifications across the RCC platform"
          actions={[
            {
              tooltip: 'Refresh',
              onClick: handleRefresh,
              icon: <FontAwesomeIcon icon={faRefresh} />,
            },
          ]}
        />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        p: { xs: 1, sm: 2, md: 3 }
      }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <GenericPageHeader
          title="Notification Center"
          subtitle="View and manage all notifications across the RCC platform"
          actions={[
            {
              tooltip: 'Refresh',
              onClick: handleRefresh,
              icon: <FontAwesomeIcon icon={faRefresh} />,
            },
            {
              tooltip: showFilters ? 'Hide Filters' : 'Show Filters',
              onClick: () => setShowFilters(!showFilters),
              icon: <FontAwesomeIcon icon={faFilter} />,
            },
          ]}
        />
      </Box>

      {/* Summary Cards */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <NotificationSummaryCards refreshTrigger={refreshTrigger} />
      </Box>

      {/* Filters */}
      {showFilters && (
        <Card sx={{ 
          mb: { xs: 2, sm: 3 }, 
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <NotificationFilters
              currentFilters={filters}
              onApplyFilters={handleFilterChange}
              onResetFilters={() => setFilters({})}
              onRefresh={handleRefresh}
            />
          </CardContent>
        </Card>
      )}

      {/* Main Content - Responsive Layout */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Notifications Panel - Full width on mobile, 8/12 on desktop */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            height: 'fit-content'
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Header */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 2 }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FontAwesomeIcon 
                    icon={faBell} 
                    style={{ 
                      marginRight: '8px', 
                      fontSize: '1.2rem',
                      color: '#1976d2'
                    }} 
                  />
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                    Notifications
                  </Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '0.9rem' },
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                >
                  Recent notifications and alerts
                </Typography>
              </Box>

              {/* Filter Tabs - Responsive */}
              <Box sx={{ 
                borderBottom: 1, 
                borderColor: 'divider', 
                mb: 3,
                overflowX: 'auto',
                '& .MuiTabs-scrollButtons': {
                  display: { xs: 'block', sm: 'none' }
                }
              }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange} 
                  aria-label="notification tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTab-root': {
                      minWidth: { xs: 'auto', sm: '120px' },
                      fontSize: { xs: '0.875rem', sm: '0.9rem' },
                      px: { xs: 1, sm: 2 }
                    }
                  }}
                >
                  <Tab label="All" />
                  <Tab label="Emergency" />
                  <Tab label="STEMI" />
                  <Tab label="Stroke" />
                  <Tab label="Trauma" />
                </Tabs>
              </Box>

              {/* Priority Filter - Responsive */}
              <Box sx={{ 
                mb: 3,
                display: 'flex',
                justifyContent: { xs: 'center', sm: 'flex-start' }
              }}>
                <FormControl 
                  size="small" 
                  sx={{ 
                    minWidth: { xs: 140, sm: 160 },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={filters.priority || 'All'}
                    label="Priority"
                    onChange={(e) => handlePriorityFilter(e.target.value)}
                  >
                    <MenuItem value="All">All Priorities</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="LOW">Low</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Notification List */}
              <NotificationList 
                filters={filters} 
                onNotificationChange={handleNotificationChange}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Categories Panel - Full width on mobile, 4/12 on desktop */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            height: 'fit-content',
            position: { lg: 'sticky' },
            top: { lg: 20 }
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Header */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 2 }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FontAwesomeIcon 
                    icon={faBell} 
                    style={{ 
                      marginRight: '8px', 
                      fontSize: '1.2rem',
                      color: '#1976d2'
                    }} 
                  />
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                    Categories
                  </Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '0.9rem' },
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                >
                  Distribution by type
                </Typography>
              </Box>

              {/* Categories List */}
              {categories.length === 0 ? (
                <EmptyState
                  icon={<FontAwesomeIcon icon={faBell} size="2x" />}
                  title="No Categories"
                  description="No notification categories available at this time."
                  size="small"
                />
              ) : (
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}>
                  {categories.map((category) => (
                    <Box
                      key={category.type}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        borderRadius: 1,
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#f1f5f9',
                          borderColor: '#cbd5e1'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FontAwesomeIcon 
                          icon={faBell} 
                          style={{ 
                            marginRight: '12px', 
                            opacity: 0.7,
                            fontSize: '0.9rem'
                          }} 
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500,
                            fontSize: { xs: '0.875rem', sm: '0.9rem' }
                          }}
                        >
                          {category.type.replace('_', ' ')}
                        </Typography>
                      </Box>
                      <Chip
                        label={category.count}
                        size="small"
                        color="primary"
                        variant="filled"
                        sx={{ 
                          fontWeight: 600,
                          minWidth: '32px'
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Box>
    </ErrorBoundary>
  );
};

export default NotificationCenterPage;
