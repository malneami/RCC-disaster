import React from 'react';
import {
    Box,
    Typography,
    Avatar,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faAmbulance,
    faUserMd,
    faClock,
    faHeart,
    faBrain,
} from '@fortawesome/free-solid-svg-icons';
import { EMSAssignment } from '../types/ems';

interface AssignmentInfoGridProps {
    assignment: EMSAssignment;
}

const AssignmentInfoGrid: React.FC<AssignmentInfoGridProps> = ({ assignment }) => {
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
    );
};

export default AssignmentInfoGrid;
