import React from 'react';
import {
    Box,
    Typography,
    Avatar,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faAmbulance,
    faUserMd,
    faMapMarkerAlt,
    faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { EMSAssignment } from '../types/ems';

interface TimelineStep {
    id: string;
    label: string;
    icon: React.ReactElement;
    completed: boolean;
    active: boolean;
    timestamp?: string;
}

interface PatientJourneyTimelineProps {
    assignment: EMSAssignment;
}

const PatientJourneyTimeline: React.FC<PatientJourneyTimelineProps> = ({ assignment }) => {
    const getTimelineSteps = (): TimelineStep[] => {
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

    const timelineSteps = getTimelineSteps();

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                    Patient Journey
                </Typography>
            </Box>

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
    );
};

export default PatientJourneyTimeline;
