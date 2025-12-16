import { useCallback } from 'react';
import { Socket } from 'socket.io-client';
import Peer from 'simple-peer';
import { useSnackbar } from 'notistack';
import { PeerObject } from './usePeerManagement';
import { User } from '../utils/videoCallUtils';

interface UseCallManagementParams {
  stream: MediaStream | null;
  socket: Socket | null;
  socketId: string;
  currentUser: any;
  callerInfo: { socketId: string; name: string; userInfo?: any } | null;
  callerSignal: any;
  peersRef: React.MutableRefObject<Array<PeerObject>>;
  setCallAccepted: (accepted: boolean) => void;
  setReceivingCall: (receiving: boolean) => void;
  setCallEnded: (ended: boolean) => void;
  setRemoteStreams: React.Dispatch<React.SetStateAction<Record<string, { stream: MediaStream; name: string; socketId: string }>>>;
  setRemoteMediaStates: React.Dispatch<React.SetStateAction<Record<string, { video: boolean; audio: boolean }>>>;
  resetCallState: () => void;
  destroyAllPeers: () => void;
}

export const useCallManagement = ({
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
}: UseCallManagementParams) => {
  const { enqueueSnackbar } = useSnackbar();

  const callUser = useCallback((targetUser?: User, email?: string) => {
    if (!stream || !socket) {
      enqueueSnackbar('Please allow camera and microphone access first', { variant: 'warning' });
      return;
    }

    const displayName = targetUser
      ? `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.email
      : email || 'Unknown';

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    const tempPeerId = `temp-${Date.now()}`;

    peer.on('signal', (data: any) => {
      const callData: any = {
        signalData: data,
        from: socketId,
        name: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.email || 'Unknown',
      };

      if (email) {
        callData.emailToCall = email;
      } else if (targetUser) {
        callData.userIdToCall = targetUser.id;
      }

      socket.emit('callUser', callData);
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      
      setRemoteStreams((prev) => ({
        ...prev,
        [tempPeerId]: {
          stream: remoteStream,
          name: displayName,
          socketId: tempPeerId,
        },
      }));
      setRemoteMediaStates((prev) => ({
        ...prev,
        [tempPeerId]: { video: true, audio: true },
      }));
    });

    peer.on('error', (err: any) => {
      console.error('[VideoCallPage] Peer error:', err);
      enqueueSnackbar('Connection error occurred', { variant: 'error' });
      // Remove the peer on error
      peersRef.current = peersRef.current.filter((p) => p.peerID !== tempPeerId);
      // Clean up remote streams for this peer
      setRemoteStreams((prev) => {
        const newStreams = { ...prev };
        delete newStreams[tempPeerId];
        return newStreams;
      });
      setRemoteMediaStates((prev) => {
        const newStates = { ...prev };
        delete newStates[tempPeerId];
        return newStates;
      });
    });

    peer.on('close', () => {
      peersRef.current = peersRef.current.filter((p) => p.peerID !== tempPeerId);
    });

    const peerObj = {
      peerID: tempPeerId,
      peer: peer,
      targetUserId: targetUser?.id,
      targetEmail: email,
      hasReceivedAnswer: false,
    };

    peersRef.current.push(peerObj);
  }, [stream, socket, socketId, currentUser, peersRef, setRemoteStreams, setRemoteMediaStates, enqueueSnackbar]);

  const answerCall = useCallback(() => {
    if (!stream || !socket || !callerInfo || !callerSignal) {
      return;
    }

    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on('signal', (data: any) => {
      socket.emit('answerCall', {
        signal: data,
        to: callerInfo.socketId,
        name: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.email || 'Unknown',
      });
    });

    peer.on('stream', (remoteStream: MediaStream) => {
        
      setRemoteStreams((prev) => ({
        ...prev,
        [callerInfo.socketId]: {
          stream: remoteStream,
          name: callerInfo.name,
          socketId: callerInfo.socketId,
        },
      }));
      setRemoteMediaStates((prev) => ({
        ...prev,
        [callerInfo.socketId]: { video: true, audio: true },
      }));
    });

    peer.on('error', (err: any) => {
      console.error('Peer error:', err);
      enqueueSnackbar('Connection error occurred', { variant: 'error' });
    });

    peer.signal(callerSignal);

    const peerObj = {
      peerID: callerInfo.socketId,
      peer: peer,
    };

    peersRef.current.push(peerObj);
    setReceivingCall(false);
  }, [stream, socket, callerInfo, callerSignal, currentUser, peersRef, setCallAccepted, setReceivingCall, setRemoteStreams, setRemoteMediaStates, enqueueSnackbar]);

  const leaveCall = useCallback(() => {
    setCallEnded(true);

    // Clean up all peers
    destroyAllPeers();

    if (socket) {
      socket.emit('endCall', { from: socketId });
    }

    setRemoteStreams({});
    setRemoteMediaStates({});
    resetCallState();
  }, [socket, socketId, destroyAllPeers, setCallEnded, setRemoteStreams, setRemoteMediaStates, resetCallState]);

  return {
    callUser,
    answerCall,
    leaveCall,
  };
};
