import { useEffect, useRef } from 'react';
import { Room, Track, RemoteTrackPublication, RemoteParticipant } from 'livekit-client';
import { Socket } from 'socket.io-client';

interface UseAudioCaptureParams {
    room: Room | null;
    transcriptionSocket: Socket | null;
    roomId: string;
    enabled: boolean;
}

/**
 * Hook to capture audio from LiveKit room and send to transcription service
 */
export const useAudioCapture = ({
    room,
    transcriptionSocket,
    roomId,
    enabled,
}: UseAudioCaptureParams) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorsRef = useRef<Map<string, ScriptProcessorNode>>(new Map());
    const streamsInitializedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!room || !transcriptionSocket || !enabled) {
            return;
        }

        // Initialize AudioContext
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        }

        const audioContext = audioContextRef.current;

        const setupAudioCapture = (
            participant: RemoteParticipant,
            publication: RemoteTrackPublication
        ) => {
            if (publication.kind !== Track.Kind.Audio || !publication.track) {
                return;
            }

            const participantId = participant.identity;
            const participantName = participant.name || participant.identity;
            const streamKey = `${participantId}-${publication.trackSid}`;

            // Avoid duplicate setup
            if (streamsInitializedRef.current.has(streamKey)) {
                return;
            }

            try {
                const audioTrack = publication.track as any;
                const mediaStream = new MediaStream([audioTrack.mediaStreamTrack]);

                const source = audioContext.createMediaStreamSource(mediaStream);
                const processor = audioContext.createScriptProcessor(4096, 1, 1);

                // Initialize transcription stream for this participant
                transcriptionSocket.emit('startTranscription', {
                    roomId,
                    participantId,
                    participantName,
                    language: 'en-US', // Can be made configurable
                });

                processor.onaudioprocess = (e) => {
                    if (!enabled) return;

                    const inputData = e.inputBuffer.getChannelData(0);

                    // Convert Float32Array to Int16Array (LINEAR16 format)
                    const int16Data = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        const s = Math.max(-1, Math.min(1, inputData[i]));
                        int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
                    }

                    // Convert to base64 for transmission
                    const buffer = int16Data.buffer;
                    const base64Audio = btoa(
                        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                    );

                    // Send audio data to transcription service
                    transcriptionSocket.emit('audioData', {
                        roomId,
                        participantId,
                        participantName,
                        audioData: base64Audio,
                    });
                };

                source.connect(processor);
                processor.connect(audioContext.destination);

                processorsRef.current.set(streamKey, processor);
                streamsInitializedRef.current.add(streamKey);

            } catch (error) {
                console.error(`[AudioCapture] Error setting up audio capture:`, error);
            }
        };

        const cleanupAudioCapture = (participantId: string, trackSid: string) => {
            const streamKey = `${participantId}-${trackSid}`;
            const processor = processorsRef.current.get(streamKey);

            if (processor) {
                processor.disconnect();
                processorsRef.current.delete(streamKey);
                streamsInitializedRef.current.delete(streamKey);

                // Stop transcription for this participant
                transcriptionSocket.emit('stopTranscription', {
                    roomId,
                    participantId,
                });

            }
        };

        // Setup audio capture for existing participants
        room.remoteParticipants.forEach((participant) => {
            participant.audioTrackPublications.forEach((publication) => {
                if (publication.track) {
                    setupAudioCapture(participant, publication);
                }
            });
        });

        // Handle new participants joining
        const handleTrackSubscribed = (
            _track: any,
            publication: RemoteTrackPublication,
            participant: RemoteParticipant
        ) => {
            if (publication.kind === Track.Kind.Audio) {
                setupAudioCapture(participant, publication);
            }
        };

        // Handle participants leaving
        const handleTrackUnsubscribed = (
            _track: any,
            publication: RemoteTrackPublication,
            participant: RemoteParticipant
        ) => {
            if (publication.kind === Track.Kind.Audio) {
                cleanupAudioCapture(participant.identity, publication.trackSid);
            }
        };

        room.on('trackSubscribed', handleTrackSubscribed);
        room.on('trackUnsubscribed', handleTrackUnsubscribed);

        // Cleanup on unmount
        return () => {
            room.off('trackSubscribed', handleTrackSubscribed);
            room.off('trackUnsubscribed', handleTrackUnsubscribed);

            // Cleanup all processors
            processorsRef.current.forEach((processor, streamKey) => {
                processor.disconnect();
                const [participantId] = streamKey.split('-');
                transcriptionSocket.emit('stopTranscription', {
                    roomId,
                    participantId,
                });
            });

            processorsRef.current.clear();
            streamsInitializedRef.current.clear();

            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, [room, transcriptionSocket, roomId, enabled]);
};