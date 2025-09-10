import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ticketService } from '../../services/ticketService';
import { getEMSStatusInfo, getEMSStatusColor } from '../../utils/emsStatusUtils';
import EMSStatusUpdater from '../../components/Common/EMSStatusUpdater';

const EMSStatusDemo: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ticketService.getTickets(1, 10);
      setTickets(data.data || []);
    } catch (err: any) {
      setError('Failed to load tickets');
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (updatedTicket: any) => {
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      )
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        EMS Status Update Demo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        This demo shows how EMS status updates immediately sync with ticket status.
        Click "Update EMS Status" to see the real-time synchronization.
      </Typography>

      <Grid container spacing={3}>
        {tickets.map((ticket) => (
          <Grid item xs={12} md={6} key={ticket.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ticket #{ticket.ticketNumber}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Patient: {ticket.patient?.firstName} {ticket.patient?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pathway: {ticket.pathway}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Priority: {ticket.priority}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Ticket: ${ticket.status}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  
                  {ticket.emsAssignmentStatus && (
                    <Chip
                      label={getEMSStatusInfo(ticket.emsAssignmentStatus).displayName}
                      size="small"
                      sx={{
                        backgroundColor: getEMSStatusColor(ticket.emsAssignmentStatus),
                        color: 'white',
                        fontWeight: 500,
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Created: {new Date(ticket.createdAt).toLocaleString()}
                  </Typography>
                  
                  <EMSStatusUpdater
                    ticketId={ticket.id}
                    currentEMSStatus={ticket.emsAssignmentStatus}
                    currentTicketStatus={ticket.status}
                    onStatusUpdate={handleStatusUpdate}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {tickets.length === 0 && (
        <Alert severity="info">
          No tickets found. Create some tickets to test the EMS status update functionality.
        </Alert>
      )}
    </Box>
  );
};

export default EMSStatusDemo;

