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
import { PrismaService } from '../../database/prisma.service';

@WebSocketGateway({
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
  namespace: '/notifications',
})
@UseGuards(WsJwtAuthGuard)
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedClients = new Map<string, { socket: Socket; userId: string; role: string }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`🔌 [NotificationsGateway] Client attempting connection: ${client.id}`);

      // Manually verify JWT token since guards don't run for handleConnection
      const token = client.handshake.auth?.token || client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`⚠️ [NotificationsGateway] Connection attempt without token: ${client.id}`);
        client.disconnect();
        return;
      }

      let user;
      try {
        user = this.jwtService.verify(token);
        // Store verified user in handshake.auth for use in SubscribeMessage handlers
        client.handshake.auth.user = user;
      } catch (error) {
        this.logger.warn(`❌ [NotificationsGateway] Invalid token for client ${client.id}: ${error instanceof Error ? error.message : String(error)}`);
        client.disconnect();
        return;
      }

      if (!user || !user.id) {
        this.logger.warn(`⚠️ [NotificationsGateway] Invalid user data in token: ${client.id}`);
        client.disconnect();
        return;
      }

      this.connectedClients.set(client.id, { socket: client, userId: user.id, role: user.role });
      this.logger.log(`✅ [NotificationsGateway] Client connected: ${client.id} - User: ${user.email} (${user.role})`);

      // Join user-specific room for targeted notifications
      await client.join(`user-${user.id}`);

      // Join role-specific rooms
      await client.join(`role-${user.role}`);

      // Join hospital-specific room if user has hospital
      if (user.hospitalId) {
        await client.join(`hospital-${user.hospitalId}`);
      }

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to notifications',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`❌ [NotificationsGateway] Error handling connection: ${error instanceof Error ? error.message : String(error)}`);
      client.disconnect();
    }
  }


  async handleDisconnect(client: Socket) {
    const clientData = this.connectedClients.get(client.id);
    if (clientData) {
      this.logger.log(`🔌 [NotificationsGateway] Client disconnected: ${client.id} - User: ${clientData.userId}`);
      this.connectedClients.delete(client.id);
    } else {
      this.logger.log(`🔌 [NotificationsGateway] Client disconnected: ${client.id} (no user data)`);
    }
  }

  @SubscribeMessage('join-notification-room')
  async handleJoinNotificationRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { room } = data;
    await client.join(room);
    this.logger.log(`Client ${client.id} joined notification room: ${room}`);
    return { event: 'joined-notification-room', room };
  }

  @SubscribeMessage('leave-notification-room')
  async handleLeaveNotificationRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { room } = data;
    await client.leave(room);
    this.logger.log(`Client ${client.id} left notification room: ${room}`);
    return { event: 'left-notification-room', room };
  }

  @SubscribeMessage('subscribe-to-case-notes')
  async handleSubscribeToCaseNotes(
    @MessageBody() data: { caseType: string; caseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { caseType, caseId } = data;
    const room = `case-${caseType}-${caseId}`;
    await client.join(room);
    this.logger.log(`Client ${client.id} subscribed to case notes: ${room}`);
    return { event: 'subscribed-to-case-notes', room };
  }

  @SubscribeMessage('unsubscribe-from-case-notes')
  async handleUnsubscribeFromCaseNotes(
    @MessageBody() data: { caseType: string; caseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { caseType, caseId } = data;
    const room = `case-${caseType}-${caseId}`;
    await client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from case notes: ${room}`);
    return { event: 'unsubscribed-from-case-notes', room };
  }

  // Methods to emit events to connected clients
  emitCaseNoteCreated(caseNote: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping case note emission');
      return;
    }

    // Emit to case-specific room
    const caseRoom = `case-${caseNote.caseType}-${caseNote.caseId}`;
    this.server.to(caseRoom).emit('case-note-created', {
      caseNote,
      timestamp: new Date().toISOString(),
    });

    // Emit to all recipients
    if (caseNote.recipients && caseNote.recipients.length > 0) {
      caseNote.recipients.forEach((recipient: any) => {
        this.server.to(`user-${recipient.userId}`).emit('case-note-created', {
          caseNote,
          timestamp: new Date().toISOString(),
        });
      });
    }

    this.logger.log(`Emitted case note created event for case ${caseNote.caseId}`);
  }

  emitNotificationCreated(notification: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping notification emission');
      return;
    }

    // Emit to all recipients
    if (notification.recipients && notification.recipients.length > 0) {
      notification.recipients.forEach((recipient: any) => {
        this.server.to(`user-${recipient.userId}`).emit('notification-created', {
          notification,
          timestamp: new Date().toISOString(),
        });
      });
    }

    // Emit to role-specific rooms based on notification type
    if (notification.type === 'CASE_COMMENT') {
      this.server.to('role-RCC').emit('notification-created', {
        notification,
        timestamp: new Date().toISOString(),
      });
      this.server.to('role-ADMIN').emit('notification-created', {
        notification,
        timestamp: new Date().toISOString(),
      });
    }

    this.logger.log(`Emitted notification created event: ${notification.id}`);
  }

  emitCaseNoteUpdated(caseNote: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping case note update emission');
      return;
    }

    // Emit to case-specific room
    const caseRoom = `case-${caseNote.caseType}-${caseNote.caseId}`;
    this.server.to(caseRoom).emit('case-note-updated', {
      caseNote,
      timestamp: new Date().toISOString(),
    });

    // Emit to all recipients
    if (caseNote.recipients && caseNote.recipients.length > 0) {
      caseNote.recipients.forEach((recipient: any) => {
        this.server.to(`user-${recipient.userId}`).emit('case-note-updated', {
          caseNote,
          timestamp: new Date().toISOString(),
        });
      });
    }

    this.logger.log(`Emitted case note updated event for case ${caseNote.caseId}`);
  }

  emitCaseNoteDeleted(caseNoteId: string, caseType: string, caseId: string) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping case note deletion emission');
      return;
    }

    // Emit to case-specific room
    const caseRoom = `case-${caseType}-${caseId}`;
    this.server.to(caseRoom).emit('case-note-deleted', {
      caseNoteId,
      caseType,
      caseId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Emitted case note deleted event for case ${caseId}`);
  }

  // Broadcast to all connected clients (for system-wide notifications)
  broadcastSystemNotification(notification: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized, skipping system notification broadcast');
      return;
    }

    this.server.emit('system-notification', {
      notification,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Broadcasted system notification: ${notification.id}`);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get connected clients by role
  getConnectedClientsByRole(role: string): number {
    return Array.from(this.connectedClients.values()).filter(client => client.role === role).length;
  }
}
