import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Typography,
  Chip,
} from '@mui/material';
import {
  Clear as ClearIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { TicketFilter } from '../../../services/ticketService';
import { useHospitals } from '../../../hooks/useHospitals';

interface TicketFiltersProps {
  filters: TicketFilter;
  onFilterChange: (filters: TicketFilter) => void;
  onClose: () => void;
}

const TicketFilters: React.FC<TicketFiltersProps> = ({
  filters,
  onFilterChange,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState<TicketFilter>(filters);
  const { data: hospitals, isLoading: hospitalsLoading } = useHospitals();

  const handleFilterChange = (field: keyof TicketFilter, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: TicketFilter = {};
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const ignoredFilterKeys = ['sortBy', 'sortOrder'];

  const getActiveFilterCount = () => {
    return Object.keys(localFilters).filter(key =>
      !ignoredFilterKeys.includes(key) &&
      localFilters[key as keyof TicketFilter] !== undefined &&
      localFilters[key as keyof TicketFilter] !== null &&
      localFilters[key as keyof TicketFilter] !== ''
    ).length;
  };

  const activeFilterCount = getActiveFilterCount();
  const hasActiveFilters = activeFilterCount > 0;

  const statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_TRANSPORT', label: 'In Transport' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const priorityOptions = [
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'EMERGENCY', label: 'Emergency' },
  ];

  const pathwayOptions = [
    { value: 'GENERAL', label: 'General' },
    { value: 'STEMI', label: 'STEMI' },
    { value: 'STROKE', label: 'Stroke' },
    { value: 'TRAUMA', label: 'Trauma' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon />
          <Typography variant="h6">Filter Tickets</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {hasActiveFilters && (
            <Chip
              label={`${activeFilterCount} active filters`}
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
        {/* Search */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search"
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by patient name, national ID, MRN, or ticket number..."
          />
        </Grid>

        {/* Status */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={localFilters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              label="Status"
            >
              <MenuItem value="">All Statuses</MenuItem>
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Priority */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={localFilters.priority || ''}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              label="Priority"
            >
              <MenuItem value="">All Priorities</MenuItem>
              {priorityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Pathway */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Pathway</InputLabel>
            <Select
              value={localFilters.pathway || ''}
              onChange={(e) => handleFilterChange('pathway', e.target.value)}
              label="Pathway"
            >
              <MenuItem value="">All Pathways</MenuItem>
              {pathwayOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Origin Hospital */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Origin Hospital</InputLabel>
            <Select
              value={localFilters.originHospitalId || ''}
              onChange={(e) => handleFilterChange('originHospitalId', e.target.value)}
              label="Origin Hospital"
              disabled={hospitalsLoading}
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

        {/* Destination Hospital */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Destination Hospital</InputLabel>
            <Select
              value={localFilters.destinationHospitalId || ''}
              onChange={(e) => handleFilterChange('destinationHospitalId', e.target.value)}
              label="Destination Hospital"
              disabled={hospitalsLoading}
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

        {/* Date Range */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={localFilters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={localFilters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
        >
          Clear All
        </Button>
        <Button
          variant="contained"
          onClick={handleApplyFilters}
        >
          Apply Filters
        </Button>
      </Box>
    </Box>
  );
};

export default TicketFilters;
