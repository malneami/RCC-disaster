import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  AccessTime as PendingIcon,
  Assignment as AssignedIcon,
  DirectionsCar as InTransportIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
} from '@mui/icons-material';

interface UpdateStatusModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (status: string, notes?: string) => void;
  currentStatus: string;
}

const statusOptions = [
  {
    value: 'PENDING',
    label: 'Pending',
    icon: <PendingIcon />,
    description: 'Ticket is waiting for assignment or action',
  },
  {
    value: 'ASSIGNED',
    label: 'Assigned',
    icon: <AssignedIcon />,
    description: 'Ticket has been assigned to an EMS unit',
  },
  {
    value: 'IN_TRANSPORT',
    label: 'In Transport',
    icon: <InTransportIcon />,
    description: 'Patient is currently being transported',
  },
  {
    value: 'COMPLETED',
    label: 'Completed',
    icon: <CompletedIcon />,
    description: 'Transport has been completed successfully',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelled',
    icon: <CancelledIcon />,
    description: 'Transport has been cancelled',
  },
];

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  open,
  onClose,
  onSubmit,
  currentStatus,
}) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedStatus) {
      setError('Please select a status');
      return;
    }

    if (selectedStatus === currentStatus) {
      setError('Please select a different status');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(selectedStatus, notes.trim() || undefined);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedStatus(currentStatus);
      setNotes('');
      setError(null);
      onClose();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ASSIGNED':
        return 'info';
      case 'IN_TRANSPORT':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const selectedStatusOption = statusOptions.find(option => option.value === selectedStatus);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Update Ticket Status
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {statusOptions.find(option => option.value === currentStatus)?.icon}
            <Typography variant="body1">
              {statusOptions.find(option => option.value === currentStatus)?.label}
            </Typography>
          </Box>
        </Box>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>New Status</InputLabel>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            label="New Status"
            disabled={isSubmitting}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {option.icon}
                  <Box>
                    <Typography variant="body1">{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedStatusOption && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Status Information
            </Typography>
            <Box sx={{ 
              p: 2, 
              bgcolor: `${getStatusColor(selectedStatus)}.light`, 
              borderRadius: 1,
              border: 1,
              borderColor: `${getStatusColor(selectedStatus)}.main`,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {selectedStatusOption.icon}
                <Typography variant="subtitle1">
                  {selectedStatusOption.label}
                </Typography>
              </Box>
              <Typography variant="body2">
                {selectedStatusOption.description}
              </Typography>
            </Box>
          </Box>
        )}

        <TextField
          fullWidth
          label="Notes (optional)"
          multiline
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
          placeholder="Add any additional notes about this status change..."
          helperText="Provide context or details about this status update"
        />
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || selectedStatus === currentStatus}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
        >
          {isSubmitting ? 'Updating...' : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateStatusModal;
