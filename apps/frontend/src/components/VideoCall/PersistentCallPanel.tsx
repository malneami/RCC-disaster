import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  IconButton,
  Paper,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  Maximize as MaximizeIcon,
  Phone as PhoneIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useVideoCall } from '../../contexts/VideoCallContext';
import { LiveKitCallInterface } from '../../pages/VideoCall/components/LiveKitCallInterface';
import { IncomingCallDialog } from '../../pages/VideoCall/components/IncomingCallDialog';
import { UserList } from '../../pages/VideoCall/components/UserList';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/apiClient';
import { User } from '../../pages/VideoCall/utils/videoCallUtils';
import { useSnackbar } from 'notistack';
import { VIDEO_CALL_CONSTANTS } from './constants';

/**
 * Persistent floating call panel that stays mounted across route navigation
 * Supports minimized (picture-in-picture) and expanded (full) states
 */
export const PersistentCallPanel: React.FC = () => {
  const {
    liveKitToken,
    serverUrl,
    receivingCall,
    callerInfo,
    inviteMode,
    isCallMinimized,
    isLoadingToken,
    currentRoomId,
    answerCall,
    endCall,
    declineCall,
    setInviteMode,
    toggleCallMinimized,
    startCall,
  } = useVideoCall();

  const location = useLocation();
  const { user: currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState<User[]>([]);

  // Drag state for minimized panel
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null); // null = use default bottom-right
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);

  // Check if we're on the video-call page
  const isOnVideoCallPage = location.pathname === '/video-call';

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }

    setIsDragging(true);
    setHasDragged(false);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    const currentX = rect.left;
    const currentY = rect.top;

    setDragOffset({
      x: e.clientX - currentX,
      y: e.clientY - currentY,
    });
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    toggleCallMinimized();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      setHasDragged(true);
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Constrain to viewport bounds
      const panelWidth = VIDEO_CALL_CONSTANTS.MINIMIZED_PANEL_WIDTH;
      const panelHeight = VIDEO_CALL_CONSTANTS.MINIMIZED_PANEL_HEIGHT;
      const maxX = window.innerWidth - panelWidth;
      const maxY = window.innerHeight - panelHeight;

      setDragPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setTimeout(() => setHasDragged(false), 100);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (inviteMode) {
      const fetchUsers = async () => {
        try {
          const response = await apiClient.get('/users/for-communication?page=1&limit=100');
          const allUsers = response.data.data || [];
          const otherUsers = allUsers.filter((u: User) => u.id !== currentUser?.id);
          setUsers(otherUsers);
        } catch (error) {
          enqueueSnackbar('Failed to load users', { variant: 'error' });
        }
      };
      if (currentUser) fetchUsers();
    }
  }, [inviteMode, currentUser, enqueueSnackbar]);

  // Don't render if no active call
  if (!liveKitToken && !receivingCall) {
    return null;
  }

  // Incoming call dialog (always full screen)
  if (receivingCall) {
    return (
      <IncomingCallDialog
        open={receivingCall}
        callerInfo={callerInfo}
        onAnswer={answerCall}
        onDecline={declineCall}
        onClose={declineCall}
      />
    );
  }

  // Single LiveKitCallInterface instance - always mounted when call is active
  // Position and visibility change based on state
  return (
    <>
      {/* Always render LiveKitCallInterface when token exists  */}
      {liveKitToken && (
        <Box
          sx={{
            position: 'fixed',
            ...(isOnVideoCallPage
              ? {
                // Full page on video-call page
                top: `${VIDEO_CALL_CONSTANTS.APP_BAR_HEIGHT}px`,
                left: { xs: 0, sm: `${VIDEO_CALL_CONSTANTS.SIDEBAR_WIDTH}px` },
                right: 0,
                bottom: 0,
                borderRadius: { xs: 0, sm: '12px 0 0 0' },
                zIndex: VIDEO_CALL_CONSTANTS.Z_INDEX_FULL_PAGE,
              }
              : isCallMinimized
                ? {
                  // Hidden when minimized - keep connection alive
                  top: VIDEO_CALL_CONSTANTS.HIDDEN_PANEL_TOP,
                  left: VIDEO_CALL_CONSTANTS.HIDDEN_PANEL_LEFT,
                  width: VIDEO_CALL_CONSTANTS.HIDDEN_PANEL_WIDTH,
                  height: VIDEO_CALL_CONSTANTS.HIDDEN_PANEL_HEIGHT,
                  opacity: 0,
                  pointerEvents: 'none',
                  zIndex: VIDEO_CALL_CONSTANTS.Z_INDEX_HIDDEN,
                }
                : {
                  // Floating panel when expanded
                  bottom: VIDEO_CALL_CONSTANTS.PANEL_MARGIN,
                  right: VIDEO_CALL_CONSTANTS.PANEL_MARGIN,
                  width: { xs: `calc(100vw - ${VIDEO_CALL_CONSTANTS.PANEL_MARGIN * 2}px)`, sm: 480, md: 640 },
                  height: { xs: `calc(100vh - ${VIDEO_CALL_CONSTANTS.APP_BAR_HEIGHT + VIDEO_CALL_CONSTANTS.PANEL_MARGIN}px)`, sm: 360, md: 480 },
                  zIndex: VIDEO_CALL_CONSTANTS.Z_INDEX_FLOATING_PANEL,
                }),
            overflow: 'hidden',
            borderRadius: isOnVideoCallPage ? undefined : 3,
            bgcolor: '#1a1a2e',
            display: 'flex',
            flexDirection: 'column',
            transition: isCallMinimized ? 'none' : 'all 0.3s ease',
          }}
        >
          {/* Header with controls - hide when minimized */}
          {!isCallMinimized && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                bgcolor: 'rgba(0,0,0,0.3)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
              role="toolbar"
              aria-label="Call controls"
            >
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                Calling Panel
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {!isOnVideoCallPage && (
                  <Tooltip title="Minimize">
                    <IconButton
                      size="small"
                      onClick={toggleCallMinimized}
                      sx={{ color: 'white' }}
                      aria-label="Minimize call panel"
                    >
                      <MinimizeIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="End call">
                  <IconButton
                    size="small"
                    onClick={endCall}
                    sx={{ color: 'white', '&:hover': { bgcolor: 'error.main' } }}
                    aria-label="End call"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}

          {/* Loading indicator for token fetch */}
          {isLoadingToken && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.7)',
                zIndex: 10,
              }}
              role="status"
              aria-label="Connecting to call"
            >
              <CircularProgress sx={{ color: 'white' }} />
            </Box>
          )}

          {/* Video content */}
          <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
            <LiveKitCallInterface
              token={liveKitToken}
              serverUrl={serverUrl}
              onDisconnected={endCall}
              roomId={currentRoomId || ''} // Pass roomId
              onInviteUser={() => setInviteMode(true)}
              height={isCallMinimized ? '240px' : '100%'}
            />
          </Box>
        </Box>
      )}

      {/* Minimized button overlay - only shown when minimized and not on video-call page */}
      {isCallMinimized && !isOnVideoCallPage && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            ...(dragPosition
              ? { left: dragPosition.x, top: dragPosition.y, right: 'auto', bottom: 'auto' }
              : { right: VIDEO_CALL_CONSTANTS.PANEL_MARGIN, bottom: VIDEO_CALL_CONSTANTS.PANEL_MARGIN, left: 'auto', top: 'auto' }),
            zIndex: VIDEO_CALL_CONSTANTS.Z_INDEX_FLOATING_PANEL,
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'primary.main',
            color: 'white',
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: isDragging ? 'none' : 'all 0.3s ease',
            userSelect: 'none',
            '&:hover': {
              transform: isDragging ? 'none' : 'scale(1.05)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            },
            '&:focus-visible': {
              outline: '2px solid white',
              outlineOffset: 2,
            },
          }}
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          onKeyDown={(e) => {
            // Keyboard navigation: Space or Enter to expand
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              toggleCallMinimized();
            }
            // Escape to end call
            if (e.key === 'Escape') {
              e.preventDefault();
              endCall();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Minimized call panel. Press space or enter to expand, escape to end call."
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1.5,
            }}
          >
            <PhoneIcon sx={{ fontSize: 20 }} />
            <Typography variant="body2" fontWeight={600}>
              Call in progress
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
              <Tooltip title="Invite participant">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInviteMode(true);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  sx={{ color: 'white' }}
                  aria-label="Invite participant to call"
                >
                  <PersonAddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Expand call">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCallMinimized();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  sx={{ color: 'white' }}
                  aria-label="Expand call panel"
                >
                  <MaximizeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Invite User Dialog */}
      <Dialog
        open={inviteMode}
        onClose={() => setInviteMode(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '80vh',
          },
        }}
        aria-labelledby="invite-dialog-title"
        aria-describedby="invite-dialog-description"
      >
        <DialogTitle id="invite-dialog-title">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Invite Participant
            <IconButton
              onClick={() => setInviteMode(false)}
              size="small"
              aria-label="Close invite dialog"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent id="invite-dialog-description">
          <UserList
            users={users}
            callUser={(user: User | undefined) => {
              if (user) {
                startCall(user);
                setInviteMode(false);
              }
            }}
            stream={null}
            socket={null}
            actionLabel="Invite"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
