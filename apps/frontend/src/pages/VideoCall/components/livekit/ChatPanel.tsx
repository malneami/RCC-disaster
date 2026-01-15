import React from 'react';
import { Chat } from '@livekit/components-react';
import { Box, Typography, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

/** Chat panel styles for LiveKit Chat component */
const chatContentStyles = {
    flex: 1,
    overflow: 'hidden',

    '& .lk-chat': {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
    },

    /* Messages */
    '& .lk-chat-messages': {
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },

    /* Each message */
    '& .lk-chat-entry': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        maxWidth: '100%',
    },

    '& .lk-chat-entry[data-lk-local-participant="true"]': {
        alignItems: 'flex-end',
    },

    '& .lk-message-body': {
        backgroundColor: '#3c4043',
        borderRadius: '12px',
        padding: '8px 12px',
        maxWidth: '85%',
        color: '#e8eaed',
        wordBreak: 'break-word',
    },

    '& .lk-chat-entry[data-lk-local-participant="true"] .lk-message-body': {
        backgroundColor: '#1967d2',
        color: '#fff',
    },

    '& .lk-participant-name': {
        fontSize: '12px',
        color: '#9aa0a6',
        marginBottom: '4px',
    },

    /* Chat form */
    '& .lk-chat-form': {
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        borderTop: '1px solid #3c4043',
    },

    /* Input */
    '& .lk-chat-form-input': {
        flex: 1,
        backgroundColor: '#3c4043',
        border: '1px solid #5f6368',
        borderRadius: '24px',
        padding: '10px 16px',
        color: '#e8eaed',
        outline: 'none',

        '&::placeholder': {
            color: '#9aa0a6',
        },

        '&:focus': {
            borderColor: '#8ab4f8',
        },
    },
};

/**
* Chat panel component
 * Slides in/out with animation
 */
export const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
    return (
        <Box
            sx={{
                width: isOpen ? '360px' : '0px',
                minWidth: isOpen ? '360px' : '0px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                bgcolor: '#202124',
                borderLeft: isOpen ? '1px solid #3c4043' : 'none',
                display: 'flex',
                flexDirection: 'column',
                mr: isOpen ? 2 : 0,
                borderRadius: isOpen ? '8px' : 0,
            }}
        >
            {/* Chat Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 3,
                    py: 2,
                    borderBottom: '1px solid #3c4043',
                }}
            >
                <Typography sx={{ color: '#e8eaed', fontSize: '16px', fontWeight: 500 }}>
                    In-call messages
                </Typography>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        color: '#9aa0a6',
                        '&:hover': {
                            bgcolor: '#3c4043',
                            color: '#e8eaed',
                        },
                    }}
                >
                    <FontAwesomeIcon icon={faXmark} />
                </IconButton>
            </Box>

            {/* Chat Content */}
            <Box sx={chatContentStyles}>
                <Chat />
            </Box>
        </Box>
    );
};
