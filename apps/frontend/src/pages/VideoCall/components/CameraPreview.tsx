import React, { useRef, useEffect } from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import {
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
} from '@mui/icons-material';

interface CameraPreviewProps {
  stream: MediaStream | null;
  videoEnabled: boolean;
  audioEnabled: boolean;
  toggleVideo: () => void;
  toggleAudio: () => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  stream,
  videoEnabled,
  audioEnabled,
  toggleVideo,
  toggleAudio,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Camera Preview
      </Typography>
      <Box sx={{ position: 'relative', maxWidth: '400px', margin: '0 auto' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            borderRadius: '8px',
            display: videoEnabled ? 'block' : 'none',
          }}
        />
        {!videoEnabled && (
          <Box
            sx={{
              width: '100%',
              aspectRatio: '16/9',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
            }}
          >
            <VideocamOffIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.7)' }} />
          </Box>
        )}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <IconButton
            onClick={toggleVideo}
            sx={{
              bgcolor: videoEnabled ? 'primary.main' : 'error.main',
              color: 'white',
              '&:hover': {
                bgcolor: videoEnabled ? 'primary.dark' : 'error.dark',
              },
            }}
          >
            {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>
          <IconButton
            onClick={toggleAudio}
            sx={{
              bgcolor: audioEnabled ? 'primary.main' : 'error.main',
              color: 'white',
              '&:hover': {
                bgcolor: audioEnabled ? 'primary.dark' : 'error.dark',
              },
            }}
          >
            {audioEnabled ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};
