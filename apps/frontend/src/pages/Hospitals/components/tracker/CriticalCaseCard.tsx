import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    CircularProgress,
    Chip,
    alpha,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExclamationTriangle,
    faHeart,
    faBrain,
    faClock,
    faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';
import { getEMSStatusInfo, getEMSStatusColor } from '../../../../utils/emsStatusUtils';
import { ticketService } from '../../../../services/ticketService';

interface CriticalCaseCardProps {
    criticalCase: any;
    refetch: () => void;
    currentHospitalId: string;
}

export const CriticalCaseCard: React.FC<CriticalCaseCardProps> = ({ criticalCase, refetch, currentHospitalId }) => {
    // Determine if this case should show a timer (STEMI or STROKE)
    const showTimer = criticalCase.pathway === 'STEMI' || criticalCase.pathway === 'STROKE';

    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [progressPercentage, setProgressPercentage] = useState<number>(0);
    const [isCritical, setIsCritical] = useState<boolean>(false);

    // Calculate time remaining and progress (only for STEMI/STROKE)
    useEffect(() => {
        if (!showTimer) {
            setTimeRemaining(0);
            setProgressPercentage(0);
            setIsCritical(false);
            return;
        }

        const calculateTime = () => {
            // Don't run countdown if EMS has arrived
            if (criticalCase.emsAssignmentStatus === 'ARRIVED') {
                setTimeRemaining(0);
                setProgressPercentage(100);
                setIsCritical(false);
                return;
            }

            // Determine start time based on pathway
            let startTime = new Date(criticalCase.createdAt).getTime();
            console.log('criticalCase', criticalCase.symptomOnset);
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
    }, [showTimer, criticalCase.createdAt, criticalCase.pathway, criticalCase.status, criticalCase.triageTime, criticalCase.symptomOnset, criticalCase.emsAssignmentStatus]);

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
                borderRadius: '16px',
                border: isCritical
                    ? '2px solid #DC2626'
                    : '1px solid rgba(0,0,0,0.04)',
                backgroundColor: isCritical
                    ? alpha('#DC2626', 0.03)
                    : '#FFFFFF',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    boxShadow: isCritical
                        ? '0 8px 24px rgba(220, 38, 38, 0.2)'
                        : '0 8px 24px rgba(2, 132, 199, 0.12)',
                    transform: 'translateY(-2px)',
                },
            }}
        >
            <CardContent sx={{ p: 3 }}>
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

                {/* Route Information */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: showTimer ? 'space-evenly' : 'center' }}>
                        {/* Left side - Time info (only for STEMI/STROKE) */}
                        {showTimer && (
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
                                            color: isCritical ? '#d32f2f' : 'inherit'
                                        }}
                                    >
                                        {criticalCase.emsAssignmentStatus === 'ARRIVED'
                                            ? 'ARRIVED'
                                            : timeRemaining > 0
                                                ? formatTime(timeRemaining)
                                                : 'TIME EXPIRED'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                        {criticalCase.emsAssignmentStatus === 'ARRIVED'
                                            ? ''
                                            : timeRemaining > 0
                                                ? 'remaining'
                                                : ''}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                                    {criticalCase.emsAssignmentStatus === 'ARRIVED'
                                        ? 'EMS has arrived'
                                        : `${Math.round(progressPercentage)}% of time limit elapsed`}
                                </Typography>
                            </Box>
                        )}

                        {/* Middle - Route Information */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mx: showTimer ? 2 : 0 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <FontAwesomeIcon
                                        icon={faMapMarkerAlt}
                                        style={{ color: '#666', marginRight: '8px', fontSize: '14px' }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        From: {criticalCase.originHospital?.name}
                                    </Typography>
                                </Box>
                                {criticalCase.destinationHospital && (
                                    <Typography variant="body2" color="text.secondary">
                                        To: {criticalCase.destinationHospital.name}
                                    </Typography>
                                )}
                                {criticalCase.estimatedArrival && (
                                    <Typography variant="body2" color="text.secondary">
                                        ETA: {new Date(criticalCase.estimatedArrival).toLocaleString()}
                                    </Typography>
                                )}
                            </Box>
                            {/* Show direction indicator */}
                            <Box sx={{ mt: 1 }}>
                                <Chip
                                    label={criticalCase.originHospital?.id === currentHospitalId ? 'OUTGOING' : 'INCOMING'}
                                    size="small"
                                    sx={{
                                        backgroundColor: criticalCase.originHospital?.id === currentHospitalId ? '#ff9800' : '#4caf50',
                                        color: 'white',
                                        fontWeight: 500,
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Right side - Circular Progress Bar (only for STEMI/STROKE) */}
                        {showTimer && (
                            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
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
                                            color="text.secondary"
                                            sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                                        >
                                            {`${Math.round(progressPercentage)}%`}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Chief Complaint */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    <strong>Chief Complaint:</strong> {criticalCase.chiefComplaint}
                </Typography>

                {/* Acknowledge Button */}
                {!criticalCase.acknowledgedAt && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Button
                            variant="contained"
                            size="medium"
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
                                backgroundColor: '#10B981',
                                color: '#FFFFFF',
                                fontWeight: 600,
                                padding: '10px 28px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                                textTransform: 'none',
                                fontSize: '0.875rem',
                                '&:hover': {
                                    backgroundColor: '#059669',
                                    boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
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
