import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
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
  const [filters, setFilters] = useState<TicketFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [emergencyTicket, setEmergencyTicket] = useState<Ticket | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Load tickets and statistics
  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsResponse, statsResponse] = await Promise.all([
        ticketService.getTickets(1, 50, filters),
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
  };

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

    return () => {
      webSocketService.unsubscribe('ticketUpdated');
      webSocketService.unsubscribe('emergencyTicket');
    };
  }, [user]);

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
      await ticketService.updateTicketStatus(ticketId, status as any, notes);
      setNotification({ message: 'Ticket status updated successfully', type: 'success' });
      loadData(); // Refresh the list
    } catch (error) {
      console.error('Error updating ticket status:', error);
      setNotification({ message: 'Failed to update ticket status', type: 'error' });
    }
  };

  const handleAssignTicket = async (ticketId: string, assignedToId: string, notes?: string) => {
    try {
      await ticketService.assignTicket(ticketId, assignedToId, notes);
      setNotification({ message: 'Ticket assigned successfully', type: 'success' });
      loadData(); // Refresh the list
    } catch (error) {
      console.error('Error assigning ticket:', error);
      setNotification({ message: 'Failed to assign ticket', type: 'error' });
    }
  };

  const getFilteredTickets = () => {
    if (tabValue === 0) return tickets; // All tickets
    if (tabValue === 1) return tickets.filter(t => t.status === 'PENDING');
    if (tabValue === 2) return tickets.filter(t => t.status === 'ASSIGNED');
    if (tabValue === 3) return tickets.filter(t => t.status === 'IN_TRANSPORT');
    if (tabValue === 4) return tickets.filter(t => t.status === 'COMPLETED');
    return tickets;
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
              <IconButton onClick={loadData} disabled={loading}>
                <RefreshIcon />
              </IconButton>
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
              onAssign={handleAssignTicket}
              userRole={user?.role}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <TicketList
              tickets={getFilteredTickets()}
              loading={loading}
              onStatusUpdate={handleStatusUpdate}
              onAssign={handleAssignTicket}
              userRole={user?.role}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <TicketList
              tickets={getFilteredTickets()}
              loading={loading}
              onStatusUpdate={handleStatusUpdate}
              onAssign={handleAssignTicket}
              userRole={user?.role}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <TicketList
              tickets={getFilteredTickets()}
              loading={loading}
              onStatusUpdate={handleStatusUpdate}
              onAssign={handleAssignTicket}
              userRole={user?.role}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={4}>
            <TicketList
              tickets={getFilteredTickets()}
              loading={loading}
              onStatusUpdate={handleStatusUpdate}
              onAssign={handleAssignTicket}
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
      </Box>
    </>
  );
};

export default TicketsPage;