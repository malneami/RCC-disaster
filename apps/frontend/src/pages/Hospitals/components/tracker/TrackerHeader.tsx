import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

export const TrackerHeader: React.FC = () => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
                sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    backgroundColor: alpha('#DC2626', 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                }}
            >
                <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    style={{ color: '#DC2626', fontSize: '22px' }}
                />
            </Box>
            <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    Real-Time Critical Case Tracker
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                    Live countdown tracking for STEMI (120 min) and Stroke (4.5 hr) cases with hospital routes and progress monitoring.
                </Typography>
            </Box>
        </Box>
    );
};
