import React from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Visibility,
  LocalHospital,
  LocationOn,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { Ticket } from '../../../../services/patientService';
import {
  getTicketPriorityColor,
  getTicketPriorityGradient,
  getTicketPriorityIcon,
  getTicketPriorityLabel,
  getTicketStatusColor,
  getTicketStatusIcon,
  getTicketStatusLabel,
} from '../../utils/ticketUtils';

interface TicketCardProps {
  ticket: Ticket;
  onView: (ticketId: string) => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onView }) => {
  const priorityColor = getTicketPriorityColor(ticket.priority);
  const statusColor = getTicketStatusColor(ticket.status);
  const priorityIcon = getTicketPriorityIcon(ticket.priority);
  const statusIcon = getTicketStatusIcon(ticket.status);
  const priorityLabel = getTicketPriorityLabel(ticket.priority);
  const statusLabel = getTicketStatusLabel(ticket.status);

  const ticketDate = new Date(ticket.createdAt);
  const formattedDate = format(ticketDate, 'MMM d, yyyy');
  const relativeDate = formatDistanceToNow(ticketDate, { addSuffix: true });

  return (
    <Box
      sx={{
        background: '#ffffff',
        borderRadius: '12px',
        borderLeft: `4px solid ${priorityColor}`,
        border: `1px solid ${alpha(priorityColor, 0.2)}`,
        borderLeftWidth: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '16px 20px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          borderColor: alpha(priorityColor, 0.35),
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* Priority Icon Badge */}
        <Box
          sx={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: getTicketPriorityGradient(ticket.priority),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 8px ${alpha(priorityColor, 0.3)}`,
            flexShrink: 0,
          }}
        >
          <Box sx={{ color: '#ffffff' ,
            marginTop: '7px',
          }}>{priorityIcon}</Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: '16px',
                  color: 'text.primary',
                  mb: 0.5,
                  lineHeight: 1.3,
                }}
              >
                {ticket.ticketNumber}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <Chip
                  label={priorityLabel}
                  size="small"
                  sx={{
                    background: getTicketPriorityGradient(ticket.priority),
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: '22px',
                    boxShadow: `0 2px 8px ${alpha(priorityColor, 0.3)}`,
                  }}
                />
                <Chip
                  label={statusLabel}
                  size="small"
                  icon={statusIcon}
                  sx={{
                    backgroundColor: alpha(statusColor, 0.1),
                    color: statusColor,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: '22px',
                    '& .MuiChip-icon': {
                      color: statusColor,
                      fontSize: '14px',
                    },
                  }}
                />
              </Box>
            </Box>
            <Tooltip title="View Ticket">
              <IconButton
                size="small"
                onClick={() => onView(ticket.id)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: alpha(priorityColor, 0.1),
                    color: priorityColor,
                  },
                }}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Hospital Information */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn sx={{ fontSize: '16px', color: priorityColor }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', fontWeight: 500 }}>
                Origin:
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.85rem', fontWeight: 600 }}>
                {ticket.originHospital?.name || 'N/A'}
              </Typography>
            </Box>
            {ticket.destinationHospital && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalHospital sx={{ fontSize: '16px', color: priorityColor }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', fontWeight: 500 }}>
                  Destination:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.85rem', fontWeight: 600 }}>
                  {ticket.destinationHospital.name}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Date Information */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '14px',
              }}
            >
              {formattedDate}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '12px',
              }}
            >
              ({relativeDate})
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TicketCard;

