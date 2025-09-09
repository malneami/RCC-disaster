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
  CircularProgress,
} from '@mui/material';
import { DriverSchedule } from '../types/ems';

interface ScheduleFormProps {
  open: boolean;
  editingSchedule: DriverSchedule | null;
  formData: {
    driverId: string;
    ambulanceId: string;
    shiftStart: string;
    shiftEnd: string;
    shiftType: string;
    status: string;
    notes: string;
  };
  onClose: () => void;
  onSubmit: () => void;
  onFormDataChange: (field: string, value: string) => void;
  drivers: Array<{ id: string; firstName: string; lastName: string }>;
  ambulances: Array<{ id: string; callSign: string; plateNumber: string }>;
  loading?: boolean;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({
  open,
  editingSchedule,
  formData,
  onClose,
  onSubmit,
  onFormDataChange,
  drivers,
  ambulances,
  loading = false,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
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
            <TextField
              fullWidth
              label="Shift Start"
              type="datetime-local"
              value={formData.shiftStart}
              onChange={(e) => onFormDataChange('shiftStart', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Shift End"
              type="datetime-local"
              value={formData.shiftEnd}
              onChange={(e) => onFormDataChange('shiftEnd', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Shift Type</InputLabel>
              <Select
                value={formData.shiftType}
                onChange={(e) => onFormDataChange('shiftType', e.target.value)}
                label="Shift Type"
              >
                <MenuItem value="DAY">Day Shift</MenuItem>
                <MenuItem value="NIGHT">Night Shift</MenuItem>
                <MenuItem value="OVERTIME">Overtime</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => onFormDataChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="ON_BREAK">On Break</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
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
          {loading ? 'Saving...' : (editingSchedule ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleForm;


