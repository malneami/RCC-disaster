import { useRef, useCallback } from 'react';
import Peer from 'simple-peer';

export interface PeerObject {
  peerID: string;
  peer: Peer.Instance;
  targetSocketId?: string;
  targetUserId?: string;
  targetEmail?: string;
  hasReceivedAnswer?: boolean;
}

export const usePeerManagement = () => {
  const peersRef = useRef<Array<PeerObject>>([]);

  const cleanupDestroyedPeers = useCallback(() => {
    peersRef.current = peersRef.current.filter((p) => {
      if (!p.peer || (p.peer as any).destroyed) {
        return false;
      }
      return true;
    });
  }, []);

  const removePeer = useCallback((socketId: string) => {
    const peerObj = peersRef.current.find((p) => p.peerID === socketId);
    if (peerObj?.peer) {
      try {
        if (!(peerObj.peer as any).destroyed) {
          peerObj.peer.destroy();
        }
      } catch (error) {
        console.warn('[VideoCallPage] Error destroying peer:', error);
      }
    }
    peersRef.current = peersRef.current.filter((p) => p.peerID !== socketId);
  }, []);

  const destroyAllPeers = useCallback(() => {
    peersRef.current.forEach((peerObj) => {
      if (peerObj.peer) {
        try {
          if (!(peerObj.peer as any).destroyed) {
            peerObj.peer.destroy();
          }
        } catch (error) {
          console.warn('[VideoCallPage] Error destroying peer:', error);
        }
      }
    });
    peersRef.current = [];
  }, []);

  return {
    peersRef,
    cleanupDestroyedPeers,
    removePeer,
    destroyAllPeers,
  };
};
