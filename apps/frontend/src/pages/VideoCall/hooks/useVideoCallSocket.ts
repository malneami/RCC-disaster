import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useSnackbar } from 'notistack';

export interface PeerObject {
  peerID: string;
  peer: any;
  targetSocketId?: string;
  targetUserId?: string;
  targetEmail?: string;
  hasReceivedAnswer?: boolean;
}

interface UseVideoCallSocketParams {
  socket: Socket | null;
  peersRef: React.MutableRefObject<Array<PeerObject>>;
  cleanupDestroyedPeers: () => void;
  removePeer: (socketId: string) => void;
  setSocketId: (id: string) => void;
  setReceivingCall: (receiving: boolean) => void;
  setCallerInfo: (info: { socketId: string; name: string; userInfo?: any } | null) => void;
  setCallerSignal: (signal: any) => void;
  setCallAccepted: (accepted: boolean) => void;
  setCallEnded: (ended: boolean) => void;
  setRemoteStreams: React.Dispatch<React.SetStateAction<Record<string, { stream: MediaStream; name: string; socketId: string }>>>;
  setRemoteMediaStates: React.Dispatch<React.SetStateAction<Record<string, { video: boolean; audio: boolean }>>>;
  resetCallState: () => void;
}

export const useVideoCallSocket = ({
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
}: UseVideoCallSocketParams) => {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleMe = (data: { socketId: string; userId: string; userInfo: any }) => {
      setSocketId(data.socketId);
    };

    const handleCallUser = (data: { signal: any; from: string; name: string; callerInfo?: any }) => {
      setReceivingCall(true);
      setCallerInfo({
        socketId: data.from,
        name: data.name,
        userInfo: data.callerInfo,
      });
      setCallerSignal(data.signal);
      enqueueSnackbar(`${data.name} is calling you...`, { variant: 'info' });
    };

    const handleCallAccepted = (data: { signal: any; name: string; answererInfo?: any; from?: string; answererSocketId?: string }) => {
      setCallAccepted(true);

      // Clean up any destroyed peers first
      cleanupDestroyedPeers();

      // Find the peer that initiated this call and signal it
      // Look for a peer that hasn't received an answer yet and matches the answerer
      let peerObj = peersRef.current.find((p) => {
        // Check if peer is still valid (not destroyed)
        if (!p.peer || (p.peer as any).destroyed) {
          return false;
        }
        // If we have answerer info, try to match
        if (data.answererSocketId && p.targetSocketId === data.answererSocketId) {
          return !p.hasReceivedAnswer;
        }
        // Otherwise, find the most recent peer that hasn't received an answer
        return !p.hasReceivedAnswer;
      });

      // Fallback: find any valid peer that hasn't received an answer
      if (!peerObj) {
        peerObj = peersRef.current.find((p) => {
          return p.peer && !(p.peer as any).destroyed && !p.hasReceivedAnswer;
        });
      }

      if (peerObj && peerObj.peer) {
        try {
          // Double-check if peer is destroyed before signaling
          if ((peerObj.peer as any).destroyed) {
            console.warn('[VideoCallPage] Cannot signal destroyed peer, removing from list');
            peersRef.current = peersRef.current.filter((p) => p.peerID !== peerObj!.peerID);
            return;
          }

          peerObj.peer.signal(data.signal);
          peerObj.hasReceivedAnswer = true;
        } catch (error) {
          console.error('[VideoCallPage] Error signaling peer:', error);
          // Remove the destroyed peer from the list
          if (error instanceof Error && (error.message.includes('destroyed') || error.message.includes('cannot signal'))) {
            peersRef.current = peersRef.current.filter((p) => p.peerID !== peerObj!.peerID);
          }
        }
      } else {
        console.warn('[VideoCallPage] No valid peer found to signal for callAccepted. Available peers:', peersRef.current.length);
      }
    };

    const handleCallEnded = (data: { from: string; userId?: string; name?: string }) => {
      // Only remove that specific participant from our local state
      if (data.from) {
        // Remove the specific peer who left
        removePeer(data.from);
        setRemoteStreams((prev) => {
          const newStreams = { ...prev };
          delete newStreams[data.from];
          return newStreams;
        });
        setRemoteMediaStates((prev) => {
          const newStates = { ...prev };
          delete newStates[data.from];
          return newStates;
        });

        if (data.name) {
          enqueueSnackbar(`${data.name} left the call`, { variant: 'info' });
        }
      }
      // The call should only end for the local user when they explicitly disconnect
      // via the onDisconnected callback from LiveKitCallInterface
    };

    const handleMediaStateChanged = (data: { from: string; video: boolean; audio: boolean; userId?: string }) => {
      setRemoteMediaStates((prev) => ({
        ...prev,
        [data.from]: { video: data.video, audio: data.audio },
      }));
    };

    const handleCallError = (data: { error?: string; message?: string; targetUserId?: string; targetEmail?: string }) => {
      console.error('Call error:', data);
      const errorMessage = data.error || data.message || 'Call failed';

      // Show user-friendly error message with better formatting
      let displayMessage = errorMessage;
      if (errorMessage.toLowerCase().includes('not online')) {
        displayMessage = 'The user you are trying to call is not online';
      } else if (errorMessage.toLowerCase().includes('not authenticated')) {
        displayMessage = 'Authentication error. Please try again.';
      } else if (errorMessage.toLowerCase().includes('no target')) {
        displayMessage = 'No user specified to call';
      }

      enqueueSnackbar(displayMessage, { variant: 'error' });

      // Clean up any pending peers when call fails
      // Find the peer that matches the failed call target
      const peersToRemove: string[] = [];

      // First, try to match by specific target info if provided
      if (data.targetUserId || data.targetEmail) {
        peersRef.current.forEach((peerObj) => {
          const matchesTarget =
            (data.targetUserId && peerObj.targetUserId === data.targetUserId) ||
            (data.targetEmail && peerObj.targetEmail === data.targetEmail);

          if (matchesTarget && !peerObj.hasReceivedAnswer) {
            // Clean up the peer
            if (peerObj.peer && !(peerObj.peer as any).destroyed) {
              try {
                peerObj.peer.destroy();
              } catch (error) {
                console.warn('[VideoCallPage] Error destroying peer on call error:', error);
              }
            }
            // Clean up remote streams
            setRemoteStreams((prev) => {
              const newStreams = { ...prev };
              delete newStreams[peerObj.peerID];
              return newStreams;
            });
            setRemoteMediaStates((prev) => {
              const newStates = { ...prev };
              delete newStates[peerObj.peerID];
              return newStates;
            });
            peersToRemove.push(peerObj.peerID);
          }
        });
      } else {
        // If no specific target info, remove the most recent peer that hasn't received an answer
        // (peers are added to the end of the array, so the last one is the most recent)
        const pendingPeers = peersRef.current.filter((p) => !p.hasReceivedAnswer);
        if (pendingPeers.length > 0) {
          const mostRecentPeer = pendingPeers[pendingPeers.length - 1];

          // Clean up the peer
          if (mostRecentPeer.peer && !(mostRecentPeer.peer as any).destroyed) {
            try {
              mostRecentPeer.peer.destroy();
            } catch (error) {
              console.warn('[VideoCallPage] Error destroying peer on call error:', error);
            }
          }
          // Clean up remote streams
          setRemoteStreams((prev) => {
            const newStreams = { ...prev };
            delete newStreams[mostRecentPeer.peerID];
            return newStreams;
          });
          setRemoteMediaStates((prev) => {
            const newStates = { ...prev };
            delete newStates[mostRecentPeer.peerID];
            return newStates;
          });
          peersToRemove.push(mostRecentPeer.peerID);
        }
      }

      // Remove peers from the list
      if (peersToRemove.length > 0) {
        peersRef.current = peersRef.current.filter((p) => !peersToRemove.includes(p.peerID));
      }
    };

    socket.on('me', handleMe);
    socket.on('callUser', handleCallUser);
    socket.on('callAccepted', handleCallAccepted);
    socket.on('callEnded', handleCallEnded);
    socket.on('mediaStateChanged', handleMediaStateChanged);
    socket.on('callError', handleCallError);


    return () => {
      socket.off('me', handleMe);
      socket.off('callUser', handleCallUser);
      socket.off('callAccepted', handleCallAccepted);
      socket.off('callEnded', handleCallEnded);
      socket.off('mediaStateChanged', handleMediaStateChanged);
      socket.off('callError', handleCallError);
    };
  }, [
    socket,
    enqueueSnackbar,
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
  ]);
};

