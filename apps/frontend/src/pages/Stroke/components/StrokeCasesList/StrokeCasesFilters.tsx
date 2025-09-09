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
} from '@mui/material';


interface StrokeCasesFiltersProps {
  open: boolean;
  onClose: () => void;
  filters: {
    strokeType: string;
    status: string;
    severity: string;
  };
  onFiltersChange: (filters: any) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const StrokeCasesFilters: React.FC<StrokeCasesFiltersProps> = ({
  open,
  onClose,
  filters,
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
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="SUSPECTED">Suspected</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="IMAGING_PENDING">Imaging Pending</MenuItem>
                <MenuItem value="IMAGING_COMPLETE">Imaging Complete</MenuItem>
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
              <InputLabel>Severity</InputLabel>
              <Select
                value={filters.severity}
                label="Severity"
                onChange={(e) => handleFilterChange('severity', e.target.value)}
              >
                <MenuItem value="">All Severities</MenuItem>
                <MenuItem value="MILD">Mild</MenuItem>
                <MenuItem value="MODERATE">Moderate</MenuItem>
                <MenuItem value="SEVERE">Severe</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
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

export default StrokeCasesFilters;
