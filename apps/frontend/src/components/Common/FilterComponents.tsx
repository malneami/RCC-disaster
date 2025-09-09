import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Chip,
  Typography,
  Grid,
} from '@mui/material';

// Base filter field interface
export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'boolean' | 'text' | 'number' | 'date' | 'multiselect';
  options?: { value: string; label: string }[];
  gridSize?: number;
  placeholder?: string;
  validation?: any;
  defaultValue?: any;
}

// Filter chip interface
export interface FilterChip {
  key: string;
  label: string;
  value: any;
  resetValue: any;
}

// Props for individual filter field components
interface FilterFieldProps {
  field: FilterField;
  value: any;
  onChange: (key: string, value: any) => void;
}

// Props for filter chips display
interface FilterChipsProps {
  chips: FilterChip[];
  onDelete: (chip: FilterChip) => void;
  title?: string;
}

// Props for filter form
interface FilterFormProps {
  fields: FilterField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  spacing?: number;
}

/**
 * Individual filter field component
 */
export const FilterFieldComponent: React.FC<FilterFieldProps> = ({
  field,
  value,
  onChange,
}) => {
  const handleChange = (newValue: any) => {
    onChange(field.key, newValue);
  };

  switch (field.type) {
    case 'select':
      return (
        <FormControl fullWidth>
          <InputLabel>{field.label}</InputLabel>
          <Select
            value={value || ''}
            onChange={(e) => handleChange(e.target.value || '')}
            label={field.label}
          >
            {field.options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );

    case 'boolean':
      return (
        <FormControl fullWidth>
          <InputLabel>{field.label}</InputLabel>
          <Select
            value={value === undefined ? '' : value.toString()}
            onChange={(e) => handleChange(e.target.value === '' ? undefined : e.target.value === 'true')}
            label={field.label}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Available</MenuItem>
            <MenuItem value="false">Not Available</MenuItem>
          </Select>
        </FormControl>
      );

    case 'text':
      return (
        <TextField
          fullWidth
          label={field.label}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );

    case 'number':
      return (
        <TextField
          fullWidth
          type="number"
          label={field.label}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : '')}
          placeholder={field.placeholder}
        />
      );

    case 'date':
      return (
        <TextField
          fullWidth
          type="date"
          label={field.label}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      );

    case 'multiselect':
      return (
        <FormControl fullWidth>
          <InputLabel>{field.label}</InputLabel>
          <Select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => handleChange(e.target.value)}
            label={field.label}
          >
            {field.options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );

    default:
      return null;
  }
};

/**
 * Filter chips display component
 */
export const FilterChips: React.FC<FilterChipsProps> = ({
  chips,
  onDelete,
  title = 'Active Filters:',
}) => {
  if (chips.length === 0) return null;

  return (
    <Box mt={3}>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {chips.map((chip) => (
          <Chip 
            key={chip.key}
            label={chip.label} 
            onDelete={() => onDelete(chip)}
            size="small"
          />
        ))}
      </Box>
    </Box>
  );
};

/**
 * Filter form component with grid layout
 */
export const FilterForm: React.FC<FilterFormProps> = ({
  fields,
  values,
  onChange,
  spacing = 3,
}) => {
  return (
    <Grid container spacing={spacing}>
      {fields.map((field) => (
        <Grid item xs={12} sm={field.gridSize || 6} key={field.key}>
          <FilterFieldComponent
            field={field}
            value={values[field.key]}
            onChange={onChange}
          />
        </Grid>
      ))}
    </Grid>
  );
};

/**
 * Utility function to generate filter chips from field configuration and values
 */
export const generateFilterChips = (
  fields: FilterField[],
  values: Record<string, any>
): FilterChip[] => {
  const chips: FilterChip[] = [];

  fields.forEach((field) => {
    const value = values[field.key];
    
    if (value === undefined || value === '' || value === null) return;

    let label = '';
    let resetValue: any = '';

    switch (field.type) {
      case 'select':
        const option = field.options?.find(opt => opt.value === value);
        label = `${field.label}: ${option?.label || value}`;
        resetValue = '';
        break;

      case 'boolean':
        label = `${field.label}: ${value ? 'Available' : 'Not Available'}`;
        resetValue = undefined;
        break;

      case 'text':
      case 'number':
        label = `${field.label}: ${value}`;
        resetValue = '';
        break;

      case 'date':
        label = `${field.label}: ${new Date(value).toLocaleDateString()}`;
        resetValue = '';
        break;

      case 'multiselect':
        if (Array.isArray(value) && value.length > 0) {
          const selectedLabels = value
            .map(v => field.options?.find(opt => opt.value === v)?.label || v)
            .join(', ');
          label = `${field.label}: ${selectedLabels}`;
          resetValue = [];
        }
        break;
    }

    if (label) {
      chips.push({
        key: field.key,
        label,
        value,
        resetValue,
      });
    }
  });

  return chips;
};

/**
 * Utility function to get active filters count
 */
export const getActiveFiltersCount = (
  fields: FilterField[],
  values: Record<string, any>
): number => {
  return generateFilterChips(fields, values).length;
};

/**
 * Utility function to reset all filters
 */
export const resetFilters = (fields: FilterField[]): Record<string, any> => {
  const resetValues: Record<string, any> = {};
  
  fields.forEach((field) => {
    switch (field.type) {
      case 'multiselect':
        resetValues[field.key] = [];
        break;
      case 'boolean':
        resetValues[field.key] = undefined;
        break;
      default:
        resetValues[field.key] = '';
    }
  });

  return resetValues;
};
