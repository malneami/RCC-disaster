import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Alert, CircularProgress, Typography } from '@mui/material';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
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
import MapLegend from './components/MapLegend';
import MapControls from './components/MapControls';
import MapFiltersComponent from './components/MapFilters';
import { calculateMapBounds, getDefaultViewport } from './utils/mapHelpers';

interface LiveAmbulanceMapProps {
  height?: number | string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  showLegend?: boolean;
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
  showLegend = true,
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
  const [shouldFitBounds, setShouldFitBounds] = useState(false);
  const mapRef = useRef<any>(null);

  const viewport = getDefaultViewport();
  const center = defaultCenter || viewport.center;
  const zoom = defaultZoom || viewport.zoom;

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
    stats,
  } = useAmbulanceTracking({
    autoRefresh,
    refreshInterval,
    filters: { ...filters, searchQuery },
    useGPSAPI,
  });

  // Calculate bounds for fit bounds functionality
  const mapBounds = shouldFitBounds ? calculateMapBounds(ambulances) : null;

  useEffect(() => {
    if (shouldFitBounds && mapBounds) {
      // Reset the flag after bounds are fitted
      const timer = setTimeout(() => setShouldFitBounds(false), 500);
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

  // Loading state
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
          <Box sx={{ mt: 2 }}>Loading ambulance locations...</Box>
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ height }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load ambulance data. Please try again.
          {error instanceof Error && `: ${error.message}`}
        </Alert>
      </Box>
    );
  }

  // Show alert for no data but keep map visible
  const showNoDataAlert = !ambulances || ambulances.length === 0;

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
                No Ambulances Found
              </Typography>
              <Typography variant="body2">
                {filters.status || searchQuery
                  ? 'Try adjusting your filters or search query'
                  : 'No ambulance location data available at this time'}
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

        {/* Render ambulance markers */}
        {!showNoDataAlert && ambulances.map((ambulance) => (
          <AmbulanceMarker
            key={ambulance.id}
            ambulance={ambulance}
            isSelected={selectedAmbulance?.id === ambulance.id}
            onClick={handleAmbulanceClick}
          />
        ))}
      </MapContainer>

      {/* Map Legend - Always show */}
      {showLegend && <MapLegend stats={stats} />}

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

