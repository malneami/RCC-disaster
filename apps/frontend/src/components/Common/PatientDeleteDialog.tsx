import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

interface PatientDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (forceDelete: boolean) => Promise<void>;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    mrn?: string;
    strokeCasesCount: number;
    ticketsCount: number;
    medicalRecordsCount: number;
  } | null;
}

const PatientDeleteDialog: React.FC<PatientDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  patient,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'soft' | 'force' | null>(null);

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setDeleteType(null);
      onClose();
    }
  };

  const handleConfirm = async (forceDelete: boolean) => {
    if (!patient) return;

    try {
      setLoading(true);
      setError(null);
      await onConfirm(forceDelete);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete patient');
    } finally {
      setLoading(false);
    }
  };

  if (!patient) return null;

  const hasActiveRecords = patient.strokeCasesCount > 0 || patient.ticketsCount > 0 || patient.medicalRecordsCount > 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="error" />
        Delete Patient Record
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Patient Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Patient Information
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <PersonIcon color="primary" />
            <Box>
              <Typography variant="h6">
                {patient.firstName} {patient.lastName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                <Chip label={`National ID: ${patient.nationalId}`} size="small" />
                {patient.mrn && (
                  <Chip label={`MRN: ${patient.mrn}`} size="small" />
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Related Records */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Related Records
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`${patient.strokeCasesCount} Stroke Cases`} 
              color={patient.strokeCasesCount > 0 ? 'error' : 'default'}
              size="small" 
            />
            <Chip 
              label={`${patient.ticketsCount} Tickets`} 
              color={patient.ticketsCount > 0 ? 'error' : 'default'}
              size="small" 
            />
            <Chip 
              label={`${patient.medicalRecordsCount} Medical Records`} 
              color={patient.medicalRecordsCount > 0 ? 'error' : 'default'}
              size="small" 
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Delete Options */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Delete Options
          </Typography>

          {hasActiveRecords ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This patient has active records. You can only perform a force delete, which will permanently remove all related data.
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              This patient has no active records. You can choose between soft delete or force delete.
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Soft Delete Option */}
            {!hasActiveRecords && (
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'warning.main', borderRadius: 1 }}>
                <Typography variant="subtitle1" color="warning.main" gutterBottom>
                  Soft Delete (Recommended)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Marks the patient record as deleted but keeps it in the database for audit purposes. 
                  The record can be restored if needed.
                </Typography>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteType('soft')}
                  disabled={loading}
                >
                  Soft Delete
                </Button>
              </Box>
            )}

            {/* Force Delete Option */}
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'error.main', borderRadius: 1 }}>
              <Typography variant="subtitle1" color="error.main" gutterBottom>
                Force Delete (Permanent)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Permanently deletes the patient record and all related data from the database. 
                This action cannot be undone.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteType('force')}
                disabled={loading}
              >
                Force Delete
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Confirmation */}
        {deleteType && (
          <Alert severity={deleteType === 'soft' ? 'warning' : 'error'} sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Confirm {deleteType === 'soft' ? 'Soft' : 'Force'} Delete
            </Typography>
            <Typography variant="body2">
              {deleteType === 'soft' 
                ? 'Are you sure you want to soft delete this patient record?'
                : 'Are you sure you want to permanently delete this patient record and all related data? This action cannot be undone.'
              }
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {deleteType && (
          <Button
            onClick={() => handleConfirm(deleteType === 'force')}
            color={deleteType === 'soft' ? 'warning' : 'error'}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {loading ? 'Deleting...' : `Confirm ${deleteType === 'soft' ? 'Soft' : 'Force'} Delete`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PatientDeleteDialog;
