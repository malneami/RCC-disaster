import React, { useEffect } from 'react';
import { Dialog, DialogActions, Button, Box, Typography, Avatar } from '@mui/material';
import {
  Phone as PhoneIcon,
  PhoneDisabled as PhoneDisabledIcon,
} from '@mui/icons-material';

interface IncomingCallDialogProps {
  open: boolean;
  callerInfo: { socketId: string; name: string; userInfo?: any } | null;
  onAnswer: () => void;
  onDecline: () => void;
  onClose: () => void;
}

export const IncomingCallDialog: React.FC<IncomingCallDialogProps> = ({
  open,
  callerInfo,
  onAnswer,
  onDecline,
  onClose,
}) => {
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to decline
      if (e.key === 'Escape') {
        e.preventDefault();
        onDecline();
      }
      // Enter to answer
      else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onAnswer, onDecline]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          minWidth: '400px',
          maxWidth: '500px',
          overflow: 'hidden',
        },
      }}
      aria-labelledby="incoming-call-title"
      aria-describedby="incoming-call-description"
      role="alertdialog"
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 4,
          textAlign: 'center',
          color: 'white',
        }}
      >
        <Avatar
          sx={{
            width: 100,
            height: 100,
            mx: 'auto',
            mb: 2,
            bgcolor: 'rgba(255,255,255,0.2)',
            fontSize: '2.5rem',
            border: '4px solid rgba(255,255,255,0.3)',
          }}
        >
          {callerInfo?.name?.charAt(0).toUpperCase() || '?'}
        </Avatar>
        <Typography id="incoming-call-title" variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          {callerInfo?.name || 'Someone'}
        </Typography>
        <Typography id="incoming-call-description" variant="body1" sx={{ opacity: 0.9 }}>
          Incoming Communication...
        </Typography>
      </Box>
      <DialogActions
        sx={{
          p: 3,
          justifyContent: 'center',
          gap: 2,
          bgcolor: '#f5f5f5',
        }}
      >
        <Button
          onClick={onDecline}
          variant="outlined"
          color="error"
          size="large"
          sx={{
            minWidth: 140,
            py: 1.5,
            borderRadius: 2,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              bgcolor: 'error.light',
              color: 'white',
            },
          }}
          startIcon={<PhoneDisabledIcon />}
          aria-label="Decline incoming call"
        >
          Decline
        </Button>
        <Button
          onClick={onAnswer}
          variant="contained"
          color="success"
          size="large"
          sx={{
            minWidth: 140,
            py: 1.5,
            borderRadius: 2,
            bgcolor: '#34a853',
            '&:hover': {
              bgcolor: '#2d8f47',
            },
          }}
          startIcon={<PhoneIcon />}
          aria-label="Answer incoming call"
          autoFocus
        >
          Answer
        </Button>
      </DialogActions>
    </Dialog>
  );
};
