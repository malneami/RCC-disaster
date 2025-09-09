import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash, 
  faMapMarkerAlt,
  faWrench,
  faAmbulance
} from '@fortawesome/free-solid-svg-icons';
import { Ambulance } from '../types/ems';

interface AmbulanceTableProps {
  ambulances: Ambulance[];
  onEdit: (ambulance: Ambulance) => void;
  onDelete: (id: string) => void;
  getStatusColor: (status: string) => string;
  getTypeColor: (type: string) => string;
  getEquipmentStatusColor: (status: string) => string;
}

const AmbulanceTable: React.FC<AmbulanceTableProps> = ({
  ambulances,
  onEdit,
  onDelete,
  getStatusColor,
  getTypeColor,
  getEquipmentStatusColor,
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Call Sign</TableCell>
            <TableCell>Plate Number</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Driver</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Equipment</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ambulances.map((ambulance) => (
            <TableRow key={ambulance.id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FontAwesomeIcon 
                    icon={faAmbulance} 
                    style={{ marginRight: 8, color: '#1976d2' }} 
                  />
                  {ambulance.callSign}
                </Box>
              </TableCell>
              <TableCell>{ambulance.plateNumber}</TableCell>
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
                  `${ambulance.driver.firstName} ${ambulance.driver.lastName}`
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
                    <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                <Chip
                  label={ambulance.equipmentStatus || 'OPERATIONAL'}
                  color={getEquipmentStatusColor(ambulance.equipmentStatus || 'OPERATIONAL') as any}
                  size="small"
                  icon={<FontAwesomeIcon icon={faWrench} size="xs" />}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => onEdit(ambulance)}
                    color="primary"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onDelete(ambulance.id)}
                    color="error"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AmbulanceTable;
