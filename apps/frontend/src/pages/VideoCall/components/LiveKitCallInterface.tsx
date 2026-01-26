import React, { useState, useCallback } from 'react';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { Box, Typography, Button, CircularProgress, Alert, AlertTitle } from '@mui/material';

import { roomOptions, CustomVideoLayout } from './livekit';

interface LiveKitCallInterfaceProps {
  token: string;
  serverUrl: string;
  onDisconnected: () => void;
  onInviteUser: () => void;
  height?: string; // Optional height override for panel mode
}

/**
 * Main LiveKit video call interface component
 * Handles connection state, errors, and renders the video room
 */
export const LiveKitCallInterface: React.FC<LiveKitCallInterfaceProps> = ({
  token,
  serverUrl,
  onDisconnected,
  onInviteUser,
  height = 'calc(100vh - 100px)',
}) => {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(false);

  const handleError = useCallback((error: Error) => {
    console.error('[LiveKitCallInterface] Error:', error);

    // Check if it's a media device error - don't disconnect, just show warning
    const isMediaError =
      error.name === 'NotReadableError' ||
      error.name === 'NotAllowedError' ||
      error.name === 'NotFoundError' ||
      error.name === 'DevicesNotFoundError' ||
      error.name === 'OverconstrainedError' ||
      error.message.includes('Device in use') ||
      error.message.includes('Could not start video source') ||
      error.message.includes('Permission denied') ||
      error.message.includes('requested device not found');

    if (isMediaError) {
      let message = 'Camera/microphone access issue. You can still join the call without media.';

      if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
        message = 'Camera/microphone permission denied. Please allow access in browser settings.';
        // If permission denied, ensure videoEnabled stays false
        setVideoEnabled(false);
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError' || error.message.includes('not found')) {
        message = 'Camera/microphone not found. Please check your hardware connection.';
        setVideoEnabled(false);
      } else if (error.name === 'NotReadableError' || error.message.includes('Device in use')) {
        message = 'Camera/microphone is in use by another application. Please close other apps using the camera.';
        setVideoEnabled(false);
      }

      setMediaError(message);
      return;
    }

    // Only set connection error for actual connection failures
    if (error.message.includes('connect') || error.message.includes('timeout') || error.message.includes('token') || error.message.includes('JWT')) {
      setConnectionError(error.message || 'Failed to connect to video server');
    }
  }, []);

  // Loading state
  if (!token) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading video session...</Typography>
      </Box>
    );
  }

  // Error state
  if (connectionError) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%" gap={2}>
        <Alert severity="error">
          <AlertTitle>Connection Failed</AlertTitle>
          {connectionError}
        </Alert>
        <Button variant="contained" onClick={onDisconnected}>
          Return to User List
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{
      height: height,
      width: '100%',
      position: 'relative',
      bgcolor: '#1a1a2e',
      borderRadius: '16px',
      '& .lk-room-container': {
        borderRadius: '16px',
      },
    }}>
      <LiveKitRoom
        video={videoEnabled}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        options={roomOptions}
        data-lk-theme="default"
        style={{ height: '100%' }}
        onDisconnected={onDisconnected}
        onError={handleError}
      >
        {/* Media error warning - dismissible */}
        {mediaError && (
          <Alert
            severity="warning"
            sx={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 100 }}
            onClose={() => setMediaError(null)}
          >
            {mediaError}
          </Alert>
        )}

        {/* Custom Layout with Chat Toggle and Grid for Screen Sharing */}
        <CustomVideoLayout onInviteUser={onInviteUser} />

        <RoomAudioRenderer />
      </LiveKitRoom>
    </Box>
  );
};