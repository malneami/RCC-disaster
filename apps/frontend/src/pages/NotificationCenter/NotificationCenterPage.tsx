import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
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
import { useQuery, useQueryClient } from 'react-query';

import NotificationSummaryCards from './components/NotificationSummaryCards';
import NotificationList from './components/NotificationList';
import NotificationFilters from './components/NotificationFilters';
import RCCIncomingCasesList from './components/RCCIncomingCasesList';

import CaseTypeTabs, { CaseTypeFilter } from './components/CaseTypeTabs';
import EmptyState from '../../components/Common/EmptyState';
import ErrorBoundary from '../../components/Common/ErrorBoundary';
import { notificationService, NotificationFilter } from '../../services/notificationService';
import { ticketService } from '../../services/ticketService';
import { useNotificationSocket } from '../../contexts/NotificationSocketContext';
import { useAuth } from '../../contexts/AuthContext';


const NotificationCenterPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Get socket connection from context
  const { socket, isConnected } = useNotificationSocket();

  // State
  const [activeCaseType, setActiveCaseType] = useState<CaseTypeFilter>('ALL');
  const [filters, setFilters] = useState<NotificationFilter>({});
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  // Use React Query for categories
  const { data: categories = [] } = useQuery(
    'notificationCategories',
    () => notificationService.getNotificationCategories(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true,
      staleTime: 10000,
    }
  );

  // Use React Query for case type counts
  const { data: caseTypeCounts = { ALL: 0, STEMI: 0, STROKE: 0, TRAUMA: 0, INCOMING_CRITICAL: 0 } } = useQuery(
    ['caseTypeCounts', user?.role],
    async () => {
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
      return {
        ALL: counts.ALL || 0,
        STEMI: counts.STEMI || 0,
        STROKE: counts.STROKE || 0,
        TRAUMA: counts.TRAUMA || 0,
        INCOMING_CRITICAL: incomingCount,
      };
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true,
      staleTime: 10000,
      enabled: !!user, // Only fetch when user is available
    }
  );

  // Check if any filters are active
  const hasActiveFilters = Boolean(
    filters.priority || 
    filters.type || 
    filters.caseType || 
    filters.category ||
    filters.isRead
  );

  const handleFilterClick = () => {
    if (filterButtonRef.current) {
      setFilterAnchorEl(filterButtonRef.current);
    }
  };

  // Memoized event handlers using useCallback
  const handleNotificationCreated = useCallback(() => {
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries('notificationCategories');
    queryClient.invalidateQueries(['caseTypeCounts']);
  }, [queryClient]);

  const handleNotificationRead = useCallback(() => {
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries(['caseTypeCounts']);
  }, [queryClient]);

  const handleNotificationDeleted = useCallback(() => {
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries('notificationCategories');
    queryClient.invalidateQueries(['caseTypeCounts']);
  }, [queryClient]);

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
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries('notificationCategories');
    queryClient.invalidateQueries(['caseTypeCounts']);
  };

  const handleNotificationChange = useCallback(() => {
    queryClient.invalidateQueries(['caseTypeCounts']);
  }, [queryClient]);

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
                  {filters.isRead === 'false' && (
                    <Chip
                      label="Unread Only"
                      onDelete={() => removeFilter('isRead')}
                      deleteIcon={<FontAwesomeIcon icon={faTimes} />}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  {filters.isRead === 'true' && (
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
                    queryClient.invalidateQueries(['caseTypeCounts']);
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

