import React from 'react';
import { Chip } from '@mui/material';
import { SupportTicketStatus } from '../../../services/supportService';

interface TicketStatusBadgeProps {
  status: SupportTicketStatus;
}

const statusColors: Record<SupportTicketStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  OPEN: 'error',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const statusLabels: Record<SupportTicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const TicketStatusBadge: React.FC<TicketStatusBadgeProps> = ({ status }) => {
  return (
    <Chip
      label={statusLabels[status]}
      color={statusColors[status]}
      size="small"
    />
  );
};

