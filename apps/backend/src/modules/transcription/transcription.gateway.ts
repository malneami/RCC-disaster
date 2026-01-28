import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsJwtAuthGuard } from '../../auth/guards/ws-jwt-auth.guard';
import { TranscriptionService } from './transcription.service';

interface TranscriptionSegment {
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

@WebSocketGateway({
    cors: {
        origin: true,
        credentials: true,
    },
    namespace: '/transcription',
})
@UseGuards(WsJwtAuthGuard)
export class TranscriptionGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(TranscriptionGateway.name);
    private connectedClients = new Map<string, { socket: Socket; userId: string; roomId?: string }>();
    private roomTranscriptions = new Map<string, TranscriptionSegment[]>();

    constructor(
        private transcriptionService: TranscriptionService,
        private jwtService: JwtService,
    ) { }

    async handleConnection(client: Socket) {
        try {

            const token = client.handshake.auth?.token || client.handshake.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                this.logger.warn(`Connection attempt without token: ${client.id}`);
                client.disconnect();
                return;
            }

            let user;
            try {
                user = this.jwtService.verify(token);
                client.handshake.auth.user = user;
            } catch (error) {
                client.disconnect()
                return;
            }

            const userId = user.id || user.sub;
            if (!userId) {
                client.disconnect();
                return;
            }

            this.connectedClients.set(client.id, {
                socket: client,
                userId: userId,
            });

            client.emit('connected', { socketId: client.id, userId });
        } catch (error) {
            this.logger.error(`Error handling connection: ${error instanceof Error ? error.message : String(error)}`);
            client.disconnect();
        }
    }

    async handleDisconnect(client: Socket) {
        const clientData = this.connectedClients.get(client.id);
        if (clientData) {

            // Leave room if in one
            if (clientData.roomId) {
                client.leave(clientData.roomId);
            }

            this.connectedClients.delete(client.id);
        }
    }

    @SubscribeMessage('joinTranscriptionRoom')
    async handleJoinRoom(
        @MessageBody() data: { roomId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const clientData = this.connectedClients.get(client.id);
            if (!clientData) {
                return { success: false, error: 'Not authenticated' };
            }

            const { roomId } = data;

            // Leave previous room if any
            if (clientData.roomId) {
                client.leave(clientData.roomId);
            }

            // Join new room
            await client.join(roomId);
            clientData.roomId = roomId;

            // Send existing transcriptions for this room
            const existingTranscriptions = this.roomTranscriptions.get(roomId) || [];
            client.emit('transcriptionHistory', {
                roomId,
                transcriptions: existingTranscriptions,
            });

            return { success: true, roomId };
        } catch (error) {
            this.logger.error(`Error joining transcription room: ${error instanceof Error ? error.message : String(error)}`);
            return { success: false, error: 'Failed to join room' };
        }
    }

    @SubscribeMessage('leaveTranscriptionRoom')
    async handleLeaveRoom(
        @MessageBody() data: { roomId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const clientData = this.connectedClients.get(client.id);
            if (!clientData) {
                return { success: false, error: 'Not authenticated' };
            }

            client.leave(data.roomId);
            if (clientData.roomId === data.roomId) {
                clientData.roomId = undefined;
            }

            return { success: true };
        } catch (error) {
            this.logger.error(`Error leaving transcription room: ${error instanceof Error ? error.message : String(error)}`);
            return { success: false, error: 'Failed to leave room' };
        }
    }

    @SubscribeMessage('startTranscription')
    async handleStartTranscription(
        @MessageBody() data: { roomId: string; participantId: string; participantName: string; language?: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const clientData = this.connectedClients.get(client.id);
            if (!clientData) {
                return { success: false, error: 'Not authenticated' };
            }


            await this.transcriptionService.initializeStream(
                data.roomId,
                data.participantId,
                data.language || 'en-US',
            );

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Failed to start transcription' };
        }
    }

    @SubscribeMessage('audioData')
    async handleAudioData(
        @MessageBody() data: { roomId: string; participantId: string; participantName: string; audioData: ArrayBuffer | string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const transcriptionResult = await this.transcriptionService.processAudioChunk(
                data.roomId,
                data.participantId,
                data.audioData,
            );

            if (transcriptionResult && transcriptionResult.text) {
                const segment: TranscriptionSegment = {
                    id: `${data.roomId}-${Date.now()}-${Math.random()}`,
                    roomId: data.roomId,
                    participantId: data.participantId,
                    participantName: data.participantName,
                    text: transcriptionResult.text,
                    timestamp: Date.now(),
                    isFinal: transcriptionResult.isFinal || false,
                    language: transcriptionResult.language,
                    confidence: transcriptionResult.confidence,
                };

                if (!this.roomTranscriptions.has(data.roomId)) {
                    this.roomTranscriptions.set(data.roomId, []);
                }
                this.roomTranscriptions.get(data.roomId)!.push(segment);

                try {
                    this.transcriptionService.saveLiveTranscriptionSegment({
                        roomId: data.roomId,
                        participantId: data.participantId,
                        participantName: data.participantName,
                        text: transcriptionResult.text,
                        isFinal: transcriptionResult.isFinal || false,
                        confidence: transcriptionResult.confidence,
                        language: transcriptionResult.language,
                    }).catch((err) => {
                        this.logger.error(
                            `Failed to persist live transcription segment for room ${data.roomId}`,
                            err instanceof Error ? err.message : String(err),
                        );
                    });
                } catch (err) {
                    this.logger.error(
                        `Unexpected error while persisting live transcription segment for room ${data.roomId}`,
                        err instanceof Error ? err.message : String(err),
                    );
                }

                this.server.to(data.roomId).emit('newTranscription', segment);
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Failed to process audio' };
        }
    }

    @SubscribeMessage('stopTranscription')
    async handleStopTranscription(
        @MessageBody() data: { roomId: string; participantId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            await this.transcriptionService.closeStream(data.roomId, data.participantId);
            return { success: true };
        } catch (error) {
            this.logger.error(`Error stopping transcription: ${error instanceof Error ? error.message : String(error)}`);
            return { success: false, error: 'Failed to stop transcription' };
        }
    }

    @SubscribeMessage('clearTranscriptions')
    async handleClearTranscriptions(
        @MessageBody() data: { roomId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            this.roomTranscriptions.delete(data.roomId);
            this.server.to(data.roomId).emit('transcriptionsCleared', { roomId: data.roomId });
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Failed to clear transcriptions' };
        }
    }

    getTranscriptionHistory(roomId: string): TranscriptionSegment[] {
        return this.roomTranscriptions.get(roomId) || [];
    }
}