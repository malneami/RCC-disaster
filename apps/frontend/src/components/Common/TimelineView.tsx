import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  Grid,
  Paper,
  IconButton,
  Collapse,
  Alert,
  TextField,
  InputAdornment,
  Button,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  AccessTime,
  Person,
  LocalHospital,
  Assignment,
  CheckCircle,
  Warning,
  Info,
  Search,
  Clear,
  FilterList,
} from '@mui/icons-material';
import TimelineFiltersDialog from './TimelineFiltersDialog';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  type: 'arrival' | 'assessment' | 'treatment' | 'discharge' | 'transfer' | 'other';
  status: 'completed' | 'in-progress' | 'pending' | 'cancelled';
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
  hospital?: {
    name: string;
    id: string;
  };
  details?: Record<string, any>;
}

export interface TimelineFilters {
  eventType: string;
  status: string;
  hospital: string;
}

export interface TimelineViewProps {
  events: TimelineEvent[];
  portalType: 'stroke' | 'trauma' | 'stemi';
  title?: string;
  showSearch?: boolean;
  onSearch?: (query: string, filter: any) => void;
  loading?: boolean;
  error?: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  portalType,
  title = 'Timeline View',
  showSearch = true,
  loading = false,
  error,
}) => {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TimelineFilters>({
    eventType: '',
    status: '',
    hospital: '',
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const getPortalColor = () => {
    switch (portalType) {
      case 'stroke': return '#1976d2';
      case 'trauma': return '#d32f2f';
      case 'stemi': return '#388e3c';
      default: return '#1976d2';
    }
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    const iconProps = {
      sx: { fontSize: 20 },
    };

    switch (type) {
      case 'arrival':
        return <LocalHospital {...iconProps} />;
      case 'assessment':
        return <Assignment {...iconProps} />;
      case 'treatment':
        return <CheckCircle {...iconProps} />;
      case 'discharge':
        return <Person {...iconProps} />;
      case 'transfer':
        return <LocalHospital {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  const getEventColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getEventTypeLabel = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'arrival': return 'Arrival';
      case 'assessment': return 'Assessment';
      case 'treatment': return 'Treatment';
      case 'discharge': return 'Discharge';
      case 'transfer': return 'Transfer';
      default: return 'Other';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  // Apply filters and search
  const applyFiltersAndSearch = useMemo(() => {
    let filtered = events;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(event => {
        const title = event.title.toLowerCase();
        const description = event.description?.toLowerCase() || '';
        const patientName = event.details?.patientName?.toLowerCase() || '';
        const patientNationalId = event.details?.patientNationalId?.toLowerCase() || '';
        const hospitalName = event.hospital?.name?.toLowerCase() || '';
        
        return title.includes(query) || 
               description.includes(query) || 
               patientName.includes(query) ||
               patientNationalId.includes(query) ||
               hospitalName.includes(query);
      });
    }

    // Apply filters
    if (filters.eventType) {
      filtered = filtered.filter(event => event.type === filters.eventType);
    }
    if (filters.status) {
      filtered = filtered.filter(event => event.status === filters.status);
    }
    if (filters.hospital) {
      filtered = filtered.filter(event => event.hospital?.name === filters.hospital);
    }

    return filtered.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [events, searchQuery, filters]);

  const sortedEvents = applyFiltersAndSearch;


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography variant="h6" color="text.secondary">
          Loading timeline...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" component="h2" fontWeight="bold">
            {title}
          </Typography>
          {showSearch && (
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setFilterDialogOpen(true)}
              sx={{
                borderColor: getPortalColor(),
                color: getPortalColor(),
                '&:hover': {
                  backgroundColor: `${getPortalColor()}10`,
                },
              }}
            >
              Filter
            </Button>
          )}
        </Box>

        {/* Search Bar */}
        {showSearch && (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search by patient name, National ID, event title, or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: getPortalColor() }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery('')} size="small">
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: getPortalColor(),
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: getPortalColor(),
                  },
                },
              }}
            />
          </Box>
        )}

        {/* Active Filters Alert */}
        {(filters.eventType || filters.status || filters.hospital || searchQuery) && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {searchQuery && `Search: "${searchQuery}"`}
            {(filters.eventType || filters.status || filters.hospital) && (
              <>
                {searchQuery && ' • '}
                Filters: {[
                  filters.eventType && `Type: ${filters.eventType}`,
                  filters.status && `Status: ${filters.status}`,
                  filters.hospital && `Hospital: ${filters.hospital}`,
                ].filter(Boolean).join(', ')}
              </>
            )}
            <Button 
              size="small" 
              onClick={() => {
                setFilters({ eventType: '', status: '', hospital: '' });
                setSearchQuery('');
              }} 
              sx={{ ml: 1 }}
            >
              Clear All
            </Button>
          </Alert>
        )}
        
        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 1, boxShadow: 1 }}>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTime sx={{ mr: 1, color: getPortalColor(), fontSize: 20 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {sortedEvents.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {sortedEvents.length === events.length ? 'Total Events' : 'Filtered Events'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 1, boxShadow: 1 }}>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ mr: 1, color: 'success.main', fontSize: 20 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {sortedEvents.filter(e => e.status === 'completed').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 1, boxShadow: 1 }}>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Warning sx={{ mr: 1, color: 'warning.main', fontSize: 20 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {sortedEvents.filter(e => e.status === 'in-progress').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Progress
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 1, boxShadow: 1 }}>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Info sx={{ mr: 1, color: 'info.main', fontSize: 20 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {sortedEvents.filter(e => e.status === 'pending').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Timeline */}
      {sortedEvents.length === 0 ? (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            {searchQuery || filters.eventType || filters.status || filters.hospital 
              ? 'No events match your search criteria' 
              : 'No timeline events found'
            }
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Loading events...' : 
             (searchQuery || filters.eventType || filters.status || filters.hospital)
               ? 'Try adjusting your search or filters to see more results.'
               : 'Timeline events will appear here as they are recorded.'
            }
          </Typography>
          {(searchQuery || filters.eventType || filters.status || filters.hospital) && (
            <Button 
              variant="outlined" 
              onClick={() => {
                setFilters({ eventType: '', status: '', hospital: '' });
                setSearchQuery('');
              }}
              sx={{ mt: 2 }}
            >
              Clear All Filters
            </Button>
          )}
        </Paper>
      ) : (
        <Box sx={{ position: 'relative' }}>
          {/* Timeline Line */}
          <Box
            sx={{
              position: 'absolute',
              left: 18,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: 'grey.300',
              zIndex: 0,
            }}
          />
          
          {sortedEvents.map((event) => {
            const isExpanded = expandedEvents.has(event.id);
            const { date, time } = formatTimestamp(event.timestamp);

            return (
              <Box key={event.id} sx={{ position: 'relative', mb: 2 }}>
                {/* Timeline Dot */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 12,
                    top: 12,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: event.status === 'completed' ? 'success.main' :
                                    event.status === 'in-progress' ? getPortalColor() :
                                    event.status === 'pending' ? 'warning.main' : 'error.main',
                    border: '2px solid white',
                    boxShadow: 1,
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getEventIcon(event.type)}
                </Box>

                {/* Event Content */}
                <Box sx={{ ml: 4 }}>
                  {/* Date/Time */}
                  <Box sx={{ mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="medium" color="text.secondary">
                      {date} • {time}
                    </Typography>
                  </Box>

                  {/* Event Card */}
                  <Card sx={{ borderRadius: 1, boxShadow: 1 }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" fontWeight="medium">
                          {event.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={getEventTypeLabel(event.type)}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: getPortalColor(), color: getPortalColor() }}
                          />
                          <Chip
                            label={event.status.replace('-', ' ')}
                            size="small"
                            color={getEventColor(event.status) as any}
                            variant="filled"
                          />
                        </Box>
                      </Box>

                      {event.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {event.description}
                        </Typography>
                      )}

                      {/* Event Details */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        {event.user && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                              {event.user.name.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                            <Typography variant="caption" color="text.secondary">
                              {event.user.name} • {event.user.role}
                            </Typography>
                          </Box>
                        )}

                        {event.hospital && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocalHospital sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {event.hospital.name}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Expandable Details */}
                      {event.details && Object.keys(event.details).length > 0 && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">
                              Additional Details
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => toggleEventExpansion(event.id)}
                              sx={{ color: getPortalColor() }}
                            >
                              {isExpanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </Box>

                          <Collapse in={isExpanded}>
                            <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                              {Object.entries(event.details).map(([key, value]) => (
                                <Box key={key} sx={{ mb: 1 }}>
                                  <Typography variant="caption" fontWeight="medium" color="text.secondary">
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                  </Typography>
                                  <Typography variant="body2" sx={{ ml: 1 }}>
                                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Collapse>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Filter Dialog */}
      <TimelineFiltersDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApplyFilters={() => {
          // Filters are already applied via useMemo
        }}
        onClearFilters={() => {
          setFilters({ eventType: '', status: '', hospital: '' });
        }}
        portalType={portalType}
      />
    </Box>
  );
};

export default TimelineView;
