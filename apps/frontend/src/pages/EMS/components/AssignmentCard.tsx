import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
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
  faHeart,
  faBrain,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { alpha } from '@mui/material/styles';
import { EMSAssignment } from '../types/ems';
import AmbulanceDriverAssignmentModal from './AmbulanceDriverAssignmentModal';

interface AssignmentCardProps {
  assignment: EMSAssignment;
  onEdit: (assignment: EMSAssignment) => void;
  onDelete: (id: string) => Promise<void>;
  onStartAssignment: (id: string) => Promise<void>;
  onMarkArrived: (id: string) => Promise<void>;
  onCompleteAssignment: (id: string) => Promise<void>;
  onAssignAmbulance?: (assignment: EMSAssignment) => void;
}

interface TimelineStep {
  id: string;
  label: string;
  icon: React.ReactElement;
  completed: boolean;
  active: boolean;
  timestamp?: string;
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
  
  // Countdown timer state for STEMI/Stroke cases
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [isCritical, setIsCritical] = useState<boolean>(false);
  
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
    console.log('Ambulance and driver assigned successfully');
  };

  // Calculate countdown timer for STEMI/Stroke cases
  useEffect(() => {
    const pathway = assignment.ticket?.pathway;
    const createdAt = assignment.ticket?.createdAt;
    
    // Only show countdown for STEMI or STROKE cases
    if (pathway !== 'STEMI' && pathway !== 'STROKE') {
      setTimeRemaining(0);
      setProgressPercentage(0);
      setIsCritical(false);
      return;
    }

    if (!createdAt) {
      setTimeRemaining(0);
      setProgressPercentage(0);
      setIsCritical(false);
      return;
    }

    const calculateTime = () => {
      const creationTime = new Date(createdAt).getTime();
      const elapsed = Date.now() - creationTime;
      const timeLimit = pathway === 'STEMI' 
        ? 120 * 60 * 1000  // 120 minutes
        : 4.5 * 60 * 60 * 1000; // 4.5 hours
      
      const remaining = Math.max(0, timeLimit - elapsed);
      const percentage = Math.min(100, (elapsed / timeLimit) * 100);
      
      setTimeRemaining(remaining);
      setProgressPercentage(percentage);
      setIsCritical(percentage >= 100);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [assignment.ticket?.pathway, assignment.ticket?.createdAt]);

  const getTimelineSteps = (): TimelineStep[] => {
    console.log(assignment.createdAt,"createdAt: timezoned", new Date(assignment.createdAt).toLocaleString());
    const steps: TimelineStep[] = [
      {
        id: 'ems_contact',
        label: 'EMS Contact',
        icon: <FontAwesomeIcon icon={faUserMd} />,
        completed: assignment.status !== 'EMS_CONTACT',
        active: assignment.status === 'EMS_CONTACT',
        timestamp: assignment.emsContactTime ? new Date(assignment.emsContactTime).toLocaleTimeString() : undefined,
      },
      {
        id: 'ems_arrival',
        label: 'EMS Arrival',
        icon: <FontAwesomeIcon icon={faAmbulance} />,
        completed: ['EMS_ARRIVAL', 'DEPARTED', 'ARRIVED'].includes(assignment.status),
        active: assignment.status === 'EMS_ARRIVAL',
        timestamp: assignment.actualArrivalTime ? new Date(assignment.actualArrivalTime).toLocaleTimeString() : undefined,
      },
      {
        id: 'departed',
        label: 'Departed',
        icon: <FontAwesomeIcon icon={faMapMarkerAlt} />,
        completed: ['DEPARTED', 'ARRIVED'].includes(assignment.status),
        active: assignment.status === 'DEPARTED',
        timestamp: assignment.journeyStartTime ? new Date(assignment.journeyStartTime).toLocaleTimeString() : undefined,
      },
      {
        id: 'arrived_destination',
        label: 'Arrived',
        icon: <FontAwesomeIcon icon={faCheck} />,
        completed: assignment.status === 'ARRIVED',
        active: assignment.status === 'ARRIVED',
        timestamp: assignment.journeyEndTime ? new Date(assignment.journeyEndTime).toLocaleTimeString() : undefined,
      },
    ];

    return steps;
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
  const timelineSteps = getTimelineSteps();

  // Format time for countdown display
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getProgressColor = () => {
    if (progressPercentage >= 100) return '#d32f2f'; // Red for missed deadline
    if (progressPercentage >= 75) return '#ff9800'; // Orange for warning
    return '#4caf50'; // Green for normal
  };

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
              {(assignment.ticket?.pathway === 'STEMI' || assignment.ticket?.pathway === 'STROKE') && (
                <Chip
                  icon={<FontAwesomeIcon icon={getPathwayIcon()} />}
                  label={assignment.ticket.pathway}
                  size="small"
                  sx={{
                    backgroundColor: getPathwayColor(),
                    color: 'white',
                    fontWeight: 600,
                    alignItems: 'center',
                  }}
                />
              )}
              {isCritical && (
                <IconButton
                  size="small"
                  sx={{ 
                    color: '#d32f2f',
                    '&:hover': { bgcolor: alpha('#d32f2f', 0.1) }
                  }}
                >
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                </IconButton>
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
        {(assignment.ticket?.pathway === 'STEMI' || assignment.ticket?.pathway === 'STROKE') && timeRemaining > 0 && (
          <Box 
            sx={{ 
              mb: 3,
              p: 2,
              borderRadius: 2,
              border: isCritical ? '2px solid #d32f2f' : '1px solid rgba(0,0,0,0.1)',
              backgroundColor: isCritical ? alpha('#d32f2f', 0.1) : alpha('#1976d2', 0.05),
              transition: 'all 0.3s ease',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  {/* Background ring */}
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={60}
                    thickness={5}
                    sx={{
                      color: 'rgba(0, 0, 0, 0.1)',
                      position: 'absolute',
                    }}
                  />
                  {/* Progress ring */}
                  <CircularProgress
                    variant="determinate"
                    value={progressPercentage}
                    size={60}
                    thickness={5}
                    sx={{
                      color: getProgressColor(),
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="caption"
                      component="div"
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                    >
                      {`${Math.round(progressPercentage)}%`}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <FontAwesomeIcon 
                      icon={getPathwayIcon()} 
                      style={{ 
                        color: getPathwayColor(), 
                        marginRight: 8,
                        fontSize: '16px'
                      }} 
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {assignment.ticket.pathway} Time Remaining
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: isCritical ? '#d32f2f' : 'text.primary'
                    }}
                  >
                    {formatTime(timeRemaining)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(progressPercentage)}% of time limit elapsed
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Assignment Details */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
          {/* Left Column - Assignment Info */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Assignment Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.light' }}>
                  <FontAwesomeIcon icon={faAmbulance} size="sm" />
                </Avatar>
                <Typography variant="body2">
                  <strong>Ambulance:</strong> {assignment.ambulance?.callSign || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.light' }}>
                  <FontAwesomeIcon icon={faUserMd} size="sm" />
                </Avatar>
                <Typography variant="body2">
                  <strong>Driver:</strong> {assignment.driver?.firstName} {assignment.driver?.lastName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, bgcolor: 'info.light' }}>
                  <FontAwesomeIcon icon={faClock} size="sm" />
                </Avatar>
                <Typography variant="body2">
                  <strong>Assigned:</strong> {new Date(assignment.assignedAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right Column - Ticket Info */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Ticket Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">
                <strong>Ticket:</strong> {assignment.ticket?.ticketNumber || 'N/A'}
              </Typography>
              {assignment.ticket?.pathway && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: getPathwayColor() }}>
                    <FontAwesomeIcon icon={getPathwayIcon()} size="sm" />
                  </Avatar>
                  <Typography variant="body2">
                    <strong>Case Type:</strong> {assignment.ticket.pathway}
                  </Typography>
                </Box>
              )}
              <Typography variant="body2">
                <strong>Patient:</strong> {assignment.ticket?.patient?.firstName} {assignment.ticket?.patient?.lastName}
              </Typography>
              <Typography variant="body2">
                <strong>From:</strong> {assignment.ticket?.originHospital?.name || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>To:</strong> {assignment.ticket?.destinationHospital?.name || 'N/A'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Timeline */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Patient Journey
          </Typography>
          

          {/* Timeline Steps */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
            {timelineSteps.map((step, index) => (
              <React.Fragment key={step.id}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: step.completed 
                        ? 'primary.main' 
                        : step.active 
                          ? 'primary.light' 
                          : alpha('#1976d2', 0.1),
                      color: step.completed || step.active ? 'white' : 'text.secondary',
                      border: step.active ? '3px solid' : 'none',
                      borderColor: 'primary.main',
                      mb: 1,
                      boxShadow: step.completed || step.active ? '0 2px 8px rgba(25, 118, 210, 0.3)' : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {step.icon}
                  </Avatar>
                  <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: step.active ? 600 : 400 }}>
                    {step.label}
                  </Typography>
                  {step.timestamp && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {step.timestamp}
                    </Typography>
                  )}
                </Box>
                
                {/* Connection Line */}
                {index < timelineSteps.length - 1 && (
                  <Box
                    sx={{
                      flex: 1,
                      height: 3,
                      bgcolor: step.completed ? 'primary.main' : alpha('#e0e0e0', 0.8),
                      borderRadius: 2,
                      mx: 1,
                      transition: 'background-color 0.3s ease',
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </Box>
        </Box>

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
      
      {/* Ambulance & Driver Assignment Modal */}
      <AmbulanceDriverAssignmentModal
        open={ambulanceDriverModalOpen}
        onClose={handleAmbulanceDriverModalClose}
        assignment={assignment}
        onSuccess={handleAmbulanceDriverSuccess}
      />
    </Card>
  );
};

export default AssignmentCard;
