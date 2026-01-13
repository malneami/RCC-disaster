import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHeart,
    faBrain,
    faAmbulance,
    faClock,
} from '@fortawesome/free-solid-svg-icons';
import { EMSAssignment } from '../types/ems';

interface CriticalCaseTimerProps {
    assignment: EMSAssignment;
}

const CriticalCaseTimer: React.FC<CriticalCaseTimerProps> = ({ assignment }) => {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [progressPercentage, setProgressPercentage] = useState<number>(0);
    const [isCritical, setIsCritical] = useState<boolean>(false);

    useEffect(() => {
        const pathway = assignment.ticket?.pathway;
        const createdAt = assignment.ticket?.createdAt;

        // Check for specific case times from nested arrays
        const stemiTriageTime = assignment.ticket?.stemiCases?.[0]?.triageTime || assignment.ticket?.triageTime;
        const strokeTriageTime = assignment.ticket?.strokeCases?.[0]?.timeOfTriage;

        // Only show countdown for STEMI or STROKE cases
        if (pathway !== 'STEMI' && pathway !== 'STROKE') {
            setTimeRemaining(0);
            setProgressPercentage(0);
            setIsCritical(false);
            return;
        }

        // Stop timer if assignment has arrived
        if (assignment.status === 'ARRIVED') {
            setTimeRemaining(0);
            setProgressPercentage(100);
            setIsCritical(false);
            return;
        }

        // Determine start time: Use triageTime for STEMI/STROKE if available, otherwise fallback to createdAt
        let startTimeStr = createdAt;
        if (pathway === 'STEMI' && stemiTriageTime) {
            startTimeStr = stemiTriageTime;
        } else if (pathway === 'STROKE' && strokeTriageTime) {
            startTimeStr = strokeTriageTime;
        }

        if (!startTimeStr) {
            setTimeRemaining(0);
            setProgressPercentage(0);
            setIsCritical(false);
            return;
        }

        const calculateTime = () => {
            const startTime = new Date(startTimeStr).getTime();
            const elapsed = Date.now() - startTime;
            const timeLimit = pathway === 'STEMI'
                ? 120 * 60 * 1000  // 120 minutes
                : 4.5 * 60 * 60 * 1000; // 4.5 hours

            const remaining = Math.max(0, timeLimit - elapsed);
            const percentage = Math.min(100, (elapsed / timeLimit) * 100);

            setTimeRemaining(remaining);
            setProgressPercentage(percentage);
            setIsCritical(percentage >= 100);
        };

        const interval = setInterval(calculateTime, 1000);

        return () => clearInterval(interval);
    }, [
        assignment.ticket?.pathway,
        assignment.ticket?.createdAt,
        assignment.ticket?.triageTime,
        assignment.ticket?.stemiCases,
        assignment.ticket?.strokeCases,
        assignment.status
    ]);

    if (!assignment.ticket?.pathway || (assignment.ticket.pathway !== 'STEMI' && assignment.ticket.pathway !== 'STROKE') || timeRemaining <= 0) {
        return null;
    }

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

    return (
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
                                {assignment.ticket?.pathway} Time Remaining
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
    );
};

export default CriticalCaseTimer;
