import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faAmbulance
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

interface AmbulanceMarkerProps {
  ambulance: AmbulanceLocation;
  isSelected: boolean;
  onClick: () => void;
}

const AmbulanceMarker: React.FC<AmbulanceMarkerProps> = ({
  ambulance,
  isSelected,
  onClick,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'IN_USE': return 'warning';
      case 'MAINTENANCE': return 'error';
      case 'OUT_OF_SERVICE': return 'default';
      default: return 'default';
    }
  };


  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {ambulance.callSign}
          </Typography>
          <Typography variant="body2">
            Status: {ambulance.status}
          </Typography>
          {ambulance.driver && (
            <Typography variant="body2">
              Driver: {ambulance.driver.firstName} {ambulance.driver.lastName}
            </Typography>
          )}
          {ambulance.speed && (
            <Typography variant="body2">
              Speed: {ambulance.speed} km/h
            </Typography>
          )}
          <Typography variant="body2">
            Last Update: {ambulance.lastUpdate.toLocaleTimeString()}
          </Typography>
        </Box>
      }
      arrow
    >
      <Box
        sx={{
          position: 'relative',
          cursor: 'pointer',
          transform: isSelected ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.2s',
          zIndex: isSelected ? 1000 : 1,
        }}
        onClick={onClick}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'white',
            border: `3px solid ${
              isSelected ? '#1976d2' : 
              getStatusColor(ambulance.status) === 'success' ? '#4caf50' :
              getStatusColor(ambulance.status) === 'warning' ? '#ff9800' :
              getStatusColor(ambulance.status) === 'error' ? '#f44336' : '#9e9e9e'
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <FontAwesomeIcon 
            icon={faAmbulance} 
            color={
              getStatusColor(ambulance.status) === 'success' ? '#4caf50' :
              getStatusColor(ambulance.status) === 'warning' ? '#ff9800' :
              getStatusColor(ambulance.status) === 'error' ? '#f44336' : '#9e9e9e'
            }
            size="lg"
          />
        </Box>
        
      </Box>
    </Tooltip>
  );
};

export default AmbulanceMarker;
