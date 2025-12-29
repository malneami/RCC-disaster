import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsJwtAuthGuard } from '../../auth/guards/ws-jwt-auth.guard';
import { TicketStatus, UserRole } from '@prisma/client';

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
})
@UseGuards(WsJwtAuthGuard)
export class TicketsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TicketsGateway.name);
  private connectedClients = new Map<string, { socket: Socket; user: any }>();

  constructor(private jwtService: JwtService) {
    this.logger.log('🎯 [TicketsGateway] Gateway constructor called');
  }

  afterInit(server: Server) {
    this.logger.log('✅ [TicketsGateway] WebSocket Gateway initialized successfully');
    this.logger.log(`📡 [TicketsGateway] Server instance: ${server ? 'exists' : 'null'}`);
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`🔌 [TicketsGateway] Client attempting connection: ${client.id}`);

      // Manually verify JWT token since guards don't run for handleConnection
      const token = client.handshake.auth?.token || client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`⚠️ [TicketsGateway] Connection attempt without token: ${client.id}`);
        client.disconnect();
        return;
      }

      let user;
      try {
        user = this.jwtService.verify(token);
        // Store verified user in handshake.auth for use in SubscribeMessage handlers
        client.handshake.auth.user = user;
      } catch (error) {
        this.logger.warn(`❌ [TicketsGateway] Invalid token for client ${client.id}: ${error instanceof Error ? error.message : String(error)}`);
        client.disconnect();
        return;
      }

      if (!user || !user.id) {
        this.logger.warn(`⚠️ [TicketsGateway] Invalid user data in token: ${client.id}`);
        client.disconnect();
        return;
      }

      this.connectedClients.set(client.id, { socket: client, user });
      this.logger.log(`✅ [TicketsGateway] Client connected: ${client.id} - User: ${user.email}`);

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to tickets gateway',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`❌ [TicketsGateway] Error handling connection: ${error instanceof Error ? error.message : String(error)}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const clientData = this.connectedClients.get(client.id);
    if (clientData) {
      this.logger.log(`🔌 [TicketsGateway] Client disconnected: ${client.id} - User: ${clientData.user?.email || 'unknown'}`);
    }
    this.connectedClients.delete(client.id);
  }

  // Subscribe to ticket updates
  @SubscribeMessage('subscribeToTicket')
  handleSubscribeToTicket(client: Socket, ticketId: string) {
    client.join(`ticket-${ticketId}`);
    console.log(`Client ${client.id} subscribed to ticket ${ticketId}`);
  }

  // Subscribe to hospital tickets
  @SubscribeMessage('subscribeToHospitalTickets')
  handleSubscribeToHospitalTickets(client: Socket, hospitalId: string) {
    client.join(`hospital-${hospitalId}`);
    console.log(`Client ${client.id} subscribed to hospital ${hospitalId}`);
  }

  // Subscribe to user's assigned tickets
  @SubscribeMessage('subscribeToAssignedTickets')
  handleSubscribeToAssignedTickets(client: Socket) {
    const user = client.handshake.auth.user;
    if (user) {
      client.join(`assigned-${user.id}`);
      console.log(`Client ${client.id} subscribed to assigned tickets for user ${user.id}`);
    }
  }

  // Emit ticket updates to relevant clients
  emitTicketUpdate(ticket: any, action: string) {
    // Check if server is initialized
    if (!this.server) {
      console.warn('WebSocket server not initialized, skipping ticket update emission');
      return;
    }

    // Emit to ticket-specific room
    this.server.to(`ticket-${ticket.id}`).emit('ticketUpdated', {
      ticket,
      action,
      timestamp: new Date(),
    });

    // Emit to origin hospital room
    this.server.to(`hospital-${ticket.originHospitalId}`).emit('ticketUpdated', {
      ticket,
      action,
      timestamp: new Date(),
    });

    // Emit to destination hospital room (if exists)
    if (ticket.destinationHospitalId) {
      this.server.to(`hospital-${ticket.destinationHospitalId}`).emit('ticketUpdated', {
        ticket,
        action,
        timestamp: new Date(),
      });
    }

    // Emit to assigned user room
    if (ticket.assignedToId) {
      this.server.to(`assigned-${ticket.assignedToId}`).emit('ticketUpdated', {
        ticket,
        action,
        timestamp: new Date(),
      });
    }

    // Emit to all RCC and ADMIN users
    this.connectedClients.forEach(({ socket, user }) => {
      if ([UserRole.RCC, UserRole.ADMIN].includes(user.role)) {
        socket.emit('ticketUpdated', {
          ticket,
          action,
          timestamp: new Date(),
        });
      }
    });
  }

  // Emit ticket creation
  emitTicketCreated(ticket: any) {
    this.emitTicketUpdate(ticket, 'created');
  }

  // Emit ticket status change
  emitTicketStatusChanged(ticket: any, previousStatus: TicketStatus) {
    this.emitTicketUpdate(ticket, 'statusChanged');
    
    // Check if server is initialized
    if (!this.server) {
      console.warn('WebSocket server not initialized, skipping status change emission');
      return;
    }
    
    // Send notification for critical status changes
    if (ticket.status === TicketStatus.IN_TRANSPORT) {
      this.server.to(`hospital-${ticket.destinationHospitalId}`).emit('transportStarted', {
        ticket,
        timestamp: new Date(),
      });
    }

    if (ticket.status === TicketStatus.COMPLETED) {
      this.server.to(`hospital-${ticket.originHospitalId}`).emit('transportCompleted', {
        ticket,
        timestamp: new Date(),
      });
    }
  }

  // Emit ticket assignment
  emitTicketAssigned(ticket: any, assignedTo: any) {
    this.emitTicketUpdate(ticket, 'assigned');
    
    // Check if server is initialized
    if (!this.server) {
      console.warn('WebSocket server not initialized, skipping assignment emission');
      return;
    }
    
    // Send notification to assigned user
    this.server.to(`assigned-${ticket.assignedToId}`).emit('ticketAssigned', {
      ticket,
      assignedTo,
      timestamp: new Date(),
    });
  }

  // Emit emergency ticket alert
  emitEmergencyTicket(ticket: any) {
    // Check if server is initialized
    if (!this.server) {
      console.warn('WebSocket server not initialized, skipping emergency ticket emission');
      return;
    }
    
    // Emit to all connected clients for emergency tickets
    this.server.emit('emergencyTicket', {
      ticket,
      timestamp: new Date(),
    });
  }
}
