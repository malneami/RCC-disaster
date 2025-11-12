import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Alert,
  Skeleton,
  Container,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketService, Ticket } from '../../services/ticketService';
import { useAuth } from '../../contexts/AuthContext';
import UpdateStatusModal from './components/UpdateStatusModal';
import TicketEditModal from './components/TicketEditModal';
import TicketDetailsTab from './components/TicketDetailsTab';
import GenericPageHeader from '../../components/Common/GenericPageHeader';
import GenericTabs from '../../components/Common/GenericTabs';
import AccessLogsTab from '../../components/Common/AccessLogsTab';

const TicketViewPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      const ticketData = await ticketService.getTicketById(ticketId!);
      setTicket(ticketData);
    } catch (err) {
      console.error('Error loading ticket:', err);
      setError('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string, notes?: string) => {
    if (!ticket) return;

    try {
      await ticketService.updateTicketStatus(ticket.id, status as any, notes);
      await loadTicket(); // Reload ticket to get updated data
      setUpdateStatusModalOpen(false);
    } catch (err) {
      console.error('Error updating ticket status:', err);
      setError('Failed to update ticket status');
    }
  };

  const handleTicketEdit = async (data: any) => {
    if (!ticket) return;

    try {
      await ticketService.updateTicket(ticket.id, data);
      await loadTicket(); // Reload ticket to get updated data
      setEditModalOpen(false);
    } catch (err) {
      console.error('Error updating ticket:', err);
      setError('Failed to update ticket');
    }
  };

  const handleViewPatient = () => {
    if (ticket?.patientId) {
      navigate(`/patients/${ticket.patientId}`);
    }
  };


  const canUpdateStatus = () => {
    if (!ticket || !user) return false;
    if (user.role === 'ADMIN' || user.role === 'RCC') return true;
    if (user.role === 'EMS' && ticket.assignedToId) return true;
    if (user.role === 'CATH_LAB_USER' && ticket.pathway === 'STEMI') return true;
    return false;
  };

  const canEditTicket = () => {
    if (!ticket || !user) return false;
    if (user.role === 'ADMIN' || user.role === 'RCC') return true;
    if (user.role === 'DATA_COLLECTOR') return true;
    return false;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error || !ticket) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Ticket not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/tickets')}
        >
          Back to Tickets
        </Button>
      </Box>
    );
  }

  // Define tabs configuration
  const tabsConfig = [
    {
      label: 'Details',
      content: <TicketDetailsTab ticket={ticket} onViewPatient={handleViewPatient} />,
      icon: <ViewIcon />,
    },
    ...(isAdmin
      ? [
          {
            label: 'Access Logs',
            content: (
              <AccessLogsTab
                entityId={ticket.id}
                entityType="ticket"
                fetchLogs={ticketService.getAccessLogs.bind(ticketService)}
                entityLabel={`Ticket ${ticket.ticketNumber} Access Logs`}
              />
            ),
            icon: <SecurityIcon />,
          },
        ]
      : []),
  ];

  return (
    <>
      <Helmet>
        <title>{ticket.ticketNumber} - Transfer Ticket - RCC Healthcare Platform</title>
      </Helmet>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <GenericPageHeader
          title={`Ticket ${ticket.ticketNumber}`}
          subtitle={`Patient: ${ticket.patient.firstName} ${ticket.patient.lastName}`}
          actions={[
            {
              icon: <ArrowBackIcon />,
              tooltip: 'Back to Tickets',
              onClick: () => navigate('/tickets'),
              color: 'primary',
              isFab: false,
            },
            ...(canUpdateStatus()
              ? [
                  {
                    icon: <EditIcon />,
                    tooltip: 'Update Status',
                    onClick: () => setUpdateStatusModalOpen(true),
                    color: 'primary' as const,
                    isFab: false,
                  },
                ]
              : []),
            ...(canEditTicket()
              ? [
                  {
                    icon: <EditIcon />,
                    tooltip: 'Edit Ticket',
                    onClick: () => setEditModalOpen(true),
                    color: 'secondary' as const,
                    isFab: false,
                  },
                ]
              : []),
          ]}
        />

        {/* Tabs */}
        <GenericTabs
          tabs={tabsConfig}
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
        />

        {/* Update Status Modal */}
        <UpdateStatusModal
          open={updateStatusModalOpen}
          onClose={() => setUpdateStatusModalOpen(false)}
          onSubmit={handleStatusUpdate}
          currentStatus={ticket.status}
        />

        {/* Edit Ticket Modal */}
        <TicketEditModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleTicketEdit}
          ticket={ticket}
        />
      </Container>
    </>
  );
};

export default TicketViewPage;
