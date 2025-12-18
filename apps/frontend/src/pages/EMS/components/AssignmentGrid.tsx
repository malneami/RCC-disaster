import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import AssignmentCard from './AssignmentCard';
import { EMSAssignment } from '../types/ems';

interface AssignmentGridProps {
  assignments: EMSAssignment[];
  onEdit: (assignment: EMSAssignment) => void;
  onDelete: (id: string) => Promise<void>;
  onStartAssignment: (id: string) => Promise<void>;
  onMarkArrived: (id: string) => Promise<void>;
  onMarkDeparted?: (id: string) => Promise<void>;
  onLoadPatient: (id: string) => void;
  onCompleteAssignment: (id: string) => Promise<void>;
  onAssignAmbulance?: (assignment: EMSAssignment) => void;
  getStatusColor: (status: string) => string;
}

const AssignmentGrid: React.FC<AssignmentGridProps> = ({
  assignments,
  onEdit,
  onDelete,
  onStartAssignment,
  onMarkArrived,
  onMarkDeparted,
  onCompleteAssignment,
  onAssignAmbulance,
}) => {
  if (assignments.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert 
          severity="info" 
          icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-message': {
              width: '100%',
            }
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            No Assignments Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            There are no assignments in this category. Create a new assignment to get started.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {assignments.map((assignment) => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          onEdit={onEdit}
          onDelete={onDelete}
          onStartAssignment={onStartAssignment}
          onMarkArrived={onMarkArrived}
          onMarkDeparted={onMarkDeparted}
          onCompleteAssignment={onCompleteAssignment}
          onAssignAmbulance={onAssignAmbulance}
        />
      ))}
    </Box>
  );
};

export default AssignmentGrid;
