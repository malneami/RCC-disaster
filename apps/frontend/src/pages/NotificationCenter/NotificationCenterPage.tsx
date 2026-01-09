import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Badge,
  alpha,
  useTheme,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faRefresh,
  faFilter,
  faAmbulance,
  faHospital,
  faTicketAlt,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';

import NotificationSummaryCards from './components/NotificationSummaryCards';
import NotificationList from './components/NotificationList';
import NotificationFilters from './components/NotificationFilters';
import RCCIncomingCasesList from './components/RCCIncomingCasesList';

import CaseTypeTabs, { CaseTypeFilter } from './components/CaseTypeTabs';
import EmptyState from '../../components/Common/EmptyState';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorBoundary from '../../components/Common/ErrorBoundary';
import { notificationService, NotificationFilter, NotificationCategory } from '../../services/notificationService';
import { ticketService } from '../../services/ticketService';
import { useDebouncedCallback } from '../../hooks/useDebounce';
import { useNotificationSocket } from '../../contexts/NotificationSocketContext';
import { useAuth } from '../../contexts/AuthContext';
import GenericPageHeader from '@/components/Common/GenericPageHeader';


const NotificationCenterPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  // Get socket connection from context
  const { socket, isConnected } = useNotificationSocket();

  // State
  const [activeCaseType, setActiveCaseType] = useState<CaseTypeFilter>('ALL');
  const [filters, setFilters] = useState<NotificationFilter>({});
  const [categories, setCategories] = useState<NotificationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [caseTypeCounts, setCaseTypeCounts] = useState<Record<CaseTypeFilter, number>>({
    ALL: 0,
    STEMI: 0,
    STROKE: 0,
    TRAUMA: 0,
    INCOMING_CRITICAL: 0,
  });
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  // Check if any filters are active
  const hasActiveFilters = Boolean(
    filters.priority || 
    filters.type || 
    filters.caseType || 
    filters.category ||
    filters.isRead === true
  );

  const handleFilterClick = () => {
    if (filterButtonRef.current) {
      setFilterAnchorEl(filterButtonRef.current);
    }
  };

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

  // Load case type counts efficiently from backend
  const loadCaseTypeCounts = useCallback(async () => {
    try {
      const counts = await notificationService.getCaseTypeCounts();
      let incomingCount = 0;
      if (user?.role === 'RCC' || user?.role === 'ADMIN' || user?.role === 'HOSPITAL_USER') {
        try {
          const incomingCases = await ticketService.getRCCIncomingCases();
          incomingCount = incomingCases.length;
        } catch (err) {
          console.error('Error loading incoming cases count:', err);
        }
      }
      setCaseTypeCounts({
        ALL: counts.ALL || 0,
        STEMI: counts.STEMI || 0,
        STROKE: counts.STROKE || 0,
        TRAUMA: counts.TRAUMA || 0,
        INCOMING_CRITICAL: incomingCount,
      });
    } catch (err) {
      console.error('Error loading case type counts:', err);
    }
  }, [user?.role]);

  // Memoized event handlers using useCallback
  const handleNotificationCreated = useCallback(() => {
    debouncedRefresh();
    debouncedLoadCategories();
    loadCaseTypeCounts();
  }, [debouncedRefresh, debouncedLoadCategories, loadCaseTypeCounts]);

  const handleNotificationRead = useCallback(() => {
    debouncedRefresh();
    loadCaseTypeCounts();
  }, [debouncedRefresh, loadCaseTypeCounts]);

  const handleNotificationDeleted = useCallback(() => {
    debouncedRefresh();
    debouncedLoadCategories();
    loadCaseTypeCounts();
  }, [debouncedRefresh, debouncedLoadCategories, loadCaseTypeCounts]);

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

  const removeFilter = (filterKey: keyof NotificationFilter) => {
    const { [filterKey]: _, ...restFilters } = filters;
    setFilters(restFilters);
    
    if (filterKey === 'caseType') {
      setActiveCaseType('ALL');
    }
  };

  const handleCaseTypeChange = (caseType: CaseTypeFilter) => {
    setActiveCaseType(caseType);
    // INCOMING_CRITICAL tab doesn't use filters - it shows all incoming cases
    if (caseType === 'INCOMING_CRITICAL') {
      return;
    }
    if (caseType === 'ALL') {
      const { caseType: _, ...restFilters } = filters;
      setFilters(restFilters);
    } else {
      setFilters({
        ...filters,
        caseType: caseType,
      });
    }
  };

  const handleFilterChange = (newFilters: NotificationFilter) => {
    const cleanFilters: NotificationFilter = {};
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanFilters[key as keyof NotificationFilter] = value;
      }
    });
    setFilters(cleanFilters);
    if (cleanFilters.caseType) {
      setActiveCaseType(cleanFilters.caseType as CaseTypeFilter);
    } else {
      setActiveCaseType('ALL');
    }
  };

  const handleRefresh = () => {
    loadInitialData();
    setRefreshTrigger(prev => prev + 1);
    loadCaseTypeCounts();
  };

  const handleNotificationChange = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    loadCaseTypeCounts();
  }, [loadCaseTypeCounts]);

  useEffect(() => {
    loadCaseTypeCounts();
    const interval = setInterval(loadCaseTypeCounts, 30000);
    return () => clearInterval(interval);
  }, [refreshTrigger, loadCaseTypeCounts]);


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
      <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            px: { xs: 2, sm: 2, md: 5},
            py: 2.5,
            backgroundColor: 'white',
            borderBottom: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            mb: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2.5,
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ flex: '1 1 auto', minWidth: 200 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                mb: 0.5,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              }}
            >
              Notification Center
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              View and manage all notifications across the RCC platform
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Tooltip title="Refresh">
              <IconButton 
                onClick={handleRefresh} 
                color="primary"
                sx={{
                  borderRadius: 2.5,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <FontAwesomeIcon icon={faRefresh} />
              </IconButton>
            </Tooltip>
            {activeCaseType !== 'INCOMING_CRITICAL' && (
              <Tooltip title={hasActiveFilters ? 'Filter Notifications (Active)' : 'Filter Notifications'}>
                <IconButton
                  ref={filterButtonRef}
                  onClick={handleFilterClick}
                  color={hasActiveFilters ? 'primary' : 'default'}
                  sx={{
                    borderRadius: 2.5,
                    ...(hasActiveFilters && {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      },
                    }),
                  }}
                >
                  {hasActiveFilters ? (
                    <Badge badgeContent="•" color="primary">
                      <FontAwesomeIcon icon={faFilter} />
                    </Badge>
                  ) : (
                    <FontAwesomeIcon icon={faFilter} />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' ,borderTop: `1px solid ${theme.palette.divider}`, paddingTop: 1, gap: 1.5, flexWrap: 'wrap' }}>
          <NotificationSummaryCards 
            refreshTrigger={refreshTrigger} 
            filters={filters}
            incomingCriticalCasesCount={caseTypeCounts.INCOMING_CRITICAL}
          />
        </Box>
        </Box>
      </Container>

      {/* Filters Popup - Don't show for INCOMING_CRITICAL tab */}
      {activeCaseType !== 'INCOMING_CRITICAL' && (
        <NotificationFilters
          currentFilters={filters}
          onApplyFilters={handleFilterChange}
          onResetFilters={() => setFilters({})}
          onRefresh={handleRefresh}
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={() => setFilterAnchorEl(null)}
        />
      )}

      {/* Content Area */}
      <Container maxWidth="xl" sx={{ py: 1, px: 2 }}>
        <Box
          sx={{
            p: 1.5,
          }}
        >
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

              {/* Case Type Tabs */}
              <CaseTypeTabs
                activeCaseType={activeCaseType}
                onCaseTypeChange={handleCaseTypeChange}
                caseTypeCounts={caseTypeCounts}
              />

              {hasActiveFilters && activeCaseType !== 'INCOMING_CRITICAL' && (
                <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                  {filters.priority && (
                    <Chip
                      label={`Priority: ${filters.priority}`}
                      onDelete={() => removeFilter('priority')}
                      deleteIcon={<FontAwesomeIcon icon={faTimes} />}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  {filters.type && (
                    <Chip
                      label={`Type: ${filters.type.replace(/_/g, ' ')}`}
                      onDelete={() => removeFilter('type')}
                      deleteIcon={<FontAwesomeIcon icon={faTimes} />}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  {filters.caseType && (
                    <Chip
                      label={`Case Type: ${filters.caseType}`}
                      onDelete={() => removeFilter('caseType')}
                      deleteIcon={<FontAwesomeIcon icon={faTimes} />}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  {filters.category && (
                    <Chip
                      label={`Category: ${filters.category}`}
                      onDelete={() => removeFilter('category')}
                      deleteIcon={<FontAwesomeIcon icon={faTimes} />}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  {filters.isRead === true && (
                    <Chip
                      label="Read Only"
                      onDelete={() => removeFilter('isRead')}
                      deleteIcon={<FontAwesomeIcon icon={faTimes} />}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              )}

              {activeCaseType === 'INCOMING_CRITICAL' && (user?.role === 'RCC' || user?.role === 'ADMIN') ? (
                <RCCIncomingCasesList 
                  onCaseAcknowledged={() => {
                    loadCaseTypeCounts();
                  }}
                />
              ) : (
                <NotificationList 
                  filters={filters} 
                  onNotificationChange={handleNotificationChange}
                />
              )}
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
                  gap: 1.5
                }}>
                  {categories.map((category) => {
                    const getTypeConfig = () => {
                      switch (category.type) {
                        // EMS types
                        case 'EMS_LATE_CASE':
                          return {
                            icon: faAmbulance,
                            color: '#3b82f6',
                            bgColor: alpha('#3b82f6', 0.1),
                            borderColor: alpha('#3b82f6', 0.3),
                          };
                        case 'CASE_ASSIGNMENT':
                        case 'CASE_ESCALATION':
                        case 'CRITICAL_CASE_INCOMING':
                          return {
                            icon: faHospital,
                            color: '#10b981',
                            bgColor: alpha('#10b981', 0.1),
                            borderColor: alpha('#10b981', 0.3),
                          };
                        case 'CASE_COMPLETION':
                        case 'CASE_UPDATE':
                          return {
                            icon: faTicketAlt,
                            color: '#f59e0b',
                            bgColor: alpha('#f59e0b', 0.1),
                            borderColor: alpha('#f59e0b', 0.3),
                          };
                        case 'CASE_COMMENT':
                        case 'INCOMPLETE_PATIENT_DATA':
                        case 'KPI_THRESHOLD_BREACH':
                        case 'CRITICAL_TIME_LIMIT_APPROACHING':
                          return {
                            icon: faBell,
                            color: '#6366f1',
                            bgColor: alpha('#6366f1', 0.1),
                            borderColor: alpha('#6366f1', 0.3),
                          };
                        default:
                          return {
                            icon: faBell,
                            color: '#6b7280',
                            bgColor: alpha('#6b7280', 0.1),
                            borderColor: alpha('#6b7280', 0.3),
                          };
                      }
                    };

                    const config = getTypeConfig();
                    const typeLabel = category.type.replace(/_/g, ' ');

                    const isSelected = filters.type === category.type;

                    const handleTypeBoxClick = () => {
                      if (isSelected) {
                        const { type: _, ...restFilters } = filters;
                        setFilters(restFilters);
                      } else {
                        setFilters({
                          ...filters,
                          type: category.type,
                        });
                      }
                    };

                    return (
                      <Box
                        key={category.type}
                        onClick={handleTypeBoxClick}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2.5,
                          borderRadius: 2,
                          background: isSelected
                            ? `linear-gradient(135deg, ${alpha(config.color, 0.15)} 0%, ${alpha(config.color, 0.08)} 100%)`
                            : `linear-gradient(135deg, ${config.bgColor} 0%, ${alpha(config.color, 0.05)} 100%)`,
                          border: `1px solid ${isSelected ? config.color : config.borderColor}`,
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          boxShadow: isSelected ? `0 4px 12px ${alpha(config.color, 0.2)}` : 'none',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(config.color, 0.2)}`,
                            borderColor: config.color,
                            background: `linear-gradient(135deg, ${alpha(config.color, 0.15)} 0%, ${alpha(config.color, 0.08)} 100%)`,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2,
                              backgroundColor: config.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              boxShadow: `0 2px 8px ${alpha(config.color, 0.3)}`,
                            }}
                          >
                            <FontAwesomeIcon 
                              icon={config.icon} 
                              style={{ 
                                fontSize: '1.1rem'
                              }} 
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                color: 'text.primary',
                                mb: 0.25,
                              }}
                            >
                              {typeLabel}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                              }}
                            >
                              {category.count} notification{category.count !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={category.count}
                          size="small"
                          sx={{ 
                            backgroundColor: config.color,
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            minWidth: 36,
                            height: 28,
                            boxShadow: `0 2px 4px ${alpha(config.color, 0.3)}`,
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
        </Box>
      </Container>
      </Box>
    </ErrorBoundary>
  );
};

export default NotificationCenterPage;

