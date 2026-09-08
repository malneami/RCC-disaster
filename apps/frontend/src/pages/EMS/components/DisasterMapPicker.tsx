import React, { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Disaster marker icon (red)
const disasterIcon = L.divIcon({
  html: `<div style="
    width: 28px; height: 28px;
    background: #DC2626; border: 2px solid white; border-radius: 50%;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Ambulance marker icon (blue)
const ambulanceIcon = L.divIcon({
  html: `<div style="
    width: 24px; height: 24px;
    background: #2563EB; border: 2px solid white; border-radius: 50%;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    cursor: pointer;
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export interface MapAmbulance {
  id: string;
  callSign?: string;
  currentLocationLat: number;
  currentLocationLng: number;
  distanceKm?: number;
}

interface DisasterMapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
  disabled?: boolean;
  ambulances?: MapAmbulance[];
  onAmbulanceClick?: (ambulanceId: string) => void;
  assigningId?: string | null;
}

function MapClickHandler({
  onChange,
  disabled,
  inAmbulanceMode,
}: {
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
  inAmbulanceMode?: boolean;
}) {
  useMapEvents({
    click: (e) => {
      if (!disabled && !inAmbulanceMode) {
        onChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapBoundsFitter({
  bounds,
}: {
  bounds: [[number, number], [number, number]] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      const leafletBounds = new LatLngBounds(bounds);
      map.fitBounds(leafletBounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

const DisasterMapPicker: React.FC<DisasterMapPickerProps> = ({
  lat,
  lng,
  onChange,
  height = 250,
  disabled = false,
  ambulances = [],
  onAmbulanceClick,
  assigningId = null,
}) => {
  const [center, setCenter] = useState<[number, number]>([lat || 16.89, lng || 42.55]);
  const hasValidPosition = lat !== 0 && lng !== 0;
  const inAmbulanceMode = ambulances.length > 0;

  useEffect(() => {
    if (lat && lng) {
      setCenter([lat, lng]);
    }
  }, [lat, lng]);

  const handleChange = useCallback(
    (newLat: number, newLng: number) => {
      onChange(newLat, newLng);
      setCenter([newLat, newLng]);
    },
    [onChange]
  );

  const mapBounds: [[number, number], [number, number]] | null =
    inAmbulanceMode && hasValidPosition && ambulances.length > 0
      ? (() => {
          const lats = [lat, ...ambulances.map((a) => a.currentLocationLat)];
          const lngs = [lng, ...ambulances.map((a) => a.currentLocationLng)];
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const pad = 0.01;
          return [
            [minLat - pad, minLng - pad],
            [maxLat + pad, maxLng + pad],
          ];
        })()
      : null;

  return (
    <div style={{ height, borderRadius: 8, overflow: 'hidden', border: '1px solid #e0e0e0', position: 'relative' }}>
      {!hasValidPosition && !disabled && !inAmbulanceMode && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(25, 118, 210, 0.95)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            pointerEvents: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          Click on the map to set location
        </div>
      )}
      {inAmbulanceMode && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(34, 197, 94, 0.95)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            pointerEvents: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          Click an ambulance to assign
        </div>
      )}
      <MapContainer
        center={center}
        zoom={hasValidPosition ? 14 : 10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={!disabled}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {mapBounds && <MapBoundsFitter bounds={mapBounds} />}
        <MapClickHandler onChange={handleChange} disabled={disabled} inAmbulanceMode={inAmbulanceMode} />
        {hasValidPosition && (
          <Marker position={[lat, lng]} icon={disasterIcon} />
        )}
        {ambulances.map((a) => (
          <Marker
            key={a.id}
            position={[a.currentLocationLat, a.currentLocationLng]}
            icon={ambulanceIcon}
            eventHandlers={{
              click: () => {
                if (!assigningId && onAmbulanceClick) {
                  onAmbulanceClick(a.id);
                }
              },
            }}
          >
            <Popup>
              <strong>{a.callSign || 'Ambulance'}</strong>
              {a.distanceKm != null && (
                <>
                  <br />
                  {a.distanceKm.toFixed(1)} km away
                </>
              )}
              <br />
              <span style={{ fontSize: 12, color: '#666' }}>
                {assigningId === a.id ? 'Assigning…' : 'Click to assign'}
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DisasterMapPicker;
