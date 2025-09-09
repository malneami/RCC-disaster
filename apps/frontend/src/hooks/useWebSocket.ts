import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

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

  useEffect(() => {
    if (!user) {
      return;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const socketUrl = namespace ? `${baseUrl}/${namespace}` : baseUrl;

    // Create socket connection
    const newSocket = io(socketUrl, {
      auth: {
        userId: user.id,
        role: user.role,
      },
      transports: ['websocket'],
      upgrade: true,
      rememberUpgrade: true,
    });

    socketRef.current = newSocket;

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
      setConnectionError(error.message);
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
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, namespace]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    socket,
    isConnected,
    connectionError,
  };
};


