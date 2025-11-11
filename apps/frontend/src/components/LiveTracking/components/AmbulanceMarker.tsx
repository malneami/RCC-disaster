import React, { useEffect, useRef } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { Box, Typography, Chip, Divider } from '@mui/material';
import { AmbulanceGPSData } from '../types';
import { createMarkerHTML, formatTimeAgo, formatDirection, getStatusColor } from '../utils/mapHelpers';

interface AmbulanceMarkerProps {
  ambulance: AmbulanceGPSData;
  isSelected?: boolean;
  onClick?: (ambulance: AmbulanceGPSData) => void;
}

const AmbulanceMarker: React.FC<AmbulanceMarkerProps> = ({ 
  ambulance, 
  isSelected = false, 
  onClick 
}) => {
  const markerRef = useRef<any>(null);

  // Create custom icon
  const icon = new DivIcon({
    html: createMarkerHTML(ambulance, isSelected),
    className: 'custom-ambulance-marker',
    iconSize: [isSelected ? 40 : 32, isSelected ? 40 : 32],
    iconAnchor: [isSelected ? 20 : 16, isSelected ? 20 : 16],
  });

  // Open popup if selected
  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  const handleClick = () => {
    if (onClick) {
      onClick(ambulance);
    }
  };

  const statusColor = getStatusColor(ambulance.status);

  return (
    <Marker
      ref={markerRef}
      position={[ambulance.latitude, ambulance.longitude]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
      }}
    >
      {/* Tooltip on hover */}
      <Tooltip direction="top" offset={[0, -15]} opacity={0.9}>
        <Box sx={{ minWidth: 150 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {ambulance.callSign}
          </Typography>
          <Typography variant="caption" display="block">
            {ambulance.plateNumber}
          </Typography>
          <Chip
            label={ambulance.status}
            size="small"
            sx={{
              mt: 0.5,
              backgroundColor: statusColor,
              color: 'white',
              fontSize: '10px',
              height: '18px',
            }}
          />
        </Box>
      </Tooltip>

      {/* Popup with detailed information */}
      <Popup maxWidth={350} minWidth={280}>
        <Box sx={{ p: 1 }}>
          {/* Header */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {ambulance.callSign}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {ambulance.plateNumber} • {ambulance.type}
            </Typography>
          </Box>

          {/* Status */}
          <Box sx={{ mb: 2 }}>
            <Chip
              label={ambulance.status.replace(/_/g, ' ')}
              size="small"
              sx={{
                backgroundColor: statusColor,
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Driver Information */}
          {ambulance.driver && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Driver
              </Typography>
              <Typography variant="body2">
                {ambulance.driver.firstName} {ambulance.driver.lastName}
              </Typography>
              {ambulance.driver.phoneNumber && (
                <Typography variant="caption" color="text.secondary">
                  {ambulance.driver.phoneNumber}
                </Typography>
              )}
            </Box>
          )}

          {/* Direction Information */}
          {ambulance.direction !== undefined && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Direction
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatDirection(ambulance.direction)}
              </Typography>
            </Box>
          )}

          {/* Fuel Level */}
          {ambulance.fuelLevel !== undefined && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Fuel Level
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    flex: 1,
                    height: 8,
                    backgroundColor: '#e0e0e0',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${ambulance.fuelLevel}%`,
                      height: '100%',
                      backgroundColor: ambulance.fuelLevel > 30 ? '#4caf50' : '#f44336',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
                <Typography variant="body2" fontWeight="bold">
                  {Math.round(ambulance.fuelLevel)}%
                </Typography>
              </Box>
            </Box>
          )}

          {/* Location Address */}
          {ambulance.address && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Location
              </Typography>
              <Typography variant="body2">{ambulance.address}</Typography>
            </Box>
          )}

          {/* Assignment Information */}
          {ambulance.assignment && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Current Assignment
              </Typography>
              <Typography variant="body2">
                Ticket: {ambulance.assignment.ticketId}
              </Typography>
              <Typography variant="caption">
                Status: {ambulance.assignment.status}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 1 }} />

          {/* Last Update */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Last updated: {formatTimeAgo(ambulance.lastUpdate)}
            </Typography>
          </Box>
        </Box>
      </Popup>
    </Marker>
  );
};

export default AmbulanceMarker;

