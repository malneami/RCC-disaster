import React, { useState, useRef, useEffect } from 'react';
import { Box, Alert, CircularProgress, Typography, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRoute, faChevronUp, faChevronDown, faTimes } from '@fortawesome/free-solid-svg-icons';
import { MapContainer, TileLayer, useMap, Circle, Marker, Polyline, Tooltip } from 'react-leaflet';
import L, { LatLngBounds, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';

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
import LocationHistoryModal, { RoutePoint } from './components/LocationHistoryModal';
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

// Route History Legend - Google Maps style
const RouteHistoryLegend: React.FC<{
  routeAmbulanceCallSign: string;
  routePointsCount: number;
  onClear?: () => void;
}> = ({ routeAmbulanceCallSign, routePointsCount, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const legendItems = [
    { label: 'Start', color: '#34a853', size: 10 },
    { label: 'Route', color: '#ea4335', size: 8 },
    { label: 'Gap', color: '#fbbc04', size: 8 },
    { label: 'End', color: '#4285f4', size: 10 },
  ];

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 50, // Above the status pill
        left: 10,
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          minWidth: isExpanded ? 160 : 'auto',
          transition: 'min-width 0.2s ease',
        }}
      >
        {/* Header */}
        <Box
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 1,
            cursor: 'pointer',
            '&:hover': { backgroundColor: '#f8f9fa' },
          }}
        >
          <FontAwesomeIcon icon={faRoute} size="sm" color="#ea4335" />
          
          {!isExpanded ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#202124' }}>
                {routeAmbulanceCallSign}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#5f6368' }}>
                ({routePointsCount})
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#202124' }}>
              Route History
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
            <IconButton size="small" sx={{ p: 0.25 }}>
              <FontAwesomeIcon 
                icon={isExpanded ? faChevronDown : faChevronUp} 
                size="xs" 
                color="#5f6368" 
              />
            </IconButton>
            {onClear && (
              <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                sx={{ p: 0.25 }}
              >
                <FontAwesomeIcon icon={faTimes} size="xs" color="#5f6368" />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Expanded content */}
        {isExpanded && (
          <Box sx={{ px: 1.5, pb: 1.5 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#202124', mb: 1 }}>
              {routeAmbulanceCallSign}
            </Typography>
            
            {legendItems.map((item) => (
              <Box
                key={item.label}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 0.25,
                }}
              >
                <Box
                  sx={{
                    width: item.size,
                    height: item.size,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                  }}
                />
                <Typography sx={{ fontSize: '11px', color: '#5f6368' }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
            
            <Typography sx={{ fontSize: '11px', color: '#5f6368', mt: 1, pt: 1, borderTop: '1px solid #e8eaed' }}>
              {routePointsCount} points total
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

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
  useGPSAPI = false, // Use database data instead of external GPS API (GPS polling service handles updates)
  onAmbulanceClick,
}) => {
  const [filters, setFilters] = useState<MapFiltersType>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAmbulance, setSelectedAmbulance] = useState<AmbulanceGPSData | null>(null);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [shouldFitBounds, setShouldFitBounds] = useState(true); // Fit bounds on initial load
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [locationHistoryAmbulance, setLocationHistoryAmbulance] = useState<AmbulanceGPSData | null>(null);
  const [routeHistory, setRouteHistory] = useState<RoutePoint[]>([]);
  const [routeAmbulanceCallSign, setRouteAmbulanceCallSign] = useState<string>('');
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

  const handleShowLocationHistory = (ambulance: AmbulanceGPSData) => {
    setLocationHistoryAmbulance(ambulance);
  };

  const handleCloseLocationHistory = () => {
    setLocationHistoryAmbulance(null);
    setRouteHistory([]);
    setRouteAmbulanceCallSign('');
  };

  const handleRouteLoaded = (route: RoutePoint[], callSign: string) => {
    console.log('=== ROUTE LOADED ===');
    console.log('Route loaded for', callSign, 'with', route.length, 'points');
    console.log('Full route data:', route);
    
    if (route.length > 0) {
      console.log('Route bounds check:');
      const lats = route.map(p => p.latitude);
      const lngs = route.map(p => p.longitude);
      console.log('  Lat range:', Math.min(...lats), 'to', Math.max(...lats));
      console.log('  Lng range:', Math.min(...lngs), 'to', Math.max(...lngs));
      console.log('First 3 points:', route.slice(0, 3));
      console.log('Last 3 points:', route.slice(-3));
      console.log('First position for Leaflet:', [route[0].latitude, route[0].longitude]);
      
      // Check for invalid coordinates
      const invalidPoints = route.filter(p => 
        p.latitude === 0 || p.longitude === 0 || 
        isNaN(p.latitude) || isNaN(p.longitude) ||
        p.latitude < 16 || p.latitude > 32 ||
        p.longitude < 34 || p.longitude > 55
      );
      if (invalidPoints.length > 0) {
        console.error('WARNING: Found', invalidPoints.length, 'invalid points:', invalidPoints);
      }
    } else {
      console.error('WARNING: Route has 0 points!');
    }
    
    setRouteHistory(route);
    setRouteAmbulanceCallSign(callSign);
    console.log('Route state updated');
  };

  const handleClearRoute = () => {
    setRouteHistory([]);
    setRouteAmbulanceCallSign('');
  };

  // Create route point marker icon
  const createRoutePointIcon = (index: number, total: number, isGapPoint: boolean = false) => {
    const isStart = index === 0;
    const isEnd = index === total - 1;
    
    let color = '#e53935'; // Red for route points
    let size = 8;
    
    if (isStart) {
      color = '#4caf50'; // Green for start
      size = 14;
    } else if (isEnd) {
      color = '#2196f3'; // Blue for end
      size = 14;
    } else if (isGapPoint) {
      color = '#ff9800'; // Orange for gap points
      size = 12;
    }

    return new DivIcon({
      className: 'route-point-icon',
      html: `<div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
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

  // Helper to create custom label icon for zones - Google Maps style
  const createZoneLabelIcon = (name: string) => {
    // Smart truncation for hospital names
    let shortName = name
      .replace(' Hospital', '')
      .replace(' General', '')
      .replace(' Central', '')
      .replace(' Medical City', '')
      .replace(' Medical Center', '');
    
    // Truncate if still too long
    if (shortName.length > 16) {
      shortName = shortName.substring(0, 14) + '...';
    }

    return new DivIcon({
      className: 'zone-label-icon',
      html: `<div style="
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background-color: white;
        padding: 6px 12px;
        border-radius: 20px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        font-weight: 500;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #202124;
        white-space: nowrap;
        text-align: center;
        border: 1px solid #e8eaed;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      ">
        <span style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #4285f4;
          flex-shrink: 0;
        "></span>
        ${shortName}
      </div>`,
      iconSize: [140, 32],
      iconAnchor: [70, 16]
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
              {(ambulances as any)?.length || 0} Ambulances
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
      {showNoDataAlert ? (
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
      ) : null}

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
        {shouldFitBounds && mapBounds ? <MapBoundsFitter bounds={mapBounds} /> : null}

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

        {/* Render ambulance markers - hide others when showing route history */}
        {ambulances ? ambulances
          .filter(ambulance => 
            routeHistory.length === 0 || 
            ambulance.callSign === routeAmbulanceCallSign
          )
          .map((ambulance) => (
            <AmbulanceMarker
              key={ambulance.id}
              ambulance={ambulance}
              isSelected={selectedAmbulance?.id === ambulance.id}
              onClick={handleAmbulanceClick}
              onShowLocationHistory={handleShowLocationHistory}
            />
          )) : null}

        {/* Render route history polylines - split at gaps to avoid false connections */}
        {routeHistory.length > 1 ? (() => {
          console.log('=== RENDERING ROUTE POLYLINES ===');
          console.log('Route history length:', routeHistory.length);
          
          // Split route into segments at gaps
          const segments: Array<[number, number][]> = [];
          let currentSegment: [number, number][] = [];
          
          routeHistory.forEach((point) => {
            if (point.hasGapBefore && currentSegment.length > 0) {
              // Gap detected - save current segment and start new one
              segments.push(currentSegment);
              currentSegment = [];
            }
            currentSegment.push([point.latitude, point.longitude]);
          });
          
          // Don't forget the last segment
          if (currentSegment.length > 0) {
            segments.push(currentSegment);
          }
          
          console.log('Created', segments.length, 'route segments');
          segments.forEach((seg, i) => {
            console.log(`  Segment ${i}: ${seg.length} points`, seg.slice(0, 2));
          });
          
          // Render each segment as a separate polyline
          return segments.map((segment, segIndex) => {
            if (segment.length > 1) {
              console.log(`Rendering polyline segment ${segIndex} with ${segment.length} points`);
              return (
                <Polyline
                  key={`route-segment-${segIndex}`}
                  positions={segment}
                  pathOptions={{
                    color: '#e53935',
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '5, 10',
                  }}
                />
              );
            }
            return null;
          });
        })() : null}

        {/* Render route history points as red dots */}
        {routeHistory.map((point, index) => {
          // Show every 5th point for performance, plus start, end, and gap points
          const isStart = index === 0;
          const isEnd = index === routeHistory.length - 1;
          const isGapPoint = point.hasGapBefore;
          const showPoint = isStart || isEnd || isGapPoint || index % 5 === 0;
          
          if (showPoint && (isStart || isEnd)) {
            console.log(`Rendering ${isStart ? 'START' : 'END'} marker at [${point.latitude}, ${point.longitude}]`);
          }
          
          if (!showPoint) return null;

          return (
            <Marker
              key={`route-point-${index}`}
              position={[point.latitude, point.longitude]}
              icon={createRoutePointIcon(index, routeHistory.length, isGapPoint)}
            >
              <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="caption" fontWeight="bold" display="block">
                    {isStart ? '🟢 Start' : isEnd ? '🔵 End' : isGapPoint ? '⚠️ Gap' : `Point ${index + 1}`}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {format(new Date(point.timestamp), 'MMM dd, HH:mm:ss')}
                  </Typography>
                  {isGapPoint && point.gapMinutes && (
                    <Typography variant="caption" display="block" color="warning.main">
                      {point.gapMinutes >= 60 
                        ? `${Math.round(point.gapMinutes / 60)}h ${point.gapMinutes % 60}m gap`
                        : `${point.gapMinutes}m gap`}
                    </Typography>
                  )}
                  {point.speed !== undefined && (
                    <Typography variant="caption" display="block">
                      Speed: {Math.round(point.speed)} km/h
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            </Marker>
          );
        })}
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

      {/* Refetching Indicator - Google Maps style toast */}
      {isRefetching && (
        <Box
          sx={{
            position: 'absolute',
            top: 60, // Below potential search bar
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1001,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1,
              backgroundColor: '#202124',
              color: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              fontSize: '13px',
            }}
          >
            <CircularProgress size={14} sx={{ color: 'white' }} />
            Updating...
          </Box>
        </Box>
      )}

      {/* Location History Modal */}
      {locationHistoryAmbulance && (
        <LocationHistoryModal
          isOpen={!!locationHistoryAmbulance}
          onClose={handleCloseLocationHistory}
          ambulanceId={locationHistoryAmbulance.id}
          ambulanceCallSign={locationHistoryAmbulance.callSign}
          onRouteLoaded={handleRouteLoaded}
          onClearRoute={handleClearRoute}
        />
      )}

      {/* Route History Legend */}
      {routeHistory.length > 0 && (
        <RouteHistoryLegend
          routeAmbulanceCallSign={routeAmbulanceCallSign}
          routePointsCount={routeHistory.length}
          onClear={handleClearRoute}
        />
      )}
    </Box>
  );
};

export default LiveAmbulanceMap;

