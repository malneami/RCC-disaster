import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { getWebSocketUrl } from '../utils/socketUtils';

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
}

export const useWebSocket = (namespace?: string): UseWebSocketReturn => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const socketUrl = getWebSocketUrl(namespace) || "http://localhost:3001";

    const token = authService.getToken();
    
    // Create socket connection using the same simple pattern as testPage
    const socketOptions: any = {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
    };

    if (token) {
      socketOptions.auth = { token };
    }

    const newSocket = io(socketUrl, socketOptions);
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      if (!isMountedRef.current) return;
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      if (!isMountedRef.current) return;
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      
      // If server explicitly disconnects (namespace doesn't exist), disable reconnection
      if (reason === 'io server disconnect') {
        console.error(`Server disconnected: ${reason}. The namespace "${namespace || 'default'}" may not exist on the server.`);
        setConnectionError(`Server disconnected: ${reason}. The namespace "${namespace || 'default'}" may not exist on the server.`);
        newSocket.disconnect(); // Stop reconnection attempts
      }
    });


    newSocket.on('connect_error', (error) => {
      if (!isMountedRef.current) return;
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message || 'Connection failed');
      setIsConnected(false);
      
      
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
      setConnectionError(error.message || 'WebSocket error occurred');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      setConnectionError(null);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      setConnectionError(`Reconnection failed: ${error.message}`);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      setConnectionError('Unable to reconnect to server');
    });

    // EMS-specific event handlers
    newSocket.on('connected', (data) => {
      console.log('EMS WebSocket connected:', data);
    });

    newSocket.on('joined-room', (data) => {
      console.log('Joined room:', data);
    });

    newSocket.on('left-room', (data) => {
      console.log('Left room:', data);
    });

    newSocket.on('ambulance-location-update', (data) => {
      console.log('Ambulance location update:', data);
    });

    newSocket.on('assignment-status-update', (data) => {
      console.log('Assignment status update:', data);
    });

    newSocket.on('new-alert', (data) => {
      console.log('New alert:', data);
    });

    newSocket.on('alert-update', (data) => {
      console.log('Alert update:', data);
    });

    newSocket.on('ambulance-status-update', (data) => {
      console.log('Ambulance status update:', data);
    });

    newSocket.on('driver-schedule-update', (data) => {
      console.log('Driver schedule update:', data);
    });

    newSocket.on('maintenance-update', (data) => {
      console.log('Maintenance update:', data);
    });

    newSocket.on('performance-update', (data) => {
      console.log('Performance update:', data);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, namespace]);

  return {
    socket,
    isConnected,
    connectionError,
  };
};


