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
  faPlay,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { EMSAssignment } from '../types/ems';

interface AssignmentTableProps {
  assignments: EMSAssignment[];
  onEdit: (assignment: EMSAssignment) => void;
  onDelete: (id: string) => void;
  onStartAssignment: (id: string) => void;
  onCompleteAssignment: (id: string) => void;
  getStatusColor: (status: string) => string;
}

const AssignmentTable: React.FC<AssignmentTableProps> = ({
  assignments,
  onEdit,
  onDelete,
  onStartAssignment,
  onCompleteAssignment,
  getStatusColor,
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Ticket</TableCell>
            <TableCell>Patient</TableCell>
            <TableCell>Ambulance</TableCell>
            <TableCell>Driver</TableCell>
            <TableCell>Assigned At</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell>
                {assignment.ticket?.ticketNumber}
              </TableCell>
              <TableCell>
                {assignment.ticket?.patient?.firstName} {assignment.ticket?.patient?.lastName}
              </TableCell>
              <TableCell>
                {assignment.ambulance?.callSign} ({assignment.ambulance?.plateNumber})
              </TableCell>
              <TableCell>
                {assignment.driver?.firstName} {assignment.driver?.lastName}
              </TableCell>
              <TableCell>
                {new Date(assignment.assignedAt).toLocaleString()}
              </TableCell>
              <TableCell>
                <Chip
                  label={assignment.status}
                  color={getStatusColor(assignment.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {assignment.status === 'EMS_CONTACT' && (
                    <IconButton
                      size="small"
                      onClick={() => onStartAssignment(assignment.id)}
                      color="primary"
                      title="Start Assignment"
                    >
                      <FontAwesomeIcon icon={faPlay} />
                    </IconButton>
                  )}
                  {assignment.status === 'DEPARTED' && (
                    <IconButton
                      size="small"
                      onClick={() => onCompleteAssignment(assignment.id)}
                      color="success"
                      title="Complete Assignment"
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => onEdit(assignment)}
                    color="primary"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onDelete(assignment.id)}
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

export default AssignmentTable;
