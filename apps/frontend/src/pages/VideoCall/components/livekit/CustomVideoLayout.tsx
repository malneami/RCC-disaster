import React, { useState, useEffect, useRef } from 'react';
import { useTracks, useRoomContext } from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import { Box, IconButton, Tooltip, Badge } from '@mui/material';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';

import { TopActionBar } from './TopActionBar';
import { VideoGrid } from './VideoGrid';
import { ChatPanel } from './ChatPanel';
import { TranscriptionPanel } from './TranscriptionPanel';
import { ControlBarWrapper } from './ControlBarWrapper';
import { useAudioCapture } from '../../hooks/useAudioCapture';
import { useTranscription } from '@/contexts/TranscriptionContext';
import { useVideoCallSocket } from '@/contexts/VideoCallSocketContext';

interface CustomVideoLayoutProps {
    onInviteUser: () => void;
    roomId: string;
}

/**
 * Custom video room layout component with transcription support
 */
export const CustomVideoLayout: React.FC<CustomVideoLayoutProps> = ({
    onInviteUser,
    roomId,
}) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isTranscriptionOpen, setIsTranscriptionOpen] = useState(false);
    const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const room = useRoomContext();
    const videoGridRef = useRef<HTMLDivElement>(null);
    const lastMediaStateRef = useRef({ video: false, screenShare: false });

    const {
        socket: transcriptionSocket,
        isConnected: transcriptionConnected,
        joinRoom,
        leaveRoom,
    } = useTranscription();

    const { socket: videoCallSocket } = useVideoCallSocket();

    // Get all camera and screen share tracks
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false }
    );

    // Check if someone is screen sharing
    const screenShareTracks = tracks.filter(
        (track) => track.source === Track.Source.ScreenShare
    );
    const isScreenSharing = screenShareTracks.length > 0;

    // Get camera tracks (participants)
    const cameraTracks = tracks.filter(
        (track) => track.source === Track.Source.Camera
    );

    // Join transcription room when component mounts
    useEffect(() => {
        if (transcriptionConnected && roomId) {
            joinRoom(roomId);
            return () => {
                leaveRoom(roomId);
            };
        }
    }, [transcriptionConnected, roomId, joinRoom, leaveRoom]);

    // Setup audio capture for transcription
    useAudioCapture({
        room,
        transcriptionSocket,
        roomId,
        enabled: isTranscriptionEnabled,
    });

    // Track and report media state changes to backend for video recording
    useEffect(() => {
        if (!room) return;

        const localParticipant = room.localParticipant;

        const cameraPublication = Array.from(localParticipant.trackPublications.values()).find(
            pub => pub.source === Track.Source.Camera
        );
        const hasCamera = cameraPublication !== undefined && !cameraPublication.isMuted;

        const screenSharePublication = Array.from(localParticipant.trackPublications.values()).find(
            pub => pub.source === Track.Source.ScreenShare
        );
        const hasScreenShare = screenSharePublication !== undefined && !screenSharePublication.isMuted;

        if (lastMediaStateRef.current.video === hasCamera &&
            lastMediaStateRef.current.screenShare === hasScreenShare) {
            return;
        }

        lastMediaStateRef.current = { video: hasCamera, screenShare: hasScreenShare };

        if (videoCallSocket) {
            videoCallSocket.emit('mediaStateChange', {
                from: room.localParticipant.identity,
                video: hasCamera,
                audio: true,
                screenShare: hasScreenShare,
                roomId: roomId
            });
        }
    }, [room, tracks, videoCallSocket, roomId]);

    // Listen for chat messages to update unread count
    useEffect(() => {
        if (!room) return;

        const handleDataReceived = () => {
            if (!isChatOpen) {
                setUnreadMessages(prev => prev + 1);
            }
        };

        room.on(RoomEvent.DataReceived, handleDataReceived);
        return () => {
            room.off(RoomEvent.DataReceived, handleDataReceived);
        };
    }, [room, isChatOpen]);

    // Reset unread count when opening chat
    const handleToggleChat = () => {
        setIsChatOpen(prev => {
            if (!prev) {
                setUnreadMessages(0);
            }
            return !prev;
        });
    };

    const handleToggleTranscription = () => {
        setIsTranscriptionOpen(prev => !prev);
    };

    const handleToggleTranscriptionEnabled = (enabled: boolean) => {
        setIsTranscriptionEnabled(enabled);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
                borderRadius: '10px',
                position: 'relative',
                bgcolor: '#202124',
            }}
        >
            {/* Top Action Bar with Transcription Button */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 3,
                    py: 2,
                    position: 'absolute',
                    borderRadius: '8px',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                }}
            >
                <TopActionBar
                    onInviteUser={onInviteUser}
                    onToggleChat={handleToggleChat}
                    isChatOpen={isChatOpen}
                    unreadMessages={unreadMessages}
                />

                {/* Transcription/Recording Toggle Button */}
                <Tooltip title={isTranscriptionOpen ? 'Close recording & transcription' : 'Open recording & transcription'}>
                    <IconButton
                        onClick={handleToggleTranscription}
                        sx={{
                            bgcolor: isTranscriptionOpen ? '#1967d2' : '#3c4043',
                            color: '#e8eaed',
                            width: 40,
                            height: 40,
                            '&:hover': {
                                bgcolor: isTranscriptionOpen ? '#1557b0' : '#5f6368',
                            },
                            transition: 'all 0.2s',
                        }}
                    >
                        <Badge
                            variant="dot"
                            color="success"
                            invisible={!isTranscriptionEnabled}
                        >
                            <ClosedCaptionIcon fontSize="small" />
                        </Badge>
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Main Content Area */}
            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    overflow: 'hidden',
                    pt: 7,
                    pb: 14,
                }}
            >
                {/* Video Grid Area */}
                <Box
                    ref={videoGridRef}
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        px: 2,
                        position: 'relative',
                    }}
                >
                    <VideoGrid
                        tracks={tracks}
                        cameraTracks={cameraTracks}
                        screenShareTracks={screenShareTracks}
                        isScreenSharing={isScreenSharing}
                    />
                </Box>

                {/* Chat Panel */}
                <ChatPanel
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                />

                {/* Transcription Panel */}
                <TranscriptionPanel
                    isOpen={isTranscriptionOpen}
                    onClose={() => setIsTranscriptionOpen(false)}
                    isEnabled={isTranscriptionEnabled}
                    onToggleTranscription={handleToggleTranscriptionEnabled}
                />
            </Box>

            <ControlBarWrapper />
        </Box>
    );
};