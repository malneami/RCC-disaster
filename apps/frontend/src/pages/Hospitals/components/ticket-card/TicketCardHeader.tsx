import React from 'react';
import { Box, Typography, IconButton, Tooltip, alpha } from '@mui/material';
import {
    Assignment as TicketIcon,
    Timeline as TransferIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { UnifiedTicket } from '../../types/tickets';

interface TicketCardHeaderProps {
    ticket: UnifiedTicket;
    onView?: (ticket: UnifiedTicket) => void;
    onEdit?: (ticket: UnifiedTicket) => void;
    showActions?: boolean;
}

export const TicketCardHeader: React.FC<TicketCardHeaderProps> = ({
    ticket,
    onView,
    onEdit,
    showActions = true,
}) => {
    const getTicketIcon = () => {
        if (ticket.type === 'TRANSFER') {
            return <TransferIcon sx={{ color: '#0284C7', fontSize: 24 }} />;
        }
        return <TicketIcon sx={{ color: '#7C3AED', fontSize: 24 }} />;
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1.5 }}>
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '10px',
                        backgroundColor: ticket.type === 'TRANSFER' ? alpha('#0284C7', 0.1) : alpha('#7C3AED', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {getTicketIcon()}
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontWeight: 700,
                            color: '#0F172A',
                            mb: 0.5,
                            lineHeight: 1.3,
                        }}
                    >
                        {ticket.title}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ color: '#64748B', fontWeight: 500 }}
                    >
                        {ticket.type === 'TRANSFER' ? ticket.ticketNumber : `#${ticket.id.slice(-8)}`}
                    </Typography>
                </Box>
            </Box>

            {showActions && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {onView && (
                        <Tooltip title="View Details">
                            <IconButton
                                size="small"
                                onClick={() => onView(ticket)}
                                sx={{
                                    backgroundColor: alpha('#0284C7', 0.1),
                                    '&:hover': { backgroundColor: alpha('#0284C7', 0.2) },
                                }}
                            >
                                <ViewIcon fontSize="small" sx={{ color: '#0284C7' }} />
                            </IconButton>
                        </Tooltip>
                    )}
                    {onEdit && (
                        <Tooltip title="Edit Ticket">
                            <IconButton
                                size="small"
                                onClick={() => onEdit(ticket)}
                                sx={{
                                    backgroundColor: alpha('#7C3AED', 0.1),
                                    '&:hover': { backgroundColor: alpha('#7C3AED', 0.2) },
                                }}
                            >
                                <EditIcon fontSize="small" sx={{ color: '#7C3AED' }} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            )}
        </Box>
    );
};
