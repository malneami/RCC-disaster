import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Fab,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { ticketService, Ticket, TicketStatistics, TicketFilter } from '../../services/ticketService';
import { webSocketService, TicketUpdateEvent, EmergencyTicketEvent } from '../../services/webSocketService';
import { useAuth } from '../../contexts/AuthContext';
import TicketList from './components/TicketList';
import TicketStatisticsCards from './components/TicketStatisticsCards';
import TicketFilters from './components/TicketFilters';
import CreateTicketDialog from './components/CreateTicketDialog';
import EmergencyNotification from './components/EmergencyNotification';
import { TicketExportService } from './services/ticketExportService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ticket-tabpanel-${index}`}
      aria-labelledby={`ticket-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statistics, setStatistics] = useState<TicketStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState<TicketFilter>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [emergencyTicket, setEmergencyTicket] = useState<Ticket | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const getEmsStatusForTab = (tab: number): string | undefined => {
    if (tab === 1) return 'EMS_CONTACT';
    if (tab === 2) return 'ASSIGNED'; 
    if (tab === 3) return 'DEPARTED';
    if (tab === 4) return 'ARRIVED';
    return undefined;
  };

  // Load tickets and statistics
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const emsStatus = getEmsStatusForTab(tabValue);
      const filtersWithTab = { ...filters };
      if (emsStatus) {
        filtersWithTab.emsStatus = emsStatus;
      } else {
        delete filtersWithTab.emsStatus;
      }
      
      const [ticketsResponse, statsResponse] = await Promise.all([
        ticketService.getTickets(1, 50, filtersWithTab),
        ticketService.getStatistics(),
      ]);

      setTickets(ticketsResponse.data);
      setStatistics(statsResponse);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setNotification({ message: 'Failed to load tickets', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters, tabValue]);

  // WebSocket setup
  useEffect(() => {
    webSocketService.connect();

    // Subscribe to ticket updates
    const handleTicketUpdate = (event: TicketUpdateEvent) => {
      setTickets(prevTickets => {
        const updatedTickets = prevTickets.map(ticket =>
          ticket.id === event.ticket.id ? event.ticket : ticket
        );
        return updatedTickets;
      });

      // Show notification for status changes
      if (event.action === 'statusChanged') {
        setNotification({
          message: `Ticket ${event.ticket.ticketNumber} status updated to ${event.ticket.status}`,
          type: 'info',
        });
      }
    };

    // Subscribe to emergency tickets
    const handleEmergencyTicket = (event: EmergencyTicketEvent) => {
      setEmergencyTicket(event.ticket);
      setNotification({
        message: `Emergency ticket created: ${event.ticket.ticketNumber}`,
        type: 'error',
      });
    };

    // Subscribe based on user role and hospital
    if (user?.hospitalId) {
      webSocketService.subscribeToHospitalTickets(user.hospitalId, handleTicketUpdate);
    }

    if (user?.role === 'EMS' || user?.role === 'CATH_LAB_USER') {
      webSocketService.subscribeToAssignedTickets(handleTicketUpdate);
    }

    webSocketService.onEmergencyTicket(handleEmergencyTicket);

    // Listen for EMS assignment changes to refresh tickets
    const handleEMSAssignmentChanged = () => {
      loadData();
    };
    window.addEventListener('ems-assignment-changed', handleEMSAssignmentChanged);

    return () => {
      webSocketService.unsubscribe('ticketUpdated');
      webSocketService.unsubscribe('emergencyTicket');
      window.removeEventListener('ems-assignment-changed', handleEMSAssignmentChanged);
    };
  }, [user, loadData]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [filters]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (newFilters: TicketFilter) => {
    setFilters(newFilters);
  };

  const handleCreateTicket = async (ticketData: any) => {
    try {
      await ticketService.createTicket(ticketData);
      setCreateDialogOpen(false);
      setNotification({ message: 'Ticket created successfully', type: 'success' });
      loadData(); // Refresh the list
    } catch (error) {
      console.error('Error creating ticket:', error);
      setNotification({ message: 'Failed to create ticket', type: 'error' });
    }
  };

  const handleStatusUpdate = async (ticketId: string, status: string, notes?: string) => {
    try {
      await ticketService.updateEMSStatus(ticketId, status as any, notes);
      setNotification({ message: 'EMS assignment status updated successfully', type: 'success' });
      loadData(); // Refresh the list
    } catch (error) {
      console.error('Error updating EMS status:', error);
      setNotification({ message: 'Failed to update EMS assignment status', type: 'error' });
    }
  };

  const getFilteredTickets = () => {
    if (tabValue === 0) return tickets; // All tickets

    // Pending: Ticket status is PENDING (waiting for assignment)
    if (tabValue === 1) return tickets.filter(t => t.status === 'PENDING');

    // Assigned: Show assigned/contacted statuses only
    if (tabValue === 2) return tickets.filter(t => {
      const status = t?.emsAssignments?.[0]?.status;
      return status && ['ASSIGNED', 'EMS_CONTACT'].includes(status);
    });

    // In Transport: Show Active Mission statuses (En Route, Arrival, Pickup, Departed)
    if (tabValue === 3) return tickets.filter(t => {
      const status = t?.emsAssignments?.[0]?.status;
      return status && ['EN_ROUTE', 'EMS_ARRIVAL', 'AT_PICKUP', 'PATIENT_LOADED', 'DEPARTED'].includes(status);
    });

    // Completed: Show ARRIVED or COMPLETED tickets
    if (tabValue === 4) return tickets.filter(t => {
      const emsStatus = t?.emsAssignments?.[0]?.status;
      return emsStatus === 'ARRIVED' || t.status === 'COMPLETED';
    });

    return tickets;
  };


  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);
      const exportFilters: TicketFilter & { emsStatus?: string } = {};
      
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'sortBy' || key === 'sortOrder') {
          return;
        }
        
        if (key === 'search') {
          if (value && typeof value === 'string' && value.trim()) {
            exportFilters[key as keyof TicketFilter] = value.trim() as any;
          }
        } else if (value !== undefined && value !== null && value !== '') {
          exportFilters[key as keyof TicketFilter] = value as any;
        }
      });
      
      const emsStatus = getEmsStatusForTab(tabValue);
      if (emsStatus) {
        exportFilters.emsStatus = emsStatus;
      }
      
      await TicketExportService.exportToExcel(exportFilters);
      setNotification({ message: 'Tickets exported successfully', type: 'success' });
    } catch (error) {
      console.error('Export failed:', error);
      setNotification({ message: 'Failed to export tickets to Excel', type: 'error' });
    } finally {
      setExportLoading(false);
    }
  };

  const canCreateTicket = ['ADMIN', 'RCC', 'DATA_COLLECTOR', 'CATH_LAB_USER'].includes(user?.role || '');

  return (
    <>
      <Helmet>
        <title>Transfer Tickets - RCC Healthcare Platform</title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Transfer Tickets
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage patient transfer requests across the healthcare network
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Refresh">
              <span>
                <IconButton onClick={loadData} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Filters">
              <IconButton onClick={() => setShowFilters(!showFilters)}>
                <FilterIcon />
              </IconButton>
            </Tooltip>

            {canCreateTicket && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create Ticket
              </Button>
            )}
          </Box>
        </Box>

        {/* Statistics Cards */}
        {statistics && (
          <Box sx={{ mb: 3 }}>
            <TicketStatisticsCards statistics={statistics} />
          </Box>
        )}

        {/* Filters */}
        {showFilters && (
          <Paper sx={{ mb: 3, p: 2 }}>
            <TicketFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClose={() => setShowFilters(false)}
            />
          </Paper>
        )}

        {/* Tabs */}
        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="ticket tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="All Tickets" />
            <Tab
              label="Pending"
              icon={<Chip size="small" label={statistics?.pending || 0} color="warning" />}
              iconPosition="end"
            />
            <Tab
              label="Assigned"
              icon={<Chip size="small" label={statistics?.assigned || 0} color="info" />}
              iconPosition="end"
            />
            <Tab
              label="In Transport"
              icon={<Chip size="small" label={statistics?.inTransport || 0} color="primary" />}
              iconPosition="end"
            />
            <Tab
              label="Completed"
              icon={<Chip size="small" label={statistics?.completed || 0} color="success" />}
              iconPosition="end"
            />
          </Tabs>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            <TicketList
              tickets={getFilteredTickets()}
              loading={loading}
              onStatusUpdate={handleStatusUpdate}
              userRole={user?.role}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TicketList
              tickets={getFilteredTickets()}
              loading={loading}
              onStatusUpdate={handleStatusUpdate}
              userRole={user?.role}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <TicketList
              tickets={getFilteredTickets()}
              loading={loading}
              onStatusUpdate={handleStatusUpdate}
              userRole={user?.role}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <TicketList
              tickets={getFilteredTickets()}
              loading={loading}
              onStatusUpdate={handleStatusUpdate}
              userRole={user?.role}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <TicketList
              tickets={getFilteredTickets()}
              loading={loading}
              onStatusUpdate={handleStatusUpdate}
              userRole={user?.role}
            />
          </TabPanel>
        </Paper>

        {/* Create Ticket Dialog */}
        <CreateTicketDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreateTicket}
        />

        {/* Emergency Notification */}
        {emergencyTicket && (
          <EmergencyNotification
            ticket={emergencyTicket}
            onClose={() => setEmergencyTicket(null)}
          />
        )}

        {/* General Notifications */}
        <Snackbar
          open={!!notification}
          autoHideDuration={6000}
          onClose={() => setNotification(null)}
        >
          <Alert
            onClose={() => setNotification(null)}
            severity={notification?.type}
            sx={{ width: '100%' }}
          >
            {notification?.message}
          </Alert>
        </Snackbar>

        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <Tooltip title="Export to Excel" placement="left">
            <Fab
              color="secondary"
              aria-label="export to excel"
              onClick={handleExportToExcel}
              disabled={exportLoading || loading}
              sx={{ width: 56, height: 56 }}
            >
              {exportLoading ? <CircularProgress size={24} color="inherit" /> : <FileDownloadIcon />}
            </Fab>
          </Tooltip>
        </Box>
      </Box>
    </>
  );
};

export default TicketsPage;