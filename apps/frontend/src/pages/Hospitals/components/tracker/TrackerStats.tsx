import React from 'react';
import { Box, Typography, Stack, Chip, alpha } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faBrain, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface TrackerStatsProps {
    stemiCount: number;
    strokeCount: number;
    otherCriticalCount: number;
    incomingCount: number;
    outgoingCount: number;
}

export const TrackerStats: React.FC<TrackerStatsProps> = ({
    stemiCount,
    strokeCount,
    otherCriticalCount,
    incomingCount,
    outgoingCount,
}) => {
    return (
        <Box
            sx={{
                mb: 4,
                p: 3,
                backgroundColor: alpha('#DC2626', 0.05),
                borderRadius: '16px',
                border: '1px solid',
                borderColor: alpha('#DC2626', 0.15),
            }}
        >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#0F172A' }}>
                Unacknowledged Critical Cases Summary
            </Typography>

            {/* Main Stats Grid */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
                {/* STEMI Card */}
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        p: 2.5,
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(0, 0, 0, 0.04)',
                    }}
                >
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '12px',
                            backgroundColor: alpha('#DC2626', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                        }}
                    >
                        <FontAwesomeIcon icon={faHeart} style={{ color: '#DC2626', fontSize: '24px' }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#DC2626', lineHeight: 1 }}>
                            {stemiCount}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B', mt: 0.5 }}>
                            STEMI Cases
                        </Typography>
                    </Box>
                </Box>

                {/* Stroke Card */}
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        p: 2.5,
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(0, 0, 0, 0.04)',
                    }}
                >
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '12px',
                            backgroundColor: alpha('#9333EA', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                        }}
                    >
                        <FontAwesomeIcon icon={faBrain} style={{ color: '#9333EA', fontSize: '24px' }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#9333EA', lineHeight: 1 }}>
                            {strokeCount}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B', mt: 0.5 }}>
                            Stroke Cases
                        </Typography>
                    </Box>
                </Box>

                {/* Other Critical Card */}
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        p: 2.5,
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(0, 0, 0, 0.04)',
                    }}
                >
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '12px',
                            backgroundColor: alpha('#F59E0B', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                        }}
                    >
                        <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#F59E0B', fontSize: '24px' }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#F59E0B', lineHeight: 1 }}>
                            {otherCriticalCount}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B', mt: 0.5 }}>
                            Other Critical
                        </Typography>
                    </Box>
                </Box>
            </Stack>

            {/* Direction Stats */}
            <Stack direction="row" spacing={2}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        py: 1,
                        backgroundColor: alpha('#10B981', 0.1),
                        borderRadius: '8px',
                    }}
                >
                    <Chip
                        label="INCOMING"
                        size="small"
                        sx={{
                            backgroundColor: '#10B981',
                            color: 'white',
                            fontWeight: 600,
                            mr: 1.5,
                        }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#10B981' }}>
                        {incomingCount}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        py: 1,
                        backgroundColor: alpha('#F59E0B', 0.1),
                        borderRadius: '8px',
                    }}
                >
                    <Chip
                        label="OUTGOING"
                        size="small"
                        sx={{
                            backgroundColor: '#F59E0B',
                            color: 'white',
                            fontWeight: 600,
                            mr: 1.5,
                        }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                        {outgoingCount}
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
};
