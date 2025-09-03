import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../../auth/guards/ws-jwt-auth.guard';
import { TicketStatus, UserRole } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(WsJwtAuthGuard)
export class TicketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedClients = new Map<string, { socket: Socket; user: any }>();

  handleConnection(client: Socket) {
    const user = client.handshake.auth.user;
    if (user) {
      this.connectedClients.set(client.id, { socket: client, user });
      console.log(`Client connected: ${client.id} - User: ${user.email}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
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
    
    // Send notification to assigned user
    this.server.to(`assigned-${ticket.assignedToId}`).emit('ticketAssigned', {
      ticket,
      assignedTo,
      timestamp: new Date(),
    });
  }

  // Emit emergency ticket alert
  emitEmergencyTicket(ticket: any) {
    // Emit to all connected clients for emergency tickets
    this.server.emit('emergencyTicket', {
      ticket,
      timestamp: new Date(),
    });
  }
}
