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
import SearchableSelect from '../../../components/Common/SearchableSelect';

interface AssignmentFormProps {
  open: boolean;
  editingAssignment: EMSAssignment | null;
  formData: {
    ticketId: string;
    ambulanceId: string;
    driverId: string;
    assignedAt: string;
    status: string;
    emsContactTime: string;
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
  loadingData?: boolean;
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
  loadingData = false,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <SearchableSelect
              label="Ticket"
              value={formData.ticketId || null}
              options={tickets?.map((ticket) => ({
                id: ticket.id,
                label: `${ticket.ticketNumber} - ${ticket.patient.firstName} ${ticket.patient.lastName}`,
                subtitle: `Patient: ${ticket.patient.firstName} ${ticket.patient.lastName}`,
              })) || []}
              onChange={(value) => onFormDataChange('ticketId', value || '')}
              placeholder="Search for a ticket..."
              loading={loadingData}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <SearchableSelect
              label="Ambulance"
              value={formData.ambulanceId || null}
              options={ambulances?.map((ambulance) => ({
                id: ambulance.id,
                label: ambulance.callSign,
                subtitle: `Plate: ${ambulance.plateNumber}`,
              })) || []}
              onChange={(value) => onFormDataChange('ambulanceId', value || '')}
              placeholder="Search for an ambulance..."
              loading={loadingData}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <SearchableSelect
              label="Driver"
              value={formData.driverId || null}
              options={drivers?.map((driver) => ({
                id: driver.id,
                label: `${driver.firstName} ${driver.lastName}`,
                subtitle: `Driver ID: ${driver.id.slice(-8)}`,
              })) || []}
              onChange={(value) => onFormDataChange('driverId', value || '')}
              placeholder="Search for a driver..."
              loading={loadingData}
            />
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
              label="EMS Contact Time"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.emsContactTime)}
              onChange={(e) => onFormDataChange('emsContactTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Journey Timeline Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main', fontWeight: 600 }}>
              Journey Timeline
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="EMS Arrival Time"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.actualArrivalTime)}
              onChange={(e) => onFormDataChange('actualArrivalTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="When EMS arrived at pickup location"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Departed Time"
              type="datetime-local"
              value={formatForDateTimeLocal(formData.journeyStartTime)}
              onChange={(e) => onFormDataChange('journeyStartTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="When EMS departed from pickup location"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
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


