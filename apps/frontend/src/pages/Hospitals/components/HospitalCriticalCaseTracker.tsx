import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  CircularProgress,
  Stack,
  alpha,
  Chip,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle,
  faRedo,
  faHeart,
  faBrain,
  faClock,
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';

import { useHospitalCriticalCases } from '../hooks/useHospitalCriticalCases';
import { useAudioAlerts } from '../../Dashboard/CriticalCaseTracker/useAudioAlerts';
import { getEMSStatusInfo, getEMSStatusColor } from '../../../utils/emsStatusUtils';

interface HospitalCriticalCaseTrackerProps {
  hospitalId: string;
}

const HospitalCriticalCaseTracker: React.FC<HospitalCriticalCaseTrackerProps> = ({
  hospitalId,
}) => {
  const { data: criticalCases, isLoading, error, refetch } = useHospitalCriticalCases(hospitalId);
  const { playAlert } = useAudioAlerts();

  // Filter for STEMI and Stroke cases only, excluding completed cases and cases older than 24 hours
  const stemiStrokeCases = criticalCases?.filter(case_ => {
    // Must be STEMI or Stroke pathway
    if (case_.pathway !== 'STEMI' && case_.pathway !== 'STROKE') {
      return false;
    }
    
    // Exclude completed cases
    if (case_.status === 'COMPLETED') {
      return false;
    }
    
    // Exclude cases older than 24 hours
    const creationTime = new Date(case_.createdAt).getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const isWithin24Hours = (Date.now() - creationTime) < twentyFourHours;
    
    return isWithin24Hours;
  }) || [];

  // Check for critical time warnings and play alerts
  useEffect(() => {
    if (stemiStrokeCases.length > 0) {
      const criticalCases = stemiStrokeCases.filter(case_ => {
        const elapsed = Date.now() - new Date(case_.createdAt).getTime();
        const timeLimit = case_.pathway === 'STEMI' ? 120 * 60 * 1000 : 4.5 * 60 * 60 * 1000; // 120 min or 4.5 hr
        const remaining = timeLimit - elapsed;
        
        // Play alert if less than 10 minutes remaining
        return remaining < 10 * 60 * 1000 && remaining > 0;
      });

      if (criticalCases.length > 0) {
        playAlert(criticalCases[0].pathway);
      }
    }
  }, [stemiStrokeCases, playAlert]);

  const CriticalCaseCard = ({ criticalCase }: { criticalCase: any }) => {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [progressPercentage, setProgressPercentage] = useState<number>(0);
    const [isCritical, setIsCritical] = useState<boolean>(false);

    // Calculate time remaining and progress
    useEffect(() => {
      const calculateTime = () => {
        // Don't run countdown if ticket is completed
        if (criticalCase.status === 'COMPLETED') {
          setTimeRemaining(0);
          setProgressPercentage(100);
          setIsCritical(false);
          return;
        }

        // Check if case is within 24 hours of creation
        const creationTime = new Date(criticalCase.createdAt).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const isWithin24Hours = (Date.now() - creationTime) < twentyFourHours;

        // Don't show countdown if more than 24 hours have passed
        if (!isWithin24Hours) {
          setTimeRemaining(0);
          setProgressPercentage(100);
          setIsCritical(false);
          return;
        }

        const elapsed = Date.now() - creationTime;
        const timeLimit = criticalCase.pathway === 'STEMI' 
          ? 120 * 60 * 1000  // 120 minutes
          : 4.5 * 60 * 60 * 1000; // 4.5 hours
        
        const remaining = Math.max(0, timeLimit - elapsed);
        const percentage = Math.min(100, (elapsed / timeLimit) * 100);
        
        setTimeRemaining(remaining);
        setProgressPercentage(percentage);
        setIsCritical(remaining < 10 * 60 * 1000 && remaining > 0); // Less than 10 minutes
      };

      calculateTime();
      const interval = setInterval(calculateTime, 1000); // Update every second

      return () => clearInterval(interval);
    }, [criticalCase.createdAt, criticalCase.pathway, criticalCase.status]);

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
      if (isCritical) return '#d32f2f'; // Red for critical
      if (progressPercentage > 75) return '#ff9800'; // Orange for warning
      return '#4caf50'; // Green for normal
    };

    const getPathwayIcon = () => {
      return criticalCase.pathway === 'STEMI' ? faHeart : faBrain;
    };

    const getPathwayColor = () => {
      return criticalCase.pathway === 'STEMI' ? '#d32f2f' : '#9c27b0';
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'CRITICAL':
        case 'EMERGENCY':
          return 'error';
        case 'HIGH':
          return 'warning';
        default:
          return 'default';
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'PENDING':
          return 'error';
        case 'ASSIGNED':
        case 'IN_TRANSPORT':
          return 'warning';
        case 'COMPLETED':
          return 'success';
        default:
          return 'default';
      }
    };

    return (
      <Card
        sx={{
          borderRadius: 2,
          border: isCritical 
            ? '2px solid #d32f2f' 
            : '1px solid rgba(0,0,0,0.08)',
          backgroundColor: isCritical 
            ? alpha('#d32f2f', 0.05) 
            : 'white',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: isCritical 
              ? '0 8px 25px rgba(211, 47, 47, 0.3)' 
              : '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <FontAwesomeIcon 
                icon={getPathwayIcon()} 
                style={{ 
                  color: getPathwayColor(), 
                  marginRight: '12px', 
                  fontSize: '20px' 
                }} 
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {criticalCase.pathway} Emergency
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Patient: {criticalCase.patient?.firstName} {criticalCase.patient?.lastName}
                  {criticalCase.patient?.mrn && ` (MRN: ${criticalCase.patient.mrn})`}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={criticalCase.priority}
                size="small"
                color={getPriorityColor(criticalCase.priority) as any}
              />
              <Chip
                label={criticalCase.status}
                size="small"
                color={getStatusColor(criticalCase.status) as any}
              />
              {criticalCase.emsAssignmentStatus && (
                <Chip
                  label={getEMSStatusInfo(criticalCase.emsAssignmentStatus).displayName}
                  size="small"
                  sx={{
                    backgroundColor: getEMSStatusColor(criticalCase.emsAssignmentStatus),
                    color: 'white',
                    fontWeight: 500,
                  }}
                />
              )}
              {isCritical && (
                <FontAwesomeIcon 
                  icon={faExclamationTriangle} 
                  style={{ color: '#d32f2f', fontSize: '16px' }} 
                />
              )}
            </Box>
          </Box>

          {/* Time Remaining */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FontAwesomeIcon 
                icon={faClock} 
                style={{ 
                  color: isCritical ? '#d32f2f' : '#666', 
                  marginRight: '8px',
                  fontSize: '14px'
                }} 
              />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  color: isCritical ? '#d32f2f' : 'inherit'
                }}
              >
                {criticalCase.status === 'COMPLETED' 
                  ? 'COMPLETED' 
                  : timeRemaining > 0 
                    ? formatTime(timeRemaining) 
                    : 'TIME EXPIRED'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                {criticalCase.status === 'COMPLETED' 
                  ? '' 
                  : timeRemaining > 0 
                    ? 'remaining' 
                    : ''}
              </Typography>
            </Box>
            
            {/* Progress Bar */}
            <Box
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(getProgressColor(), 0.1),
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: `${progressPercentage}%`,
                  backgroundColor: getProgressColor(),
                  borderRadius: 4,
                  transition: 'width 1s ease-in-out',
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {criticalCase.status === 'COMPLETED' 
                ? 'Case completed successfully' 
                : `${Math.round(progressPercentage)}% of time limit elapsed`}
            </Typography>
          </Box>

          {/* Route Information */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FontAwesomeIcon 
                icon={faMapMarkerAlt} 
                style={{ color: '#666', marginRight: '8px', fontSize: '14px' }} 
              />
              <Typography variant="body2" color="text.secondary">
                From: {criticalCase.originHospital?.name}
              </Typography>
            </Box>
            {criticalCase.destinationHospital && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                To: {criticalCase.destinationHospital.name}
              </Typography>
            )}
            {criticalCase.estimatedArrival && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                ETA: {new Date(criticalCase.estimatedArrival).toLocaleString()}
              </Typography>
            )}
          </Box>

          {/* Chief Complaint */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Chief Complaint:</strong> {criticalCase.chiefComplaint}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FontAwesomeIcon 
              icon={faExclamationTriangle} 
              style={{ color: '#d32f2f', marginRight: '16px', fontSize: '28px' }} 
            />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                Real-Time Critical Case Tracker
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Live countdown tracking for STEMI (120 min) and Stroke (4.5 hr) cases with hospital routes and progress monitoring.
              </Typography>
            </Box>
          </Box>

          {/* Error Card */}
          <Card sx={{ 
            borderRadius: 2, 
            border: '1px solid rgba(211, 47, 47, 0.3)',
            backgroundColor: alpha('#d32f2f', 0.05),
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FontAwesomeIcon 
                  icon={faExclamationTriangle} 
                  style={{ color: '#d32f2f', marginRight: '8px' }} 
                />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                  Error Loading Alerts
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Failed to load critical ticket alerts. Please try again.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<FontAwesomeIcon icon={faRedo} />}
                onClick={() => refetch()}
                sx={{
                  borderColor: '#666',
                  color: '#666',
                  '&:hover': {
                    borderColor: '#d32f2f',
                    color: '#d32f2f',
                  },
                }}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <FontAwesomeIcon 
            icon={faExclamationTriangle} 
            style={{ color: '#d32f2f', marginRight: '16px', fontSize: '28px' }} 
          />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#d32f2f' }}>
              Real-Time Critical Case Tracker
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Live countdown tracking for STEMI (120 min) and Stroke (4.5 hr) cases with hospital routes and progress monitoring.
            </Typography>
          </Box>
        </Box>
        {/* Summary Stats */}
        {stemiStrokeCases.length > 0 && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: alpha('#d32f2f', 0.05), borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Active Critical Cases Summary
            </Typography>
            <Stack direction="row" spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faHeart} style={{ color: '#d32f2f', marginRight: '8px' }} />
                <Typography variant="body2">
                  STEMI: {stemiStrokeCases.filter(c => c.pathway === 'STEMI').length}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faBrain} style={{ color: '#d32f2f', marginRight: '8px' }} />
                <Typography variant="body2">
                  Stroke: {stemiStrokeCases.filter(c => c.pathway === 'STROKE').length}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
        {/* Cases Display */}
        {stemiStrokeCases.length === 0 ? (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            No active STEMI or Stroke cases requiring critical tracking.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {stemiStrokeCases.map((case_) => (
              <CriticalCaseCard
                key={case_.id}
                criticalCase={case_}
              />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default HospitalCriticalCaseTracker;
