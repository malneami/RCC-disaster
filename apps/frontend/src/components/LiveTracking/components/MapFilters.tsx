import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { MapFilters as MapFiltersType } from '../types';

interface MapFiltersProps {
  filters: MapFiltersType;
  onFiltersChange: (filters: MapFiltersType) => void;
  onClose: () => void;
}

const MapFiltersComponent: React.FC<MapFiltersProps> = ({ filters, onFiltersChange, onClose }) => {
  const statusOptions = [
    { value: 'AVAILABLE', label: 'Available', color: '#34a853' },
    { value: 'IN_USE', label: 'In Use', color: '#4285f4' },
    { value: 'MAINTENANCE', label: 'Maintenance', color: '#fbbc04' },
    { value: 'OUT_OF_SERVICE', label: 'Out of Service', color: '#ea4335' },
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

  const activeFilterCount = filters.status?.length || 0;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        minWidth: 200,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid #e8eaed',
        }}
      >
        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#202124' }}>
          Filter by status
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ ml: 1 }}>
          <FontAwesomeIcon icon={faTimes} size="sm" color="#5f6368" />
        </IconButton>
      </Box>

      {/* Status Options */}
      <Box sx={{ p: 1.5 }}>
        {statusOptions.map((option) => {
          const isSelected = filters.status?.includes(option.value);
          return (
            <Box
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1,
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: isSelected ? `${option.color}10` : 'transparent',
                '&:hover': {
                  backgroundColor: isSelected ? `${option.color}15` : '#f8f9fa',
                },
                transition: 'background-color 0.15s ease',
              }}
            >
              {/* Status indicator */}
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: option.color,
                  flexShrink: 0,
                }}
              />
              
              {/* Label */}
              <Typography
                sx={{
                  flex: 1,
                  fontSize: '13px',
                  color: '#202124',
                }}
              >
                {option.label}
              </Typography>

              {/* Checkmark */}
              {isSelected && (
                <FontAwesomeIcon icon={faCheck} size="sm" color={option.color} />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <Box
          sx={{
            px: 2,
            pb: 1.5,
          }}
        >
          <Chip
            label={`Clear ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''}`}
            onClick={handleClearAll}
            size="small"
            sx={{
              fontSize: '12px',
              height: 28,
              backgroundColor: '#f1f3f4',
              color: '#5f6368',
              '&:hover': {
                backgroundColor: '#e8eaed',
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default MapFiltersComponent;
