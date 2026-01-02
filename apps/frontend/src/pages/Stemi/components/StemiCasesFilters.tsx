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
import { FilterField } from '../../../components/Common/FilterComponents';

interface StemiCasesFiltersProps {
  open: boolean;
  onClose: () => void;
  fields: FilterField[];
  values: Record<string, any>;
  onFiltersChange: (values: Record<string, any>) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const StemiCasesFilters: React.FC<StemiCasesFiltersProps> = ({
  open,
  onClose,
  fields,
  values,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
}) => {
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({ ...values, [key]: value });
  };

  const handleApply = () => {
    onApplyFilters();
  };

  const handleClear = () => {
    onClearFilters();
  };

  const hasActiveFilters = Object.entries(values).some(([key, value]) => {
    // Exclude search from active filter count as it's shown separately
    if (key === 'search') return false;
    // Handle boolean values (rccActivated can be true/false)
    if (typeof value === 'boolean') return true;
    return value !== undefined && value !== null && value !== '';
  });

  const activeFiltersCount = Object.entries(values).filter(([key, value]) => {
    if (key === 'search') return false;
    // Handle boolean values (rccActivated can be true/false)
    if (typeof value === 'boolean') return true;
    return value !== undefined && value !== null && value !== '';
  }).length;

  if (!open) return null;

  const renderFilterField = (field: FilterField) => {
    switch (field.type) {
      case 'select':
        // Handle boolean values that come as strings from select
        const currentValue = values[field.key];
        const displayValue = currentValue === true || currentValue === 'true' ? 'true' :
                            currentValue === false || currentValue === 'false' ? 'false' :
                            currentValue || '';
        
        return (
          <FormControl fullWidth>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={displayValue}
              label={field.label}
              onChange={(e) => {
                const val = e.target.value;
                // Convert string 'true'/'false' to boolean for rccActivated
                if (field.key === 'rccActivated') {
                  handleFilterChange(field.key, val === 'true' ? true : val === 'false' ? false : undefined);
                } else {
                  handleFilterChange(field.key, val || undefined);
                }
              }}
            >
              <MenuItem value="">All</MenuItem>
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'text':
        return (
          <TextField
            fullWidth
            label={field.label}
            value={values[field.key] || ''}
            onChange={(e) => handleFilterChange(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'date':
        return (
          <TextField
            fullWidth
            type="date"
            label={field.label}
            value={values[field.key] || ''}
            onChange={(e) => handleFilterChange(field.key, e.target.value || undefined)}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              max: field.key === 'startDate' ? values.endDate || undefined : undefined,
              min: field.key === 'endDate' ? values.startDate || undefined : undefined,
            }}
          />
        );

      default:
        return null;
    }
  };

  // Filter out search field as it's shown separately in the search bar
  const filterFields = fields.filter(field => field.key !== 'search');

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
          <Typography variant="h6">Filter STEMI Cases</Typography>
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
        {filterFields.map((field) => (
          <Grid item xs={12} sm={6} md={4} key={field.key}>
            {renderFilterField(field)}
          </Grid>
        ))}
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

export default StemiCasesFilters;
