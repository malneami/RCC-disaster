import React, { useEffect, useRef, useState } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { Box, Typography, CircularProgress, Button, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHistory, 
  faTachometerAlt, 
  faCompass, 
  faClock, 
  faUser,
  faPhone,
  faMapMarkerAlt,
  faChevronRight,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { AmbulanceGPSData } from '../types';
import { formatTimeAgo, formatDirection } from '../utils/mapHelpers';
import AmbulanceZoneTimeline from './AmbulanceZoneTimeline';
import '../styles/ambulance-markers.css';

interface AmbulanceMarkerProps {
  ambulance: AmbulanceGPSData;
  isSelected?: boolean;
  onClick?: (ambulance: AmbulanceGPSData) => void;
  onShowLocationHistory?: (ambulance: AmbulanceGPSData) => void;
}

const AmbulanceMarker: React.FC<AmbulanceMarkerProps> = ({ ambulance, isSelected = false, onClick, onShowLocationHistory }) => {
  const markerRef = useRef<any>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'zones'>('details');
  const [zoneVisits, setZoneVisits] = useState<any[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const position: [number, number] = [ambulance.latitude, ambulance.longitude];

  // Helper to get color based on assignment status (priority) or ambulance status
  const getMarkerColor = () => {
    if (ambulance.assignment?.status === 'ARRIVED') {
      return '#34a853'; // Green
    }

    if (ambulance.assignment?.status) {
      switch (ambulance.assignment.status) {
        case 'EMS_CONTACT':
        case 'CONTACTED':
          return '#fbbc04'; // Yellow
        case 'EN_ROUTE':
        case 'EMS_ARRIVAL':
          return '#4285f4'; // Blue
        case 'DEPARTED':
          return '#9334ea'; // Purple
        default:
          break;
      }
    }

    switch (ambulance.status) {
      case 'AVAILABLE': return '#34a853';
      case 'IN_USE': return '#4285f4';
      case 'MAINTENANCE': return '#fbbc04';
      case 'OUT_OF_SERVICE': return '#ea4335';
      default: return '#9aa0a6';
    }
  };

  const getStatusLabel = () => {
    if (ambulance.assignment?.status === 'ARRIVED') return 'Available';
    if (ambulance.assignment?.status) {
      switch (ambulance.assignment.status) {
        case 'EMS_CONTACT':
        case 'CONTACTED': return 'Contacted';
        case 'EN_ROUTE': return 'En Route';
        case 'EMS_ARRIVAL': return 'Arriving';
        case 'DEPARTED': return 'Departed';
        default: break;
      }
    }
    switch (ambulance.status) {
      case 'AVAILABLE': return 'Available';
      case 'IN_USE': return 'In Use';
      case 'MAINTENANCE': return 'Maintenance';
      case 'OUT_OF_SERVICE': return 'Out of Service';
      default: return 'Unknown';
    }
  };

  const statusColor = getMarkerColor();
  const isMoving = (ambulance.speed || 0) > 1;

  const customIcon = new DivIcon({
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div class="${isMoving ? 'moving-pulse' : ''}" style="
          position: relative;
          width: 32px;
          height: 32px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2), 0 0 0 3px ${statusColor};
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="16" height="16" viewBox="0 0 640 512" fill="${statusColor}" xmlns="http://www.w3.org/2000/svg">
            <path d="M624 352h-16V243.9c0-12.7-5.1-24.9-14.1-33.9L494 110.1c-9-9-21.2-14.1-33.9-14.1H416V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48v320c0 26.5 21.5 48 48 48h16c0 53 43 96 96 96s96-43 96-96h128c0 53 43 96 96 96s96-43 96-96h48c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zM160 464c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm320 0c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm80-208H416V144h44.1l99.9 99.9V256z"/>
          </svg>
        </div>
      </div>
    `,
    className: 'ambulance-marker-animated',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  useEffect(() => {
    if (isSelected && ambulance.vehicleImei) {
      fetchZoneVisits();
    }
  }, [isSelected, ambulance.vehicleImei]);

  const fetchZoneVisits = async () => {
    setLoadingZones(true);
    try {
      const response = await fetch(`/api/v1/ambulance-tracking/zone-logs?ambulanceId=${ambulance.id}`);
      if (response.ok) {
        const data = await response.json();
        setZoneVisits(data.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to fetch zone visits:', error);
    } finally {
      setLoadingZones(false);
    }
  };

  const handleClick = () => {
    onClick?.(ambulance);
  };

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={customIcon}
      eventHandlers={{ click: handleClick }}
    >
      {/* Tooltip on hover - Clean minimal design */}
      <Tooltip direction="top" offset={[0, -20]} opacity={1}>
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: '10px',
            p: 1.25,
            minWidth: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #e8eaed',
          }}
        >
          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#202124', mb: 0.5 }}>
            {ambulance.callSign}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: statusColor,
              }}
            />
            <Typography sx={{ fontSize: '11px', color: '#5f6368' }}>
              {getStatusLabel()}
            </Typography>
          </Box>
          {isMoving && ambulance.speed && (
            <Typography sx={{ fontSize: '10px', color: '#5f6368', mt: 0.5 }}>
              {Math.round(ambulance.speed)} km/h
            </Typography>
          )}
        </Box>
      </Tooltip>

      {/* Popup - Responsive card design */}
      <Popup 
        maxWidth={340} 
        minWidth={300} 
        className="modern-ambulance-popup"
        closeButton={false}
      >
        <Box sx={{ width: 300, minWidth: 300 }}>
          {/* Header with gradient */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%)`,
              color: 'white',
              p: 1,
              position: 'relative',
            }}
          >
            {/* Close button */}
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.15)',
                width: 24,
                height: 24,
                padding: 0,
                minWidth: 24,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' },
              }}
              onClick={() => markerRef.current?.closePopup()}
            >
              <FontAwesomeIcon icon={faTimes} size="xs" />
            </IconButton>

            {/* Consistent single-row layout */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, pr: 3 }}>
              {/* Left: Call sign (Number) */}
              <Typography sx={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, flex: 1 }}>
                {ambulance.callSign}
              </Typography>

              {/* Right: Status badge and speed/direction */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                {/* Status badge - redesigned for consistency */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.4,
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                >
                  <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'white' }} />
                  <Typography sx={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.02em' }}>
                    {getStatusLabel()}
                  </Typography>
                </Box>

                {/* Speed and direction - compact inline */}
                {ambulance.speed !== undefined && ambulance.speed > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                      <FontAwesomeIcon icon={faTachometerAlt} size="xs" style={{ fontSize: '10px', opacity: 0.9 }} />
                      <Typography sx={{ fontSize: '11px', fontWeight: 600, opacity: 0.95 }}>
                        {Math.round(ambulance.speed)} km/h
                      </Typography>
                    </Box>
                    {ambulance.direction !== undefined && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                        <FontAwesomeIcon icon={faCompass} size="xs" style={{ opacity: 0.85, fontSize: '10px' }} />
                        <Typography sx={{ fontSize: '10px', opacity: 0.9 }}>
                          {formatDirection(ambulance.direction)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* Tab buttons - Segmented control style */}
          <Box sx={{ display: 'flex', p: 1, backgroundColor: '#f8f9fa', gap: 0.5 }}>
            {['details', 'zones'].map((tab) => (
              <Box
                key={tab}
                onClick={() => setActiveTab(tab as 'details' | 'zones')}
                sx={{
                  flex: 1,
                  py: 1,
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: activeTab === tab ? '#202124' : '#5f6368',
                  backgroundColor: activeTab === tab ? 'white' : 'transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'details' ? 'Details' : 'Zone History'}
              </Box>
            ))}
          </Box>

          {/* Tab content */}
          <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
            {activeTab === 'details' && (
              <Box sx={{ p: 2.5 }}>
                {/* Driver info card */}
                {ambulance.driver && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      backgroundColor: '#f8f9fa',
                      borderRadius: '12px',
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        backgroundColor: '#e8eaed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FontAwesomeIcon icon={faUser} color="#5f6368" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#202124' }}>
                        {ambulance.driver.firstName} {ambulance.driver.lastName}
                      </Typography>
                      {ambulance.driver.phoneNumber && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <FontAwesomeIcon icon={faPhone} size="xs" color="#5f6368" />
                          <Typography sx={{ fontSize: '12px', color: '#5f6368' }}>
                            {ambulance.driver.phoneNumber}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Info items */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {ambulance.address && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          backgroundColor: '#f1f3f4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <FontAwesomeIcon icon={faMapMarkerAlt} size="sm" color="#5f6368" />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: '11px', color: '#5f6368', fontWeight: 500 }}>
                          Location
                        </Typography>
                        <Typography sx={{ fontSize: '13px', color: '#202124', wordBreak: 'break-word' }}>
                          {ambulance.address}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        backgroundColor: '#f1f3f4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FontAwesomeIcon icon={faClock} size="sm" color="#5f6368" />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '11px', color: '#5f6368', fontWeight: 500 }}>
                        Last Update
                      </Typography>
                      <Typography sx={{ fontSize: '13px', color: '#202124' }}>
                        {formatTimeAgo(ambulance.lastUpdate)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Route history button */}
                {onShowLocationHistory && (
                  <Button
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowLocationHistory(ambulance);
                    }}
                    sx={{
                      mt: 2.5,
                      py: 1.25,
                      borderRadius: '10px',
                      backgroundColor: '#e8f0fe',
                      color: '#4285f4',
                      fontSize: '13px',
                      fontWeight: 600,
                      textTransform: 'none',
                      justifyContent: 'space-between',
                      '&:hover': {
                        backgroundColor: '#d2e3fc',
                      },
                    }}
                    endIcon={<FontAwesomeIcon icon={faChevronRight} size="sm" />}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FontAwesomeIcon icon={faHistory} />
                      View Route History
                    </Box>
                  </Button>
                )}
              </Box>
            )}

            {activeTab === 'zones' && (
              <Box>
                {loadingZones ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={28} sx={{ color: statusColor }} />
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
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        backgroundColor: '#f1f3f4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1.5,
                      }}
                    >
                      <FontAwesomeIcon icon={faMapMarkerAlt} color="#9aa0a6" />
                    </Box>
                    <Typography sx={{ fontSize: '13px', color: '#5f6368' }}>
                      No zone visits recorded
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Popup>
    </Marker>
  );
};

export default AmbulanceMarker;
