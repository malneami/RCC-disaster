import React from 'react';
import { Box, Typography, Chip, Stack, Divider } from '@mui/material';
import {
    Person as PatientIcon,
    LocalHospital as HospitalIcon,
    AccessTime as TimeIcon,
    Warning as EmergencyIcon,
} from '@mui/icons-material';
import { UnifiedTicket } from '../../types/tickets';
import { getEMSStatusInfo, getEMSStatusColor } from '../../../../utils/emsStatusUtils';
import { getPriorityStyles, getStatusStyles, getTimeInfo, getLocationInfo } from './ticketUtils';

interface TicketCardContentProps {
    ticket: UnifiedTicket;
}

export const TicketCardContent: React.FC<TicketCardContentProps> = ({ ticket }) => {
    const priorityStyles = getPriorityStyles(ticket.priority);
    const statusStyles = getStatusStyles(ticket.status);

    return (
        <>
            {/* Status and Priority Chips */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
                <Chip
                    label={ticket.priority}
                    size="small"
                    sx={{
                        backgroundColor: priorityStyles.bg,
                        color: priorityStyles.color,
                        fontWeight: 600,
                        borderRadius: '8px',
                        border: `1px solid ${priorityStyles.border}`,
                    }}
                />
                <Chip
                    label={ticket.status}
                    size="small"
                    sx={{
                        backgroundColor: statusStyles.bg,
                        color: statusStyles.color,
                        fontWeight: 600,
                        borderRadius: '8px',
                    }}
                />
                {ticket.emsAssignmentStatus && (
                    <Chip
                        label={getEMSStatusInfo(ticket.emsAssignmentStatus).displayName}
                        size="small"
                        sx={{
                            backgroundColor: getEMSStatusColor(ticket.emsAssignmentStatus),
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: '8px',
                        }}
                    />
                )}
                {ticket.isEmergency && (
                    <Chip
                        label="Life Saving"
                        size="small"
                        sx={{
                            backgroundColor: '#DC2626',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: '8px',
                        }}
                        icon={<EmergencyIcon sx={{ color: 'white !important', fontSize: 16 }} />}
                    />
                )}
                <Chip
                    label={ticket.type}
                    size="small"
                    sx={{
                        backgroundColor: ticket.type === 'TRANSFER' ? '#E0F2FE' : '#F3E8FF',
                        color: ticket.type === 'TRANSFER' ? '#0284C7' : '#7C3AED',
                        fontWeight: 600,
                        borderRadius: '8px',
                    }}
                />
            </Stack>

            {/* Description */}
            <Typography
                variant="body2"
                sx={{
                    color: '#475569',
                    mb: 2,
                    lineHeight: 1.6,
                }}
            >
                {ticket.description}
            </Typography>

            <Divider sx={{ my: 2, borderColor: '#E2E8F0' }} />

            {/* Location & Time Section */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HospitalIcon sx={{ fontSize: 18, color: '#0284C7' }} />
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                        {getLocationInfo(ticket)}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon sx={{ fontSize: 18, color: '#0284C7' }} />
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                        {getTimeInfo(ticket)}
                    </Typography>
                </Box>
            </Box>

            {/* Patient Information (for transfer tickets) */}
            {ticket.type === 'TRANSFER' && ticket.patient && (
                <>
                    <Divider sx={{ my: 2, borderColor: '#E2E8F0' }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PatientIcon sx={{ fontSize: 18, color: '#10B981' }} />
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                            Patient: {ticket.patient.firstName} {ticket.patient.lastName}
                            {ticket.patient.mrn && ` (MRN: ${ticket.patient.mrn})`}
                        </Typography>
                    </Box>
                </>
            )}

            {/* Pathway Information (for transfer tickets) */}
            {ticket.type === 'TRANSFER' && ticket.pathway && (
                <Box sx={{ mt: 2 }}>
                    <Chip
                        label={ticket.pathway}
                        size="small"
                        sx={{
                            backgroundColor: ticket.pathway === 'STEMI' ? '#FEE2E2' :
                                ticket.pathway === 'STROKE' ? '#F3E8FF' : '#FEF3C7',
                            color: ticket.pathway === 'STEMI' ? '#DC2626' :
                                ticket.pathway === 'STROKE' ? '#7C3AED' : '#D97706',
                            fontWeight: 700,
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                        }}
                    />
                </Box>
            )}
        </>
    );
};
