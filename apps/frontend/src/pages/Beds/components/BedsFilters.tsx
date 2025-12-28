import React, { useEffect } from 'react';
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
  Grid,
} from '@mui/material';
import { useUnits } from '../hooks/useUnits';

interface BedsFiltersProps {
  open: boolean;
  onClose: () => void;
  filters: {
    hospitalId?: string;
    unitId: string;
    status: string;
  };
  hospitals?: Array<{ id: string; name: string }>;
  units?: Array<{ id: string; name: string }>;
  onFiltersChange: (filters: any) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  isAdmin?: boolean;
  userHospitalId?: string | null;
}

const BedsFilters: React.FC<BedsFiltersProps> = ({
  open,
  onClose,
  filters,
  hospitals,
  units,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  isAdmin = false,
  userHospitalId,
}) => {
  const targetHospitalId = isAdmin && filters.hospitalId 
    ? filters.hospitalId 
    : (!isAdmin ? userHospitalId : null);

  const { units: fetchedUnits } = useUnits(targetHospitalId, open && !!targetHospitalId);
  
  const availableUnits = fetchedUnits.length > 0 
    ? fetchedUnits 
    : (units || []);

  useEffect(() => {
    if (isAdmin && filters.hospitalId && filters.unitId) {
      onFiltersChange({ ...filters, unitId: '' });
    }
  }, [filters.hospitalId, isAdmin]);

  const handleFilterChange = (field: string, value: string) => {
    onFiltersChange({ ...filters, [field]: value });
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
      <DialogTitle>Filter Beds</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {isAdmin && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Hospital</InputLabel>
                <Select
                  value={filters.hospitalId}
                  label="Hospital"
                  onChange={(e) => handleFilterChange('hospitalId', e.target.value)}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 280,
                      },
                    },
                  }}
                >
                  <MenuItem value="">All Hospitals</MenuItem>
                  {hospitals?.map((hospital) => (
                    <MenuItem key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Unit</InputLabel>
              <Select
                value={filters.unitId}
                label="Unit"
                onChange={(e) => handleFilterChange('unitId', e.target.value)}
                disabled={isAdmin && !filters.hospitalId && !userHospitalId}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 280,
                    },
                  },
                }}
              >
                <MenuItem value="">All Units</MenuItem>
                {availableUnits.length > 0 ? (
                  availableUnits.map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>
                    No units available
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 240,
                    },
                  },
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="OCCUPIED">Occupied</MenuItem>
                <MenuItem value="VACANT">Vacant</MenuItem>
                <MenuItem value="CLEANING">Cleaning</MenuItem>
                <MenuItem value="BLOCKED">Blocked</MenuItem>
                <MenuItem value="RESERVED">Reserved</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleClear} color="secondary">Clear Filters</Button>
        <Button onClick={handleApply} variant="contained">Apply Filters</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BedsFilters;

