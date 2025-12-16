import React, { useRef, useEffect } from 'react';
import { Box, Grid, IconButton, Avatar } from '@mui/material';
import {
  PhoneDisabled as PhoneDisabledIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
} from '@mui/icons-material';
import { getUserDisplayName } from '../utils/videoCallUtils';

interface RemoteStream {
  stream: MediaStream;
  name: string;
  socketId: string;
}

interface VideoCallInterfaceProps {
  stream: MediaStream | null;
  remoteStreams: Record<string, RemoteStream>;
  remoteMediaStates: Record<string, { video: boolean; audio: boolean }>;
  videoEnabled: boolean;
  audioEnabled: boolean;
  currentUser: any;
  toggleVideo: () => void;
  toggleAudio: () => void;
  leaveCall: () => void;
}

export const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  stream,
  remoteStreams,
  remoteMediaStates,
  videoEnabled,
  audioEnabled,
  currentUser,
  toggleVideo,
  toggleAudio,
  leaveCall,
}) => {
  const myVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (stream && myVideoRef.current) {
      myVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: 'calc(100vh - 200px)',
        bgcolor: '#202124',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Grid container spacing={1} sx={{ height: '100%', p: 1 }}>
        {/* My Video */}
        <Grid item xs={12} md={Object.keys(remoteStreams).length > 0 ? 6 : 12}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: Object.keys(remoteStreams).length > 0 ? 'calc(50vh - 100px)' : 'calc(100vh - 200px)',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: '#000',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            }}
          >
            {stream && (
              <>
                <video
                  ref={myVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: videoEnabled ? 'block' : 'none',
                    backgroundColor: '#1a1a1a',
                  }}
                />
                {!videoEnabled && (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 120,
                        height: 120,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        fontSize: '3rem',
                      }}
                    >
                      {getUserDisplayName(currentUser)?.charAt(0).toUpperCase() || 'Y'}
                    </Avatar>
                    <VideocamOffIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.7)' }} />
                  </Box>
                )}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {getUserDisplayName(currentUser) || 'You'}
                  {!audioEnabled && <MicOffIcon sx={{ fontSize: 18, color: '#ea4335' }} />}
                </Box>
              </>
            )}
          </Box>
        </Grid>

        {Object.entries(remoteStreams).map(([socketId, { stream: remoteStream, name }]) => {
          const mediaState = remoteMediaStates[socketId] || { video: true, audio: true };
          return (
            <Grid item xs={12} md={6} key={socketId}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 'calc(50vh - 100px)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: '#000',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                }}
              >
                <video
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: mediaState.video ? 'block' : 'none',
                    backgroundColor: '#1a1a1a',
                  }}
                  ref={(videoElement) => {
                    if (videoElement && remoteStream) {
                      if (videoElement.srcObject !== remoteStream) {
                        console.log('[VideoCallPage] Assigning remote stream to video element for:', name);
                        videoElement.srcObject = remoteStream;
                      }
                    }
                  }}
                />
                {!mediaState.video && (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #ea4335 0%, #fbbc04 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 120,
                        height: 120,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        fontSize: '3rem',
                      }}
                    >
                      {name?.charAt(0).toUpperCase() || '?'}
                    </Avatar>
                    <VideocamOffIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.7)' }} />
                  </Box>
                )}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {name}
                  {!mediaState.audio && <MicOffIcon sx={{ fontSize: 18, color: '#ea4335' }} />}
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Media Controls - Floating at bottom */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          justifyContent: 'center',
          gap: 1.5,
          alignItems: 'center',
          bgcolor: 'rgba(32, 33, 36, 0.9)',
          backdropFilter: 'blur(10px)',
          px: 3,
          py: 1.5,
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        <IconButton
          onClick={toggleVideo}
          sx={{
            bgcolor: videoEnabled ? 'rgba(255,255,255,0.1)' : '#ea4335',
            color: 'white',
            '&:hover': {
              bgcolor: videoEnabled ? 'rgba(255,255,255,0.2)' : '#d33b2c',
            },
            width: 48,
            height: 48,
          }}
        >
          {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>

        <IconButton
          onClick={toggleAudio}
          sx={{
            bgcolor: audioEnabled ? 'rgba(255,255,255,0.1)' : '#ea4335',
            color: 'white',
            '&:hover': {
              bgcolor: audioEnabled ? 'rgba(255,255,255,0.2)' : '#d33b2c',
            },
            width: 48,
            height: 48,
          }}
        >
          {audioEnabled ? <MicIcon /> : <MicOffIcon />}
        </IconButton>

        <IconButton
          onClick={leaveCall}
          sx={{
            bgcolor: '#ea4335',
            color: 'white',
            '&:hover': {
              bgcolor: '#d33b2c',
            },
            width: 48,
            height: 48,
            ml: 1,
          }}
        >
          <PhoneDisabledIcon />
        </IconButton>
      </Box>
    </Box>
  );
};
