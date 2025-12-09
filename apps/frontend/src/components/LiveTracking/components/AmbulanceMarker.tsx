import React, { useEffect, useRef, useState } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { Box, Typography, Divider, Tabs, Tab, CircularProgress } from '@mui/material';
import { AmbulanceGPSData } from '../types';
import { formatTimeAgo, formatDirection } from '../utils/mapHelpers';
import AmbulanceZoneTimeline from './AmbulanceZoneTimeline';
import '../styles/ambulance-markers.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface AmbulanceMarkerProps {
  ambulance: AmbulanceGPSData;
  isSelected?: boolean;
  onClick?: (ambulance: AmbulanceGPSData) => void;
}

const AmbulanceMarker: React.FC<AmbulanceMarkerProps> = ({ ambulance, isSelected = false, onClick }) => {
  const markerRef = useRef<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [zoneVisits, setZoneVisits] = useState<any[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const position: [number, number] = [ambulance.latitude, ambulance.longitude];

  // Helper to get color based on assignment status (priority) or ambulance status
  const getMarkerColor = () => {
    // Special case: If assignment is ARRIVED, treat as available
    if (ambulance.assignment?.status === 'ARRIVED') {
      return '#4caf50'; // Green - available
    }

    // Priority 1: Active assignment status
    if (ambulance.assignment?.status) {
      switch (ambulance.assignment.status) {
        case 'EMS_CONTACT':
        case 'CONTACTED':
          return '#ff9800'; // Orange - contacted, not moving yet
        case 'EN_ROUTE':
        case 'EMS_ARRIVAL':
          return '#2196f3'; // Blue - on the way
        case 'DEPARTED':
          return '#9c27b0'; // Purple - departed from hospital
        default:
          break;
      }
    }

    // Priority 2: Fall back to ambulance status
    switch (ambulance.status) {
      case 'AVAILABLE': return '#4caf50'; // Green
      case 'IN_USE': return '#2196f3'; // Blue
      case 'MAINTENANCE': return '#ff9800'; // Orange
      case 'OUT_OF_SERVICE': return '#f44336'; // Red
      default: return '#757575'; // Gray
    }
  };

  const statusColor = getMarkerColor();
  const isMoving = (ambulance.speed || 0) > 1; // Moving if speed > 1 km/h

  // Create custom icon with smooth transitions and better design
  const customIcon = new DivIcon({
    html: `
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div class="${isMoving ? 'moving-pulse' : ''}" style="
          position: relative;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2);
          transition: all 0.25s ease;
          border: 2.5px solid ${statusColor};
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="14" height="14" viewBox="0 0 640 512" fill="${statusColor}" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: auto;">
            <path d="M624 352h-16V243.9c0-12.7-5.1-24.9-14.1-33.9L494 110.1c-9-9-21.2-14.1-33.9-14.1H416V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48v320c0 26.5 21.5 48 48 48h16c0 53 43 96 96 96s96-43 96-96h128c0 53 43 96 96 96s96-43 96-96h48c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zM160 464c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm320 0c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm80-208H416V144h44.1l99.9 99.9V256z"/>
          </svg>
        </div>
      </div>
    `,
    className: 'ambulance-marker-animated',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Open popup if selected
  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  // Fetch zone visits when popup opens
  useEffect(() => {
    if (isSelected && ambulance.vehicleImei) {
      fetchZoneVisits();
    }
  }, [isSelected, ambulance.vehicleImei]);

  const fetchZoneVisits = async () => {
    setLoadingZones(true);
    try {
      const response = await fetch(
        `/api/v1/ambulance-tracking/zone-logs?ambulanceId=${ambulance.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setZoneVisits(data.slice(0, 10)); // Show last 10 visits
      }
    } catch (error) {
      console.error('Failed to fetch zone visits:', error);
    } finally {
      setLoadingZones(false);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(ambulance);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Removed status color mapping as requested

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={customIcon}
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
        </Box>
      </Tooltip>

      {/* Popup with tabbed interface */}
      <Popup maxWidth={400} minWidth={320}>
        <Box sx={{ width: '100%' }}>
          {/* Header */}
          <Box sx={{ p: 2, pb: 0 }}>
            <Typography variant="h6" gutterBottom>
              {ambulance.callSign}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {ambulance.plateNumber} • {ambulance.type}
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="ambulance details tabs">
              <Tab label="Details" />
              <Tab label="Zone History" />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
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

              <Divider sx={{ my: 1 }} />

              {/* Speed */}
              {ambulance.speed !== undefined && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Speed
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {Math.round(ambulance.speed)} km/h
                  </Typography>
                </Box>
              )}

              {/* Direction */}
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

              {/* Last Update */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Last Update
                </Typography>
                <Typography variant="body2">
                  {formatTimeAgo(ambulance.lastUpdate)}
                </Typography>
              </Box>

              {/* Location Address */}
              {ambulance.address && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Location
                  </Typography>
                  <Typography variant="body2">{ambulance.address}</Typography>
                </Box>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {loadingZones ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : zoneVisits.length > 0 ? (
                <AmbulanceZoneTimeline
                  ambulanceId={ambulance.id}
                  zoneVisits={zoneVisits.map(visit => ({
                    ...visit,
                    entryTime: new Date(visit.entryTime),
                    exitTime: visit.exitTime ? new Date(visit.exitTime) : null,
                  }))}
                  maxItems={10}
                />
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No zone visits recorded
                  </Typography>
                </Box>
              )}
            </Box>
          </TabPanel>
        </Box>
      </Popup>
    </Marker>
  );
};

export default AmbulanceMarker;

