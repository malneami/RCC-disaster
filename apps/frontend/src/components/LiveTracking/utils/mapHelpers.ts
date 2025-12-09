import { AmbulanceGPSData, MapViewport } from '../types';

/**
 * Get color based on ambulance status
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    AVAILABLE: '#4caf50',      // Green
    IN_USE: '#2196f3',         // Blue
    MAINTENANCE: '#ff9800',    // Orange
    OUT_OF_SERVICE: '#f44336', // Red
  };
  return colors[status] || '#757575'; // Gray default
};

/**
 * Get icon name based on ambulance type
 */
export const getTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    BASIC: '🚑',
    ADVANCED: '🚑',
    CRITICAL_CARE: '🚑',
  };
  return icons[type] || '🚑';
};

/**
 * Calculate map bounds from ambulance positions
 */
export const calculateMapBounds = (ambulances: AmbulanceGPSData[]): [[number, number], [number, number]] | null => {
  if (!ambulances || ambulances.length === 0) return null;

  const lats = ambulances.map(a => a.latitude);
  const lngs = ambulances.map(a => a.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Add padding (roughly 10% on each side)
  const latPadding = (maxLat - minLat) * 0.1;
  const lngPadding = (maxLng - minLng) * 0.1;

  return [
    [minLat - latPadding, minLng - lngPadding],
    [maxLat + latPadding, maxLng + lngPadding],
  ];
};

/**
 * Calculate center point from ambulance positions
 */
export const calculateMapCenter = (ambulances: AmbulanceGPSData[]): [number, number] => {
  if (!ambulances || ambulances.length === 0) {
    // Default to Jazan, Saudi Arabia
    return [16.889560, 42.598695];
  }

  const avgLat = ambulances.reduce((sum, a) => sum + a.latitude, 0) / ambulances.length;
  const avgLng = ambulances.reduce((sum, a) => sum + a.longitude, 0) / ambulances.length;

  return [avgLat, avgLng];
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format time ago
 */
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

/**
 * Format speed
 */
export const formatSpeed = (speed?: number): string => {
  if (speed === undefined || speed === null) return 'N/A';
  return `${Math.round(speed)} km/h`;
};

/**
 * Format direction
 */
export const formatDirection = (direction?: number): string => {
  if (direction === undefined || direction === null) return 'N/A';
  
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(direction / 45) % 8;
  return directions[index];
};

/**
 * Get default map viewport
 */
export const getDefaultViewport = (): MapViewport => {
  return {
    center: [16.889560, 42.598695], // Jazan, Saudi Arabia
    zoom: 12,
  };
};

/**
 * Create custom marker HTML
 */
export const createMarkerHTML = (_ambulance: AmbulanceGPSData, isSelected: boolean = false): string => {
  // Removed status color mapping as requested
  const size = isSelected ? '40px' : '32px';
  const zIndex = isSelected ? 1000 : 'auto';

  return `
    <div style="
      position: relative;
      width: ${size};
      height: ${size};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${isSelected ? '30px' : '24px'};
      cursor: pointer;
      z-index: ${zIndex};
      transition: all 0.2s ease;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    ">
      🚑
    </div>
  `;
};

