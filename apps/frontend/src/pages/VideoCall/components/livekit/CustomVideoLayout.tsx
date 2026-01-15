import React, { useState, useEffect, useRef } from 'react';
import { useTracks, useRoomContext } from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import { Box } from '@mui/material';

import { TopActionBar } from './TopActionBar';
import { VideoGrid } from './VideoGrid';
import { ChatPanel } from './ChatPanel';
import { ControlBarWrapper } from './ControlBarWrapper';

interface CustomVideoLayoutProps {
    onInviteUser: () => void;
}

/**
 * Custom video room layout component
 * Composes all sub-components for the video call UI
 */
export const CustomVideoLayout: React.FC<CustomVideoLayoutProps> = ({ onInviteUser }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const room = useRoomContext();
    const videoGridRef = useRef<HTMLDivElement>(null);

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
            <TopActionBar
                onInviteUser={onInviteUser}
                onToggleChat={handleToggleChat}
                isChatOpen={isChatOpen}
                unreadMessages={unreadMessages}
            />

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
                    }}
                >
                    <VideoGrid
                        tracks={tracks}
                        cameraTracks={cameraTracks}
                        screenShareTracks={screenShareTracks}
                        isScreenSharing={isScreenSharing}
                    />
                </Box>

                <ChatPanel
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                />
            </Box>

            <ControlBarWrapper />
        </Box>
    );
};
