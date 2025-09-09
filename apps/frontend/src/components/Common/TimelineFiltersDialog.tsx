import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import { TimelineFilters } from './TimelineView';

interface TimelineFiltersDialogProps {
  open: boolean;
  onClose: () => void;
  filters: TimelineFilters;
  onFiltersChange: (filters: TimelineFilters) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  portalType: 'stroke' | 'trauma' | 'stemi';
}

const TimelineFiltersDialog: React.FC<TimelineFiltersDialogProps> = ({
  open,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  portalType,
}) => {
  const getPortalColor = () => {
    switch (portalType) {
      case 'stroke': return '#1976d2';
      case 'trauma': return '#d32f2f';
      case 'stemi': return '#388e3c';
      default: return '#1976d2';
    }
  };

  const getEventTypes = () => {
    switch (portalType) {
      case 'stroke':
        return [
          { value: 'admission', label: 'Admission' },
          { value: 'assessment', label: 'Assessment' },
          { value: 'treatment', label: 'Treatment' },
          { value: 'discharge', label: 'Discharge' },
          { value: 'follow-up', label: 'Follow-up' },
        ];
      case 'trauma':
        return [
          { value: 'arrival', label: 'Arrival' },
          { value: 'assessment', label: 'Assessment' },
          { value: 'surgery', label: 'Surgery' },
          { value: 'recovery', label: 'Recovery' },
          { value: 'discharge', label: 'Discharge' },
        ];
      case 'stemi':
        return [
          { value: 'presentation', label: 'Presentation' },
          { value: 'diagnosis', label: 'Diagnosis' },
          { value: 'intervention', label: 'Intervention' },
          { value: 'monitoring', label: 'Monitoring' },
          { value: 'discharge', label: 'Discharge' },
        ];
      default:
        return [];
    }
  };

  const getStatuses = () => [
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const getHospitals = () => [
    { value: 'hospital1', label: 'King Fahd Hospital' },
    { value: 'hospital2', label: 'King Abdulaziz Hospital' },
    { value: 'hospital3', label: 'King Khalid Hospital' },
    { value: 'hospital4', label: 'King Saud Hospital' },
    { value: 'hospital5', label: 'King Faisal Hospital' },
  ];

  const handleFilterChange = (field: keyof TimelineFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const handleApply = () => {
    onApplyFilters();
    onClose();
  };

  const handleClear = () => {
    onClearFilters();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold">
          Filter Timeline Events
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Filter events by type, status, or hospital
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Event Type Filter */}
          <FormControl fullWidth>
            <InputLabel>Event Type</InputLabel>
            <Select
              value={filters.eventType}
              label="Event Type"
              onChange={(e) => handleFilterChange('eventType', e.target.value)}
            >
              <MenuItem value="">
                <em>All Event Types</em>
              </MenuItem>
              {getEventTypes().map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status Filter */}
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">
                <em>All Statuses</em>
              </MenuItem>
              {getStatuses().map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Hospital Filter */}
          <FormControl fullWidth>
            <InputLabel>Hospital</InputLabel>
            <Select
              value={filters.hospital}
              label="Hospital"
              onChange={(e) => handleFilterChange('hospital', e.target.value)}
            >
              <MenuItem value="">
                <em>All Hospitals</em>
              </MenuItem>
              {getHospitals().map((hospital) => (
                <MenuItem key={hospital.value} value={hospital.label}>
                  {hospital.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleClear} 
          color="inherit"
          variant="outlined"
        >
          Clear All
        </Button>
        <Button 
          onClick={handleApply} 
          variant="contained"
          sx={{
            backgroundColor: getPortalColor(),
            '&:hover': {
              backgroundColor: getPortalColor(),
              opacity: 0.9,
            },
          }}
        >
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimelineFiltersDialog;
