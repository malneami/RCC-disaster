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

@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
        return;
      }
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  },
  namespace: '/disasters',
})
@UseGuards(WsJwtAuthGuard)
export class DisasterGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(DisasterGateway.name);

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const user = this.jwtService.verify(token);
      client.handshake.auth.user = user;
      this.logger.log(`[DisasterGateway] Client connected: ${client.id} - User: ${user.email}`);
    } catch (error) {
      this.logger.warn(`[DisasterGateway] Connection failed: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[DisasterGateway] Client disconnected: ${client.id}`);
  }

  broadcastIncidentCreated(incident: any) {
    this.server?.emit('incident-created', incident);
  }

  broadcastIncidentUpdated(incident: any) {
    this.server?.emit('incident-updated', incident);
  }

  broadcastIncidentResolved(incident: any) {
    this.server?.emit('incident-resolved', incident);
  }

  broadcastAmbulanceAssigned(data: any) {
    this.server?.emit('ambulance-assigned', data);
  }

  broadcastAnnouncement(announcement: any) {
    this.server?.emit('announcement', announcement);
  }

  broadcastMessageCreated(message: any) {
    this.server?.emit('message-created', message);
  }

  @SubscribeMessage('join-incident-room')
  async handleJoinIncidentRoom(
    @MessageBody() data: { incidentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { incidentId } = data || {};
    if (!incidentId) return { event: 'error', message: 'incidentId required' };
    await client.join(`incident:${incidentId}`);
    return { event: 'joined-incident-room', incidentId };
  }

  @SubscribeMessage('leave-incident-room')
  async handleLeaveIncidentRoom(
    @MessageBody() data: { incidentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { incidentId } = data || {};
    if (!incidentId) return { event: 'error', message: 'incidentId required' };
    await client.leave(`incident:${incidentId}`);
    return { event: 'left-incident-room', incidentId };
  }

  broadcastCommandRoomUpdated(incidentId: string, payload: any) {
    const data = { incidentId, ...payload };
    this.server?.to(`incident:${incidentId}`).emit('command-room-updated', data);
  }

  broadcastSituationalAwarenessUpdated(incidentId: string) {
    this.server?.to(`incident:${incidentId}`).emit('situational-awareness-updated', { incidentId });
  }
}
