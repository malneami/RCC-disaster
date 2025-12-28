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
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useUnits } from '../hooks/useUnits';
import { useAuth } from '../../../contexts/AuthContext';
import { useBedMutations } from '../hooks/useBedMutations';

interface AddBedDialogProps {
  open: boolean;
  onClose: () => void;
  hospitalId?: string | null;
}

const AddBedDialog: React.FC<AddBedDialogProps> = ({
  open,
  onClose,
  hospitalId,
}) => {
  const { user } = useAuth();
  const { createBed, createBedLoading } = useBedMutations();
  const [unitId, setUnitId] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isOperational, setIsOperational] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const targetHospitalId = hospitalId !== undefined ? hospitalId : (user?.hospital?.id || null);
  
  const { units, loading: unitsLoading } = useUnits(
    targetHospitalId,
    open && !!targetHospitalId
  );

  useEffect(() => {
    if (!open) {
      setUnitId('');
      setBedNumber('');
      setLocation('');
      setNotes('');
      setIsOperational(true);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!unitId || !bedNumber.trim()) {
      setError('Unit and Bed Number are required');
      return;
    }

    try {
      setError(null);
      await createBed({
        unitId,
        bedNumber: bedNumber.trim(),
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        isOperational,
      });
      onClose();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to create bed';
      setError(errorMessage);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AddIcon color="primary" />
          <Typography variant="h6" component="span" sx={{ color: '#1976d2', fontWeight: 600 }}>
            Add New Bed
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Unit</InputLabel>
              <Select
                value={unitId}
                label="Unit"
                onChange={(e) => setUnitId(e.target.value)}
                disabled={unitsLoading || createBedLoading}
              >
                {units.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bed Number"
              value={bedNumber}
              onChange={(e) => setBedNumber(e.target.value)}
              required
              disabled={createBedLoading}
              placeholder="e.g., ICU-01, PICU-02"
              helperText="Unique identifier for the bed within the unit"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={createBedLoading}
              placeholder="e.g., Room 101, Floor 2"
              helperText="Optional location description"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={createBedLoading}
              multiline
              rows={3}
              placeholder="Additional notes about the bed"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={isOperational}
                  onChange={(e) => setIsOperational(e.target.checked)}
                  disabled={createBedLoading}
                />
              }
              label="Bed is operational"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={createBedLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createBedLoading || !unitId || !bedNumber.trim()}
          startIcon={createBedLoading ? <CircularProgress size={20} /> : <AddIcon />}
        >
          Create Bed
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddBedDialog;

