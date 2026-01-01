import React from 'react';
import { Card, CardContent } from '@mui/material';
import { UnifiedTicket } from '../types/tickets';
import { TicketCardHeader } from './ticket-card/TicketCardHeader';
import { TicketCardContent } from './ticket-card/TicketCardContent';

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
        <TicketCardHeader
          ticket={ticket}
          onView={onView}
          onEdit={onEdit}
          showActions={showActions}
        />
        <TicketCardContent ticket={ticket} />
      </CardContent>
    </Card>
  );
};

export default TicketCard;
