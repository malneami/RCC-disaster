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
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash, 
  faCoffee,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { DriverSchedule } from '../types/ems';

interface ScheduleTableProps {
  schedules: DriverSchedule[];
  onEdit: (schedule: DriverSchedule) => void;
  onDelete: (id: string) => void;
  onStartBreak: (id: string) => void;
  onEndBreak: (id: string) => void;
  canStartBreak: (schedule: DriverSchedule) => boolean;
  canEndBreak: (schedule: DriverSchedule) => boolean;
  getStatusColor: (status: string) => string;
  getShiftTypeColor: (shiftType: string) => string;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedules,
  onEdit,
  onDelete,
  onStartBreak,
  onEndBreak,
  canStartBreak,
  canEndBreak,
  getStatusColor,
  getShiftTypeColor,
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Driver</TableCell>
            <TableCell>Ambulance</TableCell>
            <TableCell>Shift Type</TableCell>
            <TableCell>Start Time</TableCell>
            <TableCell>End Time</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Break Actions</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {schedules.map((schedule) => (
            <TableRow key={schedule.id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box>
                    {schedule.driver?.firstName} {schedule.driver?.lastName}
                  </Box>
                  {schedule.driver?.status === 'INACTIVE' && (
                    <Chip
                      label="Inactive"
                      color="error"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </TableCell>
              <TableCell>
                {schedule.ambulance?.callSign} ({schedule.ambulance?.plateNumber})
              </TableCell>
              <TableCell>
                <Chip
                  label={schedule.shiftType}
                  color={getShiftTypeColor(schedule.shiftType) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {schedule.shiftStart ? new Date(schedule.shiftStart).toLocaleString() : 'N/A'}
              </TableCell>
              <TableCell>
                {schedule.shiftEnd ? new Date(schedule.shiftEnd).toLocaleString() : 'N/A'}
              </TableCell>
              <TableCell>
                <Chip
                  label={schedule.status}
                  color={getStatusColor(schedule.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {canStartBreak(schedule) && (
                    <IconButton
                      size="small"
                      onClick={() => onStartBreak(schedule.id)}
                      color="primary"
                      title="Start Break"
                    >
                      <FontAwesomeIcon icon={faCoffee} />
                    </IconButton>
                  )}
                  {canEndBreak(schedule) && (
                    <IconButton
                      size="small"
                      onClick={() => onEndBreak(schedule.id)}
                      color="secondary"
                      title="End Break"
                    >
                      <FontAwesomeIcon icon={faClock} />
                    </IconButton>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => onEdit(schedule)}
                    color="primary"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onDelete(schedule.id)}
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

export default ScheduleTable;
