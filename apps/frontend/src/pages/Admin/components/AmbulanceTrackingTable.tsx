import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faAmbulance, 
  faMapMarkerAlt,
  faLocationArrow
} from '@fortawesome/free-solid-svg-icons';

interface GPSAmbulance {
  imei: string;
  name?: string;
  lat?: number;
  lng?: number;
  speed?: number;
  direction?: number;
  timestamp?: string;
  [key: string]: any;
}

interface AmbulanceTrackingTableProps {
  ambulances: GPSAmbulance[];
  onViewGPS: (ambulance: GPSAmbulance) => void;
}

const AmbulanceTrackingTable: React.FC<AmbulanceTrackingTableProps> = ({
  ambulances,
  onViewGPS,
}) => {
  const formatSpeed = (speed?: number) => {
    return speed !== undefined ? `${speed} km/h` : 'N/A';
  };

  const formatDirection = (direction?: number) => {
    return direction !== undefined ? `${direction}°` : 'N/A';
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Vehicle</TableCell>
            <TableCell>IMEI</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Speed</TableCell>
            <TableCell>Direction</TableCell>
            <TableCell>Last Update</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ambulances.map((ambulance: GPSAmbulance, index: number) => (
            <TableRow key={ambulance.imei || index} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FontAwesomeIcon 
                    icon={faAmbulance} 
                    style={{ marginRight: 8, color: '#1976d2' }} 
                  />
                  <Typography variant="body2" fontWeight={600}>
                    {ambulance.name || ambulance.imei}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: 'primary.main'
                  }}
                >
                  {ambulance.imei}
                </Typography>
              </TableCell>
              <TableCell>
                {ambulance.lat != null && ambulance.lng != null && 
                 typeof ambulance.lat === 'number' && typeof ambulance.lng === 'number' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon 
                      icon={faMapMarkerAlt} 
                      size="sm" 
                      style={{ marginRight: 4, color: '#666' }} 
                    />
                    <Typography 
                      variant="body2" 
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {Number(ambulance.lat).toFixed(6)}, {Number(ambulance.lng).toFixed(6)}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No location
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatSpeed(ambulance.speed)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatDirection(ambulance.direction)}
                </Typography>
              </TableCell>
              <TableCell>
                {ambulance.timestamp ? (
                  <Typography variant="body2" color="text.secondary">
                    {new Date(ambulance.timestamp).toLocaleString()}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    N/A
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Tooltip title="View GPS Location" arrow>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onViewGPS(ambulance)}
                  >
                    <FontAwesomeIcon icon={faLocationArrow} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AmbulanceTrackingTable;

