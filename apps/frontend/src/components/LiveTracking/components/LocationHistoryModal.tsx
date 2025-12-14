import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faHistory, faChevronUp, faRoute } from '@fortawesome/free-solid-svg-icons';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { subHours } from 'date-fns';
import { emsService } from '../../../pages/EMS/services/emsService';

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  direction?: number;
  hasGapBefore?: boolean;
  gapMinutes?: number;
}

interface LocationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ambulanceId: string;
  ambulanceCallSign: string;
  onRouteLoaded: (route: RoutePoint[], ambulanceCallSign: string) => void;
  onClearRoute: () => void;
}

const LocationHistoryModal: React.FC<LocationHistoryModalProps> = ({
  isOpen,
  onClose,
  ambulanceId,
  ambulanceCallSign,
  onRouteLoaded,
  onClearRoute,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [startTime, setStartTime] = useState<Date | null>(subHours(new Date(), 24));
  const [endTime, setEndTime] = useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ points: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleShowRoute = async () => {
    setError(null);
    
    if (!startTime || !endTime) {
      setError('Select both start and end times');
      return;
    }

    if (startTime >= endTime) {
      setError('Start must be before end time');
      return;
    }

    const diffDays = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 10) {
      setError('Max 10 days range');
      return;
    }

    setIsLoading(true);
    try {
      const routeData = await emsService.getAmbulanceRoute(ambulanceId, {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        limit: 2000,
      });

      if (routeData && routeData.length > 0) {
        onRouteLoaded(routeData, ambulanceCallSign);
        setRouteInfo({ points: routeData.length });
        setIsExpanded(false);
      } else {
        setError('No data for this period');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    onClearRoute();
    setRouteInfo(null);
    setError(null);
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  if (!isOpen) return null;

  const timePresets = [
    { label: '1h', hours: 1 },
    { label: '6h', hours: 6 },
    { label: '12h', hours: 12 },
    { label: '24h', hours: 24 },
  ];

  // Collapsed mini view
  if (!isExpanded) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: isMobile ? 'auto' : 10,
          bottom: isMobile ? 60 : 'auto',
          left: 10,
          zIndex: 1001,
        }}
      >
        <Box
          onClick={() => setIsExpanded(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1,
            backgroundColor: '#4285f4',
            color: 'white',
            borderRadius: '24px',
            boxShadow: '0 2px 8px rgba(66,133,244,0.4)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#3367d6',
              transform: 'scale(1.02)',
            },
          }}
        >
          <FontAwesomeIcon icon={faRoute} size="sm" />
          <Box>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.2 }}>
              {ambulanceCallSign}
            </Typography>
            <Typography sx={{ fontSize: '10px', opacity: 0.9 }}>
              {routeInfo?.points || 0} points
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            sx={{ color: 'white', p: 0.25, ml: 0.5 }}
          >
            <FontAwesomeIcon icon={faTimes} size="xs" />
          </IconButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        // Mobile: bottom sheet style, Desktop: top-left card
        top: isMobile ? 'auto' : 10,
        bottom: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : 10,
        right: isMobile ? 0 : 'auto',
        zIndex: 1001,
        backgroundColor: 'white',
        borderRadius: isMobile ? '16px 16px 0 0' : '16px',
        boxShadow: isMobile 
          ? '0 -4px 20px rgba(0,0,0,0.15)' 
          : '0 4px 20px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        width: isMobile ? '100%' : 300,
        maxWidth: isMobile ? '100%' : 300,
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              backgroundColor: '#e8f0fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FontAwesomeIcon icon={faHistory} color="#4285f4" />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#202124' }}>
              Route History
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#5f6368' }}>
              {ambulanceCallSign}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {!isMobile && (
            <IconButton 
              size="small" 
              onClick={() => setIsExpanded(false)}
              sx={{ color: '#5f6368' }}
            >
              <FontAwesomeIcon icon={faChevronUp} size="sm" />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ color: '#5f6368' }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2 }}>
        {/* Quick time presets - chips style */}
        <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#5f6368', mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Quick Select
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
          {timePresets.map(({ label, hours }) => (
            <Box
              key={label}
              onClick={() => {
                setStartTime(subHours(new Date(), hours));
                setEndTime(new Date());
              }}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: '20px',
                backgroundColor: '#f1f3f4',
                color: '#5f6368',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': {
                  backgroundColor: '#e8f0fe',
                  color: '#4285f4',
                },
              }}
            >
              Last {label}
            </Box>
          ))}
        </Box>

        {/* Date pickers - stacked on mobile */}
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            <DateTimePicker
              label="From"
              value={startTime}
              onChange={setStartTime}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      fontSize: '13px',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '13px',
                    },
                  },
                },
              }}
              maxDateTime={endTime || new Date()}
            />
            <DateTimePicker
              label="To"
              value={endTime}
              onChange={setEndTime}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      fontSize: '13px',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '13px',
                    },
                  },
                },
              }}
              maxDateTime={new Date()}
              minDateTime={startTime || undefined}
            />
          </Box>
        </LocalizationProvider>

        {/* Messages */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              py: 0.5,
              borderRadius: '10px',
              '& .MuiAlert-message': { fontSize: '12px' } 
            }}
          >
            {error}
          </Alert>
        )}

        {routeInfo && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
              p: 1.5,
              backgroundColor: '#e6f4ea',
              borderRadius: '10px',
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#34a853',
              }}
            />
            <Typography sx={{ fontSize: '12px', color: '#137333', fontWeight: 500 }}>
              {routeInfo.points} points loaded on map
            </Typography>
          </Box>
        )}

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={handleShowRoute}
            disabled={isLoading}
            fullWidth
            sx={{
              fontSize: '14px',
              py: 1.25,
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: '10px',
              backgroundColor: '#4285f4',
              boxShadow: 'none',
              '&:hover': { 
                backgroundColor: '#3367d6',
                boxShadow: '0 2px 8px rgba(66,133,244,0.3)',
              },
            }}
            startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <FontAwesomeIcon icon={faRoute} />}
          >
            {isLoading ? 'Loading...' : 'Show Route'}
          </Button>
          {routeInfo && (
            <Button
              variant="outlined"
              onClick={handleClear}
              sx={{
                fontSize: '14px',
                py: 1.25,
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: '10px',
                minWidth: 80,
                borderColor: '#dadce0',
                color: '#5f6368',
                '&:hover': {
                  borderColor: '#5f6368',
                  backgroundColor: '#f8f9fa',
                },
              }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Box>

      {/* Mobile drag handle */}
      {isMobile && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#dadce0',
          }}
        />
      )}
    </Box>
  );
};

export default LocationHistoryModal;

