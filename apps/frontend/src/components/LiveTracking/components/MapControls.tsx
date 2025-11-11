import React, { useState, useEffect } from 'react';
import { Box, Paper, IconButton, Tooltip, TextField, InputAdornment, Chip, CircularProgress } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRefresh,
  faExpand,
  faSearch,
  faFilter,
  faMapMarkerAlt,
  faClock,
} from '@fortawesome/free-solid-svg-icons';

interface MapControlsProps {
  onRefresh?: () => void;
  onFitBounds?: () => void;
  onSearchChange?: (query: string) => void;
  onFilterToggle?: () => void;
  isRefreshing?: boolean;
  lastUpdateTime?: Date;
  nextRefreshTime?: Date | null;
  secondsUntilRefresh?: number | null;
  totalAmbulances?: number;
}

const MapControls: React.FC<MapControlsProps> = ({
  onRefresh,
  onFitBounds,
  onSearchChange,
  onFilterToggle,
  isRefreshing = false,
  lastUpdateTime,
  secondsUntilRefresh,
  totalAmbulances = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [countdown, setCountdown] = useState<number | null>(secondsUntilRefresh ?? null);

  // Update countdown every second
  useEffect(() => {
    if (secondsUntilRefresh !== null && secondsUntilRefresh !== undefined) {
      setCountdown(secondsUntilRefresh);
      
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [secondsUntilRefresh]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearchChange) {
      onSearchChange(query);
    }
  };

  const formatCountdown = (seconds: number | null): string => {
    if (seconds === null) return '--';
    if (seconds <= 0) return 'Refreshing...';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        maxWidth: 280,
      }}
    >
      {/* Search Bar */}
      <Paper
        elevation={3}
        sx={{
          p: 1.5,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <TextField
          size="small"
          placeholder="Search ambulances..."
          value={searchQuery}
          onChange={handleSearchChange}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FontAwesomeIcon icon={faSearch} size="sm" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Control Panel */}
      <Paper
        elevation={3}
        sx={{
          p: 1.5,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Stats Row */}
        <Box sx={{ mb: 1.5, display: 'flex', gap: 1, flexDirection: 'column' }}>
          {/* Countdown Timer */}
          {countdown !== null && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.5,
                py: 1,
                backgroundColor: '#e3f2fd',
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FontAwesomeIcon icon={faClock} color="#1976d2" />
                <Box sx={{ fontSize: '13px', color: '#1976d2', fontWeight: 500 }}>
                  Next refresh
                </Box>
              </Box>
              <Chip
                label={formatCountdown(countdown)}
                size="small"
                color="primary"
                sx={{ fontSize: '12px', height: '24px', fontWeight: 'bold' }}
              />
            </Box>
          )}

          {/* Total Ambulances */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.5,
              py: 1,
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FontAwesomeIcon icon={faMapMarkerAlt} color="#666" />
              <Box sx={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>
                Total Ambulances
              </Box>
            </Box>
            <Chip
              label={totalAmbulances}
              size="small"
              sx={{ 
                fontSize: '12px', 
                height: '24px', 
                fontWeight: 'bold',
                backgroundColor: '#1976d2',
                color: 'white',
              }}
            />
          </Box>
        </Box>

        {/* Action Buttons Row */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
          {/* Refresh Button */}
          <Tooltip title="Refresh now" placement="bottom">
            <span style={{ flex: 1 }}>
              <IconButton
                onClick={onRefresh}
                disabled={isRefreshing}
                color="primary"
                size="medium"
                sx={{
                  width: '100%',
                  backgroundColor: '#f5f5f5',
                  '&:hover': { backgroundColor: '#e0e0e0' },
                  borderRadius: 1,
                }}
              >
                {isRefreshing ? (
                  <CircularProgress size={20} />
                ) : (
                  <FontAwesomeIcon icon={faRefresh} />
                )}
              </IconButton>
            </span>
          </Tooltip>

          {/* Fit Bounds Button */}
          <Tooltip title="Fit all ambulances" placement="bottom">
            <IconButton
              onClick={onFitBounds}
              color="primary"
              size="medium"
              sx={{
                flex: 1,
                backgroundColor: '#f5f5f5',
                '&:hover': { backgroundColor: '#e0e0e0' },
                borderRadius: 1,
              }}
            >
              <FontAwesomeIcon icon={faExpand} />
            </IconButton>
          </Tooltip>

          {/* Filter Button */}
          {onFilterToggle && (
            <Tooltip title="Filters" placement="bottom">
              <IconButton
                onClick={onFilterToggle}
                color="primary"
                size="medium"
                sx={{
                  flex: 1,
                  backgroundColor: '#f5f5f5',
                  '&:hover': { backgroundColor: '#e0e0e0' },
                  borderRadius: 1,
                }}
              >
                <FontAwesomeIcon icon={faFilter} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Last Update Info */}
        {lastUpdateTime && (
          <Box
            sx={{
              mt: 1.5,
              pt: 1.5,
              borderTop: '1px solid #e0e0e0',
              textAlign: 'center',
              fontSize: '11px',
              color: 'text.secondary',
            }}
          >
            Last update: {lastUpdateTime.toLocaleTimeString()}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MapControls;

