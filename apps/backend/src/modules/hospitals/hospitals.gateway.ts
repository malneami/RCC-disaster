import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { WsJwtAuthGuard } from '../../auth/guards/ws-jwt-auth.guard';

@WebSocketGateway({
  namespace: '/hospitals',
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow connections with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }
      // Allow localhost with any port for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
        return;
      }
      // Allow configured frontend URL
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  },
})
@UseGuards(WsJwtAuthGuard)
export class HospitalsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(HospitalsGateway.name);
  private connectedClients = new Map<string, { socket: Socket; userId: string; role: string }>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`🔌 [HospitalsGateway] Client attempting connection: ${client.id}`);

      // Manually verify JWT token since guards don't run for handleConnection
      const token = client.handshake.auth?.token || client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`⚠️ [HospitalsGateway] Connection attempt without token: ${client.id}`);
        client.disconnect();
        return;
      }

      let user;
      try {
        user = this.jwtService.verify(token);
        // Store verified user in handshake.auth for use in SubscribeMessage handlers
        client.handshake.auth.user = user;
      } catch (error) {
        this.logger.warn(`❌ [HospitalsGateway] Invalid token for client ${client.id}: ${error instanceof Error ? error.message : String(error)}`);
        client.disconnect();
        return;
      }

      if (!user || !user.id) {
        this.logger.warn(`⚠️ [HospitalsGateway] Invalid user data in token: ${client.id}`);
        client.disconnect();
        return;
      }

      this.connectedClients.set(client.id, { socket: client, userId: user.id, role: user.role });
      this.logger.log(`✅ [HospitalsGateway] Client connected: ${client.id} - User: ${user.email} (${user.role})`);

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to hospitals gateway',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`❌ [HospitalsGateway] Error handling connection: ${error instanceof Error ? error.message : String(error)}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const clientData = this.connectedClients.get(client.id);
    if (clientData) {
      this.logger.log(`🔌 [HospitalsGateway] Client disconnected: ${client.id} - User: ${clientData.userId}`);
    }
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('join-hospital-room')
  async handleJoinHospitalRoom(
    @MessageBody() data: { hospitalId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { hospitalId } = data;
    await client.join(`hospital-${hospitalId}`);
    return { event: 'joined-hospital-room', hospitalId };
  }

  @SubscribeMessage('leave-hospital-room')
  async handleLeaveHospitalRoom(
    @MessageBody() data: { hospitalId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { hospitalId } = data;
    await client.leave(`hospital-${hospitalId}`);
    return { event: 'left-hospital-room', hospitalId };
  }

  @SubscribeMessage('subscribe-to-alerts')
  async handleSubscribeToAlerts(@ConnectedSocket() client: Socket) {
    await client.join('capacity-alerts');
    return { event: 'subscribed-to-alerts' };
  }

  @SubscribeMessage('unsubscribe-from-alerts')
  async handleUnsubscribeFromAlerts(@ConnectedSocket() client: Socket) {
    await client.leave('capacity-alerts');
    return { event: 'unsubscribed-from-alerts' };
  }

  // Methods to emit events to connected clients
  emitCapacityUpdate(hospitalId: string, capacityData: any) {
    this.server.to(`hospital-${hospitalId}`).emit('capacity-updated', {
      hospitalId,
      capacity: capacityData,
      timestamp: new Date(),
    });
  }

  emitCapacityAlert(alert: any) {
    this.server.to('capacity-alerts').emit('capacity-alert', {
      ...alert,
      timestamp: new Date(),
    });
  }

  emitHospitalStatusChange(hospitalId: string, status: string) {
    this.server.to(`hospital-${hospitalId}`).emit('status-changed', {
      hospitalId,
      status,
      timestamp: new Date(),
    });
  }
}
