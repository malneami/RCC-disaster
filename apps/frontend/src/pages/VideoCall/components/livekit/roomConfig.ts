import { RoomOptions, VideoPresets } from 'livekit-client';

/**
 * Room options for optimal video quality in LiveKit
 */
export const roomOptions: RoomOptions = {
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: {
        resolution: VideoPresets.h1080.resolution,
    },
    publishDefaults: {
        simulcast: true,
    },
    stopLocalTrackOnUnpublish: false,
};
