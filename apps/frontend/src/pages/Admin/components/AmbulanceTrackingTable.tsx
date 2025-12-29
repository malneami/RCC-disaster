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
  faLocationArrow,
  faClock,
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
    return speed !== undefined ? `${speed} km/h` : '—';
  };

  const formatDirection = (direction?: number) => {
    return direction !== undefined ? `${direction}°` : '—';
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return null;
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <TableContainer
      component={Paper}
      className="ambulance-table-container"
      elevation={0}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Vehicle</TableCell>
            <TableCell>IMEI</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Speed</TableCell>
            <TableCell>Direction</TableCell>
            <TableCell>Last Update</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ambulances.map((ambulance: GPSAmbulance, index: number) => (
            <TableRow key={ambulance.imei || index}>
              {/* Vehicle Name */}
              <TableCell>
                <Box className="vehicle-name">
                  <Box className="vehicle-icon">
                    <FontAwesomeIcon icon={faAmbulance} />
                  </Box>
                  <Typography className="vehicle-text">
                    {ambulance.name || `Vehicle ${index + 1}`}
                  </Typography>
                </Box>
              </TableCell>

              {/* IMEI */}
              <TableCell>
                <Box className="imei-badge">
                  {ambulance.imei}
                </Box>
              </TableCell>

              {/* Location */}
              <TableCell>
                {ambulance.lat != null && ambulance.lng != null &&
                  typeof ambulance.lat === 'number' && typeof ambulance.lng === 'number' ? (
                  <Box className="location-display">
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      style={{ color: '#0056b3', fontSize: 12 }}
                    />
                    <span>
                      {Number(ambulance.lat).toFixed(6)}, {Number(ambulance.lng).toFixed(6)}
                    </span>
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#9ca3af',
                      fontStyle: 'italic',
                    }}
                  >
                    No location data
                  </Typography>
                )}
              </TableCell>

              {/* Speed */}
              <TableCell>
                {ambulance.speed !== undefined ? (
                  <Box className="speed-display">
                    {formatSpeed(ambulance.speed)}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                    —
                  </Typography>
                )}
              </TableCell>

              {/* Direction */}
              <TableCell>
                {ambulance.direction !== undefined ? (
                  <Box className="direction-display">
                    {formatDirection(ambulance.direction)}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                    —
                  </Typography>
                )}
              </TableCell>

              {/* Last Update */}
              <TableCell>
                {ambulance.timestamp ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FontAwesomeIcon
                      icon={faClock}
                      style={{ color: '#9ca3af', fontSize: 12 }}
                    />
                    <Typography className="timestamp-display">
                      {formatTimestamp(ambulance.timestamp)}
                    </Typography>
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#ef4444',
                      fontWeight: 500,
                      fontSize: '0.8125rem',
                    }}
                  >
                    Invalid Date
                  </Typography>
                )}
              </TableCell>

              {/* Actions */}
              <TableCell align="center">
                <Tooltip title="View GPS Location" arrow placement="top">
                  <IconButton
                    className="action-button"
                    onClick={() => onViewGPS(ambulance)}
                    size="small"
                  >
                    <FontAwesomeIcon icon={faLocationArrow} style={{ fontSize: 14, color: '#ffffff' }} />
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
