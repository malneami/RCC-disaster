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
  alpha,
} from '@mui/material';
import {
  Assignment as TicketIcon,
  Timeline as TransferIcon,
  Person as PatientIcon,
  LocalHospital as HospitalIcon,
  AccessTime as TimeIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Warning as EmergencyIcon,
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
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
      case 'EMERGENCY':
        return { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' };
      case 'HIGH':
        return { bg: '#FEF3C7', color: '#D97706', border: '#FCD34D' };
      case 'MEDIUM':
        return { bg: '#E0F2FE', color: '#0284C7', border: '#7DD3FC' };
      case 'LOW':
        return { bg: '#D1FAE5', color: '#059669', border: '#6EE7B7' };
      default:
        return { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' };
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'OPEN':
        return { bg: '#FEE2E2', color: '#DC2626' };
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return { bg: '#FEF3C7', color: '#D97706' };
      case 'COMPLETED':
      case 'CLOSED':
      case 'RESOLVED':
        return { bg: '#D1FAE5', color: '#059669' };
      case 'CANCELLED':
        return { bg: '#F1F5F9', color: '#64748B' };
      default:
        return { bg: '#F1F5F9', color: '#64748B' };
    }
  };

  const getTicketIcon = () => {
    if (ticket.type === 'TRANSFER') {
      return <TransferIcon sx={{ color: '#0284C7', fontSize: 24 }} />;
    }
    return <TicketIcon sx={{ color: '#7C3AED', fontSize: 24 }} />;
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

  const priorityStyles = getPriorityStyles(ticket.priority);
  const statusStyles = getStatusStyles(ticket.status);

  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        backgroundColor: '#FFFFFF',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(2, 132, 199, 0.12)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                backgroundColor: ticket.type === 'TRANSFER' ? alpha('#0284C7', 0.1) : alpha('#7C3AED', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getTicketIcon()}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: '#0F172A',
                  mb: 0.5,
                  lineHeight: 1.3,
                }}
              >
                {ticket.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: '#64748B', fontWeight: 500 }}
              >
                {ticket.type === 'TRANSFER' ? ticket.ticketNumber : `#${ticket.id.slice(-8)}`}
              </Typography>
            </Box>
          </Box>

          {showActions && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {onView && (
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={() => onView(ticket)}
                    sx={{
                      backgroundColor: alpha('#0284C7', 0.1),
                      '&:hover': { backgroundColor: alpha('#0284C7', 0.2) },
                    }}
                  >
                    <ViewIcon fontSize="small" sx={{ color: '#0284C7' }} />
                  </IconButton>
                </Tooltip>
              )}
              {onEdit && (
                <Tooltip title="Edit Ticket">
                  <IconButton
                    size="small"
                    onClick={() => onEdit(ticket)}
                    sx={{
                      backgroundColor: alpha('#7C3AED', 0.1),
                      '&:hover': { backgroundColor: alpha('#7C3AED', 0.2) },
                    }}
                  >
                    <EditIcon fontSize="small" sx={{ color: '#7C3AED' }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>

        {/* Status and Priority Chips */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
          <Chip
            label={ticket.priority}
            size="small"
            sx={{
              backgroundColor: priorityStyles.bg,
              color: priorityStyles.color,
              fontWeight: 600,
              borderRadius: '8px',
              border: `1px solid ${priorityStyles.border}`,
            }}
          />
          <Chip
            label={ticket.status}
            size="small"
            sx={{
              backgroundColor: statusStyles.bg,
              color: statusStyles.color,
              fontWeight: 600,
              borderRadius: '8px',
            }}
          />
          {ticket.emsAssignmentStatus && (
            <Chip
              label={getEMSStatusInfo(ticket.emsAssignmentStatus).displayName}
              size="small"
              sx={{
                backgroundColor: getEMSStatusColor(ticket.emsAssignmentStatus),
                color: 'white',
                fontWeight: 600,
                borderRadius: '8px',
              }}
            />
          )}
          {ticket.isEmergency && (
            <Chip
              label="Life Saving"
              size="small"
              sx={{
                backgroundColor: '#DC2626',
                color: 'white',
                fontWeight: 600,
                borderRadius: '8px',
              }}
              icon={<EmergencyIcon sx={{ color: 'white !important', fontSize: 16 }} />}
            />
          )}
          <Chip
            label={ticket.type}
            size="small"
            sx={{
              backgroundColor: ticket.type === 'TRANSFER' ? '#E0F2FE' : '#F3E8FF',
              color: ticket.type === 'TRANSFER' ? '#0284C7' : '#7C3AED',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          />
        </Stack>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: '#475569',
            mb: 2,
            lineHeight: 1.6,
          }}
        >
          {ticket.description}
        </Typography>

        <Divider sx={{ my: 2, borderColor: '#E2E8F0' }} />

        {/* Location & Time Section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HospitalIcon sx={{ fontSize: 18, color: '#0284C7' }} />
            <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
              {getLocationInfo()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimeIcon sx={{ fontSize: 18, color: '#0284C7' }} />
            <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
              {getTimeInfo()}
            </Typography>
          </Box>
        </Box>

        {/* Patient Information (for transfer tickets) */}
        {ticket.type === 'TRANSFER' && ticket.patient && (
          <>
            <Divider sx={{ my: 2, borderColor: '#E2E8F0' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PatientIcon sx={{ fontSize: 18, color: '#10B981' }} />
              <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                Patient: {ticket.patient.firstName} {ticket.patient.lastName}
                {ticket.patient.mrn && ` (MRN: ${ticket.patient.mrn})`}
              </Typography>
            </Box>
          </>
        )}

        {/* Pathway Information (for transfer tickets) */}
        {ticket.type === 'TRANSFER' && ticket.pathway && (
          <Box sx={{ mt: 2 }}>
            <Chip
              label={ticket.pathway}
              size="small"
              sx={{
                backgroundColor: ticket.pathway === 'STEMI' ? '#FEE2E2' :
                  ticket.pathway === 'STROKE' ? '#F3E8FF' : '#FEF3C7',
                color: ticket.pathway === 'STEMI' ? '#DC2626' :
                  ticket.pathway === 'STROKE' ? '#7C3AED' : '#D97706',
                fontWeight: 700,
                borderRadius: '8px',
                fontSize: '0.75rem',
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketCard;
