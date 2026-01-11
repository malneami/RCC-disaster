import React from 'react';
import {
  Box,
  Button,
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
import { FilterField, FilterFieldComponent } from '../../../components/Common/FilterComponents';

interface TraumaCasesFiltersProps {
  open: boolean;
  onClose: () => void;
  fields: FilterField[];
  values: Record<string, any>;
  hospitals?: Array<{ id: string; name: string }>;
  onApply: (values: Record<string, any>) => void;
  onClearFilters: () => void;
  onChange?: (values: Record<string, any>) => void; // New prop for live updates
}

const TraumaCasesFilters: React.FC<TraumaCasesFiltersProps> = ({
  open,
  onClose,
  fields,
  values,
  hospitals = [],
  onApply,
  onClearFilters,
  onChange,
}) => {
  // Controlled component: use values prop directly

  const handleFilterChange = (key: string, value: any) => {
    // If onChange prop is present (for live filtering)
    if (onChange) {
      onChange({ ...values, [key]: value });
    }
  };

  const handleApply = () => {
    // Just trigger onApply with current values
    onApply(values);
  };

  const handleClear = () => {
    onClearFilters();
  };

  // Check for active filters (excluding search which is shown separately)
  const hasActiveFilters = Object.entries(values).some(([key, value]) => {
    if (key === 'search') return false;
    // Handle boolean values (criticalCase, transferCase can be true/false/null)
    if (typeof value === 'boolean') return true;
    if (value === null) return false;
    return value !== undefined && value !== '';
  });

  const activeFiltersCount = Object.entries(values).filter(([key, value]) => {
    if (key === 'search') return false;
    // Handle boolean values
    if (typeof value === 'boolean') return true;
    if (value === null) return false;
    return value !== undefined && value !== '';
  }).length;

  if (!open) return null;

  // Filter out search field as it's shown separately in the search bar
  const filterFields = fields.filter(field => field.key !== 'search');

  // Add hospital field if hospitals are provided and not already in fields
  const hasHospitalField = filterFields.some(f => f.key === 'hospitalId');
  const fieldsWithHospital = hasHospitalField
    ? filterFields
    : [
      ...filterFields,
      {
        key: 'hospitalId',
        label: 'Hospital',
        type: 'select' as const,
        options: hospitals.map(h => ({ value: h.id, label: h.name })),
      }
    ];

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
          <Typography variant="h6">Filter Trauma Cases</Typography>
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
        {fieldsWithHospital.map((field) => {
          // Handle special cases for boolean fields (criticalCase, transferCase)
          // These come as booleans/null but need to be displayed as strings in the select
          let currentValue = values[field.key];
          if ((field.key === 'criticalCase' || field.key === 'transferCase')) {
            if (currentValue === true) {
              currentValue = 'true';
            } else if (currentValue === false) {
              currentValue = 'false';
            } else {
              currentValue = '';
            }
          }

          return (
            <Grid item xs={12} sm={6} md={4} key={field.key}>
              <FilterFieldComponent
                field={field}
                value={currentValue || ''}
                onChange={(key, newValue) => {
                  // Store as string for boolean fields, will be converted on apply
                  if ((key === 'criticalCase' || key === 'transferCase')) {
                    handleFilterChange(key, newValue || null);
                  } else {
                    handleFilterChange(key, newValue || undefined);
                  }
                }}
              />
            </Grid>
          );
        })}
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

export default TraumaCasesFilters;
