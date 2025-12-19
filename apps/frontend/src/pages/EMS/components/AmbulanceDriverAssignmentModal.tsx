import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Autocomplete,
  TextField,
  Chip,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAmbulance, faUserMd } from '@fortawesome/free-solid-svg-icons';
import { EMSAssignment } from '../types/ems';
import { useAmbulances } from '../hooks/useAmbulances';
import { useEMSDrivers } from '../hooks/useEMSDrivers';
import { useEMSAssignments } from '../hooks/useEMSAssignments';

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
  const { updateAssignment } = useEMSAssignments();
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

    // Additional validation to ensure selected options exist
    const selectedAmbulance = ambulances.find(ambulance => ambulance.id === formData.ambulanceId);
    const selectedDriver = drivers.find(driver => driver.id === formData.driverId);

    if (!selectedAmbulance) {
      setError('Selected ambulance is no longer available');
      return false;
    }

    if (!selectedDriver) {
      setError('Selected driver is no longer available');
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
      await updateAssignment({
        id: assignment.id,
        data: {
          ambulanceId: formData.ambulanceId,
          driverId: formData.driverId,
        },
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error updating assignment:', err);
      const errorMessage = (err as any).response?.data?.message || 'Failed to update assignment. Please try again.';
      setError(errorMessage);
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
            <Autocomplete
              value={ambulances.find(ambulance => ambulance.id === formData.ambulanceId) || null}
              onChange={(_, newValue) => {
                handleInputChange('ambulanceId', newValue?.id || '');
              }}
              options={ambulances}
              getOptionLabel={(option) => `${option.callSign} - ${option.plateNumber}`}
              loading={ambulancesLoading}
              disabled={loading || ambulancesLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Ambulance"
                  placeholder="Search by call sign or plate number..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {ambulancesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <FontAwesomeIcon icon={faAmbulance} size="sm" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {option.callSign}
                        </Typography>
                        {option.id === assignment?.ambulanceId && (
                          <Chip
                            label="Currently Assigned"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {option.plateNumber} • {option.type} • {option.status}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
              filterOptions={(options, { inputValue }) => {
                const filtered = options.filter(option =>
                  option.callSign.toLowerCase().includes(inputValue.toLowerCase()) ||
                  option.plateNumber.toLowerCase().includes(inputValue.toLowerCase()) ||
                  option.type.toLowerCase().includes(inputValue.toLowerCase())
                );
                return filtered;
              }}
              noOptionsText="No ambulances found"
              loadingText="Loading ambulances..."
            />
          </Grid>

          {/* Driver Selection */}
          <Grid item xs={12}>
            <Autocomplete
              value={drivers.find(driver => driver.id === formData.driverId) || null}
              onChange={(_, newValue) => {
                handleInputChange('driverId', newValue?.id || '');
              }}
              options={drivers}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
              loading={driversLoading}
              disabled={loading || driversLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Driver"
                  placeholder="Search by name or phone number..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {driversLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              getOptionDisabled={(option) =>
                !!option.activeAssignment && option.id !== assignment?.driverId
              }
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ opacity: option.activeAssignment && option.id !== assignment?.driverId ? 0.7 : 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <FontAwesomeIcon icon={faUserMd} size="sm" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {option.firstName} {option.lastName}
                        </Typography>
                        {option.id === assignment?.driverId && (
                          <Chip
                            label="Currently Assigned"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {option.activeAssignment && option.id !== assignment?.driverId && (
                          <Chip
                            label={`Assigned (#${option.activeAssignment.ticket.ticketNumber})`}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {option.phoneNumber}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
              filterOptions={(options, { inputValue }) => {
                const filtered = options.filter(option =>
                  option.firstName.toLowerCase().includes(inputValue.toLowerCase()) ||
                  option.lastName.toLowerCase().includes(inputValue.toLowerCase()) ||
                  option.phoneNumber.includes(inputValue)
                );
                return filtered;
              }}
              noOptionsText="No drivers found"
              loadingText="Loading drivers..."
            />
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
