import React, { useEffect, useState, useRef } from 'react';
import { useVideoCallSocket } from '../../contexts/VideoCallSocketContext';

/**
 * IncomingCallNotification - Handles incoming call socket events
 * Tracks call IDs for filtering purposes
 * The actual incoming call handling is done in VideoCallContext via useVideoCallSocketHook
 */
const IncomingCallNotification: React.FC = () => {
  const { socket, isConnected } = useVideoCallSocket();

  // Track initiated call IDs to avoid showing notifications for calls we started
  const [initiatedCallIds, setInitiatedCallIds] = useState<Set<string>>(new Set());
  const activeCallIdsRef = useRef<Set<string>>(new Set());

  // Load initiated callIds from sessionStorage on mount
  useEffect(() => {
    const storedInitiatedCalls = sessionStorage.getItem('initiatedCallIds');
    if (storedInitiatedCalls) {
      try {
        const callIds = JSON.parse(storedInitiatedCalls);
        setInitiatedCallIds(new Set(callIds));
      } catch (error) {
        console.error('Error loading initiated callIds:', error);
      }
    }
  }, []);

  // Save initiated callIds to sessionStorage whenever it changes
  useEffect(() => {
    if (initiatedCallIds.size > 0) {
      sessionStorage.setItem('initiatedCallIds', JSON.stringify(Array.from(initiatedCallIds)));
    }
  }, [initiatedCallIds]);

  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    const handleCallEnded = (data: { from: string; userId?: string; callId?: string }) => {
      console.log('[IncomingCallNotification] Call ended event:', data);

      if (data.callId) {
        activeCallIdsRef.current.delete(data.callId);
      }

      // If call ended, clear any pending call from sessionStorage
      const pendingCall = sessionStorage.getItem('pendingIncomingCall');
      if (pendingCall) {
        const callData = JSON.parse(pendingCall);
        if (data.from === callData.from || data.callId === callData.callId) {
          sessionStorage.removeItem('pendingIncomingCall');
        }

      }
    };

    const handleCallAccepted = (data: { signal: any; name: string; answererInfo?: any; roomId?: string; callId?: string; answererSocketId?: string }) => {
      // When we receive callAccepted, it means someone answered our call
      // Mark this callId as one we initiated (so we don't show incoming call notifications for it)
      if (data.callId) {
        setInitiatedCallIds(prev => new Set(prev).add(data.callId!));
        // Remove from active calls
        activeCallIdsRef.current.delete(data.callId);
      }

      // If call accepted, clear pending call from sessionStorage
      const pendingCall = sessionStorage.getItem('pendingIncomingCall');
      if (pendingCall) {
        const callData = JSON.parse(pendingCall);
        if (data.callId === callData.callId) {
          sessionStorage.removeItem('pendingIncomingCall');
        }
      }
    };

    socket.on('callEnded', handleCallEnded);
    socket.on('callAccepted', handleCallAccepted);

    return () => {
      socket.off('callEnded', handleCallEnded);
      socket.off('callAccepted', handleCallAccepted);
    };
  }, [socket, isConnected]);

  // This component no longer renders a dialog
  // It only handles socket events and updates sessionStorage
  // PersistentCallPanel's IncomingCallDialog handles the UI
  return null;
};

export default IncomingCallNotification;

