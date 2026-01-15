import React from 'react';
import {
    GridLayout,
    FocusLayout,
    ParticipantTile,
    TrackLoop,
} from '@livekit/components-react';
import { Box } from '@mui/material';
import { TrackReferenceOrPlaceholder } from '@livekit/components-core';

interface VideoGridProps {
    tracks: TrackReferenceOrPlaceholder[];
    cameraTracks: TrackReferenceOrPlaceholder[];
    screenShareTracks: TrackReferenceOrPlaceholder[];
    isScreenSharing: boolean;
}

/**
 * Video grid component that handles both normal grid layout
 * and screen share layout with participant strip
 */
export const VideoGrid: React.FC<VideoGridProps> = ({
    tracks,
    cameraTracks,
    screenShareTracks,
    isScreenSharing,
}) => {
    if (isScreenSharing) {
        return (
            <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
                {/* Main Screen Share */}
                <Box
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#000',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        '& .lk-focus-layout': {
                            height: '100%',
                            width: '100%',
                        },
                        '& .lk-participant-tile': {
                            borderRadius: '8px',
                        },
                    }}
                >
                    <FocusLayout
                        trackRef={screenShareTracks[0]}
                        style={{ height: '100%', width: '100%' }}
                    />
                </Box>

                {/* Compact Participant Strip */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        width: '180px',
                        minWidth: '180px',
                        height: '100%',
                        overflow: 'hidden',
                        '& .lk-track-loop': {
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            gap: '8px',
                        },
                        '& .lk-participant-tile': {
                            width: '100%',
                            flex: 1,
                            minHeight: 0,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            bgcolor: '#3c4043',
                        },
                        '& .lk-participant-name': {
                            fontSize: '11px',
                            color: '#e8eaed',
                        },
                    }}
                >
                    <TrackLoop tracks={cameraTracks}>
                        <ParticipantTile />
                    </TrackLoop>
                </Box>
            </Box>
        );
    }

    // Normal Grid Layout
    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& .lk-grid-layout': {
                    height: '100%',
                    gap: '12px',
                },
                '& .lk-participant-tile': {
                    borderRadius: '8px',
                    overflow: 'hidden',
                    bgcolor: '#3c4043',
                    border: '2px solid transparent',
                    transition: 'border-color 0.2s',
                },
                '& .lk-participant-tile:hover': {
                    border: '2px solid #5f6368',
                },
            }}
        >
            <GridLayout tracks={tracks} style={{ height: '100%', width: '100%' }}>
                <ParticipantTile />
            </GridLayout>
        </Box>
    );
};
