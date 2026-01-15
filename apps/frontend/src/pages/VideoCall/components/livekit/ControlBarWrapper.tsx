import React from 'react';
import { ControlBar } from '@livekit/components-react';
import { Box } from '@mui/material';

/** Styles for the floating control bar */
const controlBarStyles = {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    bgcolor: '#3c4043',
    borderRadius: '24px',
    padding: '8px 12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',

    '& .lk-control-bar': {
        bgcolor: 'transparent',
        padding: 0,
        gap: '8px',
        display: 'flex',
        alignItems: 'center',
    },

    '& .lk-button': {
        borderRadius: '24px !important',
        minWidth: '48px',
        height: '48px',
        padding: '0 16px',
        margin: '0',
        bgcolor: '#5f6368',
        color: '#e8eaed',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: 500,
        border: 'none',
        '&:hover': {
            bgcolor: '#8ab4f8',
            transform: 'scale(1.05)',
        },
    },

    '& .lk-button[data-lk-enabled="false"]': {
        bgcolor: '#ea4335',
        '&:hover': {
            bgcolor: '#d33b2c',
        },
    },

    '& .lk-disconnect-button': {
        color: '#e8eaed',
        bgcolor: '#ea4335 !important',
        borderRadius: '24px !important',
        '&:hover': {
            bgcolor: '#d33b2c !important',
            transform: 'scale(1.05)',
        },
    },

    '& .lk-button-group': {
        display: 'flex',
        gap: '4px',
    },

    '& .lk-button svg': {
        width: '20px',
        height: '20px',
    },
};

/**
 * Floating control bar wrapper with Google Meet styling
 * Contains microphone, camera, screen share, and leave buttons
 */
export const ControlBarWrapper: React.FC = () => {
    return (
        <Box sx={controlBarStyles}>
            <ControlBar variation="verbose" />
        </Box>
    );
};
