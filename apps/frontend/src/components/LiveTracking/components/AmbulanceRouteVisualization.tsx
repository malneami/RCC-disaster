import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Box, Paper, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { emsService } from '../../../pages/EMS/services/emsService';
import { format } from 'date-fns';

interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  direction?: number;
  distanceFromPrevious?: number;
  timeFromPrevious?: number;
}

interface AmbulanceRouteVisualizationProps {
  ambulanceId: string;
  ambulanceCallSign?: string;
  startTime?: Date;
  endTime?: Date;
  height?: number | string;
  onClose?: () => void;
}

// Component to fit map bounds to route
const RouteBoundsFitter: React.FC<{ route: RoutePoint[] }> = ({ route }) => {
  const map = useMap();

  useEffect(() => {
    if (route.length > 0) {
      const bounds = route.map(point => [point.latitude, point.longitude] as [number, number]);
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [route, map]);

  return null;
};

const AmbulanceRouteVisualization: React.FC<AmbulanceRouteVisualizationProps> = ({
  ambulanceId,
  ambulanceCallSign,
  startTime,
  endTime,
  height = 600,
  onClose,
}) => {
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<RoutePoint | null>(null);

  useEffect(() => {
    const fetchRoute = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const routeData = await emsService.getAmbulanceRoute(ambulanceId, {
          startTime: startTime?.toISOString(),
          endTime: endTime?.toISOString(),
          limit: 2000, // Get up to 2000 points
        });
        setRoute(routeData);
      } catch (err: any) {
        setError(err.message || 'Failed to load route data');
        console.error('Error fetching route:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (ambulanceId) {
      fetchRoute();
    }
  }, [ambulanceId, startTime, endTime]);



  // Calculate total distance and duration
  const totalDistance = route.reduce((sum, point) => sum + (point.distanceFromPrevious || 0), 0);
  const totalDuration = route.length > 0
    ? (new Date(route[route.length - 1].timestamp).getTime() - new Date(route[0].timestamp).getTime()) / 1000 / 60
    : 0;

  // Get start and end points
  const startPoint = route[0];
  const endPoint = route[route.length - 1];

  if (isLoading) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading route data...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height, p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        {onClose && (
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        )}
      </Box>
    );
  }

  if (route.length === 0) {
    return (
      <Box sx={{ height, p: 2 }}>
        <Alert severity="info">
          No route data available for this ambulance in the selected time period.
        </Alert>
        {onClose && (
          <Button onClick={onClose} variant="outlined" sx={{ mt: 2 }}>
            Close
          </Button>
        )}
      </Box>
    );
  }

  // Create custom icons for start and end points
  const startIcon = L.divIcon({
    className: 'route-marker',
    html: `<div style="
      background-color: #4caf50;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const endIcon = L.divIcon({
    className: 'route-marker',
    html: `<div style="
      background-color: #f44336;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const waypointIcon = L.divIcon({
    className: 'route-marker',
    html: `<div style="
      background-color: #2196f3;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

  return (
    <Box sx={{ position: 'relative', height }}>
      {/* Route Info Panel */}
      <Paper
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1000,
          p: 2,
          minWidth: 250,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            Route Details
          </Typography>
          {onClose && (
            <Button size="small" onClick={onClose}>
              Close
            </Button>
          )}
        </Box>
        {ambulanceCallSign && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Ambulance: {ambulanceCallSign}
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total Distance
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {totalDistance.toFixed(2)} km
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Duration
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {totalDuration.toFixed(1)} minutes
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Route Points
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {route.length} points
            </Typography>
          </Box>
          {startPoint && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Start Time
              </Typography>
              <Typography variant="body2">
                {format(new Date(startPoint.timestamp), 'MMM dd, yyyy HH:mm:ss')}
              </Typography>
            </Box>
          )}
          {endPoint && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                End Time
              </Typography>
              <Typography variant="body2">
                {format(new Date(endPoint.timestamp), 'MMM dd, yyyy HH:mm:ss')}
              </Typography>
            </Box>
          )}
        </Box>
        {selectedPoint && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Selected Point
            </Typography>
            <Typography variant="body2">
              {format(new Date(selectedPoint.timestamp), 'MMM dd, yyyy HH:mm:ss')}
            </Typography>
            {selectedPoint.speed !== undefined && (
              <Typography variant="body2">
                Speed: {selectedPoint.speed.toFixed(1)} km/h
              </Typography>
            )}
            {selectedPoint.distanceFromPrevious !== undefined && (
              <Typography variant="body2">
                Distance from previous: {selectedPoint.distanceFromPrevious.toFixed(3)} km
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      <MapContainer
        center={startPoint ? [startPoint.latitude, startPoint.longitude] : [24.7136, 46.6753]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fit bounds to route */}
        <RouteBoundsFitter route={route} />

        {/* Route polyline - Hiding connection as requested to reduce clutter */}
        {/* {routePath.length > 1 && (
          <Polyline
            positions={routePath}
            pathOptions={{
              color: '#2196f3',
              weight: 4,
              opacity: 0.7,
            }}
          />
        )} */}

        {/* Start point marker */}
        {startPoint && (
          <Marker
            position={[startPoint.latitude, startPoint.longitude]}
            icon={startIcon}
          >
            <Popup>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  Start Point
                </Typography>
                <Typography variant="body2">
                  {format(new Date(startPoint.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                </Typography>
                {startPoint.speed !== undefined && (
                  <Typography variant="body2">
                    Speed: {startPoint.speed.toFixed(1)} km/h
                  </Typography>
                )}
              </Box>
            </Popup>
          </Marker>
        )}

        {/* End point marker */}
        {endPoint && endPoint !== startPoint && (
          <Marker
            position={[endPoint.latitude, endPoint.longitude]}
            icon={endIcon}
          >
            <Popup>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  End Point
                </Typography>
                <Typography variant="body2">
                  {format(new Date(endPoint.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                </Typography>
                {endPoint.speed !== undefined && (
                  <Typography variant="body2">
                    Speed: {endPoint.speed.toFixed(1)} km/h
                  </Typography>
                )}
              </Box>
            </Popup>
          </Marker>
        )}

        {/* Waypoint markers (every 2nd point for better history visibility as requested) */}
        {route
          .filter((_, index) => index % 2 === 0 && index !== 0 && index !== route.length - 1)
          .map((point, index) => (
            <Marker
              key={`waypoint-${index}`}
              position={[point.latitude, point.longitude]}
              icon={waypointIcon}
              eventHandlers={{
                click: () => setSelectedPoint(point),
              }}
            >
              <Popup>
                <Box>
                  <Typography variant="body2">
                    {format(new Date(point.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                  </Typography>
                  {point.speed !== undefined && (
                    <Typography variant="body2">
                      Speed: {point.speed.toFixed(1)} km/h
                    </Typography>
                  )}
                </Box>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </Box>
  );
};

export default AmbulanceRouteVisualization;
