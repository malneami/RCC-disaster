import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Delete as DeleteIcon, Warning as WarningIcon } from '@mui/icons-material';
import { useBed } from '../hooks/useBed';

interface DeleteBedDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bedId: string | null;
  loading?: boolean;
  error?: string | null;
}

const DeleteBedDialog: React.FC<DeleteBedDialogProps> = ({
  open,
  onClose,
  onConfirm,
  bedId,
  loading = false,
  error,
}) => {
  const { bed, loading: bedLoading } = useBed(bedId);

  if (!bedId) return null;

  if (bedLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!bed) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WarningIcon color="error" />
          <Typography variant="h6" component="span" sx={{ color: 'error.main', fontWeight: 600 }}>
            Delete Bed
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to delete bed <strong>{bed.bedNumber}</strong>?
        </Typography>

        <Box
          sx={{
            p: 2,
            bgcolor: 'warning.light',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'warning.main',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            <strong>Unit:</strong> {bed.unit.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Hospital:</strong> {bed.hospital.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Status:</strong> {bed.status}
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ mt: 2 }}>
          This action cannot be undone. The bed will be permanently removed from the system.
          {bed.status === 'OCCUPIED' && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Note:</strong> This bed is currently occupied. Please discharge the patient first.
            </Typography>
          )}
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading || bed.status === 'OCCUPIED'}
          startIcon={<DeleteIcon />}
        >
          {loading ? 'Deleting...' : 'Delete Bed'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteBedDialog;

