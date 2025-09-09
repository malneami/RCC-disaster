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
import { WsJwtAuthGuard } from '../../auth/guards/ws-jwt-auth.guard';
import { PrismaService } from '../../database/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/ems',
})
export class EmsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EmsGateway.name);
  private connectedClients = new Map<string, { socket: Socket; userId: string; role: string }>();

  constructor(private prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connected: ${client.id}`);
      
      // Join client to general EMS room
      client.join('ems-general');
      
      // Store client info
      this.connectedClients.set(client.id, {
        socket: client,
        userId: client.handshake.auth?.userId || 'anonymous',
        role: client.handshake.auth?.role || 'guest',
      });

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to EMS real-time updates',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, (error as Error).message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('join-ambulance-room')
  async handleJoinAmbulanceRoom(
    @MessageBody() data: { ambulanceId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const roomName = `ambulance-${data.ambulanceId}`;
      await client.join(roomName);
      
      this.logger.log(`Client ${client.id} joined ambulance room: ${roomName}`);
      
      client.emit('joined-room', {
        room: roomName,
        message: `Joined ambulance ${data.ambulanceId} updates`,
      });
    } catch (error) {
      this.logger.error(`Error joining ambulance room:`, (error as Error).message);
      client.emit('error', { message: 'Failed to join ambulance room' });
    }
  }

  @SubscribeMessage('leave-ambulance-room')
  async handleLeaveAmbulanceRoom(
    @MessageBody() data: { ambulanceId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const roomName = `ambulance-${data.ambulanceId}`;
      await client.leave(roomName);
      
      this.logger.log(`Client ${client.id} left ambulance room: ${roomName}`);
      
      client.emit('left-room', {
        room: roomName,
        message: `Left ambulance ${data.ambulanceId} updates`,
      });
    } catch (error) {
      this.logger.error(`Error leaving ambulance room:`, (error as Error).message);
      client.emit('error', { message: 'Failed to leave ambulance room' });
    }
  }

  @SubscribeMessage('join-assignment-room')
  async handleJoinAssignmentRoom(
    @MessageBody() data: { assignmentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const roomName = `assignment-${data.assignmentId}`;
      await client.join(roomName);
      
      this.logger.log(`Client ${client.id} joined assignment room: ${roomName}`);
      
      client.emit('joined-room', {
        room: roomName,
        message: `Joined assignment ${data.assignmentId} updates`,
      });
    } catch (error) {
      this.logger.error(`Error joining assignment room:`, (error as Error).message);
      client.emit('error', { message: 'Failed to join assignment room' });
    }
  }

  @SubscribeMessage('get-active-ambulances')
  async handleGetActiveAmbulances(@ConnectedSocket() client: Socket) {
    try {
      const activeAmbulances = await this.prisma.ambulance.findMany({
        where: {
          status: { in: ['AVAILABLE', 'IN_USE'] },
          isActive: true,
        },
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
          gpsTrackingLogs: {
            take: 1,
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      client.emit('active-ambulances', activeAmbulances);
    } catch (error) {
      this.logger.error(`Error getting active ambulances:`, (error as Error).message);
      client.emit('error', { message: 'Failed to get active ambulances' });
    }
  }

  @SubscribeMessage('get-active-assignments')
  async handleGetActiveAssignments(@ConnectedSocket() client: Socket) {
    try {
      const activeAssignments = await this.prisma.eMSAssignment.findMany({
        where: {
          status: {
            in: ['EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED'],
          },
          deletedAt: null,
        },
        include: {
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              priority: true,
              status: true,
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          ambulance: {
            select: {
              id: true,
              callSign: true,
              plateNumber: true,
              type: true,
              status: true,
              currentLocationLat: true,
              currentLocationLng: true,
            },
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      });

      client.emit('active-assignments', activeAssignments);
    } catch (error) {
      this.logger.error(`Error getting active assignments:`, (error as Error).message);
      client.emit('error', { message: 'Failed to get active assignments' });
    }
  }

  // Broadcast methods for real-time updates
  async broadcastAmbulanceLocationUpdate(ambulanceId: string, locationData: any) {
    const roomName = `ambulance-${ambulanceId}`;
    this.server.to(roomName).emit('ambulance-location-update', {
      ambulanceId,
      location: locationData,
      timestamp: new Date().toISOString(),
    });

    // Also broadcast to general EMS room
    this.server.to('ems-general').emit('ambulance-location-update', {
      ambulanceId,
      location: locationData,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastAssignmentStatusUpdate(assignmentId: string, statusData: any) {
    const roomName = `assignment-${assignmentId}`;
    this.server.to(roomName).emit('assignment-status-update', {
      assignmentId,
      status: statusData,
      timestamp: new Date().toISOString(),
    });

    // Also broadcast to general EMS room
    this.server.to('ems-general').emit('assignment-status-update', {
      assignmentId,
      status: statusData,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastNewAlert(alertData: any) {
    this.server.to('ems-general').emit('new-alert', {
      alert: alertData,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastAlertUpdate(alertId: string, updateData: any) {
    this.server.to('ems-general').emit('alert-update', {
      alertId,
      update: updateData,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastAmbulanceStatusUpdate(ambulanceId: string, statusData: any) {
    const roomName = `ambulance-${ambulanceId}`;
    this.server.to(roomName).emit('ambulance-status-update', {
      ambulanceId,
      status: statusData,
      timestamp: new Date().toISOString(),
    });

    // Also broadcast to general EMS room
    this.server.to('ems-general').emit('ambulance-status-update', {
      ambulanceId,
      status: statusData,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastDriverScheduleUpdate(driverId: string, scheduleData: any) {
    this.server.to('ems-general').emit('driver-schedule-update', {
      driverId,
      schedule: scheduleData,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastMaintenanceUpdate(ambulanceId: string, maintenanceData: any) {
    const roomName = `ambulance-${ambulanceId}`;
    this.server.to(roomName).emit('maintenance-update', {
      ambulanceId,
      maintenance: maintenanceData,
      timestamp: new Date().toISOString(),
    });

    // Also broadcast to general EMS room
    this.server.to('ems-general').emit('maintenance-update', {
      ambulanceId,
      maintenance: maintenanceData,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastPerformanceUpdate(ambulanceId: string, performanceData: any) {
    const roomName = `ambulance-${ambulanceId}`;
    this.server.to(roomName).emit('performance-update', {
      ambulanceId,
      performance: performanceData,
      timestamp: new Date().toISOString(),
    });
  }

  // Get connected clients info
  getConnectedClients() {
    return Array.from(this.connectedClients.values()).map(client => ({
      clientId: client.socket.id,
      userId: client.userId,
      role: client.role,
    }));
  }

  // Get clients in specific room
  getClientsInRoom(roomName: string) {
    const room = this.server.sockets.adapter.rooms.get(roomName);
    if (!room) return [];

    return Array.from(room).map(clientId => {
      const client = this.connectedClients.get(clientId);
      return client ? {
        clientId,
        userId: client.userId,
        role: client.role,
      } : null;
    }).filter(Boolean);
  }
}
