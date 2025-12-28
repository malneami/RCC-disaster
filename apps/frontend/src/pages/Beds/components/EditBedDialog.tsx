import React, { useState, useEffect } from 'react';
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
  Grid,
  Box,
  Typography,
  Alert,
  Divider,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from '@mui/material';
import {
  Circle as CircleIcon,
} from '@mui/icons-material';
import { BedStatus } from '../services/bedService';
import { BedStatusChip } from './BedStatusChip';
import { useBed } from '../hooks/useBed';
import { useBedMutations } from '../hooks/useBedMutations';

interface EditBedDialogProps {
  open: boolean;
  onClose: () => void;
  bedId: string | null;
  onUpdate: () => void;
}

const EditBedDialog: React.FC<EditBedDialogProps> = ({
  open,
  onClose,
  bedId,
  onUpdate,
}) => {
  const { bed, loading: bedLoading } = useBed(bedId);
  const { updateBed, updateBedLoading } = useBedMutations();
  const [status, setStatus] = useState<BedStatus>('VACANT');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bed) {
      setStatus(bed.status);
      setLocation(bed.location || '');
    }
  }, [bed]);

  const handleSubmit = async () => {
    if (!bed || !bedId) return;

    try {
      setError(null);
      await updateBed({
        bedId,
        status,
      });
      onUpdate();
      onClose();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update bed status';
      setError(errorMessage);
    }
  };

  const getAvailableStatuses = (currentStatus: BedStatus): BedStatus[] => {
    switch (currentStatus) {
      case 'VACANT':
        return ['OCCUPIED', 'CLEANING', 'BLOCKED'];
      case 'CLEANING':
        return ['VACANT', 'BLOCKED'];
      case 'OCCUPIED':
        return ['CLEANING', 'BLOCKED'];
      case 'BLOCKED':
        return ['VACANT', 'CLEANING'];
      case 'RESERVED':
        return ['OCCUPIED', 'VACANT', 'BLOCKED'];
      default:
        return ['VACANT', 'OCCUPIED', 'CLEANING', 'BLOCKED', 'RESERVED'];
    }
  };

  const getStatusColor = (status: BedStatus): string => {
    switch (status) {
      case 'OCCUPIED':
        return '#f44336'; // Red
      case 'VACANT':
        return '#4caf50'; // Green
      case 'CLEANING':
        return '#ff9800'; // Yellow/Orange
      case 'BLOCKED':
        return '#9e9e9e'; // Gray
      case 'RESERVED':
        return '#2196f3'; // Blue
      default:
        return '#9e9e9e';
    }
  };

  const getStatusLabel = (status: BedStatus): string => {
    return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ');
  };

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

  const availableStatuses = getAvailableStatuses(bed.status);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" component="span" sx={{ color: '#1976d2', fontWeight: 600 }}>
            {bed.bedNumber}
          </Typography>
          <BedStatusChip status={bed.status} />
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Bed Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Unit
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {bed.unit.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Hospital
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {bed.hospital.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Bed Type
                  </Typography>
                  <Typography variant="body1">
                    {bed.unit.bedType.replace(/_/g, ' ')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Operational
                  </Typography>
                  <Typography variant="body1">
                    {bed.isOperational ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                {bed.currentPatient && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Current Patient
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {bed.currentPatient.name}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Bed Status</InputLabel>
              <Select
                value={status}
                label="Bed Status"
                onChange={(e) => setStatus(e.target.value as BedStatus)}
                renderValue={(value) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircleIcon sx={{ fontSize: 12, color: getStatusColor(value) }} />
                    <Typography>{getStatusLabel(value)}</Typography>
                  </Box>
                )}
              >
                {availableStatuses.map((s) => (
                  <MenuItem key={s} value={s}>
                    <ListItemIcon>
                      <CircleIcon sx={{ fontSize: 16, color: getStatusColor(s) }} />
                    </ListItemIcon>
                    <ListItemText primary={getStatusLabel(s)} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Room 101, Floor 2"
              helperText="Optional: Specify bed location details"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={updateBedLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateBedLoading || status === bed.status}
        >
          {updateBedLoading ? 'Updating...' : 'Update Bed'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditBedDialog;
