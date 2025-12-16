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
  Grid,
  TextField,
} from '@mui/material';


interface StrokeCasesFiltersProps {
  open: boolean;
  onClose: () => void;
  filters: {
    strokeType: string;
    status: string;
    originHospitalId: string;
    destinationHospitalId: string;
    modeOfArrival: string;
    dateFrom: string;
    dateTo: string;
  };
  hospitals?: Array<{ id: string; name: string }>;
  onFiltersChange: (filters: any) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const StrokeCasesFilters: React.FC<StrokeCasesFiltersProps> = ({
  open,
  onClose,
  filters,
  hospitals,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
}) => {
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
      <DialogTitle>Filter Stroke Cases</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Stroke Type</InputLabel>
              <Select
                value={filters.strokeType}
                label="Stroke Type"
                onChange={(e) => handleFilterChange('strokeType', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="ISCHEMIC">Ischemic</MenuItem>
                <MenuItem value="HEMORRHAGIC">Hemorrhagic</MenuItem>
                <MenuItem value="TIA">TIA</MenuItem>
                <MenuItem value="UNKNOWN">Unknown</MenuItem>
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
                <MenuItem value="SUSPECTED">Suspected</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="IMAGING_PENDING">CT Scan Pending</MenuItem>
                <MenuItem value="IMAGING_COMPLETE">CT Scan Complete</MenuItem>
                <MenuItem value="TREATMENT_EVALUATION">Treatment Evaluation</MenuItem>
                <MenuItem value="THROMBOLYSIS_STARTED">Thrombolysis Started</MenuItem>
                <MenuItem value="THROMBECTOMY_STARTED">Thrombectomy Started</MenuItem>
                <MenuItem value="TREATMENT_COMPLETE">Treatment Complete</MenuItem>
                <MenuItem value="STROKEUNIT_ADMITTED">Stroke Unit Admitted</MenuItem>
                <MenuItem value="REHABILITATION_STARTED">Rehabilitation Started</MenuItem>
                <MenuItem value="DISCHARGED">Discharged</MenuItem>
                <MenuItem value="FOLLOW_UP">Follow Up</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Mode of Arrival</InputLabel>
              <Select
                value={filters.modeOfArrival}
                label="Mode of Arrival"
                onChange={(e) => handleFilterChange('modeOfArrival', e.target.value)}
              >
                <MenuItem value="">All Modes</MenuItem>
                <MenuItem value="AMBULANCE_RED_CRESCENT">Ambulance (Red Crescent)</MenuItem>
                <MenuItem value="PRIVATE_CAR">Private Car</MenuItem>
                <MenuItem value="TRANSFERRED_FROM_ANOTHER_HOSPITAL">Transferred from another hospital</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Origin Hospital</InputLabel>
              <Select
                value={filters.originHospitalId}
                label="Origin Hospital"
                onChange={(e) => handleFilterChange('originHospitalId', e.target.value as string)}
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
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Destination Hospital</InputLabel>
              <Select
                value={filters.destinationHospitalId}
                label="Destination Hospital"
                onChange={(e) => handleFilterChange('destinationHospitalId', e.target.value as string)}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 200,
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
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="From Date (Admission Time)"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                max: filters.dateTo || undefined,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="To Date (Time of Triage)"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: filters.dateFrom || undefined,
              }}
            />
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

export default StrokeCasesFilters;
