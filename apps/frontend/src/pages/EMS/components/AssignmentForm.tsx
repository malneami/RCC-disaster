import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import { EMSAssignment } from '../types/ems';
import { formatForDateTimeLocal } from '../../../helpers';

interface AssignmentFormProps {
  open: boolean;
  editingAssignment: EMSAssignment | null;
  formData: {
    ticketId: string;
    ambulanceId: string;
    driverId: string;
    assignedAt: string;
    status: string;
    estimatedArrivalTime: string;
    journeyStartTime: string;
    actualArrivalTime: string;
    journeyEndTime: string;
    notes: string;
  };
  onClose: () => void;
  onSubmit: () => void;
  onFormDataChange: (field: string, value: string) => void;
  tickets: Array<{ id: string; ticketNumber: string; patient: { firstName: string; lastName: string } }>;
  ambulances: Array<{ id: string; callSign: string; plateNumber: string }>;
  drivers: Array<{ id: string; firstName: string; lastName: string }>;
  loading?: boolean;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({
  open,
  editingAssignment,
  formData,
  onClose,
  onSubmit,
  onFormDataChange,
  tickets,
  ambulances,
  drivers,
  loading = false,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Ticket</InputLabel>
              <Select
                value={formData.ticketId}
                onChange={(e) => onFormDataChange('ticketId', e.target.value)}
                label="Ticket"
              >
                {tickets?.map((ticket) => (
                  <MenuItem key={ticket.id} value={ticket.id}>
                    {ticket.ticketNumber} - {ticket.patient.firstName} {ticket.patient.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Ambulance</InputLabel>
              <Select
                value={formData.ambulanceId}
                onChange={(e) => onFormDataChange('ambulanceId', e.target.value)}
                label="Ambulance"
              >
                {ambulances?.map((ambulance) => (
                  <MenuItem key={ambulance.id} value={ambulance.id}>
                    {ambulance.callSign} ({ambulance.plateNumber})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Driver</InputLabel>
              <Select
                value={formData.driverId}
                onChange={(e) => onFormDataChange('driverId', e.target.value)}
                label="Driver"
              >
                {drivers?.map((driver) => (
                  <MenuItem key={driver.id} value={driver.id}>
                    {driver.firstName} {driver.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Assignment Time"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.assignedAt)}
              onChange={(e) => onFormDataChange('assignedAt', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => onFormDataChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="EMS_CONTACT">EMS Contact</MenuItem>
                <MenuItem value="EMS_ARRIVAL">EMS Arrival</MenuItem>
                <MenuItem value="DEPARTED">Departed</MenuItem>
                <MenuItem value="ARRIVED">Arrived</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Estimated Arrival"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.estimatedArrivalTime)}
              onChange={(e) => onFormDataChange('estimatedArrivalTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          {/* Journey Timeline Fields */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
              Journey Timeline
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="EMS Arrival Time"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.journeyStartTime)}
              onChange={(e) => onFormDataChange('journeyStartTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="When EMS arrived at pickup location"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Departed Time"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.actualArrivalTime)}
              onChange={(e) => onFormDataChange('actualArrivalTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="When EMS departed from pickup location"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Arrived Time"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.journeyEndTime)}
              onChange={(e) => onFormDataChange('journeyEndTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="When EMS arrived at destination"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => onFormDataChange('notes', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          onClick={onSubmit} 
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Saving...' : (editingAssignment ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignmentForm;


