import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  IconButton,
  Chip,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { MapFilters as MapFiltersType } from '../types';

interface MapFiltersProps {
  filters: MapFiltersType;
  onFiltersChange: (filters: MapFiltersType) => void;
  onClose: () => void;
}

const MapFiltersComponent: React.FC<MapFiltersProps> = ({ filters, onFiltersChange, onClose }) => {
  const statusOptions = [
    { value: 'AVAILABLE', label: 'Available', color: '#4caf50' },
    { value: 'IN_USE', label: 'In Use', color: '#2196f3' },
    { value: 'MAINTENANCE', label: 'Maintenance', color: '#ff9800' },
    { value: 'OUT_OF_SERVICE', label: 'Out of Service', color: '#f44336' },
  ];

  const handleStatusChange = (status: string) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    
    onFiltersChange({ ...filters, status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleClearAll = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = (filters.status && filters.status.length > 0);

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1000,
        p: 2,
        width: 280,
        maxHeight: '80vh',
        overflow: 'auto',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <IconButton size="small" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </IconButton>
      </Box>

      {/* Clear All Button */}
      {hasActiveFilters && (
        <Box sx={{ mb: 2 }}>
          <Chip
            label="Clear All Filters"
            onDelete={handleClearAll}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ width: '100%' }}
          />
        </Box>
      )}

      {/* Status Filters */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Status
        </Typography>
        <FormGroup>
          {statusOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={filters.status?.includes(option.value) || false}
                  onChange={() => handleStatusChange(option.value)}
                  size="small"
                  sx={{
                    color: option.color,
                    '&.Mui-checked': {
                      color: option.color,
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: option.color,
                    }}
                  />
                  <Typography variant="body2">{option.label}</Typography>
                </Box>
              }
            />
          ))}
        </FormGroup>
      </Box>
    </Paper>
  );
};

export default MapFiltersComponent;

