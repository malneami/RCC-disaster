import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Warning as EmergencyIcon,
  DirectionsCar as TransportIcon,
  CheckCircle as CompletedIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Ticket } from '../../../services/ticketService';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import UpdateStatusModal from './UpdateStatusModal';
import { getEMSStatusInfo, getEMSStatusColor } from '../../../utils/emsStatusUtils';

interface TicketListProps {
  tickets: Ticket[];
  loading: boolean;
  onStatusUpdate: (ticketId: string, status: string, notes?: string) => void;
  userRole?: string;
}

const TicketList: React.FC<TicketListProps> = ({
  tickets,
  loading,
  onStatusUpdate,
  userRole,
}) => {
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');

  const handleStatusUpdate = (status: string, notes?: string) => {
    if (selectedTicket) {
      onStatusUpdate(selectedTicket.id, status, notes);
      setStatusDialogOpen(false);
    }
  };

  const handleViewDetails = (ticket: Ticket) => {
    navigate(`/tickets/${ticket.id}`);
  };

  const handleUpdateStatusClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setStatusDialogOpen(true);
    setCurrentStatus(ticket?.emsAssignments?.[0]?.status || 'EMS_CONTACT');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return 'error';
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ASSIGNED':
        return 'info';
      case 'IN_TRANSPORT':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ScheduleIcon />;
      case 'ASSIGNED':
        return <AssignmentIcon />;
      case 'IN_TRANSPORT':
        return <TransportIcon />;
      case 'COMPLETED':
        return <CompletedIcon />;
      case 'CANCELLED':
        return <EmergencyIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const canUpdateStatus = (ticket: Ticket) => {
    if (userRole === 'ADMIN' || userRole === 'RCC') return true;
    if (userRole === 'EMS' && ticket.assignedToId) return true;
    if (userRole === 'CATH_LAB_USER' && ticket.pathway === 'STEMI') return true;
    return false;
  };

  if (loading) {
    return (
      <Box>
        {[1, 2, 3].map((i) => (
          <Card key={i} sx={{ mb: 2 }}>
            <CardContent>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="80%" />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  if (tickets.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No tickets found matching the current filters.
      </Alert>
    );
  }

  return (
    <Box>
      {tickets.map((ticket) => (
        <Card key={ticket.id} sx={{ mb: 2, position: 'relative' }}>
          {ticket.isEmergency && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
              }}
            >
              <EmergencyIcon color="error" />
            </Box>
          )}
          
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h6" component="h3">
                    {ticket.ticketNumber}
                  </Typography>
                  <Chip
                    label={ticket.priority}
                    color={getPriorityColor(ticket.priority)}
                    size="small"
                  />
                  <Chip
                    label={ticket.status}
                    color={getStatusColor(ticket.status)}
                    icon={getStatusIcon(ticket.status)}
                    size="small"
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
                  {ticket.isEmergency && (
                    <Chip
                      label="EMERGENCY"
                      color="error"
                      size="small"
                      icon={<EmergencyIcon />}
                    />
                  )}
                </Box>

                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Patient:</strong> {ticket.patient.firstName} {ticket.patient.lastName}
                  {ticket.patient.mrn && ` (MRN: ${ticket.patient.mrn})`}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Chief Complaint:</strong> {ticket.chiefComplaint}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Pathway:</strong> {ticket.pathway}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <HospitalIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      From: {ticket.originHospital.name}
                    </Typography>
                  </Box>
                  
                  {ticket.destinationHospital && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <HospitalIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        To: {ticket.destinationHospital.name}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {ticket.assignedTo && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Assigned to: {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                    </Typography>
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary">
                  Created: {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}
                  {ticket.emsContactTime && (
                    <> | EMS Contact: {format(new Date(ticket.emsContactTime), 'MMM dd, yyyy HH:mm')}</>
                  )}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(ticket)}
                    color="primary"
                  >
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                
                {canUpdateStatus(ticket) && (
                  <Tooltip title="Update Status">
                    <IconButton
                      size="small"
                      onClick={() => handleUpdateStatusClick(ticket)}
                      color="secondary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    <UpdateStatusModal currentStatus={currentStatus} open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} onSubmit={handleStatusUpdate} />
    </Box>
  );
};

export default TicketList;
