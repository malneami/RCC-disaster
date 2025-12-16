import { useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface UseMediaControlsParams {
  stream: MediaStream | null;
  socket: Socket | null;
  socketId: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  setVideoEnabled: (enabled: boolean) => void;
  setAudioEnabled: (enabled: boolean) => void;
}

export const useMediaControls = ({
  stream,
  socket,
  socketId,
  videoEnabled,
  audioEnabled,
  setVideoEnabled,
  setAudioEnabled,
}: UseMediaControlsParams) => {
  const toggleVideo = useCallback(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        if (socket) {
          socket.emit('mediaStateChange', {
            from: socketId,
            video: videoTrack.enabled,
            audio: audioEnabled,
          });
        }
      }
    }
  }, [stream, socket, socketId, audioEnabled, setVideoEnabled]);

  const toggleAudio = useCallback(() => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        if (socket) {
          socket.emit('mediaStateChange', {
            from: socketId,
            video: videoEnabled,
            audio: audioTrack.enabled,
          });
        }
      }
    }
  }, [stream, socket, socketId, videoEnabled, setAudioEnabled]);

  return {
    toggleVideo,
    toggleAudio,
  };
};
