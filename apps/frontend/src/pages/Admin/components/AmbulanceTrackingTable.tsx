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
  Chip,
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
import { Ambulance } from '../../EMS/types/ems';

interface AmbulanceTrackingTableProps {
  ambulances: Ambulance[];
  onViewGPS: (ambulance: Ambulance) => void;
}

const AmbulanceTrackingTable: React.FC<AmbulanceTrackingTableProps> = ({
  ambulances,
  onViewGPS,
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BASIC': return 'primary';
      case 'ADVANCED': return 'secondary';
      case 'CRITICAL_CARE': return 'error';
      default: return 'default';
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Call Sign</TableCell>
            <TableCell>Plate Number</TableCell>
            <TableCell>Tracking IMEI</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Driver</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ambulances.map((ambulance: Ambulance) => (
            <TableRow key={ambulance.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FontAwesomeIcon 
                    icon={faAmbulance} 
                    style={{ marginRight: 8, color: '#1976d2' }} 
                  />
                  <Typography variant="body2" fontWeight={600}>
                    {ambulance.callSign}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {ambulance.plateNumber}
                </Typography>
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
                  {ambulance.vehicleImei}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={ambulance.type}
                  color={getTypeColor(ambulance.type) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={ambulance.status}
                  color={getStatusColor(ambulance.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {ambulance.driver ? (
                  <Typography variant="body2">
                    {ambulance.driver.firstName} {ambulance.driver.lastName}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No Driver
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                {ambulance.currentLocationAddress ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon 
                      icon={faMapMarkerAlt} 
                      size="sm" 
                      style={{ marginRight: 4, color: '#666' }} 
                    />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        maxWidth: 200, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {ambulance.currentLocationAddress}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Unknown
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

