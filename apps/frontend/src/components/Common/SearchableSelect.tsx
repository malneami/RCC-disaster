import React from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';

interface SearchableSelectOption {
  id: string;
  label: string;
  subtitle?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  label: string;
  value: string | null;
  options: SearchableSelectOption[];
  onChange: (value: string | null) => void;
  loading?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  fullWidth?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  options,
  onChange,
  loading = false,
  disabled = false,
  error = false,
  helperText,
  placeholder,
  required = false,
  fullWidth = true,
}) => {
  const selectedOption = options.find(option => option.id === value) || null;

  return (
    <Autocomplete
      value={selectedOption}
      onChange={(_, newValue) => {
        onChange(newValue?.id || null);
      }}
      options={options}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      loading={loading}
      disabled={disabled}
      fullWidth={fullWidth}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText}
          placeholder={placeholder}
          required={required}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {option.label}
            </Typography>
            {option.subtitle && (
              <Typography variant="caption" color="text.secondary">
                {option.subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      noOptionsText="No options found"
      loadingText="Loading..."
    />
  );
};

export default SearchableSelect;
