import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Alert, CircularProgress, Typography } from '@mui/material';
import { MapContainer, TileLayer, useMap, Circle, Marker } from 'react-leaflet';
import L, { LatLngBounds, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

import { useAmbulanceTracking } from './hooks/useAmbulanceTracking';
import { MapFilters as MapFiltersType, AmbulanceGPSData } from './types';
import AmbulanceMarker from './components/AmbulanceMarker';
import MapControls from './components/MapControls';
import MapFiltersComponent from './components/MapFilters';
import { getDefaultViewport } from './utils/mapHelpers';
import { hospitalService, Hospital } from '../../services/hospitalService';

interface LiveAmbulanceMapProps {
  height?: number | string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  showControls?: boolean;
  showFilters?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  useGPSAPI?: boolean;
  onAmbulanceClick?: (ambulance: AmbulanceGPSData) => void;
}

// Component to handle map bounds fitting
const MapBoundsFitter: React.FC<{ bounds: [[number, number], [number, number]] | null }> = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      const leafletBounds = new LatLngBounds(bounds);
      map.fitBounds(leafletBounds, { padding: [50, 50] });
    }
  }, [bounds, map]);

  return null;
};

const LiveAmbulanceMap: React.FC<LiveAmbulanceMapProps> = ({
  height = 600,
  defaultCenter,
  defaultZoom,
  showControls = true,
  showFilters = true,
  autoRefresh = true,
  refreshInterval,
  useGPSAPI = true,
  onAmbulanceClick,
}) => {
  const [filters, setFilters] = useState<MapFiltersType>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAmbulance, setSelectedAmbulance] = useState<AmbulanceGPSData | null>(null);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [shouldFitBounds, setShouldFitBounds] = useState(true); // Fit bounds on initial load
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const mapRef = useRef<any>(null);

  const viewport = getDefaultViewport();
  const center = defaultCenter || viewport.center;
  const zoom = defaultZoom || viewport.zoom;

  // Fetch hospitals
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const data = await hospitalService.getAllHospitals();
        const validHospitals = data.filter(h => h.latitude && h.longitude);
        setHospitals(validHospitals);
        // Trigger fit bounds after hospitals are loaded
        if (validHospitals.length > 0) {
          setShouldFitBounds(true);
        }
      } catch (error) {
        console.error('Failed to fetch hospitals:', error);
      }
    };
    fetchHospitals();
  }, []);

  // Use the ambulance tracking hook
  const {
    ambulances,
    isLoading,
    isRefetching,
    error,
    lastUpdateTime,
    nextRefreshTime,
    secondsUntilRefresh,
    refresh,
  } = useAmbulanceTracking({
    autoRefresh,
    refreshInterval,
    filters: { ...filters, searchQuery },
    useGPSAPI,
  });

  // Calculate bounds for fit bounds functionality
  const mapBounds = React.useMemo(() => {
    if (!shouldFitBounds) return null;

    const points: [number, number][] = [];

    // Add ambulance locations
    if (ambulances) {
      ambulances.forEach(amb => points.push([amb.latitude, amb.longitude]));
    }

    // Add hospital locations
    if (hospitals) {
      hospitals.forEach(h => {
        if (h.latitude && h.longitude) {
          points.push([h.latitude, h.longitude]);
        }
      });
    }

    if (points.length === 0) return null;

    // Calculate bounds manually if needed, or use helper if it supports points
    // Reusing calculateMapBounds logic but extending it
    let minLat = points[0][0], maxLat = points[0][0];
    let minLng = points[0][1], maxLng = points[0][1];

    points.forEach(([lat, lng]) => {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });

    return [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]];
  }, [shouldFitBounds, ambulances, hospitals]);

  useEffect(() => {
    if (shouldFitBounds && mapBounds) {
      // Reset the flag after bounds are fitted
      const timer = setTimeout(() => setShouldFitBounds(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldFitBounds, mapBounds]);

  const handleAmbulanceClick = (ambulance: AmbulanceGPSData) => {
    setSelectedAmbulance(ambulance.id === selectedAmbulance?.id ? null : ambulance);
    if (onAmbulanceClick) {
      onAmbulanceClick(ambulance);
    }
  };

  const handleFitBounds = () => {
    setShouldFitBounds(true);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleFiltersChange = (newFilters: MapFiltersType) => {
    setFilters(newFilters);
  };

  const handleFilterToggle = () => {
    setShowFiltersPanel(!showFiltersPanel);
  };

  // Helper to create custom label icon for zones
  const createZoneLabelIcon = (name: string) => {
    const shortName = name.replace(' Hospital', '').replace(' General', '').replace(' Central', '').replace(' Medical City', '');
    return new DivIcon({
      className: 'zone-label-icon',
      html: `<div style="
        background-color: rgba(255, 255, 255, 0.9);
        padding: 4px 8px;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        font-weight: bold;
        font-size: 12px;
        color: #333;
        white-space: nowrap;
        text-align: center;
        border: 1px solid #e0e0e0;
      ">${shortName}</div>`,
      iconSize: [100, 30], // Approximate size, CSS will handle actual size
      iconAnchor: [50, 15] // Center the label
    });
  };

  // Loading state
  if (isLoading && !ambulances) {
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
          <Box sx={{ mt: 2 }}>Loading ambulance locations...</Box>
        </Box>
      </Box>
    );
  }

  // Error state
  if (error && !ambulances) {
    return (
      <Box sx={{ height, position: 'relative' }}>
        {/* Update Status Indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            padding: '8px 16px',
            boxShadow: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isRefetching ? (
              <CircularProgress size={16} />
            ) : (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'success.main',
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
            )}
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {ambulances?.length || 0} Ambulances
            </Typography>
          </Box>
          <Box sx={{ borderLeft: 1, borderColor: 'divider', pl: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Updated {Math.floor((Date.now() - lastUpdateTime.getTime()) / 1000)}s ago
              {secondsUntilRefresh !== null && ` • Next: ${secondsUntilRefresh}s`}
            </Typography>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load ambulance data. Please try refreshing.
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
    );
  }

  // Show alert for no data but keep map visible
  const showNoDataAlert = (!ambulances || ambulances.length === 0) && (!hospitals || hospitals.length === 0);

  return (
    <Box sx={{ position: 'relative', height }}>
      {/* No Data Alert - Show as overlay */}
      {showNoDataAlert && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
          }}
        >
          <Alert
            severity="info"
            sx={{
              minWidth: 300,
              boxShadow: 3,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ fontSize: 32, mb: 1 }}>🚑</Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                No Data Available
              </Typography>
              <Typography variant="body2">
                {filters.status || searchQuery
                  ? 'Try adjusting your filters or search query'
                  : 'No ambulance or hospital data available at this time'}
              </Typography>
            </Box>
          </Alert>
        </Box>
      )}

      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        {/* OpenStreetMap Tiles - Fully Open Source */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Fit bounds handler */}
        {shouldFitBounds && mapBounds && <MapBoundsFitter bounds={mapBounds} />}

        {/* Render Hospital Zones */}
        {hospitals.map((hospital) => (
          <React.Fragment key={hospital.id}>
            <Circle
              center={[hospital.latitude!, hospital.longitude!]}
              radius={500} // 500m radius for zone
              pathOptions={{
                color: '#1976d2',
                fillColor: '#1976d2',
                fillOpacity: 0.2,
                weight: 2,
              }}
            />
            {/* Custom Label Marker */}
            <Marker
              position={[hospital.latitude!, hospital.longitude!]}
              icon={createZoneLabelIcon(hospital.name)}
              interactive={false} // Allow clicking through to the circle/map
            />
          </React.Fragment>
        ))}

        {/* Render ambulance markers */}
        {ambulances && ambulances.map((ambulance) => (
          <AmbulanceMarker
            key={ambulance.id}
            ambulance={ambulance}
            isSelected={selectedAmbulance?.id === ambulance.id}
            onClick={handleAmbulanceClick}
          />
        ))}
      </MapContainer>

      {/* Map Controls - Always show */}
      {showControls && (
        <MapControls
          onRefresh={refresh}
          onFitBounds={handleFitBounds}
          onSearchChange={handleSearchChange}
          onFilterToggle={showFilters ? handleFilterToggle : undefined}
          isRefreshing={isRefetching}
          lastUpdateTime={lastUpdateTime}
          nextRefreshTime={nextRefreshTime}
          secondsUntilRefresh={secondsUntilRefresh}
          totalAmbulances={ambulances?.length || 0}
        />
      )}

      {/* Map Filters Panel */}
      {showFilters && showFiltersPanel && (
        <MapFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClose={() => setShowFiltersPanel(false)}
        />
      )}

      {/* Refetching Indicator */}
      {isRefetching && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1001,
          }}
        >
          <Paper
            sx={{
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: 'rgba(33, 150, 243, 0.9)',
              color: 'white',
            }}
          >
            <CircularProgress size={16} sx={{ color: 'white' }} />
            <Box>Updating locations...</Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default LiveAmbulanceMap;

