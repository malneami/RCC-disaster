import React from 'react';
import { Box, Typography, IconButton, Tooltip, Badge } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faComments } from '@fortawesome/free-solid-svg-icons';

interface TopActionBarProps {
    onInviteUser: () => void;
    onToggleChat: () => void;
    isChatOpen: boolean;
    unreadMessages: number;
}

/**
 * Top action bar with meeting info, invite button, and chat toggle
 */
export const TopActionBar: React.FC<TopActionBarProps> = ({
    onInviteUser,
    onToggleChat,
    isChatOpen,
    unreadMessages,
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 3,
                py: 2,
                position: 'absolute',
                borderRadius: '8px',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ color: '#e8eaed', fontSize: '14px', fontWeight: 500 }}>
                    Video Call
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Invite others">
                    <IconButton
                        onClick={onInviteUser}
                        sx={{
                            bgcolor: '#3c4043',
                            color: '#e8eaed',
                            width: 40,
                            height: 40,
                            '&:hover': {
                                bgcolor: '#5f6368',
                            },
                            transition: 'all 0.2s',
                        }}
                    >
                        <FontAwesomeIcon icon={faUserPlus} size="sm" />
                    </IconButton>
                </Tooltip>

                <Tooltip title={isChatOpen ? 'Close chat' : 'Open chat'}>
                    <IconButton
                        onClick={onToggleChat}
                        sx={{
                            bgcolor: isChatOpen ? '#1967d2' : '#3c4043',
                            color: '#e8eaed',
                            width: 40,
                            height: 40,
                            '&:hover': {
                                bgcolor: isChatOpen ? '#1557b0' : '#5f6368',
                            },
                            transition: 'all 0.2s',
                        }}
                    >
                        <Badge badgeContent={unreadMessages} color="error" max={99}>
                            <FontAwesomeIcon icon={faComments} size="sm" />
                        </Badge>
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
};
