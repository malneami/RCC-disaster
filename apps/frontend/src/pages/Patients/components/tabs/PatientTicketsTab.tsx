import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Ticket } from '../../../services/patientService';

interface PatientTicketsTabProps {
  tickets: Ticket[];
  onViewTicket: (ticketId: string) => void;
}

const PatientTicketsTab: React.FC<PatientTicketsTabProps> = ({ tickets, onViewTicket }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY': return 'error';
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_TRANSPORT': return 'warning';
      case 'ASSIGNED': return 'info';
      case 'PENDING': return 'default';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader title="Patient Tickets" />
      <CardContent>
        {tickets && tickets.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ticket #</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Origin</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.map((ticket: Ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{ticket.ticketNumber}</TableCell>
                    <TableCell>
                      <Chip 
                        label={ticket.status} 
                        color={getStatusColor(ticket.status) as any}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ticket.priority} 
                        color={getPriorityColor(ticket.priority) as any}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{ticket.originHospital?.name}</TableCell>
                    <TableCell>{ticket.destinationHospital?.name || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(ticket.createdAt), 'PP')}</TableCell>
                    <TableCell>
                      <Tooltip title="View Ticket">
                        <IconButton 
                          size="small"
                          onClick={() => onViewTicket(ticket.id)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No tickets found for this patient
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientTicketsTab;
