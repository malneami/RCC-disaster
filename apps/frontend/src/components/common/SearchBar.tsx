import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Typography,
  Box,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

export interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  onReset?: () => void;
  placeholder?: string;
  onToggleFilters?: () => void;
  resultCount?: number;
  resultLabel?: string;
  showFilterButton?: boolean;
  filterButtonText?: string;
  showResetButton?: boolean;
  resetButtonText?: string;
  sx?: any;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
  onReset,
  placeholder = "Search...",
  onToggleFilters,
  resultCount,
  resultLabel = "results found",
  showFilterButton = true,
  filterButtonText = "Filters",
  showResetButton = true,
  resetButtonText = "Reset",
  sx = {},
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <Card sx={{ mb: 3, ...sx }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={onSearch}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          {showFilterButton && onToggleFilters && (
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={onToggleFilters}
              >
                {filterButtonText}
              </Button>
            </Grid>
          )}
          
          {showResetButton && onReset && (
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                startIcon={<ClearIcon />}
                onClick={onReset}
              >
                {resetButtonText}
              </Button>
            </Grid>
          )}
          
          <Grid item xs={12} md={showFilterButton && showResetButton ? 2 : showFilterButton || showResetButton ? 4 : 6}>
            {resultCount !== undefined ? (
              <Typography variant="body2" color="text.secondary">
                {resultCount} {resultLabel}
              </Typography>
            ) : (
              <Box />
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SearchBar;
