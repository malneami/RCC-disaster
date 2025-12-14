import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRefresh,
  faMapMarkerAlt,
  faAmbulance,
  faUserMd,
  faGasPump
} from '@fortawesome/free-solid-svg-icons';

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

interface MapControlsProps {
  ambulanceLocations: AmbulanceLocation[];
  onRefresh: () => void;
  onCenterMap: () => void;
  isConnected: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({
  ambulanceLocations,
  onRefresh,
  onCenterMap,
  isConnected,
}) => {
  const getStatusCounts = () => {
    const counts = {
      available: 0,
      inUse: 0,
      maintenance: 0,
      outOfService: 0,
    };

    ambulanceLocations.forEach(ambulance => {
      switch (ambulance.status) {
        case 'AVAILABLE':
          counts.available++;
          break;
        case 'IN_USE':
          counts.inUse++;
          break;
        case 'MAINTENANCE':
          counts.maintenance++;
          break;
        case 'OUT_OF_SERVICE':
          counts.outOfService++;
          break;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'white',
        borderRadius: 2,
        padding: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
        minWidth: 200,
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Fleet Status
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <FontAwesomeIcon icon={faAmbulance} color="#4caf50" style={{ marginRight: 8 }} />
          <Typography variant="body2">Available: {statusCounts.available}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <FontAwesomeIcon icon={faUserMd} color="#ff9800" style={{ marginRight: 8 }} />
          <Typography variant="body2">In Use: {statusCounts.inUse}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <FontAwesomeIcon icon={faGasPump} color="#f44336" style={{ marginRight: 8 }} />
          <Typography variant="body2">Maintenance: {statusCounts.maintenance}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <FontAwesomeIcon icon={faAmbulance} color="#9e9e9e" style={{ marginRight: 8 }} />
          <Typography variant="body2">Out of Service: {statusCounts.outOfService}</Typography>
        </Box>
      </Box>

      <Box sx={{ borderTop: '1px solid #eee', pt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isConnected ? '#4caf50' : '#f44336',
              mr: 1,
            }}
          />
          <Typography variant="body2">
            {isConnected ? 'Connected' : 'Disconnected'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Tooltip title="Refresh Locations">
            <IconButton size="small" onClick={onRefresh}>
              <FontAwesomeIcon icon={faRefresh} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Center Map">
            <IconButton size="small" onClick={onCenterMap}>
              <FontAwesomeIcon icon={faMapMarkerAlt} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export default MapControls;


