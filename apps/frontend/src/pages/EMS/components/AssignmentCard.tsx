import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  CircularProgress,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAmbulance,
  faUserMd,
  faMapMarkerAlt,
  faClock,
  faCheck,
  faEllipsisV,
  faPlay,
  faStop,
  faEdit,
  faTrash,
  faUserPlus,
  faExclamationTriangle,
  faHistory,
  faHeart,
  faBrain,
} from '@fortawesome/free-solid-svg-icons';
import { alpha } from '@mui/material/styles';
import { EMSAssignment } from '../types/ems';
import CrewAssignmentModal from './CrewAssignmentModal';
import AmbulanceZoneEntriesModal from './AmbulanceZoneEntriesModal';
import PatientJourneyTimeline from './PatientJourneyTimeline';
import CriticalCaseTimer from './CriticalCaseTimer';
import AssignmentInfoGrid from './AssignmentInfoGrid';

interface AssignmentCardProps {
  assignment: EMSAssignment;
  onEdit: (assignment: EMSAssignment) => void;
  onDelete: (id: string) => Promise<void>;
  onStartAssignment: (id: string) => Promise<void>;
  onMarkArrived: (id: string) => Promise<void>;
  onCompleteAssignment: (id: string) => Promise<void>;
  onAssignAmbulance?: (assignment: EMSAssignment) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onEdit,
  onDelete,
  onStartAssignment,
  onMarkArrived,
  onCompleteAssignment,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [ambulanceDriverModalOpen, setAmbulanceDriverModalOpen] = useState(false);
  const [zoneEntriesModalOpen, setZoneEntriesModalOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{
    startAssignment: boolean;
    markArrived: boolean;
    completeAssignment: boolean;
    delete: boolean;
  }>({
    startAssignment: false,
    markArrived: false,
    completeAssignment: false,
    delete: false,
  });

  // Critical case check for header display
  const isCriticalCase = (assignment.ticket?.pathway === 'STEMI' || assignment.ticket?.pathway === 'STROKE');

  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const setLoading = (action: keyof typeof loadingStates, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [action]: loading }));
  };

  const handleStartAssignment = async () => {
    setLoading('startAssignment', true);
    try {
      await onStartAssignment(assignment.id);
    } finally {
      setLoading('startAssignment', false);
    }
  };

  const handleMarkArrived = async () => {
    setLoading('markArrived', true);
    try {
      await onMarkArrived(assignment.id);
    } finally {
      setLoading('markArrived', false);
    }
  };

  const handleCompleteAssignment = async () => {
    setLoading('completeAssignment', true);
    try {
      await onCompleteAssignment(assignment.id);
    } finally {
      setLoading('completeAssignment', false);
    }
  };

  const handleDelete = async () => {
    setLoading('delete', true);
    try {
      await onDelete(assignment.id);
    } finally {
      setLoading('delete', false);
    }
  };

  const handleAmbulanceDriverAssignment = () => {
    setAmbulanceDriverModalOpen(true);
  };

  const handleAmbulanceDriverModalClose = () => {
    setAmbulanceDriverModalOpen(false);
  };

  const handleAmbulanceDriverSuccess = () => {
    // Optionally refresh the assignment data or show a success message
  };

  const getStatusInfo = () => {
    switch (assignment.status) {
      case 'EMS_CONTACT':
        return { label: 'EMS Contact', color: 'info', icon: faUserMd };
      case 'EMS_ARRIVAL':
        return { label: 'EMS Arrival', color: 'primary', icon: faAmbulance };
      case 'DEPARTED':
        return { label: 'Departed', color: 'warning', icon: faMapMarkerAlt };
      case 'ARRIVED':
        return { label: 'Arrived', color: 'success', icon: faCheck };
      case 'CANCELLED':
        return { label: 'Cancelled', color: 'error', icon: faStop };
      default:
        return { label: 'Unknown', color: 'default', icon: faClock };
    }
  };

  const getPriorityInfo = () => {
    // Priority is now derived from the ticket's priority
    const ticketPriority = assignment.ticket?.priority || 'MEDIUM';
    switch (ticketPriority) {
      case 'HIGH':
        return { label: 'High Priority', color: 'error', icon: faClock };
      case 'MEDIUM':
        return { label: 'Medium Priority', color: 'warning', icon: faClock };
      case 'LOW':
        return { label: 'Low Priority', color: 'info', icon: faClock };
      default:
        return { label: 'Standard', color: 'default', icon: faClock };
    }
  };

  const statusInfo = getStatusInfo();
  const priorityInfo = getPriorityInfo();

  const getPathwayIcon = () => {
    const pathway = assignment.ticket?.pathway;
    switch (pathway) {
      case 'STEMI':
        return faHeart;
      case 'STROKE':
        return faBrain;
      case 'TRAUMA':
        return faAmbulance;
      default:
        return faClock;
    }
  };

  const getPathwayColor = () => {
    const pathway = assignment.ticket?.pathway;
    switch (pathway) {
      case 'STEMI':
        return '#f44336'; // Red
      case 'STROKE':
        return '#ff9800'; // Orange
      case 'TRAUMA':
        return '#2196f3'; // Blue
      default:
        return '#757575'; // Grey
    }
  };

  const getActionButtons = () => {
    const buttons: React.ReactElement[] = [];

    switch (assignment.status) {
      case 'EMS_CONTACT':
        // Add ambulance & driver assignment button if not already assigned
        buttons.push(
          <Button
            key="assign"
            variant="outlined"
            color="secondary"
            startIcon={<FontAwesomeIcon icon={faUserPlus} />}
            onClick={handleAmbulanceDriverAssignment}
            sx={{ minWidth: 140 }}
          >
            Assign Crew
          </Button>
        );

        buttons.push(
          <Button
            key="start"
            variant="contained"
            color="primary"
            startIcon={loadingStates.startAssignment ? <CircularProgress size={16} color="inherit" /> : <FontAwesomeIcon icon={faPlay} />}
            onClick={handleStartAssignment}
            disabled={loadingStates.startAssignment || !assignment.ambulance}
            sx={{ minWidth: 120 }}
          >
            {loadingStates.startAssignment ? 'Processing...' : 'EMS Arrival'}
          </Button>
        );
        break;

      case 'EMS_ARRIVAL':
        buttons.push(
          <Button
            key="arrived"
            variant="contained"
            color="warning"
            startIcon={loadingStates.markArrived ? <CircularProgress size={16} color="inherit" /> : <FontAwesomeIcon icon={faMapMarkerAlt} />}
            onClick={handleMarkArrived}
            disabled={loadingStates.markArrived}
            sx={{ minWidth: 120 }}
          >
            {loadingStates.markArrived ? 'Processing...' : 'Departed'}
          </Button>
        );
        break;

      case 'DEPARTED':
        buttons.push(
          <Button
            key="complete"
            variant="contained"
            color="success"
            startIcon={loadingStates.completeAssignment ? <CircularProgress size={16} color="inherit" /> : <FontAwesomeIcon icon={faCheck} />}
            onClick={handleCompleteAssignment}
            disabled={loadingStates.completeAssignment}
            sx={{ minWidth: 120 }}
          >
            {loadingStates.completeAssignment ? 'Processing...' : 'Arrived'}
          </Button>
        );
        break;

      case 'ARRIVED':
        buttons.push(
          <Button
            key="completed"
            variant="outlined"
            color="primary"
            disabled
            sx={{ minWidth: 120 }}
          >
            Arrived
          </Button>
        );
        break;

      case 'CANCELLED':
        buttons.push(
          <Button
            key="cancelled"
            variant="outlined"
            color="error"
            disabled
            sx={{ minWidth: 120 }}
          >
            Cancelled
          </Button>
        );
        break;
    }

    return buttons;
  };

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: 2,
        boxShadow: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Assignment #{assignment.id.slice(-8).toUpperCase()}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Chip
                label={statusInfo.label}
                color={statusInfo.color as any}
                size="small"
                icon={<FontAwesomeIcon icon={statusInfo.icon} />}
              />
              <Chip
                label={priorityInfo.label}
                color={priorityInfo.color as any}
                size="small"
                variant="outlined"
              />
              {isCriticalCase && (
                <Chip
                  icon={<FontAwesomeIcon icon={getPathwayIcon()} />}
                  label={assignment.ticket?.pathway}
                  size="small"
                  sx={{
                    backgroundColor: getPathwayColor(),
                    color: 'white',
                    fontWeight: 600,
                    alignItems: 'center',
                  }}
                />
              )}
              {assignment.ticket?.isEmergency && (
                <Chip
                  label="Life Saving"
                  color="error"
                  size="small"
                  icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
                />
              )}
            </Box>
          </Box>

          <IconButton
            onClick={handleMenuClick}
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: alpha('#000', 0.04) }
            }}
          >
            <FontAwesomeIcon icon={faEllipsisV} />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => { setZoneEntriesModalOpen(true); handleMenuClose(); }}>
              <FontAwesomeIcon icon={faHistory} style={{ marginRight: 8 }} />
              View Zone Entries
            </MenuItem>
            <MenuItem onClick={() => { onEdit(assignment); handleMenuClose(); }}>
              <FontAwesomeIcon icon={faEdit} style={{ marginRight: 8 }} />
              Edit Assignment
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => { handleDelete(); handleMenuClose(); }}
              disabled={loadingStates.delete}
              sx={{ color: 'error.main' }}
            >
              {loadingStates.delete ? (
                <CircularProgress size={16} style={{ marginRight: 8 }} />
              ) : (
                <FontAwesomeIcon icon={faTrash} style={{ marginRight: 8 }} />
              )}
              {loadingStates.delete ? 'Deleting...' : 'Delete Assignment'}
            </MenuItem>
          </Menu>
        </Box>

        {/* Countdown Timer for STEMI/Stroke */}
        <CriticalCaseTimer assignment={assignment} />

        {/* Assignment Details */}
        <AssignmentInfoGrid assignment={assignment} />

        {/* Timeline */}
        <PatientJourneyTimeline assignment={assignment} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
          {getActionButtons()}
        </Box>

        {/* Notes */}
        {assignment.notes && (
          <Box sx={{ mt: 2, p: 2, bgcolor: alpha('#1976d2', 0.05), borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Notes:
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {assignment.notes}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Crew Assignment Modal with AI Recommendations */}
      <CrewAssignmentModal
        open={ambulanceDriverModalOpen}
        onClose={handleAmbulanceDriverModalClose}
        assignment={assignment}
        ticketId={assignment.ticketId}
        onSuccess={handleAmbulanceDriverSuccess}
      />

      {/* Ambulance Zone Entries Modal */}
      <AmbulanceZoneEntriesModal
        open={zoneEntriesModalOpen}
        onClose={() => setZoneEntriesModalOpen(false)}
        assignment={assignment}
      />
    </Card>
  );
};

export default AssignmentCard;
