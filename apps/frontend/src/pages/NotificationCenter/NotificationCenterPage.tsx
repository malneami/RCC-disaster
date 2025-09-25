import React, { useState, useEffect } from 'react';
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
import { notificationService, NotificationFilter, NotificationCategory } from '../../services/notificationService';


const NotificationCenterPage: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<NotificationFilter>({});
  const [categories, setCategories] = useState<NotificationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

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
  };

  const handleFilterChange = (newFilters: NotificationFilter) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    loadInitialData();
  };

  const handlePriorityFilter = (priority: string) => {
    if (priority === 'All') {
      const { priority: _, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({ ...filters, priority: priority as any });
    }
  };

  const handleCategoryFilter = (category: string) => {
    if (category === 'All') {
      const { type: _, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({ ...filters, type: category });
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
          {
            tooltip: showFilters ? 'Hide Filters' : 'Show Filters',
            onClick: () => setShowFilters(!showFilters),
            icon: <FontAwesomeIcon icon={faFilter} />,
          },
        ]}
      />

      {/* Summary Cards */}
      <Box sx={{ mb: 3 }}>
        <NotificationSummaryCards />
      </Box>

      {/* Filters */}
      {showFilters && (
        <Card sx={{ 
          mt: 2, 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          <CardContent sx={{ p: 3 }}>
            <NotificationFilters
              currentFilters={filters}
              onApplyFilters={handleFilterChange}
              onResetFilters={() => setFilters({})}
              onRefresh={handleRefresh}
            />
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Notifications Panel */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FontAwesomeIcon icon={faBell} style={{ marginRight: '8px' }} />
                <Typography variant="h6" component="h2">
                  Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  Recent notifications and alerts
                </Typography>
              </Box>

              {/* Filter Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="notification tabs">
                  <Tab label="All" onClick={() => handleCategoryFilter('All')} />
                  <Tab label="Emergency" onClick={() => handlePriorityFilter('HIGH')} />
                  <Tab label="Transfers" onClick={() => handleCategoryFilter('CASE_ASSIGNMENT')} />
                  <Tab label="STEMI" onClick={() => handleCategoryFilter('STEMI')} />
                  <Tab label="Stroke" onClick={() => handleCategoryFilter('STROKE')} />
                  <Tab label="Trauma" onClick={() => handleCategoryFilter('TRAUMA')} />
                </Tabs>
              </Box>

              {/* Priority Filter */}
              <Box sx={{ mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
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
              <NotificationList filters={filters} />
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Categories Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FontAwesomeIcon icon={faBell} style={{ marginRight: '8px' }} />
                <Typography variant="h6" component="h2">
                  Notification Categories
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  Distribution by notification type
                </Typography>
              </Box>

              {categories.length === 0 ? (
                <EmptyState
                  icon={<FontAwesomeIcon icon={faBell} size="2x" />}
                  title="No Categories"
                  description="No notification categories available at this time."
                  size="small"
                />
              ) : (
                <Box>
                  {categories.map((category) => (
                    <Box
                      key={category.type}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FontAwesomeIcon icon={faBell} style={{ marginRight: '8px', opacity: 0.7 }} />
                        <Typography variant="body2">
                          {category.type.replace('_', ' ')}
                        </Typography>
                      </Box>
                      <Chip
                        label={category.count}
                        size="small"
                        color="primary"
                        variant="outlined"
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
  );
};

export default NotificationCenterPage;
