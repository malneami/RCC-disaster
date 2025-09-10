import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Menu,
  ListItemText,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
} from '@mui/icons-material';
import { UnifiedTicket, TicketFilterOptions, TicketSortOption, convertToUnifiedTicket } from '../types/tickets';
import TicketCard from './TicketCard';
import { Ticket } from '../../../services/ticketService';
import { HospitalTicket } from '../../../services/hospitalService';

interface RelatedTicketsManagerProps {
  hospitalTickets: HospitalTicket[];
  transferTickets: Ticket[];
  onRefresh?: () => void;
  onViewTicket?: (ticket: UnifiedTicket) => void;
  onEditTicket?: (ticket: UnifiedTicket) => void;
  isLoading?: boolean;
}

const RelatedTicketsManager: React.FC<RelatedTicketsManagerProps> = ({
  hospitalTickets,
  transferTickets,
  onRefresh,
  onViewTicket,
  onEditTicket,
  isLoading = false,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<TicketFilterOptions>({});
  const [sortBy, setSortBy] = useState<TicketSortOption>('createdAt_desc');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  // Convert all tickets to unified format
  const unifiedTickets = useMemo(() => {
    const hospitalUnified = hospitalTickets.map(convertToUnifiedTicket);
    const transferUnified = transferTickets.map(convertToUnifiedTicket);
    return [...hospitalUnified, ...transferUnified];
  }, [hospitalTickets, transferTickets]);

  // Filter and sort tickets
  const filteredAndSortedTickets = useMemo(() => {
    let filtered = unifiedTickets;

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(ticket => filters.status!.includes(ticket.status));
    }
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(ticket => filters.priority!.includes(ticket.priority));
    }
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(ticket => filters.type!.includes(ticket.type));
    }
    if (filters.pathway && filters.pathway.length > 0) {
      filtered = filtered.filter(ticket => 
        ticket.pathway && filters.pathway!.includes(ticket.pathway)
      );
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower) ||
        (ticket.patient && `${ticket.patient.firstName} ${ticket.patient.lastName}`.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'createdAt_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'priority_desc':
          const priorityOrder = { 'EMERGENCY': 5, 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        case 'priority_asc':
          const priorityOrderAsc = { 'EMERGENCY': 5, 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return (priorityOrderAsc[a.priority as keyof typeof priorityOrderAsc] || 0) - 
                 (priorityOrderAsc[b.priority as keyof typeof priorityOrderAsc] || 0);
        case 'status_asc':
          return a.status.localeCompare(b.status);
        case 'status_desc':
          return b.status.localeCompare(a.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [unifiedTickets, filters, sortBy]);

  // Get unique filter options
  const statusOptions = useMemo(() => {
    const statuses = new Set(unifiedTickets.map(t => t.status));
    return Array.from(statuses).sort();
  }, [unifiedTickets]);

  const priorityOptions = useMemo(() => {
    const priorities = new Set(unifiedTickets.map(t => t.priority));
    return Array.from(priorities).sort();
  }, [unifiedTickets]);

  const pathwayOptions = useMemo(() => {
    const pathways = new Set(unifiedTickets.map(t => t.pathway).filter(Boolean));
    return Array.from(pathways).sort();
  }, [unifiedTickets]);

  const handleFilterChange = (key: keyof TicketFilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getSortLabel = (sortOption: TicketSortOption) => {
    switch (sortOption) {
      case 'createdAt_desc': return 'Newest First';
      case 'createdAt_asc': return 'Oldest First';
      case 'priority_desc': return 'Priority (High to Low)';
      case 'priority_asc': return 'Priority (Low to High)';
      case 'status_asc': return 'Status (A-Z)';
      case 'status_desc': return 'Status (Z-A)';
      default: return 'Sort';
    }
  };

  const getTicketStats = () => {
    const total = unifiedTickets.length;
    const open = unifiedTickets.filter(t => ['PENDING', 'OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;
    const completed = unifiedTickets.filter(t => ['COMPLETED', 'CLOSED', 'RESOLVED'].includes(t.status)).length;
    const transfer = unifiedTickets.filter(t => t.type === 'TRANSFER').length;
    const hospital = unifiedTickets.filter(t => t.type === 'HOSPITAL').length;

    return { total, open, completed, transfer, hospital };
  };

  const stats = getTicketStats();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Stats */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Related Tickets ({stats.total})
        </Typography>
        
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip label={`${stats.open} Open`} color="warning" size="small" />
          <Chip label={`${stats.completed} Completed`} color="success" size="small" />
          <Chip label={`${stats.transfer} Transfer`} color="primary" size="small" />
          <Chip label={`${stats.hospital} Hospital`} color="secondary" size="small" />
        </Stack>
      </Box>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search tickets..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </Grid>

            {/* Filter Button */}
            <Grid item xs={6} sm={3} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                size="small"
              >
                Filters
              </Button>
            </Grid>

            {/* Sort Button */}
            <Grid item xs={6} sm={3} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SortIcon />}
                onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                size="small"
              >
                {getSortLabel(sortBy)}
              </Button>
            </Grid>

            {/* View Mode Toggle */}
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Tooltip title="Grid View">
                  <IconButton
                    size="small"
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                    onClick={() => setViewMode('grid')}
                  >
                    <GridIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="List View">
                  <IconButton
                    size="small"
                    color={viewMode === 'list' ? 'primary' : 'default'}
                    onClick={() => setViewMode('list')}
                  >
                    <ListIcon />
                  </IconButton>
                </Tooltip>
                {onRefresh && (
                  <Tooltip title="Refresh">
                    <IconButton size="small" onClick={onRefresh}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Active Filters */}
          {(filters.status?.length || filters.priority?.length || filters.type?.length || filters.pathway?.length) && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Active Filters:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {filters.status?.map(status => (
                  <Chip
                    key={status}
                    label={`Status: ${status}`}
                    size="small"
                    onDelete={() => handleFilterChange('status', filters.status?.filter(s => s !== status))}
                  />
                ))}
                {filters.priority?.map(priority => (
                  <Chip
                    key={priority}
                    label={`Priority: ${priority}`}
                    size="small"
                    onDelete={() => handleFilterChange('priority', filters.priority?.filter(p => p !== priority))}
                  />
                ))}
                {filters.type?.map(type => (
                  <Chip
                    key={type}
                    label={`Type: ${type}`}
                    size="small"
                    onDelete={() => handleFilterChange('type', filters.type?.filter(t => t !== type))}
                  />
                ))}
                {filters.pathway?.map(pathway => (
                  <Chip
                    key={pathway}
                    label={`Pathway: ${pathway}`}
                    size="small"
                    onDelete={() => handleFilterChange('pathway', filters.pathway?.filter(p => p !== pathway))}
                  />
                ))}
                <Button size="small" onClick={clearFilters}>
                  Clear All
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle2" gutterBottom>Status</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              multiple
              value={filters.status || []}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              label="Status"
            >
              {statusOptions.map(status => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" gutterBottom>Priority</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              multiple
              value={filters.priority || []}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              label="Priority"
            >
              {priorityOptions.map(priority => (
                <MenuItem key={priority} value={priority}>{priority}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" gutterBottom>Type</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              multiple
              value={filters.type || []}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              label="Type"
            >
              <MenuItem value="TRANSFER">Transfer</MenuItem>
              <MenuItem value="HOSPITAL">Hospital</MenuItem>
            </Select>
          </FormControl>

          {pathwayOptions.length > 0 && (
            <>
              <Typography variant="subtitle2" gutterBottom>Pathway</Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Pathway</InputLabel>
                <Select
                  multiple
                  value={filters.pathway || []}
                  onChange={(e) => handleFilterChange('pathway', e.target.value)}
                  label="Pathway"
                >
                  {pathwayOptions.map(pathway => (
                    <MenuItem key={pathway} value={pathway}>{pathway}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </Box>
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        {[
          'createdAt_desc',
          'createdAt_asc',
          'priority_desc',
          'priority_asc',
          'status_asc',
          'status_desc',
        ].map(sortOption => (
          <MenuItem
            key={sortOption}
            onClick={() => {
              setSortBy(sortOption as TicketSortOption);
              setSortMenuAnchor(null);
            }}
          >
            <ListItemText>{getSortLabel(sortOption as TicketSortOption)}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Tickets Display */}
      {filteredAndSortedTickets.length === 0 ? (
        <Alert severity="info">
          {unifiedTickets.length === 0 
            ? 'No tickets found for this hospital.'
            : 'No tickets match the current filters.'
          }
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {filteredAndSortedTickets.map((ticket) => (
            <Grid item xs={12} sm={6} md={4} key={ticket.id}>
              <TicketCard
                ticket={ticket}
                onView={onViewTicket}
                onEdit={onEditTicket}
                showActions={true}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default RelatedTicketsManager;
