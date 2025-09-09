import React, { useState } from 'react';
import {
  TextField,
  Box,
  IconButton,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Typography,
  Divider,
} from '@mui/material';
import {
  Search,
  Clear,
  Person,
  LocalHospital,
  Assignment,
} from '@mui/icons-material';

export interface SearchFilter {
  type: 'all' | 'patient' | 'hospital' | 'case';
  value: string;
}

export interface PortalSearchProps {
  placeholder?: string;
  onSearch: (query: string, filter: SearchFilter) => void;
  onClear?: () => void;
  portalType: 'stroke' | 'trauma' | 'stemi' | 'patients';
  disabled?: boolean;
  showFilters?: boolean;
}

export const PortalSearch: React.FC<PortalSearchProps> = ({
  placeholder = 'Search by patient name, MRN, or National ID...',
  onSearch,
  onClear,
  portalType,
  disabled = false,
  showFilters = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<SearchFilter>({
    type: 'all',
    value: 'All',
  });
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  const getPortalColor = () => {
    switch (portalType) {
      case 'stroke': return '#1976d2';
      case 'trauma': return '#d32f2f';
      case 'stemi': return '#388e3c';
      case 'patients': return '#7b1fa2';
      default: return '#1976d2';
    }
  };

  const getPortalIcon = () => {
    switch (portalType) {
      case 'stroke': return '🧠';
      case 'trauma': return '🚑';
      case 'stemi': return '❤️';
      case 'patients': return '👥';
      default: return '🏥';
    }
  };

  const filterOptions = [
    { type: 'all', value: 'All', icon: <Search /> },
    { type: 'patient', value: 'Patient', icon: <Person /> },
    { type: 'hospital', value: 'Hospital', icon: <LocalHospital /> },
    { type: 'case', value: 'Case', icon: <Assignment /> },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim(), selectedFilter);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    onClear?.();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterSelect = (filter: typeof filterOptions[0]) => {
    setSelectedFilter({ type: filter.type as any, value: filter.value });
    setFilterAnchorEl(null);
  };

  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
      {/* Search Input */}
      <TextField
        fullWidth
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: getPortalColor() }} />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton
                onClick={handleClear}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <Clear />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: getPortalColor(),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: getPortalColor(),
            },
          },
        }}
      />

      {/* Filter Dropdown */}
      {showFilters && (
        <>
          <Chip
            icon={selectedFilter.type === 'all' ? <Search /> : 
                  selectedFilter.type === 'patient' ? <Person /> :
                  selectedFilter.type === 'hospital' ? <LocalHospital /> : <Assignment />}
            label={selectedFilter.value}
            onClick={handleFilterMenuOpen}
            variant="outlined"
            sx={{
              borderColor: getPortalColor(),
              color: getPortalColor(),
              '&:hover': {
                backgroundColor: `${getPortalColor()}10`,
              },
              minWidth: 120,
            }}
          />

          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterMenuClose}
            PaperProps={{
              sx: {
                borderRadius: 2,
                boxShadow: 3,
                mt: 1,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {getPortalIcon()} Filter by Type
              </Typography>
            </Box>
            <Divider />
            {filterOptions.map((filter) => (
              <MenuItem
                key={filter.type}
                onClick={() => handleFilterSelect(filter)}
                selected={selectedFilter.type === filter.type}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&.Mui-selected': {
                    backgroundColor: `${getPortalColor()}10`,
                    '&:hover': {
                      backgroundColor: `${getPortalColor()}20`,
                    },
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {filter.icon}
                  <Typography variant="body2">{filter.value}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      {/* Search Button */}
      <IconButton
        onClick={handleSearch}
        disabled={disabled || !searchQuery.trim()}
        sx={{
          backgroundColor: getPortalColor(),
          color: 'white',
          '&:hover': {
            backgroundColor: getPortalColor(),
            opacity: 0.9,
          },
          '&:disabled': {
            backgroundColor: 'grey.300',
            color: 'grey.500',
          },
          borderRadius: 2,
          p: 1.5,
        }}
      >
        <Search />
      </IconButton>
    </Box>
  );
};

export default PortalSearch;
