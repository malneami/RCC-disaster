import React from 'react';
import {
  Box,
  Typography,
  alpha,
} from '@mui/material';
import {
  ConfirmationNumber,
  Inbox,
} from '@mui/icons-material';
import { Ticket } from '../../../../services/patientService';
import TicketCard from './TicketCard';

interface PatientTicketsTabProps {
  tickets: Ticket[];
  onViewTicket: (ticketId: string) => void;
}

const PatientTicketsTab: React.FC<PatientTicketsTabProps> = ({ tickets, onViewTicket }) => {
  const cardColor = '#42a5f5';

  return (
    <Box>
      {/* Header Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(cardColor, 0.1)} 0%, ${alpha(cardColor, 0.05)} 100%)`,
          borderRadius: '16px',
          border: `1px solid ${alpha(cardColor, 0.2)}`,
          padding: '18px 24px',
          marginBottom: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${cardColor} 0%, ${alpha(cardColor, 0.8)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 8px ${alpha(cardColor, 0.3)}`,
            }}
          >
            <ConfirmationNumber sx={{ color: '#ffffff', fontSize: '24px' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.1rem' }}>
              Patient Tickets
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.25 }}>
              {tickets?.length || 0} ticket{tickets?.length !== 1 ? 's' : ''} found
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tickets List */}
      {tickets && tickets.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {tickets.map((ticket: Ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onView={onViewTicket}
            />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            background: '#ffffff',
            borderRadius: '16px',
            border: `1px solid ${alpha(cardColor, 0.2)}`,
            padding: '60px 24px',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(cardColor, 0.1)} 0%, ${alpha(cardColor, 0.05)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Inbox sx={{ color: cardColor, fontSize: '40px' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
            No Tickets Found
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            This patient has no tickets associated
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PatientTicketsTab;
