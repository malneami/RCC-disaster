import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { authService } from '../services/authService';
import { getWebSocketUrl } from '../utils/socketUtils';

interface VideoCallSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
}

const VideoCallSocketContext = createContext<VideoCallSocketContextType | undefined>(undefined);

interface VideoCallSocketProviderProps {
  children: ReactNode;
}

export const VideoCallSocketProvider: React.FC<VideoCallSocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Only connect if user is logged in
    if (!user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get socket base URL
    const baseUrl = getWebSocketUrl();
    const namespace = '/video-calls';

    console.log(`[VideoCallSocketContext] Connecting to: ${baseUrl}${namespace}`);

    // Get token for authentication
    const token = authService.getToken();

    if (!token) {
      console.warn('[VideoCallSocketContext] No token available, cannot connect');
      setConnectionError('No authentication token available');
      return;
    }

    // Create socket connection with namespace
    const socketOptions: any = {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      timeout: 20000,
      autoConnect: true,
      auth: { token },
      forceNew: false, // Reuse existing connection if available
    };

    const newSocket = io(baseUrl + namespace, socketOptions);
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      if (!isMountedRef.current) return;
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      if (!isMountedRef.current) return;
      setIsConnected(false);

      if (reason === 'io server disconnect') {
        console.error('[VideoCallSocketContext] Server disconnected:', reason);
        setConnectionError(`Server disconnected: ${reason}`);
        newSocket.disconnect();
      }
    });

    newSocket.on('connect_error', (error) => {
      if (!isMountedRef.current) return;
      console.error('[VideoCallSocketContext] Connection error:', error);
      setConnectionError(error.message || 'Connection failed');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('[VideoCallSocketContext] Socket error:', error);
      setConnectionError(error.message || 'Socket error occurred');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('[VideoCallSocketContext] Reconnected after', attemptNumber, 'attempts');
      setConnectionError(null);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('[VideoCallSocketContext] Reconnection error:', error);
      setConnectionError(`Reconnection failed: ${error.message}`);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('[VideoCallSocketContext] Reconnection failed');
      setConnectionError('Unable to reconnect to server');
    });

    setSocket(newSocket);

    // Cleanup on unmount or when user changes
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
  }, [user]);

  return (
    <VideoCallSocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </VideoCallSocketContext.Provider>
  );
};

export const useVideoCallSocket = (): VideoCallSocketContextType => {
  const context = useContext(VideoCallSocketContext);
  if (context === undefined) {
    throw new Error('useVideoCallSocket must be used within a VideoCallSocketProvider');
  }
  return context;
};

