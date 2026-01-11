import React, { useState, useEffect, useMemo } from 'react';
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

import { useCriticalCases, CriticalCase, CriticalCasesFilters } from '../../hooks/useCriticalCases';
import { useAudioAlerts } from './useAudioAlerts';
import { getEMSStatusInfo, getEMSStatusColor, EMSAssignmentStatus } from '../../utils/emsStatusUtils';
import { useHospitals } from '../../hooks/useHospitals';
import { ticketService } from '../../services/ticketService';

interface GlobalCriticalCaseTrackerProps {
  selectedHospital?: string;
  onHospitalChange?: (hospitalId: string) => void;
}

const GlobalCriticalCaseTracker: React.FC<GlobalCriticalCaseTrackerProps> = ({
  selectedHospital = 'all',
  onHospitalChange: _onHospitalChange,
}) => {

  // Build filters for the hook with stable reference
  const filters: CriticalCasesFilters = useMemo(() => ({
    hospitalId: selectedHospital !== 'all' ? selectedHospital : undefined,
  }), [selectedHospital]);

  const { data: criticalCases, isLoading, error, refetch } = useCriticalCases(filters);
  const { data: hospitals } = useHospitals();
  const { playAlert } = useAudioAlerts();

  // Filter cases based on other criteria (hospital filtering is now done in the hook)
  const filteredCases = criticalCases?.filter((case_: CriticalCase) => {
    // Must be STEMI or Stroke pathway (already filtered in hook, but keeping for safety)
    if (case_.pathway !== 'STEMI' && case_.pathway !== 'STROKE') {
      return false;
    }

    // Exclude completed cases
    if (case_.status === 'COMPLETED') {
      return false;
    }

    // Exclude acknowledged cases
    if (case_.acknowledgedAt

    ) {
      return false;
    }

    // Exclude cases older than 24 hours from start time
    let startTime = new Date(case_.createdAt).getTime();
    if (case_.pathway === 'STEMI' && case_.triageTime) {
      startTime = new Date(case_.triageTime).getTime();
    } else if (case_.pathway === 'STROKE' && case_.symptomOnset) {
      startTime = new Date(case_.symptomOnset).getTime();
    }

    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const isWithin24Hours = (Date.now() - startTime) < twentyFourHours;

    return isWithin24Hours && case_.acknowledgedAt === null;
  }) || [];

  // Check for critical time warnings and play alerts
  useEffect(() => {
    if (filteredCases.length > 0) {
      const criticalCases = filteredCases.filter((case_: CriticalCase) => {
        let startTime = new Date(case_.createdAt).getTime();
        if (case_.pathway === 'STEMI' && case_.triageTime) {
          startTime = new Date(case_.triageTime).getTime();
        } else if (case_.pathway === 'STROKE' && case_.symptomOnset) {
          startTime = new Date(case_.symptomOnset).getTime();
        }

        const elapsed = Date.now() - startTime;
        const timeLimit = case_.pathway === 'STEMI' ? 120 * 60 * 1000 : 4.5 * 60 * 60 * 1000;
        const percentage = Math.min(100, (elapsed / timeLimit) * 100);


        // Play alert only when deadline is missed (100%)
        return percentage >= 100;
      });


      if (criticalCases.length > 0) {
        playAlert(criticalCases[0].pathway as 'STEMI' | 'STROKE' | 'TRAUMA' | 'GENERAL');
      }
    }
  }, [filteredCases, playAlert]);

  // Removed unused hospital filter handler

  const CriticalCaseCard = ({ criticalCase }: { criticalCase: CriticalCase }) => {
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

        // Determine start time based on pathway
        let startTime = new Date(criticalCase.createdAt).getTime();
        if (criticalCase.pathway === 'STEMI' && criticalCase.triageTime) {
          startTime = new Date(criticalCase.triageTime).getTime();
        } else if (criticalCase.pathway === 'STROKE' && criticalCase.symptomOnset) {
          startTime = new Date(criticalCase.symptomOnset).getTime();
        }

        // Check if case is within 24 hours of start time
        const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const isWithin24Hours = (Date.now() - startTime) < twentyFourHours;

        // Don't show countdown if more than 24 hours have passed
        if (!isWithin24Hours) {
          setTimeRemaining(0);
          setProgressPercentage(100);
          setIsCritical(false);
          return;
        }

        const elapsed = Date.now() - startTime;
        const timeLimit = criticalCase.pathway === 'STEMI'
          ? 120 * 60 * 1000  // 120 minutes
          : 4.5 * 60 * 60 * 1000; // 4.5 hours

        const remaining = Math.max(0, timeLimit - elapsed);
        const percentage = Math.min(100, (elapsed / timeLimit) * 100);

        setTimeRemaining(remaining);
        setProgressPercentage(percentage);
        setIsCritical(percentage >= 100); // Critical only when deadline is missed
      };

      calculateTime();
      const interval = setInterval(calculateTime, 1000); // Update every second

      return () => clearInterval(interval);
    }, [criticalCase.createdAt, criticalCase.pathway, criticalCase.status, criticalCase.triageTime, criticalCase.symptomOnset]);

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
            : '1px solid rgba(255,255,255,0.1)',
          backgroundColor: isCritical
            ? alpha('#d32f2f', 0.1)
            : 'rgba(255,255,255,0.05)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: isCritical
              ? '0 8px 25px rgba(211, 47, 47, 0.3)'
              : '0 4px 12px rgba(255,255,255,0.1)',
            transform: 'translateY(-2px)',
            backgroundColor: isCritical
              ? alpha('#d32f2f', 0.15)
              : 'rgba(255,255,255,0.08)',
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
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, color: '#ffffff' }}>
                  {criticalCase.pathway} Emergency
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  Patient: {criticalCase.patient?.firstName} {criticalCase.patient?.lastName}
                  {criticalCase.patient?.mrn && ` (MRN: ${criticalCase.patient.mrn})`}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                  label={getEMSStatusInfo(criticalCase.emsAssignmentStatus as EMSAssignmentStatus).displayName}
                  size="small"
                  sx={{
                    backgroundColor: getEMSStatusColor(criticalCase.emsAssignmentStatus as EMSAssignmentStatus),
                    color: 'white',
                    fontWeight: 500,
                  }}
                />
              )}
              {criticalCase.isEmergency && (
                <Chip
                  label="Life Saving"
                  size="small"
                  sx={{
                    backgroundColor: '#d32f2f',
                    color: 'white',
                    fontWeight: 600,
                  }}
                  icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly' }}>
              {/* Left side - Time info */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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
                      color: isCritical ? '#d32f2f' : '#ffffff'
                    }}
                  >
                    {criticalCase.status === 'COMPLETED'
                      ? 'COMPLETED'
                      : timeRemaining > 0
                        ? formatTime(timeRemaining)
                        : 'TIME EXPIRED'}
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 1, color: '#b0b0b0' }}>
                    {criticalCase.status === 'COMPLETED'
                      ? ''
                      : timeRemaining > 0
                        ? 'remaining'
                        : ''}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ textAlign: 'center', color: '#b0b0b0' }}>
                  {criticalCase.status === 'COMPLETED'
                    ? 'Case completed successfully'
                    : `${Math.round(progressPercentage)}% of time limit elapsed`}
                </Typography>
              </Box>

              {/* Middle - Route Information */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mx: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      style={{ color: '#666', marginRight: '8px', fontSize: '14px' }}
                    />
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      From: {criticalCase.originHospital?.name}
                    </Typography>
                  </Box>
                  {criticalCase.destinationHospital && (
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      To: {criticalCase.destinationHospital.name}
                    </Typography>
                  )}
                  {criticalCase.estimatedArrival && (
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      ETA: {new Date(criticalCase.estimatedArrival).toLocaleString()}
                    </Typography>
                  )}
                </Box>
                {/* Show direction indicator */}
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label="TRANSFER"
                    size="small"
                    sx={{
                      backgroundColor: '#2196f3',
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                </Box>
              </Box>

              {/* Right side - Circular Progress Bar */}
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  {/* Background ring for uncompleted portion */}
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={80}
                    thickness={6}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.1)',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />
                  {/* Progress ring */}
                  <CircularProgress
                    variant="determinate"
                    value={progressPercentage}
                    size={80}
                    thickness={6}
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
                      sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#b0b0b0' }}
                    >
                      {`${Math.round(progressPercentage)}%`}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Chief Complaint */}
          <Typography variant="body2" sx={{ mb: 2, color: '#b0b0b0' }}>
            <strong style={{ color: '#ffffff' }}>Chief Complaint:</strong> {criticalCase.chiefComplaint}
          </Typography>

          {/* Acknowledge Button */}
          {!criticalCase.acknowledgedAt && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={async () => {
                  try {
                    await ticketService.acknowledgeTicket(criticalCase.id);
                    // Refresh the data
                    refetch();
                  } catch (error) {
                    console.error('Failed to acknowledge ticket:', error);
                  }
                }}
                sx={{
                  backgroundColor: '#4caf50',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#45a049',
                  },
                }}
              >
                Acknowledge Case
              </Button>
            </Box>
          )}

          {/* Acknowledgment Status */}
          {criticalCase.acknowledgedAt && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Chip
                label={`Acknowledged by ${criticalCase.acknowledgedBy?.firstName} ${criticalCase.acknowledgedBy?.lastName} at ${new Date(criticalCase.acknowledgedAt).toLocaleString()}`}
                size="small"
                sx={{
                  backgroundColor: '#4caf50',
                  color: 'white',
                  fontWeight: 500,
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card sx={{
        borderRadius: 3,
        border: '1px solid #333',
        backgroundColor: '#1e1e1e',
        background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress sx={{ color: '#ff9800' }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{
        borderRadius: 3,
        border: '1px solid #333',
        backgroundColor: '#1e1e1e',
        background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)'
      }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              style={{ color: '#ff9800', marginRight: '16px', fontSize: '28px' }}
            />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#ffffff' }}>
                Global Critical Case Tracker
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                Live countdown tracking for STEMI (120 min) and Stroke (4.5 hr) cases across all hospitals.
              </Typography>
            </Box>
          </Box>

          {/* Error Card */}
          <Card sx={{
            borderRadius: 2,
            border: '1px solid #d32f2f',
            backgroundColor: '#2d1b1b',
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  style={{ color: '#f44336', marginRight: '8px' }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#f44336' }}>
                  Error Loading Alerts
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2, color: '#b0b0b0' }}>
                Failed to load critical ticket alerts. Please try again.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<FontAwesomeIcon icon={faRedo} />}
                onClick={() => refetch()}
                sx={{
                  borderColor: '#f44336',
                  color: '#f44336',
                  '&:hover': {
                    borderColor: '#d32f2f',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
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
    <Card sx={{
      borderRadius: 3,
      border: '1px solid #333',
      backgroundColor: '#1e1e1e',
      background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)'
    }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header with Hospital Filter */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              style={{ color: '#ff9800', marginRight: '16px', fontSize: '28px' }}
            />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#ffffff' }}>
                Global Critical Case Tracker
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                Live countdown tracking for STEMI (120 min) and Stroke (4.5 hr) cases across all hospitals.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Summary Stats */}
        {filteredCases.length > 0 && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: alpha('#d32f2f', 0.1), borderRadius: 2, border: '1px solid rgba(211, 47, 47, 0.2)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#ffffff' }}>
              Unacknowledged Critical Cases Summary
              {selectedHospital !== 'all' && (
                <Typography component="span" variant="body2" sx={{ ml: 1, color: '#b0b0b0' }}>
                  (Filtered by: {hospitals?.find((h: any) => h.id === selectedHospital)?.name || 'Unknown Hospital'})
                </Typography>
              )}
            </Typography>
            <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faHeart} style={{ color: '#d32f2f', marginRight: '8px' }} />
                <Typography variant="body2" sx={{ color: '#ffffff' }}>
                  STEMI: {filteredCases.filter((c: CriticalCase) => c.pathway === 'STEMI').length}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faBrain} style={{ color: '#d32f2f', marginRight: '8px' }} />
                <Typography variant="body2" sx={{ color: '#ffffff' }}>
                  Stroke: {filteredCases.filter((c: CriticalCase) => c.pathway === 'STROKE').length}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip label="TOTAL UNACKNOWLEDGED" size="small" sx={{ backgroundColor: '#d32f2f', color: 'white', mr: 1 }} />
                <Typography variant="body2" sx={{ color: '#ffffff' }}>
                  {filteredCases.length}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip label="CRITICAL (OVERDUE)" size="small" sx={{ backgroundColor: '#d32f2f', color: 'white', mr: 1 }} />
                <Typography variant="body2" sx={{ color: '#ffffff' }}>
                  {filteredCases.filter((c: CriticalCase) => {
                    const startTime = (c.pathway === 'STEMI' && c.triageTime)
                      ? new Date(c.triageTime).getTime()
                      : (c.pathway === 'STROKE' && c.symptomOnset)
                        ? new Date(c.symptomOnset).getTime()
                        : new Date(c.createdAt).getTime();
                    const elapsed = Date.now() - startTime;
                    const timeLimit = c.pathway === 'STEMI' ? 120 * 60 * 1000 : 4.5 * 60 * 60 * 1000;
                    return (elapsed / timeLimit) >= 1;
                  }).length}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {/* Cases Display */}
        {filteredCases.length === 0 ? (
          <Alert
            severity="success"
            sx={{
              borderRadius: 2,
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              '& .MuiAlert-message': {
                color: '#ffffff'
              },
              '& .MuiAlert-icon': {
                color: '#4caf50'
              }
            }}
          >
            {selectedHospital === 'all'
              ? 'No unacknowledged STEMI or Stroke cases requiring critical tracking across all hospitals.'
              : `No unacknowledged STEMI or Stroke cases for the selected hospital.`
            }
          </Alert>
        ) : (
          <Stack spacing={2}>
            {filteredCases.map((case_: CriticalCase) => (
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

export default GlobalCriticalCaseTracker;
