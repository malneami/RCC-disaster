import React, { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, TextField, CircularProgress } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRefresh,
  faExpand,
  faSearch,
  faFilter,
  faTimes,
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

// Shared styles for map control buttons
const controlButtonStyle = {
  width: 40,
  height: 40,
  backgroundColor: 'white',
  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  borderRadius: '8px',
  '&:hover': { 
    backgroundColor: '#f5f5f5',
  },
  '&:disabled': {
    backgroundColor: 'white',
    opacity: 0.6,
  },
};

const MapControls: React.FC<MapControlsProps> = ({
  onRefresh,
  onFitBounds,
  onSearchChange,
  onFilterToggle,
  isRefreshing = false,
  secondsUntilRefresh,
  totalAmbulances = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [countdown, setCountdown] = useState<number | null>(secondsUntilRefresh ?? null);
  const [showSearch, setShowSearch] = useState(false);

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
    onSearchChange?.(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearchChange?.('');
    setShowSearch(false);
  };

  return (
    <>
      {/* Search Bar - Top center when expanded */}
      {showSearch && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: 320,
            maxWidth: 'calc(100% - 120px)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'white',
              borderRadius: '24px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              pl: 2,
              pr: 0.5,
            }}
          >
            <FontAwesomeIcon icon={faSearch} size="sm" color="#5f6368" />
            <TextField
              size="small"
              placeholder="Search ambulances..."
              value={searchQuery}
              onChange={handleSearchChange}
              autoFocus
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { border: 'none' },
                },
                '& .MuiInputBase-input': {
                  py: 1.25,
                  px: 1.5,
                  fontSize: '14px',
                },
              }}
            />
            <IconButton size="small" onClick={handleClearSearch} sx={{ mr: 0.5 }}>
              <FontAwesomeIcon icon={faTimes} size="sm" color="#5f6368" />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Control Buttons - Right side stack (Google Maps style) */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {/* Search Button */}
        {!showSearch && (
          <Tooltip title="Search ambulances" placement="left">
            <IconButton
              onClick={() => setShowSearch(true)}
              sx={controlButtonStyle}
            >
              <FontAwesomeIcon icon={faSearch} size="sm" color="#5f6368" />
            </IconButton>
          </Tooltip>
        )}

        {/* Filter Button */}
        {onFilterToggle && (
          <Tooltip title="Filter by status" placement="left">
            <IconButton
              onClick={onFilterToggle}
              sx={controlButtonStyle}
            >
              <FontAwesomeIcon icon={faFilter} size="sm" color="#5f6368" />
            </IconButton>
          </Tooltip>
        )}

        {/* Refresh Button with countdown */}
        <Tooltip 
          title={countdown !== null && countdown > 0 ? `Refresh (${countdown}s)` : 'Refresh now'} 
          placement="left"
        >
          <span>
            <IconButton
              onClick={onRefresh}
              disabled={isRefreshing}
              sx={{
                ...controlButtonStyle,
                position: 'relative',
              }}
            >
              {isRefreshing ? (
                <CircularProgress size={18} sx={{ color: '#5f6368' }} />
              ) : (
                <FontAwesomeIcon icon={faRefresh} size="sm" color="#5f6368" />
              )}
            </IconButton>
          </span>
        </Tooltip>

        {/* Fit Bounds Button */}
        <Tooltip title="Fit all on map" placement="left">
          <IconButton
            onClick={onFitBounds}
            sx={controlButtonStyle}
          >
            <FontAwesomeIcon icon={faExpand} size="sm" color="#5f6368" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Status Pill - Bottom right (subtle info) */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          zIndex: 1000,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            px: 1.5,
            py: 0.75,
            fontSize: '12px',
            fontWeight: 500,
            color: '#5f6368',
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isRefreshing ? '#fbbc04' : '#34a853',
              animation: isRefreshing ? 'pulse 1s infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          />
          {totalAmbulances} ambulances
        </Box>
      </Box>
    </>
  );
};

export default MapControls;
