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
  faUser,
  faPhone,
  faEnvelope,
  faHospital
} from '@fortawesome/free-solid-svg-icons';

interface DriverTableProps {
  drivers: any[];
  onEdit: (driver: any) => void;
  onDelete: (id: string) => void;
  getStatusColor: (status: string) => 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const DriverTable: React.FC<DriverTableProps> = ({
  drivers,
  onEdit,
  onDelete,
  getStatusColor,
}) => {
  if (!drivers || drivers.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <FontAwesomeIcon icon={faUser} size="3x" color="#ccc" />
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          No drivers found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add your first driver to get started
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Driver</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Hospital</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {drivers.map((driver) => (
            <TableRow key={driver.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FontAwesomeIcon icon={faUser} color="#666" />
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {driver.firstName} {driver.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {driver.id}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              
              <TableCell>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FontAwesomeIcon icon={faEnvelope} size="sm" color="#666" />
                    <Typography variant="body2">{driver.email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FontAwesomeIcon icon={faPhone} size="sm" color="#666" />
                    <Typography variant="body2">{driver.phoneNumber}</Typography>
                  </Box>
                </Box>
              </TableCell>
              
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FontAwesomeIcon icon={faHospital} color="#666" />
                  <Typography variant="body2">
                    {driver.hospital?.name || 'Not assigned'}
                  </Typography>
                </Box>
              </TableCell>
              
              <TableCell>
                <Chip
                  label={driver.status}
                  color={getStatusColor(driver.status)}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              
              <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <IconButton
                    onClick={() => onEdit(driver)}
                    size="small"
                    color="primary"
                    title="Edit Driver"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </IconButton>
                  <IconButton
                    onClick={() => onDelete(driver.id)}
                    size="small"
                    color="error"
                    title="Delete Driver"
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

export default DriverTable;

