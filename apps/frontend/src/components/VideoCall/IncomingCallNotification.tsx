import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  PhoneDisabled as PhoneDisabledIcon,
} from '@mui/icons-material';
import { useVideoCallSocket } from '../../contexts/VideoCallSocketContext';
import { useAuth } from '../../contexts/AuthContext';

interface IncomingCallData {
  signal: any;
  from: string;
  name: string;
  callerInfo?: any;
  callId?: string;
}

const IncomingCallNotification: React.FC = () => {
  const { socket, isConnected } = useVideoCallSocket();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [activeCallIds, setActiveCallIds] = useState<Set<string>>(new Set());
  const [initiatedCallIds, setInitiatedCallIds] = useState<Set<string>>(new Set()); // Track calls we initiated
  const [mySocketId, setMySocketId] = useState<string>('');

  // Get socket ID when connected and load initiated calls from sessionStorage
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMe = (data: { socketId: string; userId: string; userInfo: any }) => {
      console.log('[IncomingCallNotification] My socket ID:', data.socketId);
      setMySocketId(data.socketId);
    };

    // Load initiated callIds from sessionStorage
    const storedInitiatedCalls = sessionStorage.getItem('initiatedCallIds');
    if (storedInitiatedCalls) {
      try {
        const callIds = JSON.parse(storedInitiatedCalls);
        setInitiatedCallIds(new Set(callIds));
      } catch (error) {
        console.error('Error loading initiated callIds:', error);
      }
    }

    socket.on('me', handleMe);

    return () => {
      socket.off('me', handleMe);
    };
  }, [socket, isConnected]);

  // Save initiated callIds to sessionStorage whenever it changes
  useEffect(() => {
    if (initiatedCallIds.size > 0) {
      sessionStorage.setItem('initiatedCallIds', JSON.stringify(Array.from(initiatedCallIds)));
    }
  }, [initiatedCallIds]);

  // Setup event listeners - separate effect to avoid re-registering
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('[IncomingCallNotification] Socket not connected, skipping event listeners');
      return;
    }


    const handleIncomingCall = (data: IncomingCallData) => {
      console.log('[IncomingCallNotification] Received incoming call:', data);
      
      // Ignore if this is from ourselves (shouldn't happen, but safety check)
      if (data.from === mySocketId || data.from === socket.id) {
        console.log('[IncomingCallNotification] Ignoring call from self');
        return;
      }

      // Ignore if we initiated this call (check if callId is in our initiated calls)
      if (data.callId && initiatedCallIds.has(data.callId)) {
        console.log('[IncomingCallNotification] Ignoring call we initiated, callId:', data.callId);
        return;
      }


      // Ignore if we already have an active call with this callId
      if (data.callId && activeCallIds.has(data.callId)) {
        console.log('[IncomingCallNotification] Call ID already active, ignoring duplicate');
        return;
      }

      // Ignore if we're already answering a call
      if (isAnswering) {
        console.log('[IncomingCallNotification] Already answering a call, ignoring new call');
        return;
      }

      // Don't show notification if we're on the video call page - let VideoCallPage handle it
      if (window.location.pathname === '/video-call' || window.location.pathname.startsWith('/video-call')) {
        console.log('[IncomingCallNotification] On video call page, letting VideoCallPage handle the call');
        return;
      }

      setIncomingCall(data);
    };

    const handleCallEnded = (data: { from: string; userId?: string; callId?: string }) => {
      console.log('[IncomingCallNotification] Call ended event:', data);
      
      // Remove callId from active calls
      if (data.callId) {
        setActiveCallIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.callId!);
          return newSet;
        });
      }

      // If the call ended is for the current incoming call, close the notification
      if (incomingCall && (data.from === incomingCall.from || data.callId === incomingCall.callId)) {
        console.log('[IncomingCallNotification] Call ended, closing notification');
        setIncomingCall(null);
        setIsAnswering(false);
      }
    };

    const handleCallAccepted = (data: { signal: any; name: string; answererInfo?: any; roomId?: string; callId?: string; answererSocketId?: string }) => {
      // When we receive callAccepted, it means someone answered our call
      // Mark this callId as one we initiated (so we don't show incoming call notifications for it)
      if (data.callId) {
        setInitiatedCallIds(prev => new Set(prev).add(data.callId!));
        setActiveCallIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.callId!);
          return newSet;
        });
      }
      
      // Close incoming call notification if it matches (shouldn't happen, but safety check)
      if (incomingCall && data.callId === incomingCall.callId) {
        console.log('[IncomingCallNotification] Call accepted, closing notification');
        setIncomingCall(null);
        setIsAnswering(false);
      }
    };

    socket.on('callUser', handleIncomingCall);
    socket.on('callEnded', handleCallEnded);
    socket.on('callAccepted', handleCallAccepted);

    return () => {
      console.log('[IncomingCallNotification] Cleaning up event listeners');
      socket.off('callUser', handleIncomingCall);
      socket.off('callEnded', handleCallEnded);
      socket.off('callAccepted', handleCallAccepted);
    };
  }, [socket, isConnected, mySocketId, activeCallIds, initiatedCallIds, isAnswering, incomingCall]);

  const handleAnswer = async () => {
    if (!incomingCall || !socket || !currentUser) return;

    setIsAnswering(true);

    // Store call info so VideoCallPage can pick it up after navigation
    sessionStorage.setItem('pendingIncomingCall', JSON.stringify({
      from: incomingCall.from,
      name: incomingCall.name,
      callerInfo: incomingCall.callerInfo,
      callId: incomingCall.callId,
      signal: incomingCall.signal,
    }));

    
    navigate('/video-call');
    setIncomingCall(null);
    setIsAnswering(false);
  };

  const handleDecline = () => {
    if (!incomingCall || !socket) return;

    // Emit endCall to notify the caller
    socket.emit('endCall', {
      to: incomingCall.from,
      callId: incomingCall.callId,
    });

    setIncomingCall(null);
    setIsAnswering(false);
  };


  return (
    <Dialog
      open={!!incomingCall && !isAnswering}
      onClose={handleDecline}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 2,
        },
      }}
    >
      <DialogContent>
        <Typography variant="body1" align="center" sx={{ mt: 2 }}>
          Incoming video call... Checkout who is calling you.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
        <Button
          variant="contained"
          color="error"
          startIcon={<PhoneDisabledIcon />}
          onClick={handleDecline}
          size="large"
          sx={{ minWidth: 120 }}
        >
          Decline
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<PhoneIcon />}
          onClick={handleAnswer}
          size="large"
          sx={{ minWidth: 120 }}
        >
          See Who
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IncomingCallNotification;

