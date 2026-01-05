import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { authService } from '../services/authService';
import { getWebSocketUrl } from '../utils/socketUtils';

interface NotificationSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
}

const NotificationSocketContext = createContext<NotificationSocketContextType | undefined>(undefined);

interface NotificationSocketProviderProps {
  children: ReactNode;
}

export const NotificationSocketProvider: React.FC<NotificationSocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (!user) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const baseUrl = getWebSocketUrl();
    const namespace = '/notifications';

    console.log(`[NotificationSocketContext] Connecting to: ${baseUrl}${namespace}`);

    const token = authService.getToken();

    if (!token) {
      setConnectionError('No authentication token available');
      return;
    }

    const socketOptions: any = {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      autoConnect: true,
      auth: {
        token,
        userId: user.id,
        userInfo: {
          name: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
          email: user.email,
          role: user.role,
          hospitalId: user.hospitalId,
        }
      },
      forceNew: false,
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
        setConnectionError(`Server disconnected: ${reason}`);
        newSocket.disconnect();
      }
    });

    newSocket.on('connect_error', (error) => {
      if (!isMountedRef.current) return;
      setConnectionError(error.message || 'Connection failed');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      setConnectionError(error.message || 'Socket error occurred');
    });

    newSocket.on('reconnect', () => {
      setConnectionError(null);
    });

    newSocket.on('reconnect_error', (error) => {
      setConnectionError(`Reconnection failed: ${error.message}`);
    });

    newSocket.on('reconnect_failed', () => {
      setConnectionError('Unable to reconnect to server');
    });


    setSocket(newSocket);

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
    <NotificationSocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </NotificationSocketContext.Provider>
  );
};

export const useNotificationSocket = (): NotificationSocketContextType => {
  const context = useContext(NotificationSocketContext);
  if (context === undefined) {
    throw new Error('useNotificationSocket must be used within a NotificationSocketProvider');
  }
  return context;
};

