import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { useAuth } from './AuthContext';
import { useVideoCallSocket } from './VideoCallSocketContext';
import { useVideoCallSocket as useVideoCallSocketHook } from '../pages/VideoCall/hooks/useVideoCallSocket';
import { useVideoCallToken } from '../pages/VideoCall/hooks/useVideoCallToken';
import { User } from '../pages/VideoCall/utils/videoCallUtils';

interface CallerInfo {
  socketId: string;
  name: string;
  userInfo?: any;
}

interface VideoCallContextType {
  // Call state
  liveKitToken: string | null;
  serverUrl: string;
  receivingCall: boolean;
  callerInfo: CallerInfo | null;
  callerSignal: any | null;
  inviteMode: boolean;
  isLoadingToken: boolean;
  
  // Actions
  startCall: (targetUser: User) => Promise<void>;
  answerCall: () => Promise<void>;
  endCall: () => void;
  declineCall: () => void;
  setInviteMode: (mode: boolean) => void;
  
  // UI state for floating panel
  isCallMinimized: boolean;
  toggleCallMinimized: () => void;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

interface VideoCallProviderProps {
  children: ReactNode;
}

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';

export const VideoCallProvider: React.FC<VideoCallProviderProps> = ({ children }) => {
  const { user: currentUser } = useAuth();
  const { socket } = useVideoCallSocket();
  const { enqueueSnackbar } = useSnackbar();
  
  // React Query mutation for token fetching
  const tokenMutation = useVideoCallToken();
  
  // Call state
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerInfo, setCallerInfo] = useState<CallerInfo | null>(null);
  const [callerSignal, setCallerSignal] = useState<any | null>(null);
  const [inviteMode, setInviteMode] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  
  const isLoadingToken = tokenMutation.isLoading;

  // Hook for socket events
  useVideoCallSocketHook({
    socket,
    peersRef: { current: [] },
    cleanupDestroyedPeers: () => {},
    removePeer: () => {},
    setSocketId: () => {},
    setReceivingCall,
    setCallerInfo,
    setCallerSignal,
    setCallAccepted: () => {},
    setCallEnded: () => {
      setLiveKitToken(null);
      setCurrentRoomId(null);
      setInviteMode(false);
      setIsCallMinimized(false);
    },
    setRemoteStreams: () => {},
    setRemoteMediaStates: () => {},
    resetCallState: () => {
      setLiveKitToken(null);
      setCurrentRoomId(null);
    }
  });

  // Check for pending incoming call from sessionStorage
  React.useEffect(() => {
    const pendingCall = sessionStorage.getItem('pendingIncomingCall');
    if (pendingCall) {
      try {
        const callData = JSON.parse(pendingCall);
        setReceivingCall(true);
        setCallerInfo({
          socketId: callData.from,
          name: callData.name,
          userInfo: callData.callerInfo,
        });
        setCallerSignal(callData.signal);
        sessionStorage.removeItem('pendingIncomingCall');
      } catch (error) {
        sessionStorage.removeItem('pendingIncomingCall');
      }
    }
  }, []);

  const startCall = useCallback(async (targetUser: User) => {
    if (!socket || !currentUser) return;

    try {
      // If we're already in a call, use the existing room ID for the invitation
      // Otherwise, create a new room
      let targetRoomId: string;
      
      if (currentRoomId && liveKitToken) {
        // Already in a call - invite to existing room
        targetRoomId = currentRoomId;
      } else {
        targetRoomId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const token = await tokenMutation.mutateAsync(targetRoomId);
        
        setLiveKitToken(token);
        setCurrentRoomId(targetRoomId);
      }

      // Emit invite signal with room ID
      const signalData = { type: 'invite', roomId: targetRoomId };
      socket.emit('callUser', {
        userToCall: targetUser?.id,
        userIdToCall: targetUser?.id,
        signalData: signalData,
        from: socket.id,
        name: `${currentUser.firstName} ${currentUser.lastName}`
      });

      setInviteMode(false);
      setIsCallMinimized(false);

    } catch (err) {
      enqueueSnackbar('Failed to start call. Please try again.', { variant: 'error' });
    }
  }, [socket, currentUser, enqueueSnackbar, currentRoomId, liveKitToken, tokenMutation]);

  const answerCall = useCallback(async () => {
    if (!callerSignal?.roomId) {
      enqueueSnackbar('Invalid call invitation', { variant: 'error' });
      return;
    }

    if (!callerInfo?.socketId) {
      enqueueSnackbar('Invalid caller information', { variant: 'error' });
      return;
    }

    try {
      const roomId = callerSignal.roomId;
      
      const token = await tokenMutation.mutateAsync(roomId);
      
      setLiveKitToken(token);
      setCurrentRoomId(roomId);
      setReceivingCall(false);
      setIsCallMinimized(false);

      socket?.emit('answerCall', {
        signal: { type: 'accept' },
        to: callerInfo.socketId
      });
    } catch (err) {
      enqueueSnackbar('Failed to join call. Please try again.', { variant: 'error' });
      setReceivingCall(false);
    }
  }, [callerSignal, callerInfo, socket, enqueueSnackbar, tokenMutation]);

  const endCall = useCallback(() => {
    // Emit endCall to notify all participants (broadcast)
    if (socket) {
      socket.emit('endCall', { 
        roomId: currentRoomId,
        from: socket.id 
      });
    }
    
    // Clear local state
    setLiveKitToken(null);
    setCurrentRoomId(null);
    setInviteMode(false);
    setIsCallMinimized(false);
    setCallerInfo(null);
    setCallerSignal(null);
  }, [socket, currentRoomId]);

  const declineCall = useCallback(() => {
    setReceivingCall(false);
    if (socket && callerInfo?.socketId) {
      socket.emit('endCall', { to: callerInfo.socketId });
    }
    setCallerInfo(null);
    setCallerSignal(null);
  }, [socket, callerInfo]);

  const toggleCallMinimized = useCallback(() => {
    setIsCallMinimized(prev => !prev);
  }, []);

  const value: VideoCallContextType = {
    liveKitToken,
    serverUrl: LIVEKIT_URL,
    receivingCall,
    callerInfo,
    callerSignal,
    inviteMode,
    isLoadingToken,
    startCall,
    answerCall,
    endCall,
    declineCall,
    setInviteMode,
    isCallMinimized,
    toggleCallMinimized,
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = (): VideoCallContextType => {
  const context = useContext(VideoCallContext);
  if (context === undefined) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
};
