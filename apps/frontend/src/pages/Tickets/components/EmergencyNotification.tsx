import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Alert,
} from '@mui/material';
import {
  Warning as EmergencyIcon,
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Ticket } from '../../../services/ticketService';
import { parseJsonObject } from '../../../utils/jsonUtils';

interface EmergencyNotificationProps {
  ticket: Ticket;
  onClose: () => void;
}

const EmergencyNotification: React.FC<EmergencyNotificationProps> = ({
  ticket,
  onClose,
}) => {
  // Auto-close after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 30000);

    return () => clearTimeout(timer);
  }, [onClose]);

  // Play emergency sound (if browser supports it)
  useEffect(() => {
    // In a real application, you might want to play an emergency sound
    // const audio = new Audio('/emergency-sound.mp3');
    // audio.play().catch(() => {}); // Ignore errors if audio can't play
  }, []);

  return (
    <Dialog
      open={true}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          border: '3px solid #d32f2f',
          animation: 'pulse 2s infinite',
        },
      }}
    >
      <DialogTitle sx={{ backgroundColor: '#d32f2f', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmergencyIcon />
          <Typography variant="h6">EMERGENCY TICKET ALERT</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>Emergency patient transfer request requires immediate attention!</strong>
        </Alert>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            Ticket: {ticket.ticketNumber}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label="EMERGENCY"
              color="error"
              icon={<EmergencyIcon />}
            />
            <Chip
              label={ticket.priority}
              color="error"
              variant="outlined"
            />
            <Chip
              label={ticket.pathway}
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Patient Information
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonIcon color="action" />
              <Typography>
                <strong>Name:</strong> {ticket.patient.firstName} {ticket.patient.lastName}
                {ticket.patient.mrn && ` (MRN: ${ticket.patient.mrn})`}
              </Typography>
            </Box>
            <Typography>
              <strong>Chief Complaint:</strong> {ticket.chiefComplaint}
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Transfer Details
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <HospitalIcon color="action" />
              <Typography>
                <strong>From:</strong> {ticket.originHospital.name}
              </Typography>
            </Box>
            {ticket.destinationHospital && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <HospitalIcon color="action" />
                <Typography>
                  <strong>To:</strong> {ticket.destinationHospital.name}
                </Typography>
              </Box>
            )}
            {ticket.estimatedArrival && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon color="action" />
                <Typography>
                  <strong>ETA:</strong> {new Date(ticket.estimatedArrival).toLocaleString()}
                </Typography>
              </Box>
            )}
          </Box>

          {ticket.notes && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Additional Notes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {ticket.notes}
              </Typography>
            </Box>
          )}

          <Box>
            <Typography variant="h6" gutterBottom>
              Required Resources
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {ticket.requiredResources && (() => {
                const resources = parseJsonObject(ticket.requiredResources);
                return (
                  <>
                    {resources.icu && (
                      <Chip label="ICU" color="warning" size="small" />
                    )}
                    {resources.ventilator && (
                      <Chip label="Ventilator" color="warning" size="small" />
                    )}
                    {resources.cardiology && (
                      <Chip label="Cardiology" color="warning" size="small" />
                    )}
                    {resources.neurology && (
                      <Chip label="Neurology" color="warning" size="small" />
                    )}
                    {resources.trauma && (
                      <Chip label="Trauma" color="warning" size="small" />
                    )}
                  </>
                );
              })()}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Acknowledge
        </Button>
        <Button
          onClick={() => {
            // Navigate to ticket details
            window.open(`/tickets/${ticket.id}`, '_blank');
            onClose();
          }}
          variant="contained"
          color="error"
        >
          View Details
        </Button>
      </DialogActions>

      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(211, 47, 47, 0); }
            100% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
          }
        `}
      </style>
    </Dialog>
  );
};

export default EmergencyNotification;
