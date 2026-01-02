import React from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  Typography,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';


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
  };

  const handleClear = () => {
    onClearFilters();
  };

  const hasActiveFilters = 
    !!filters.strokeType ||
    !!filters.status ||
    !!filters.originHospitalId ||
    !!filters.destinationHospitalId ||
    !!filters.modeOfArrival ||
    !!filters.dateFrom ||
    !!filters.dateTo;

  if (!open) return null;

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 2,
        backgroundColor: '#fdfdfd',
        border: '1px solid #e0e0e0'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon />
          <Typography variant="h6">Filter Stroke Cases</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {hasActiveFilters && (
            <Chip
              label={`${[
                filters.strokeType,
                filters.status,
                filters.originHospitalId,
                filters.destinationHospitalId,
                filters.modeOfArrival,
                filters.dateFrom,
                filters.dateTo,
              ].filter(Boolean).length} active filters`}
              color="primary"
              size="small"
            />
          )}
          <IconButton onClick={onClose} size="small">
            <ClearIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
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
        <Grid item xs={12} sm={6} md={4}>
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
        <Grid item xs={12} sm={6} md={4}>
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
        <Grid item xs={12} sm={6} md={4}>
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
        <Grid item xs={12} sm={6} md={4}>
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
        <Grid item xs={12} sm={6} md={4}>
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
        <Grid item xs={12} sm={6} md={4}>
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

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleClear}
          disabled={!hasActiveFilters}
        >
          Clear All
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
        >
          Apply Filters
        </Button>
      </Box>
    </Paper>
  );
};

export default StrokeCasesFilters;
