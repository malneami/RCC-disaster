import React, { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/apiClient';
import { useVideoCallSocket as useVideoCallSocketContext } from '../../contexts/VideoCallSocketContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useMediaStream } from './hooks/useMediaStream';
import { usePeerManagement } from './hooks/usePeerManagement';
import { useVideoCallSocket } from './hooks/useVideoCallSocket';
import { useCallManagement } from './hooks/useCallManagement';
import { useMediaControls } from './hooks/useMediaControls';
import { VideoCallInterface } from './components/VideoCallInterface';
import { IncomingCallDialog } from './components/IncomingCallDialog';
import { CameraPreview } from './components/CameraPreview';
import { UserList } from './components/UserList';
import { User } from './utils/videoCallUtils';

interface RemoteStream {
  stream: MediaStream;
  name: string;
  socketId: string;
}

const VideoCallPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [socketId, setSocketId] = useState<string>('');
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerInfo, setCallerInfo] = useState<{ socketId: string; name: string; userInfo?: any } | null>(null);
  const [callerSignal, setCallerSignal] = useState<any>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, RemoteStream>>({});
  const [remoteMediaStates, setRemoteMediaStates] = useState<Record<string, { video: boolean; audio: boolean }>>({});
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [emailToCall, setEmailToCall] = useState<string>('');

  const stream = useMediaStream();
  const { peersRef, cleanupDestroyedPeers, removePeer, destroyAllPeers } = usePeerManagement();

  const { socket: contextSocket, isConnected: contextIsConnected, connectionError: contextError } = useVideoCallSocketContext();

  const { socket: localSocket, isConnected: localIsConnected, connectionError: localError } = useWebSocket(contextSocket ? undefined : 'video-calls');

  const socket = contextSocket || localSocket;
  const isConnected = contextIsConnected || localIsConnected;
  const connectionError = contextError || localError;

  // Fetch users list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/users?page=1&limit=100');
        const allUsers = response.data.data || [];
        const otherUsers = allUsers.filter((u: User) => u.id !== currentUser?.id);
        setUsers(otherUsers);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        enqueueSnackbar('Failed to load users', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, enqueueSnackbar]);


  // Check for pending incoming call from sessionStorage on mount
  useEffect(() => {
    const pendingCall = sessionStorage.getItem('pendingIncomingCall');
    if (pendingCall) {
      try {
        const callData = JSON.parse(pendingCall);
        console.log('[VideoCallPage] Found pending incoming call:', callData);
        setReceivingCall(true);
        setCallerInfo({
          socketId: callData.from,
          name: callData.name,
          userInfo: callData.callerInfo,
        });
        setCallerSignal(callData.signal);
        sessionStorage.removeItem('pendingIncomingCall');
      } catch (error) {
        console.error('[VideoCallPage] Error parsing pending call:', error);
        sessionStorage.removeItem('pendingIncomingCall');
      }
    }
  }, []);

  const resetCallState = () => {
    setCallAccepted(false);
    setReceivingCall(false);
    setCallerInfo(null);
    setCallerSignal(null);
    setCallEnded(false);
  };

  // Setup socket event listeners
  useVideoCallSocket({
    socket,
    peersRef,
    cleanupDestroyedPeers,
    removePeer,
    setSocketId,
    setReceivingCall,
    setCallerInfo,
    setCallerSignal,
    setCallAccepted,
    setCallEnded,
    setRemoteStreams,
    setRemoteMediaStates,
    resetCallState,
  });

  const { callUser, answerCall, leaveCall } = useCallManagement({
    stream,
    socket,
    socketId,
    currentUser,
    callerInfo,
    callerSignal,
    peersRef,
    setCallAccepted,
    setReceivingCall,
    setCallEnded,
    setRemoteStreams,
    setRemoteMediaStates,
    resetCallState,
    destroyAllPeers,
  });

  const { toggleVideo, toggleAudio } = useMediaControls({
    stream,
    socket,
    socketId,
    videoEnabled,
    audioEnabled,
    setVideoEnabled,
    setAudioEnabled,
  });

  const callUserByEmail = () => {
    if (!emailToCall.trim()) {
      enqueueSnackbar('Please enter an email address', { variant: 'warning' });
      return;
    }
    callUser(undefined, emailToCall.trim());
    setEmailToCall('');
  };

  const handleDecline = () => {
    setReceivingCall(false);
    resetCallState();
    if (socket) {
      socket.emit('endCall', { to: callerInfo?.socketId });
    }
  };

  const handleAnswer = () => {
    answerCall();
  };

  const handleDialogClose = () => {
    setReceivingCall(false);
    resetCallState();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Communication
      </Typography>

      {connectionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {connectionError}
        </Alert>
      )}

      {!isConnected && !connectionError && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Connecting to Communication service...
        </Alert>
      )}

      {callAccepted && !callEnded ? (
        <VideoCallInterface
          stream={stream}
          remoteStreams={remoteStreams}
          remoteMediaStates={remoteMediaStates}
          videoEnabled={videoEnabled}
          audioEnabled={audioEnabled}
          currentUser={currentUser}
          toggleVideo={toggleVideo}
          toggleAudio={toggleAudio}
          leaveCall={leaveCall}
        />
      ) : (
        <>
          <CameraPreview
            stream={stream}
            videoEnabled={videoEnabled}
            audioEnabled={audioEnabled}
            toggleVideo={toggleVideo}
            toggleAudio={toggleAudio}
          />
          <UserList
            users={users}
            emailToCall={emailToCall}
            setEmailToCall={setEmailToCall}
            callUser={callUser}
            callUserByEmail={callUserByEmail}
            stream={stream}
            socket={socket}
          />
        </>
      )}

      <IncomingCallDialog
        open={receivingCall && !callAccepted}
        callerInfo={callerInfo}
        onAnswer={handleAnswer}
        onDecline={handleDecline}
        onClose={handleDialogClose}
      />
    </Box>
  );
};

export default VideoCallPage;
