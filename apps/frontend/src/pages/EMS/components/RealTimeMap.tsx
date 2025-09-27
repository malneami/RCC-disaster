import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

import { useWebSocket } from '../../../hooks/useWebSocket';
import { useAmbulances } from '../hooks/useAmbulances';
import AmbulanceMarker from './AmbulanceMarker';
import MapControls from './MapControls';
import GenericPageHeader from '../../../components/Common/GenericPageHeader';
import EmptyState from '../../../components/Common/EmptyState';

interface AmbulanceLocation {
  id: string;
  callSign: string;
  latitude: number;
  longitude: number;
  status: string;
  speed?: number;
  direction?: number;
  driver?: {
    firstName: string;
    lastName: string;
  };
  lastUpdate: Date;
}

const RealTimeMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [ambulanceLocations, setAmbulanceLocations] = useState<AmbulanceLocation[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<AmbulanceLocation | null>(null);
  const { socket, isConnected } = useWebSocket('ems');
  const { ambulances } = useAmbulances();

  // Initialize map (placeholder - replace with actual map library)
  useEffect(() => {
    if (mapRef.current && !map) {
      // This is a placeholder - you would initialize your map library here
      // For example, with Leaflet:
      // const leafletMap = L.map(mapRef.current).setView([24.7136, 46.6753], 10);
      // setMap(leafletMap);
      
      // For now, we'll just set a placeholder
      setMap({ initialized: true });
    }
  }, [map]);

  // Convert ambulances to location format
  useEffect(() => {
    if (!ambulances || ambulances.length === 0) {
      setAmbulanceLocations([]);
      return;
    }

    const locations: AmbulanceLocation[] = ambulances
      .filter(ambulance => ambulance.currentLocationLat && ambulance.currentLocationLng)
      .map(ambulance => ({
        id: ambulance.id,
        callSign: ambulance.callSign,
        latitude: ambulance.currentLocationLat!,
        longitude: ambulance.currentLocationLng!,
        status: ambulance.status,
        speed: Math.random() * 80, // Placeholder - would come from GPS
        direction: Math.random() * 360, // Placeholder - would come from GPS
        driver: ambulance.driver ? {
          firstName: ambulance.driver.firstName,
          lastName: ambulance.driver.lastName,
        } : undefined,
        lastUpdate: new Date(),
      }));
    
    setAmbulanceLocations(locations);
  }, [ambulances]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('join-ambulance-room', { ambulanceId: 'all' });
      
      socket.on('ambulance-location-update', (data: any) => {
        setAmbulanceLocations(prev => 
          prev.map(location => 
            location.id === data.ambulanceId 
              ? { ...location, ...data.location, lastUpdate: new Date() }
              : location
          )
        );
      });

      return () => {
        socket.off('ambulance-location-update');
      };
    }
  }, [socket, isConnected]);

  const handleRefresh = () => {
    // Refresh ambulance locations
    setAmbulanceLocations(prev => 
      prev.map(location => ({
        ...location,
        lastUpdate: new Date(),
      }))
    );
  };

  const handleCenterMap = () => {
    // Center map on all ambulances
    if (ambulanceLocations.length > 0) {
      const avgLat = ambulanceLocations.reduce((sum, loc) => sum + loc.latitude, 0) / ambulanceLocations.length;
      const avgLng = ambulanceLocations.reduce((sum, loc) => sum + loc.longitude, 0) / ambulanceLocations.length;
      
      // This would center the actual map
      console.log('Center map at:', avgLat, avgLng);
    }
  };

  const handleAmbulanceClick = (ambulance: AmbulanceLocation) => {
    setSelectedAmbulance(selectedAmbulance?.id === ambulance.id ? null : ambulance);
  };

  // Show empty state if no ambulances with location data
  if (!ambulances || ambulances.length === 0 || ambulanceLocations.length === 0) {
    return (
      <Box>
        <GenericPageHeader
          title="Real-Time Ambulance Tracking"
          subtitle="Live GPS tracking of ambulance fleet"
          actions={[]}
        />
        
        <EmptyState
          icon={<FontAwesomeIcon icon={faMapMarkerAlt} size="3x" />}
          title="No Ambulances to Track"
          description="There are no ambulances with GPS location data available for tracking. Add ambulances with location information to start real-time tracking."
          size="large"
        />
      </Box>
    );
  }

  return (
    <Box>
      <GenericPageHeader
        title="Real-Time Ambulance Tracking"
        subtitle="Live GPS tracking of ambulance fleet"
        actions={[]}
      />

      <Paper sx={{ mt: 2, height: 600, position: 'relative', overflow: 'hidden' }}>
        {/* Map Container */}
        <Box
          ref={mapRef}
          sx={{
            width: '100%',
            height: '100%',
            backgroundColor: '#e3f2fd',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Placeholder for map */}
          <Box sx={{ textAlign: 'center', color: '#666' }}>
            <FontAwesomeIcon icon={faMapMarkerAlt} size="3x" />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Map Integration Required
            </Typography>
            <Typography variant="body2">
              Integrate with Leaflet, Mapbox, or Google Maps
            </Typography>
          </Box>

          {/* Ambulance Markers */}
          {ambulanceLocations.map((ambulance) => (
            <Box
              key={ambulance.id}
              sx={{
                position: 'absolute',
                left: `${50 + (ambulance.longitude - 46.6753) * 100}px`,
                top: `${50 + (24.7136 - ambulance.latitude) * 100}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <AmbulanceMarker
                ambulance={ambulance}
                isSelected={selectedAmbulance?.id === ambulance.id}
                onClick={() => handleAmbulanceClick(ambulance)}
              />
            </Box>
          ))}

          {/* Map Controls */}
          <MapControls
            ambulanceLocations={ambulanceLocations}
            onRefresh={handleRefresh}
            onCenterMap={handleCenterMap}
            isConnected={isConnected}
          />
        </Box>
      </Paper>

      {/* Selected Ambulance Details */}
      {selectedAmbulance && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {selectedAmbulance.callSign} Details
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Typography variant="body1">{selectedAmbulance.status}</Typography>
            </Box>
            {selectedAmbulance.driver && (
              <Box>
                <Typography variant="body2" color="text.secondary">Driver</Typography>
                <Typography variant="body1">
                  {selectedAmbulance.driver.firstName} {selectedAmbulance.driver.lastName}
                </Typography>
              </Box>
            )}
            {selectedAmbulance.speed && (
              <Box>
                <Typography variant="body2" color="text.secondary">Speed</Typography>
                <Typography variant="body1">{selectedAmbulance.speed.toFixed(1)} km/h</Typography>
              </Box>
            )}
            <Box>
              <Typography variant="body2" color="text.secondary">Last Update</Typography>
              <Typography variant="body1">
                {selectedAmbulance.lastUpdate.toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default RealTimeMap;