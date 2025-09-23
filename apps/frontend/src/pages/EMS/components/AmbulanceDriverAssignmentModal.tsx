import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAmbulance, faUserMd } from '@fortawesome/free-solid-svg-icons';
import { EMSAssignment } from '../types/ems';
import { useAmbulances } from '../hooks/useAmbulances';
import { useEMSDrivers } from '../hooks/useEMSDrivers';
import { emsService } from '../services/emsService';

interface AmbulanceDriverAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  assignment: EMSAssignment | null;
  onSuccess?: () => void;
}

interface FormData {
  ambulanceId: string;
  driverId: string;
}

const AmbulanceDriverAssignmentModal: React.FC<AmbulanceDriverAssignmentModalProps> = ({
  open,
  onClose,
  assignment,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>({
    ambulanceId: '',
    driverId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { ambulances: allAmbulances, isLoading: ambulancesLoading } = useAmbulances();
  const { drivers, isLoading: driversLoading } = useEMSDrivers();

  // Filter ambulances to include available ones and the currently assigned one
  const ambulances = React.useMemo(() => {
    if (!allAmbulances) return [];
    
    const availableAmbulances = allAmbulances.filter(ambulance => 
      ambulance.status === 'AVAILABLE' || ambulance.id === assignment?.ambulanceId
    );
    
    return availableAmbulances;
  }, [allAmbulances, assignment?.ambulanceId]);

  // Initialize form data when assignment changes
  React.useEffect(() => {
    if (assignment && open) {
      setFormData({
        ambulanceId: assignment.ambulanceId || '',
        driverId: assignment.driverId || '',
      });
      setError(null);
    }
  }, [assignment, open]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.ambulanceId) {
      setError('Please select an ambulance');
      return false;
    }

    if (!formData.driverId) {
      setError('Please select a driver');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!assignment || !validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Update the assignment with ambulance and driver
      await emsService.updateEMSAssignment(assignment.id, {
        ambulanceId: formData.ambulanceId,
        driverId: formData.driverId,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error updating assignment:', err);
      setError('Failed to update assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ ambulanceId: '', driverId: '' });
      setError(null);
      onClose();
    }
  };

  if (!assignment) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FontAwesomeIcon icon={faAmbulance} color="#1976d2" />
          <Typography variant="h6">
            {assignment?.ambulanceId && assignment?.driverId ? 'Reassign Crew' : 'Assign Ambulance & Driver'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Assignment #{assignment.id.slice(-8).toUpperCase()}
          {assignment?.ambulanceId && assignment?.driverId && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              • Currently assigned to {assignment.ambulance?.callSign} with {assignment.driver?.firstName} {assignment.driver?.lastName}
            </Typography>
          )}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Ambulance Selection */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Select Ambulance</InputLabel>
              <Select
                value={formData.ambulanceId}
                onChange={(e) => handleInputChange('ambulanceId', e.target.value)}
                label="Select Ambulance"
                disabled={loading || ambulancesLoading}
              >
                {ambulancesLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Loading ambulances...
                  </MenuItem>
                ) : ambulances.length === 0 ? (
                  <MenuItem disabled>No available ambulances</MenuItem>
                ) : (
                  ambulances.map((ambulance) => (
                    <MenuItem key={ambulance.id} value={ambulance.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FontAwesomeIcon icon={faAmbulance} size="sm" />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {ambulance.callSign}
                            {ambulance.id === assignment?.ambulanceId && (
                              <Typography component="span" variant="caption" sx={{ ml: 1, color: 'primary.main' }}>
                                (Currently Assigned)
                              </Typography>
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ambulance.plateNumber} • {ambulance.type} • {ambulance.status}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          {/* Driver Selection */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Select Driver</InputLabel>
              <Select
                value={formData.driverId}
                onChange={(e) => handleInputChange('driverId', e.target.value)}
                label="Select Driver"
                disabled={loading || driversLoading}
              >
                {driversLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Loading drivers...
                  </MenuItem>
                ) : drivers.length === 0 ? (
                  <MenuItem disabled>No available drivers</MenuItem>
                ) : (
                  drivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FontAwesomeIcon icon={faUserMd} size="sm" />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {driver.firstName} {driver.lastName}
                            {driver.id === assignment?.driverId && (
                              <Typography component="span" variant="caption" sx={{ ml: 1, color: 'primary.main' }}>
                                (Currently Assigned)
                              </Typography>
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {driver.phoneNumber}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          {/* Current Assignment Info */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Current Assignment Details
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Ticket:</strong> {assignment.ticket?.ticketNumber || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Patient:</strong> {assignment.ticket?.patient?.firstName} {assignment.ticket?.patient?.lastName}
              </Typography>
              <Typography variant="body2">
                <strong>From:</strong> {assignment.ticket?.originHospital?.name || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>To:</strong> {assignment.ticket?.destinationHospital?.name || 'N/A'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading || !formData.ambulanceId || !formData.driverId}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading 
            ? (assignment?.ambulanceId && assignment?.driverId ? 'Reassigning...' : 'Assigning...') 
            : (assignment?.ambulanceId && assignment?.driverId ? 'Reassign Crew' : 'Assign Ambulance & Driver')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AmbulanceDriverAssignmentModal;
