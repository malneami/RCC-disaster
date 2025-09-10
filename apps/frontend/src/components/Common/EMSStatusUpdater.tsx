import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { ticketService } from '../../services/ticketService';
import { 
  getNextAvailableEMSStatuses, 
  getEMSStatusInfo, 
  getEMSStatusColor,
  EMSAssignmentStatus 
} from '../../utils/emsStatusUtils';

interface EMSStatusUpdaterProps {
  ticketId: string;
  currentEMSStatus: EMSAssignmentStatus | null;
  currentTicketStatus: string;
  onStatusUpdate: (updatedTicket: any) => void;
  disabled?: boolean;
}

const EMSStatusUpdater: React.FC<EMSStatusUpdaterProps> = ({
  ticketId,
  currentEMSStatus,
  currentTicketStatus,
  onStatusUpdate,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<EMSAssignmentStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableStatuses = getNextAvailableEMSStatuses(currentEMSStatus);

  const handleOpen = () => {
    setSelectedStatus('');
    setNotes('');
    setError(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStatus('');
    setNotes('');
    setError(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      setError('Please select a status');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedTicket = await ticketService.updateEMSStatus(
        ticketId,
        selectedStatus as EMSAssignmentStatus,
        notes || undefined
      );
      
      onStatusUpdate(updatedTicket);
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update EMS status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: EMSAssignmentStatus) => {
    return getEMSStatusInfo(status);
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={handleOpen}
        disabled={disabled || availableStatuses.length === 0}
        sx={{
          borderColor: currentEMSStatus ? getEMSStatusColor(currentEMSStatus) : undefined,
          color: currentEMSStatus ? getEMSStatusColor(currentEMSStatus) : undefined,
        }}
      >
        {currentEMSStatus 
          ? getStatusInfo(currentEMSStatus).displayName 
          : 'Update EMS Status'
        }
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Update EMS Status
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current Status: {currentTicketStatus}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>New EMS Status</InputLabel>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as EMSAssignmentStatus)}
                label="New EMS Status"
              >
                {availableStatuses.map((status) => {
                  const statusInfo = getStatusInfo(status);
                  return (
                    <MenuItem key={status} value={status}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: getEMSStatusColor(status),
                          }}
                        />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {statusInfo.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {statusInfo.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Notes (Optional)"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this status change..."
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateStatus} 
            variant="contained"
            disabled={loading || !selectedStatus}
          >
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EMSStatusUpdater;

