import React, { useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
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
  };

  const handleClear = () => {
    onClearFilters();
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    return value !== undefined && value !== null && value !== '';
  });

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    return value !== undefined && value !== null && value !== '';
  }).length;

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
          <Typography variant="h6">Filter Beds</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {hasActiveFilters && (
            <Chip
              label={`${activeFiltersCount} active filters`}
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
        {isAdmin && (
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Hospital</InputLabel>
              <Select
                value={filters.hospitalId || ''}
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
        <Grid item xs={12} sm={6} md={4}>
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
              <MenuItem value="OCCUPIED">Occupied</MenuItem>
              <MenuItem value="VACANT">Vacant</MenuItem>
              <MenuItem value="CLEANING">Cleaning</MenuItem>
              <MenuItem value="BLOCKED">Blocked</MenuItem>
              <MenuItem value="RESERVED">Reserved</MenuItem>
            </Select>
          </FormControl>
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

export default BedsFilters;
