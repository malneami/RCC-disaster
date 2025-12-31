import React from 'react';
import { Box, Typography, Avatar, Chip, Tooltip, IconButton } from '@mui/material';
import { Visibility, CalendarToday, Person, Computer, Badge } from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { PatientAccessLog } from '@/services/patientService'; // Ensure this import path is correct relative to the new file
import { GRADIENT_COLORS, getAccessTypeGradient, getAccessTypeColor } from './AccessLogConstants';
import { getAccessTypeIcon } from './AccessLogUtils';

interface AccessLogListProps {
    logs: PatientAccessLog[];
    onLogClick: (log: PatientAccessLog) => void;
}

const AccessLogList: React.FC<AccessLogListProps> = ({ logs, onLogClick }) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {logs.map((log, index) => (
                <Box
                    key={log.id}
                    sx={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(66, 165, 245, 0.3)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 24px rgba(66, 165, 245, 0.25), 0 4px 8px rgba(0, 0, 0, 0.06)',
                        },
                    }}
                >
                    {/* Timeline line */}
                    {index < logs.length - 1 && (
                        <Box
                            sx={{
                                position: 'absolute',
                                left: '40px',
                                top: '60px',
                                bottom: '-16px',
                                width: '2px',
                                background: 'linear-gradient(180deg, rgba(66, 165, 245, 0.4) 0%, transparent 100%)',
                            }}
                        />
                    )}

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* Avatar */}
                        <Avatar
                            sx={{
                                width: 48,
                                height: 48,
                                background: getAccessTypeGradient(log.accessType),
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                flexShrink: 0,
                            }}
                        >
                            {log.user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                            {log.user?.lastName?.charAt(0)?.toUpperCase() || ''}
                        </Avatar>

                        {/* Content */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                fontWeight: 600,
                                                color: '#1a237e',
                                                fontSize: '1rem',
                                            }}
                                        >
                                            {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown User'}
                                        </Typography>
                                        <Chip
                                            label={log.accessType}
                                            size="small"
                                            icon={getAccessTypeIcon(log.accessType)}
                                            sx={{
                                                background: getAccessTypeGradient(log.accessType),
                                                color: '#ffffff',
                                                fontWeight: 600,
                                                fontSize: '0.7rem',
                                                height: '22px',
                                                boxShadow: `0 2px 8px ${getAccessTypeColor(log.accessType)}50`,
                                            }}
                                        />
                                        {log.user && (
                                            <Chip
                                                label={log.user.role}
                                                size="small"
                                                sx={{
                                                    background: 'rgba(66, 165, 245, 0.12)',
                                                    color: '#42a5f5',
                                                    fontSize: '0.65rem',
                                                    height: '20px',
                                                    border: '1px solid rgba(66, 165, 245, 0.3)',
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <CalendarToday sx={{ fontSize: '14px', color: '#42a5f5' }} />
                                            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8125rem' }}>
                                                {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#999', fontSize: '0.75rem', ml: 0.5 }}>
                                                ({formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })})
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Tooltip title="View Details" arrow>
                                    <IconButton
                                        size="small"
                                        onClick={() => onLogClick(log)}
                                        sx={{
                                            color: '#42a5f5',
                                            background: 'rgba(66, 165, 245, 0.12)',
                                            '&:hover': {
                                                background: 'rgba(66, 165, 245, 0.25)',
                                                transform: 'scale(1.1)',
                                            },
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <Visibility fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            {/* Patient Info */}
                            {log.patient && (
                                <Box
                                    sx={{
                                        background: 'linear-gradient(135deg, #e8f5ff 0%, #d6e7ff 100%)',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        mb: 1.5,
                                        border: '1px solid rgba(66, 165, 245, 0.3)',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Person sx={{ fontSize: '16px', color: '#42a5f5' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a237e', fontSize: '0.875rem' }}>
                                            {log.patient.firstName} {log.patient.lastName}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', ml: 3 }}>
                                        {log.patient.mrn && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Badge sx={{ fontSize: '12px', color: '#42a5f5' }} />
                                                <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                                                    MRN: {log.patient.mrn}
                                                </Typography>
                                            </Box>
                                        )}
                                        {log.patient.nationalId && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Badge sx={{ fontSize: '12px', color: '#42a5f5' }} />
                                                <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                                                    ID: {log.patient.nationalId}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            )}

                            {/* Additional Info */}
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Computer sx={{ fontSize: '14px', color: '#42a5f5' }} />
                                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                                        {log.accessMethod}
                                    </Typography>
                                </Box>
                                {log.ipAddress && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Computer sx={{ fontSize: '14px', color: '#42a5f5' }} />
                                        <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                                            {log.ipAddress}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Reason */}
                            {log.reason && (
                                <Box
                                    sx={{
                                        mt: 1.5,
                                        pt: 1.5,
                                        borderTop: '1px solid rgba(66, 165, 245, 0.2)',
                                    }}
                                >
                                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 500 }}>
                                        Reason:
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#424242', fontSize: '0.8125rem', mt: 0.5 }}>
                                        {log.reason}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

export default AccessLogList;
