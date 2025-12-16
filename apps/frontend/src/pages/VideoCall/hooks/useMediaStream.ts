import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';

export const useMediaStream = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let mediaStream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        mediaStream = stream;
        setStream(stream);
        console.log('[VideoCallPage] Media stream obtained, tracks:', stream.getTracks().length);
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
        enqueueSnackbar('Failed to access camera/microphone', { variant: 'error' });
      });

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [enqueueSnackbar]);

  return stream;
};
