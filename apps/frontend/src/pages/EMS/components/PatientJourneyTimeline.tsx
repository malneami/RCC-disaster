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
    dateObject?: Date;
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
                dateObject: assignment.emsContactTime ? new Date(assignment.emsContactTime) : undefined,
            },
            {
                id: 'ems_arrival',
                label: 'EMS Arrival',
                icon: <FontAwesomeIcon icon={faAmbulance} />,
                completed: ['EMS_ARRIVAL', 'DEPARTED', 'ARRIVED'].includes(assignment.status),
                active: assignment.status === 'EMS_ARRIVAL',
                dateObject: assignment.actualArrivalTime ? new Date(assignment.actualArrivalTime) : undefined,
            },
            {
                id: 'departed',
                label: 'Departed',
                icon: <FontAwesomeIcon icon={faMapMarkerAlt} />,
                completed: ['DEPARTED', 'ARRIVED'].includes(assignment.status),
                active: assignment.status === 'DEPARTED',
                dateObject: assignment.journeyStartTime ? new Date(assignment.journeyStartTime) : undefined,
            },
            {
                id: 'arrived_destination',
                label: 'Arrived',
                icon: <FontAwesomeIcon icon={faCheck} />,
                // Completed if status is ARRIVED OR if journeyEndTime exists (timestamp is source of truth)
                completed: assignment.status === 'ARRIVED' || !!assignment.journeyEndTime,
                active: assignment.status === 'ARRIVED' || !!assignment.journeyEndTime,
                dateObject: assignment.journeyEndTime ? new Date(assignment.journeyEndTime) : undefined,
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

            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', xl: 'row' }, // Stack on mobile/tablet/laptop, row ONLY on huge screens
                alignItems: { xs: 'flex-start', xl: 'center' },
                justifyContent: 'space-between',
                px: 2,
                gap: { xs: 3, xl: 0 } // Add vertical gap when stacked
            }}>
                {timelineSteps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'row', xl: 'column' }, // Horizontal content in vertical steps
                            alignItems: 'center',
                            flex: 1,
                            width: { xs: '100%', xl: 'auto' },
                            gap: { xs: 2, xl: 0 }
                        }}>
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
                                    mb: { xs: 0, xl: 1 },
                                    boxShadow: step.completed || step.active ? '0 2px 8px rgba(25, 118, 210, 0.3)' : 'none',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                {step.icon}
                            </Avatar>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', xl: 'center' } }}>
                                <Typography variant="caption" sx={{ textAlign: { xs: 'left', xl: 'center' }, fontWeight: step.active ? 600 : 400 }}>
                                    {step.label}
                                </Typography>
                                {step.dateObject && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', xl: 'center' } }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                                            {step.dateObject.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                                            {step.dateObject.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        {/* Connection Line - Hidden on mobile/tablet/laptop, shown on XL+ */}
                        {index < timelineSteps.length - 1 && (
                            <Box
                                sx={{
                                    display: { xs: 'none', xl: 'block' },
                                    flex: 1,
                                    height: 3,
                                    bgcolor: step.completed ? 'primary.main' : alpha('#e0e0e0', 0.8),
                                    borderRadius: 2,
                                    mx: 1,
                                    transition: 'background-color 0.3s ease',
                                }}
                            />
                        )}
                        {/* Hide horizontal separators on mobile, use the vertical line approach above or simpler: just hide lines on mobile for cleaner look if vertical lines are tricky to position perfectly without relative parents. 
                           Actually, for simplicity and reliability: Hide lines on mobile stack, it looks cleaner as a list. */}
                    </React.Fragment>
                ))}
            </Box>
        </Box>
    );
};

export default PatientJourneyTimeline;
