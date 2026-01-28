import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { authService } from '../services/authService';
import { getWebSocketUrl } from '../utils/socketUtils';

export interface TranscriptionSegment {
    id: string;
    roomId: string;
    participantId: string;
    participantName: string;
    text: string;
    timestamp: number;
    isFinal: boolean;
    language?: string;
    confidence?: number;
}

interface TranscriptionContextType {
    socket: Socket | null;
    isConnected: boolean;
    transcriptions: TranscriptionSegment[];
    joinRoom: (roomId: string) => void;
    leaveRoom: (roomId: string) => void;
    clearTranscriptions: () => void;
    isTranscribing: boolean;
}

const TranscriptionContext = createContext<TranscriptionContextType | undefined>(undefined);

interface TranscriptionProviderProps {
    children: ReactNode;
}

export const TranscriptionProvider: React.FC<TranscriptionProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [transcriptions, setTranscriptions] = useState<TranscriptionSegment[]>([]);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
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
        const namespace = '/transcription';
        const token = authService.getToken();

        if (!token) {
            return;
        }

        const newSocket = io(baseUrl + namespace, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            auth: {
                token,
                userId: user.id,
            },
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('transcriptionHistory', (data: { roomId: string; transcriptions: TranscriptionSegment[] }) => {
            setTranscriptions(data.transcriptions);
        });

        newSocket.on('newTranscription', (segment: TranscriptionSegment) => {
            setTranscriptions((prev) => {
                if (!segment.isFinal) {
                    const lastIndex = prev.findIndex(
                        (t) => !t.isFinal && t.participantId === segment.participantId
                    );
                    if (lastIndex !== -1) {
                        const newTranscriptions = [...prev];
                        newTranscriptions[lastIndex] = segment;
                        return newTranscriptions;
                    }
                }
                return [...prev, segment];
            });
        });

        newSocket.on('transcriptionsCleared', () => {
            setTranscriptions([]);
        });

        setSocket(newSocket);

        return () => {
            if (socketRef.current) {
                socketRef.current.removeAllListeners();
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setSocket(null);
            setIsConnected(false);
        };
    }, [user]);

    const joinRoom = (roomId: string) => {
        if (socket && isConnected) {
            socket.emit('joinTranscriptionRoom', { roomId });
            setCurrentRoomId(roomId);
            setIsTranscribing(true);
        }
    };

    const leaveRoom = (roomId: string) => {
        if (socket && isConnected) {
            socket.emit('leaveTranscriptionRoom', { roomId });
            setCurrentRoomId(null);
            setIsTranscribing(false);
        }
    };

    const clearTranscriptions = () => {
        if (socket && isConnected && currentRoomId) {
            socket.emit('clearTranscriptions', { roomId: currentRoomId });
        }
    };

    return (
        <TranscriptionContext.Provider
            value={{
                socket,
                isConnected,
                transcriptions,
                joinRoom,
                leaveRoom,
                clearTranscriptions,
                isTranscribing,
            }}
        >
            {children}
        </TranscriptionContext.Provider>
    );
};

export const useTranscription = (): TranscriptionContextType => {
    const context = useContext(TranscriptionContext);
    if (context === undefined) {
        throw new Error('useTranscription must be used within a TranscriptionProvider');
    }
    return context;
};