import React, { useState, useMemo, useEffect } from 'react';
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
  faDownload,
} from '@fortawesome/free-solid-svg-icons';
import { alpha } from '@mui/material/styles';
import { EMSAssignment } from '../types/ems';
import CrewAssignmentModal from './CrewAssignmentModal';
import AmbulanceZoneEntriesModal from './AmbulanceZoneEntriesModal';
import PatientJourneyTimeline from './PatientJourneyTimeline';
import CriticalCaseTimer from './CriticalCaseTimer';
import AssignmentInfoGrid from './AssignmentInfoGrid';
import { emsService } from '../services/emsService';
import { downloadFile, sanitizeFilename } from '../../../utils/fileUtils';

interface AssignmentCardProps {
  assignment: EMSAssignment;
  onEdit: (assignment: EMSAssignment) => void;
  onDelete: (id: string) => Promise<void>;
  onStartAssignment: (id: string) => Promise<void>;
  onMarkArrived: (id: string) => Promise<void>;
  onMarkDeparted?: (id: string) => Promise<void>;
  onCompleteAssignment: (id: string) => Promise<void>;
  onAssignAmbulance?: (assignment: EMSAssignment) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onEdit,
  onDelete,
  onStartAssignment,
  onMarkArrived,
  onMarkDeparted,
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
    download: boolean;
  }>({
    startAssignment: false,
    markArrived: false,
    completeAssignment: false,
    delete: false,
    download: false,
  });

  // Check if ambulance is late
  // Logic: If (Now + ETA Minutes) > estimatedArrivalTime + 5 mins buffer
  const isLate = useMemo(() => {
    if (!assignment.estimatedArrivalMinutes || !assignment.estimatedArrivalTime) return false;

    // Only apply for active statuses where travel is involved
    if (!['EMS_CONTACT', 'EN_ROUTE', 'DEPARTED', 'PATIENT_LOADED'].includes(assignment.status)) return false;

    const now = new Date();
    const projectedArrival = new Date(now.getTime() + assignment.estimatedArrivalMinutes * 60000);
    const targetArrival = new Date(assignment.estimatedArrivalTime);
    const bufferMinutes = 5;

    // Check if projected arrival is significantly later than target
    return projectedArrival.getTime() > (targetArrival.getTime() + bufferMinutes * 60000);
    // Check if projected arrival is significantly later than target
    return projectedArrival.getTime() > (targetArrival.getTime() + bufferMinutes * 60000);
  }, [assignment.estimatedArrivalMinutes, assignment.estimatedArrivalTime, assignment.status]);

  // Live countdown logic
  const [displayedMinutes, setDisplayedMinutes] = useState<number | null>(assignment.estimatedArrivalMinutes || null);

  useEffect(() => {
    // Sync with prop when it updates
    setDisplayedMinutes(assignment.estimatedArrivalMinutes || null);
  }, [assignment.estimatedArrivalMinutes]);

  useEffect(() => {
    if (!assignment.estimatedArrivalMinutes || !assignment.lastEtaUpdateTime) return;

    // Only run for active statuses
    if (!['EMS_CONTACT', 'EN_ROUTE', 'DEPARTED', 'PATIENT_LOADED'].includes(assignment.status)) return;

    const intervalId = setInterval(() => {
      // Calculate how much time passed since the last ETA update
      const lastUpdate = new Date(assignment.lastEtaUpdateTime!);
      const now = new Date();
      const secondsPassed = (now.getTime() - lastUpdate.getTime()) / 1000;
      const minutesPassed = Math.floor(secondsPassed / 60);

      // New remaining time = Original Estimate - Minutes Passed
      // Ensure we don't show negative numbers (min 0) or weird jumps
      const newMinutes = Math.max(0, assignment.estimatedArrivalMinutes! - minutesPassed);

      setDisplayedMinutes(newMinutes);
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [assignment.estimatedArrivalMinutes, assignment.lastEtaUpdateTime, assignment.status]);

  // Helper to format minute display
  const getEtaLabel = () => {
    if (displayedMinutes === null) return '';
    if (displayedMinutes <= 0) return 'Arriving now';
    if (displayedMinutes < 60) return `Arriving in ${displayedMinutes} min`;
    const hours = Math.floor(displayedMinutes / 60);
    const mins = displayedMinutes % 60;
    return `Arriving in ${hours}h ${mins}m`;
  };

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

  const handleMarkDeparted = async () => {
    setLoading('markArrived', true);
    try {
      if (onMarkDeparted) {
        await onMarkDeparted(assignment.id);
      } else {
        // Fallback to onMarkArrived if onMarkDeparted is not provided
        await onMarkArrived(assignment.id);
      }
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

  const handleDownload = async () => {
    setLoading('download', true);
    try {
      const blob = await emsService.exportAssignment(assignment.id, 'PDF');
      const filename = sanitizeFilename(`assignment-${assignment.id.slice(-8).toUpperCase()}-${Date.now()}.pdf`);
      downloadFile(blob, filename);
    } catch (error) {
      // You could add a toast notification here if available
    } finally {
      setLoading('download', false);
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
    // PRIORITY: Check timestamps FIRST - they are the source of truth
    // If timestamps exist, they override the status field (which might be stale)
    if (assignment.journeyEndTime) {
      return { label: 'Arrived', color: 'success', icon: faCheck };
    }
    if (assignment.journeyStartTime) {
      return { label: 'Departed', color: 'warning', icon: faMapMarkerAlt };
    }
    if (assignment.actualArrivalTime) {
      return { label: 'EMS Arrival', color: 'primary', icon: faAmbulance };
    }
    if (assignment.emsContactTime) {
      return { label: 'EMS Contact', color: 'info', icon: faUserMd };
    }

    // Fallback: Use explicit status field if no timestamps exist
    if (assignment.status) {
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
      }
    }

    // Default fallback
    return { label: 'Unknown', color: 'default', icon: faClock };
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

    // Infer status from timestamps if status field is missing/invalid
    const inferredStatus = assignment.status && ['EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED', 'ARRIVED', 'CANCELLED'].includes(assignment.status)
      ? assignment.status
      : assignment.journeyEndTime ? 'ARRIVED'
        : assignment.journeyStartTime ? 'DEPARTED'
          : assignment.actualArrivalTime ? 'EMS_ARRIVAL'
            : assignment.emsContactTime ? 'EMS_CONTACT'
              : assignment.status || 'EMS_CONTACT';

    switch (inferredStatus) {
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
            key="departed"
            variant="contained"
            color="warning"
            startIcon={loadingStates.markArrived ? <CircularProgress size={16} color="inherit" /> : <FontAwesomeIcon icon={faMapMarkerAlt} />}
            onClick={handleMarkDeparted}
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
        border: isLate ? '2px solid #ff9800' : 'none',
        bgcolor: isLate ? alpha('#ff9800', 0.05) : 'background.paper',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {isLate && (
          <Box sx={{
            mb: 2,
            p: 1,
            bgcolor: '#fff3e0',
            color: '#e65100',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            border: '1px solid #ffe0b2'
          }}>
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <Typography variant="body2" fontWeight="bold">
              Delayed: Estimated arrival exceeds initial prediction
            </Typography>
          </Box>
        )}
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
              {assignment.estimatedArrivalMinutes !== undefined && assignment.estimatedArrivalMinutes !== null && assignment.estimatedArrivalMinutes > 0 && (
                <Chip
                  icon={<FontAwesomeIcon icon={faClock} />}
                  label={`ETA: ${assignment.estimatedArrivalMinutes} min`}
                  color={assignment.estimatedArrivalMinutes < 10 ? 'error' : assignment.estimatedArrivalMinutes < 20 ? 'warning' : 'success'}
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
              {assignment.estimatedArrivalTime && (
                <Chip
                  icon={<FontAwesomeIcon icon={faClock} />}
                  label={`Original Est: ${new Date(assignment.estimatedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  variant="outlined"
                  size="small"
                  sx={{
                    opacity: 0.6, // Dimmed to show it's secondary
                    borderColor: isLate ? '#ff9800' : 'default',
                    color: isLate ? '#e65100' : 'text.secondary'
                  }}
                />
              )}

              {(displayedMinutes !== null) && ['EMS_CONTACT', 'EN_ROUTE', 'DEPARTED', 'PATIENT_LOADED'].includes(assignment.status) && (
                <Chip
                  icon={<FontAwesomeIcon icon={faClock} />}
                  label={getEtaLabel()} // Use the dynamic label
                  color={isLate ? "warning" : "success"} // Green normally, Orange if late
                  size="small"
                  sx={{ fontWeight: 'bold' }}
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
            <MenuItem
              onClick={() => { handleDownload(); handleMenuClose(); }}
              disabled={loadingStates.download}
            >
              {loadingStates.download ? (
                <CircularProgress size={16} style={{ marginRight: 8 }} />
              ) : (
                <FontAwesomeIcon icon={faDownload} style={{ marginRight: 8 }} />
              )}
              {loadingStates.download ? 'Downloading...' : 'Download Assignment'}
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
