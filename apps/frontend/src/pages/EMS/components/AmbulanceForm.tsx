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
import { Ambulance } from '../types/ems';

interface AmbulanceFormProps {
  open: boolean;
  editingAmbulance: Ambulance | null;
  formData: {
    vehicleId: string;
    callSign: string;
    plateNumber: string;
    type: string;
    status: string;
    manufacturer: string;
    model: string;
    year: number;
    baseStation: string;
    driverId: string;
    equipmentStatus: string;
    isActive: boolean;
  };
  onClose: () => void;
  onSubmit: () => void;
  onFormDataChange: (field: string, value: string | number) => void;
  drivers: Array<{ id: string; firstName: string; lastName: string; status?: string }>;
  loading?: boolean;
}

const AmbulanceForm: React.FC<AmbulanceFormProps> = ({
  open,
  editingAmbulance,
  formData,
  onClose,
  onSubmit,
  onFormDataChange,
  drivers,
  loading = false,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingAmbulance ? 'Edit Ambulance' : 'Add New Ambulance'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Vehicle ID"
              value={formData.vehicleId}
              onChange={(e) => onFormDataChange('vehicleId', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Call Sign"
              value={formData.callSign}
              onChange={(e) => onFormDataChange('callSign', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Plate Number"
              value={formData.plateNumber}
              onChange={(e) => onFormDataChange('plateNumber', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => onFormDataChange('type', e.target.value)}
                label="Type"
              >
                <MenuItem value="BASIC">Basic</MenuItem>
                <MenuItem value="ADVANCED">Advanced</MenuItem>
                <MenuItem value="CRITICAL_CARE">Critical Care</MenuItem>
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
                <MenuItem value="AVAILABLE">Available</MenuItem>
                <MenuItem value="IN_USE">In Use</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                <MenuItem value="OUT_OF_SERVICE">Out of Service</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Manufacturer"
              value={formData.manufacturer}
              onChange={(e) => onFormDataChange('manufacturer', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Model"
              value={formData.model}
              onChange={(e) => onFormDataChange('model', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Year"
              type="number"
              value={formData.year}
              onChange={(e) => onFormDataChange('year', parseInt(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Base Station"
              value={formData.baseStation}
              onChange={(e) => onFormDataChange('baseStation', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Driver</InputLabel>
              <Select
                value={formData.driverId}
                onChange={(e) => onFormDataChange('driverId', e.target.value)}
                label="Driver"
              >
                <MenuItem value="">No Driver Assigned</MenuItem>
                {drivers.map((driver) => (
                  <MenuItem key={driver.id} value={driver.id}>
                    {driver.firstName} {driver.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Equipment Status</InputLabel>
              <Select
                value={formData.equipmentStatus}
                onChange={(e) => onFormDataChange('equipmentStatus', e.target.value)}
                label="Equipment Status"
              >
                <MenuItem value="OPERATIONAL">Operational</MenuItem>
                <MenuItem value="MAINTENANCE_REQUIRED">Maintenance Required</MenuItem>
                <MenuItem value="OUT_OF_SERVICE">Out of Service</MenuItem>
                <MenuItem value="REPLACED">Replaced</MenuItem>
              </Select>
            </FormControl>
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
          {loading ? 'Saving...' : (editingAmbulance ? 'Update' : 'Add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AmbulanceForm;
