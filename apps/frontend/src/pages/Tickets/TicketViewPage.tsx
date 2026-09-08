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
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketService, Ticket, UpdateTicketData } from '../../services/ticketService';
import { useAuth } from '../../contexts/AuthContext';
import { bedService } from '../Beds/services/bedService';
import { useSnackbar } from 'notistack';
import { useQueryClient } from 'react-query';
import UpdateStatusModal from './components/UpdateStatusModal';
import TicketEditModal from './components/TicketEditModal';
import TicketDetailsTab from './components/TicketDetailsTab';
import GenericPageHeader from '../../components/Common/GenericPageHeader';
import GenericTabs from '../../components/Common/GenericTabs';
import AccessLogsTab from '../../components/Common/AccessLogsTab';
import DeleteConfirmationDialog from '../../components/Common/DeleteConfirmationDialog';
import ActivateNeurosurgicalDialog from './components/ActivateNeurosurgicalDialog';
import { CaseType } from '@prisma/client';

const TicketViewPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  const handleTicketEdit = async (data: UpdateTicketData) => {
    if (!ticket) return;

    try {
      await ticketService.updateTicket(ticket.id, data);
      
      if (data.bedAssignment && data.bedAssignment.bedId && ticket.patientId) {
        const updatedTicket = await ticketService.getTicketById(ticket.id);
        const allCases = [
          ...(updatedTicket.traumaCases || []),
          ...(updatedTicket.strokeCases || []),
          ...(updatedTicket.stemiCases || []),
        ];
        
        if (allCases.length > 0) {
          const mostRecentCase = allCases.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          
          let caseType: CaseType | undefined;
          if ('strokeType' in mostRecentCase) {
            caseType = 'STROKE';
          } else if ('ecgResult' in mostRecentCase) {
            caseType = 'STEMI';
          } else {
            caseType = 'TRAUMA';
          }
          
          try {
            await bedService.assignBed(data.bedAssignment.bedId, {
              patientId: ticket.patientId,
              caseId: mostRecentCase.id,
              caseType: caseType,
              arrivalDate: data.bedAssignment.arrivalDate,
            });
            enqueueSnackbar('Bed assigned successfully', { variant: 'success' });
            queryClient.invalidateQueries('hospitals');
            window.dispatchEvent(new CustomEvent('hospital-capacity-changed'));
          } catch (bedError: any) {
            console.error('Error assigning bed during ticket update:', bedError);
            enqueueSnackbar(
              'Ticket updated but bed assignment failed: ' + (bedError?.response?.data?.message || bedError?.message || 'Unknown error'),
              { variant: 'warning' }
            );
          }
        }
      }
      
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

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ticket) return;

    try {
      setDeleting(true);
      const result = await ticketService.deleteTicket(ticket.id);

      enqueueSnackbar(result.message, { variant: 'success' });
      navigate('/tickets'); // Navigate back to tickets list
    } catch (error: any) {
      console.error('Error deleting ticket:', error);
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to delete ticket',
        { variant: 'error' }
      );
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
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

  const canDeleteTicket = () => {
    if (!ticket || !user) return false;
    return user.role === 'ADMIN' || user.role === 'RCC';
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
        <title>{ticket.ticketNumber} - Transfer Ticket | MASAR</title>
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
            ...(canDeleteTicket()
              ? [
                {
                  icon: <DeleteIcon />,
                  tooltip: 'Delete Ticket',
                  onClick: handleDeleteClick,
                  color: 'error' as const,
                  isFab: false,
                },
              ]
              : []),
          ]}
        />

        {!(ticket.neurosurgicalCases && ticket.neurosurgicalCases.length > 0) &&
          ['ADMIN', 'RCC', 'HOSPITAL_USER', 'ED_NURSE', 'DATA_COLLECTOR'].includes(
            (user?.role || '').toUpperCase(),
          ) && (
            <Box sx={{ mb: 2 }}>
              <ActivateNeurosurgicalDialog
                ticketId={ticket.id}
                onActivated={loadTicket}
              />
              <Button
                size="small"
                sx={{ ml: 1 }}
                onClick={() => navigate('/portals/neurosurgical')}
              >
                Open Neuro Portal
              </Button>
            </Box>
          )}

        {ticket.neurosurgicalCases && ticket.neurosurgicalCases.length > 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Neurosurgical pathway active
            {ticket.neurosurgicalCases[0].severity
              ? ` — Severity: ${ticket.neurosurgicalCases[0].severity === 'RED' ? 'Red' : 'Orange'}`
              : ''}
            .{' '}
            <Button size="small" onClick={() => navigate('/portals/neurosurgical')}>
              Open portal
            </Button>
          </Alert>
        )}

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

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Ticket"
          itemName={ticket?.ticketNumber || ''}
          itemType="ticket"
          loading={deleting}
          consequences={[
            'Delete the ticket permanently',
            'Delete all associated EMS assignments',
            'This action cannot be undone',
          ]}
        />
      </Container>
    </>
  );
};

export default TicketViewPage;
