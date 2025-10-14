import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Assignment as TicketIcon,
  Timeline as TransferIcon,
  Person as PatientIcon,
  LocalHospital as HospitalIcon,
  AccessTime as TimeIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { UnifiedTicket } from '../types/tickets';
import { getEMSStatusInfo, getEMSStatusColor } from '../../../utils/emsStatusUtils';

interface TicketCardProps {
  ticket: UnifiedTicket;
  onView?: (ticket: UnifiedTicket) => void;
  onEdit?: (ticket: UnifiedTicket) => void;
  showActions?: boolean;
}

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onView,
  onEdit,
  showActions = true,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
      case 'EMERGENCY':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'OPEN':
        return 'error';
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return 'warning';
      case 'COMPLETED':
      case 'CLOSED':
      case 'RESOLVED':
        return 'success';
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTicketIcon = () => {
    if (ticket.type === 'TRANSFER') {
      return <TransferIcon color="primary" />;
    }
    return <TicketIcon color="primary" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeInfo = () => {
    if (ticket.type === 'TRANSFER') {
      if (ticket.emsContactTime) {
        return `EMS Contact: ${formatDate(ticket.emsContactTime)}`;
      }
      return `Created: ${formatDate(ticket.createdAt)}`;
    }
    return `Updated: ${formatDate(ticket.updatedAt)}`;
  };

  const getLocationInfo = () => {
    if (ticket.type === 'TRANSFER') {
      const origin = ticket.originHospital?.name || 'Unknown origin';
      const destination = ticket.destinationHospital?.name || 'Unknown destination';
      return `From: ${origin} → To: ${destination}`;
    }
    return ticket.hospitalId ? 'Internal Hospital Ticket' : 'Hospital ticket';
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        border: '1px solid rgba(0,0,0,0.08)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {getTicketIcon()}
            <Box sx={{ ml: 1, flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {ticket.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {ticket.type === 'TRANSFER' ? ticket.ticketNumber : `#${ticket.id.slice(-8)}`}
              </Typography>
            </Box>
          </Box>
          
          {showActions && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {onView && (
                <Tooltip title="View Details">
                  <IconButton size="small" onClick={() => onView(ticket)}>
                    <ViewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onEdit && (
                <Tooltip title="Edit Ticket">
                  <IconButton size="small" onClick={() => onEdit(ticket)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>

        {/* Status and Priority Chips */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            label={ticket.priority}
            size="small"
            color={getPriorityColor(ticket.priority) as any}
            variant="outlined"
          />
          <Chip
            label={ticket.status}
            size="small"
            color={getStatusColor(ticket.status) as any}
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
          <Chip
            label={ticket.type}
            size="small"
            variant="outlined"
            color="primary"
          />
        </Stack>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {ticket.description}
        </Typography>

        <Divider sx={{ my: 1 }} />

        {/* Additional Information */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HospitalIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {getLocationInfo()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimeIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {getTimeInfo()}
            </Typography>
          </Box>
        </Box>

        {/* Patient Information (for transfer tickets) */}
        {ticket.type === 'TRANSFER' && ticket.patient && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PatientIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Patient: {ticket.patient.firstName} {ticket.patient.lastName}
                {ticket.patient.mrn && ` (MRN: ${ticket.patient.mrn})`}
              </Typography>
            </Box>
          </>
        )}

        {/* Pathway Information (for transfer tickets) */}
        {ticket.type === 'TRANSFER' && ticket.pathway && (
          <Box sx={{ mt: 1 }}>
            <Chip
              label={ticket.pathway}
              size="small"
              variant="outlined"
              color="secondary"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketCard;
