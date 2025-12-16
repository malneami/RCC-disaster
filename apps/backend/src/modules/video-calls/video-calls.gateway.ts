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
import { VideoCallsService } from './video-calls.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/video-calls',
})
@UseGuards(WsJwtAuthGuard)
export class VideoCallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(VideoCallsGateway.name);
  private connectedClients = new Map<string, { socket: Socket; userId: string; userInfo: any }>();
  private userIdToSocketId = new Map<string, string>();
  private emailToSocketId = new Map<string, string>();
  // Room management
  private rooms = new Map<string, Set<string>>(); // roomId -> Set of socketIds
  private socketToRoom = new Map<string, string>(); // socketId -> roomId

  constructor(
    private videoCallsService: VideoCallsService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`🔌 [VideoCallsGateway] Client attempting connection: ${client.id}`);
      this.logger.debug(`Connection handshake:`, {
        id: client.id,
        query: client.handshake.query,
        auth: client.handshake.auth,
        headers: {
          origin: client.handshake.headers.origin,
          referer: client.handshake.headers.referer,
        },
      });

      // Manually verify JWT token since guards don't run for handleConnection
      const token = client.handshake.auth?.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Connection attempt without authentication token: ${client.id}`);
        client.disconnect();
        return;
      }

      let user;
      try {
        // Verify and decode the JWT token
        user = this.jwtService.verify(token);
        // Store user in handshake.auth for use in message handlers
        client.handshake.auth.user = user;
        this.logger.debug(`JWT token verified successfully for user: ${user.email || user.sub}`);
      } catch (error) {
        this.logger.warn(`Invalid authentication token for client ${client.id}: ${error instanceof Error ? error.message : String(error)}`);
        client.disconnect();
        return;
      }

      if (!user || (!user.id && !user.sub)) {
        this.logger.warn(`Connection attempt with invalid user data: ${client.id}`, user);
        client.disconnect();
        return;
      }

      // Use user.id or user.sub (JWT standard uses 'sub' for subject/user ID)
      const userId = user.id || user.sub;
      if (!userId) {
        this.logger.warn(`No user ID found in token payload: ${client.id}`);
        client.disconnect();
        return;
      }

      // Get user information from database
      const userInfo = await this.videoCallsService.getUserInfo(userId);
      const displayName = userInfo
        ? this.videoCallsService.getUserDisplayName(userInfo)
        : user.email || 'Unknown User';

      // Store client info (matching NotificationsGateway and TicketsGateway pattern)
      this.connectedClients.set(client.id, {
        socket: client,
        userId: userId,
        userInfo: { ...userInfo, displayName },
      });
      
      // Map userId and email to socketId for easy lookup
      this.userIdToSocketId.set(userId, client.id);
      if (user.email) {
        this.emailToSocketId.set(user.email.toLowerCase(), client.id);
      }

      this.logger.log(`Video calls client connected: ${client.id} - User: ${user.email || userId}`);

      // Send connection info to client
      client.emit('me', {
        socketId: client.id,
        userId: userId,
        userInfo: this.connectedClients.get(client.id)?.userInfo,
      });
    } catch (error) {
      this.logger.error(`Error handling connection: ${error instanceof Error ? error.message : String(error)}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const clientData = this.connectedClients.get(client.id);
    if (clientData) {
      this.logger.log(`Client disconnected: ${client.id} - User: ${clientData.userId}`);

      // Leave room if in one
      const roomId = this.socketToRoom.get(client.id);
      if (roomId) {
        this.leaveRoom(client.id, roomId);
      }

      // Notify all other clients that this user has disconnected (like working prototype)
      client.broadcast.emit('callEnded', {
        from: client.id,
        userId: clientData.userId,
      });

      // Clean up mappings
      this.connectedClients.delete(client.id);
      if (clientData.userId && clientData.userId !== 'anonymous') {
        this.userIdToSocketId.delete(clientData.userId);
      }
      const userInfo = clientData.userInfo;
      if (userInfo?.email) {
        this.emailToSocketId.delete(userInfo.email.toLowerCase());
      }
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('callUser')
  async handleCallUser(
    @MessageBody() data: { 
      userToCall?: string; 
      userIdToCall?: string; 
      emailToCall?: string; 
      signalData: any; 
      from: string; 
      name: string;
      callId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        this.logger.warn(`Call attempt from unauthenticated client: ${client.id}`);
        client.emit('callError', { error: 'Not authenticated' });
        return { success: false, error: 'Not authenticated' };
      }

      let targetSocketId = data.userToCall || '';
      
      if (data.emailToCall) {
        targetSocketId = this.emailToSocketId.get(data.emailToCall.toLowerCase()) || '';
        if (!targetSocketId) {
          this.logger.warn(`User with email ${data.emailToCall} is not online`);
          client.emit('callError', { error: 'User is not online' });
          return { success: false, error: 'User is not online' };
        }
      } else if (data.userIdToCall) {
        targetSocketId = this.userIdToSocketId.get(data.userIdToCall) || '';
        if (!targetSocketId) {
          this.logger.warn(`User ${data.userIdToCall} is not online`);
          client.emit('callError', { error: 'User is not online' });
          return { success: false, error: 'User is not online' };
        }
      }

      if (!targetSocketId) {
        this.logger.warn(`No target specified for call from ${client.id}`);
        client.emit('callError', { error: 'No target user specified' });
        return { success: false, error: 'No target user specified' };
      }

      this.logger.log(`User ${clientData.userId} calling ${targetSocketId}${data.callId ? ` (callId: ${data.callId})` : ''}`);

      this.server.to(targetSocketId).emit('callUser', {
        signal: data.signalData,
        from: data.from,
        name: data.name,
        callerInfo: clientData.userInfo,
        callId: data.callId,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error handling callUser: ${error instanceof Error ? error.message : String(error)}`);
      client.emit('callError', { error: 'Failed to initiate call' });
      return { success: false, error: 'Failed to initiate call' };
    }
  }

  @SubscribeMessage('answerCall')
  async handleAnswerCall(
    @MessageBody() data: { signal: any; to: string; name: string; callId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        this.logger.warn(`Answer attempt from unauthenticated client: ${client.id}`);
        return { success: false, error: 'Not authenticated' };
      }

      this.logger.log(`User ${clientData.userId} answering call from ${data.to}`);
      this.logger.log(`Caller socket ID: ${data.to}, Answerer socket ID: ${client.id}`);
      
      // Verify caller socket exists
      const callerSocket = this.connectedClients.get(data.to);
      if (!callerSocket) {
        this.logger.error(`Caller socket ${data.to} not found in connected clients`);
        this.logger.log(`Available socket IDs: ${Array.from(this.connectedClients.keys()).join(', ')}`);
        client.emit('callError', { error: 'Caller is no longer connected', callId: data.callId });
        return { success: false, error: 'Caller is no longer connected' };
      }
      this.logger.log(`Caller socket found: ${data.to}, User: ${callerSocket.userId}`);

      // Create a room for this call
      const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Add both caller and answerer to the room
      this.logger.log(`Adding answerer ${client.id} to room ${roomId}`);
      await this.joinRoom(client.id, roomId); // Answerer
      
      this.logger.log(`Adding caller ${data.to} to room ${roomId}`);
      await this.joinRoom(data.to, roomId); // Caller

      // Get all participants in the room
      const participants = this.getRoomParticipants(roomId);
      this.logger.log(`Room ${roomId} created with ${participants.length} participants:`, participants.map(p => ({ socketId: p.socketId, userId: p.userId })));

      // Notify caller that call was accepted and they're in a room
      this.logger.log(`Sending callAccepted to caller socket: ${data.to}`);
      this.server.to(data.to).emit('callAccepted', {
        signal: data.signal,
        name: data.name,
        answererInfo: clientData.userInfo,
        answererSocketId: client.id, // Include answerer's socketId
        roomId: roomId,
        callId: data.callId,
      });

      // Notify answerer that they're in a room
      this.logger.log(`Sending joinedRoom to answerer socket: ${client.id}`);
      client.emit('joinedRoom', {
        roomId: roomId,
        participants: participants,
        callId: data.callId,
      });

      // Notify caller that they're in a room
      this.logger.log(`Sending joinedRoom to caller socket: ${data.to}`);
      this.server.to(data.to).emit('joinedRoom', {
        roomId: roomId,
        participants: participants,
        callId: data.callId,
      });

      return { success: true, roomId };
    } catch (error) {
      this.logger.error(`Error handling answerCall: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, error: 'Failed to answer call' };
    }
  }

  @SubscribeMessage('endCall')
  async handleEndCall(
    @MessageBody() data: { from: string; callId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        this.logger.warn(`End call attempt from unauthenticated client: ${client.id}`);
        return { success: false, error: 'Not authenticated' };
      }

      this.logger.log(`User ${clientData.userId} ending call`);

      // Leave room if in one
      const roomId = this.socketToRoom.get(client.id);
      if (roomId) {
        this.leaveRoom(client.id, roomId);
      }

      client.broadcast.emit('callEnded', {
        from: data.from,
        userId: clientData.userId,
        callId: data.callId,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error handling endCall: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, error: 'Failed to end call' };
    }
  }

  @SubscribeMessage('mediaStateChange')
  async handleMediaStateChange(
    @MessageBody() data: { from: string; video: boolean; audio: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        this.logger.warn(`Media state change from unauthenticated client: ${client.id}`);
        return { success: false, error: 'Not authenticated' };
      }

      this.logger.debug(
        `User ${clientData.userId} changed media state - Video: ${data.video}, Audio: ${data.audio}`,
      );

      client.broadcast.emit('mediaStateChanged', {
        from: data.from,
        video: data.video,
        audio: data.audio,
        userId: clientData.userId,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error handling mediaStateChange: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { success: false, error: 'Failed to update media state' };
    }
  }

  @SubscribeMessage('getOnlineUsers')
  async handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    try {
      const onlineUsers = this.getOnlineUsers();
      client.emit('onlineUsers', onlineUsers);
      return { success: true, users: onlineUsers };
    } catch (error) {
      this.logger.error(`Error getting online users: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, error: 'Failed to get online users' };
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string; callId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        this.logger.warn(`Join room attempt from unauthenticated client: ${client.id}`);
        client.emit('roomError', { error: 'Not authenticated' });
        return { success: false, error: 'Not authenticated' };
      }

      this.logger.log(`User ${clientData.userId} (${client.id}) joining room: ${data.roomId}`);

      // Join the room
      await this.joinRoom(client.id, data.roomId);

      // Get all participants in the room
      const participants = this.getRoomParticipants(data.roomId);

      // Notify the client they joined
      client.emit('joinedRoom', {
        roomId: data.roomId,
        participants: participants,
        callId: data.callId,
      });

      // Notify other participants that someone joined
      const otherParticipants = participants.filter((p) => p.socketId !== client.id);
      otherParticipants.forEach((participant) => {
        this.server.to(participant.socketId).emit('userJoinedRoom', {
          socketId: client.id,
          userId: clientData.userId,
          userInfo: clientData.userInfo,
          callId: data.callId,
        });
      });

      return { success: true, roomId: data.roomId, participants };
    } catch (error) {
      this.logger.error(`Error joining room: ${error instanceof Error ? error.message : String(error)}`);
      client.emit('roomError', { error: 'Failed to join room' });
      return { success: false, error: 'Failed to join room' };
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        return { success: false, error: 'Not authenticated' };
      }

      this.leaveRoom(client.id, data.roomId);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error leaving room: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, error: 'Failed to leave room' };
    }
  }

  // Helper methods for room management
  private async joinRoom(socketId: string, roomId: string) {
    const clientData = this.connectedClients.get(socketId);
    if (!clientData) {
      this.logger.error(`Cannot join room: socket ${socketId} not found in connectedClients`);
      this.logger.log(`Available sockets: ${Array.from(this.connectedClients.keys()).join(', ')}`);
      throw new Error(`Socket ${socketId} not found`);
    }
    const client = clientData.socket;

    // Leave previous room if in one
    const previousRoomId = this.socketToRoom.get(socketId);
    if (previousRoomId && previousRoomId !== roomId) {
      this.leaveRoom(socketId, previousRoomId);
    }

    await client.join(roomId);

    // Track in our room map
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(socketId);
    this.socketToRoom.set(socketId, roomId);

    this.logger.log(`Socket ${socketId} joined room ${roomId}`);
  }

  private leaveRoom(socketId: string, roomId: string) {
    const client = this.connectedClients.get(socketId)?.socket;
    const clientData = this.connectedClients.get(socketId);

    if (client) {
      client.leave(roomId);
    }

    // Remove from room tracking
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      } else {
        // Notify other participants that someone left
        const otherSocketIds = Array.from(room);
        otherSocketIds.forEach((otherSocketId) => {
          this.server.to(otherSocketId).emit('userLeftRoom', {
            socketId: socketId,
            userId: clientData?.userId,
            userInfo: clientData?.userInfo,
          });
        });
      }
    }

    this.socketToRoom.delete(socketId);
    this.logger.log(`Socket ${socketId} left room ${roomId}`);
  }

  private getRoomParticipants(roomId: string): Array<{ socketId: string; userId: string; userInfo: any }> {
    const socketIds = this.rooms.get(roomId);
    if (!socketIds) {
      return [];
    }

    return Array.from(socketIds)
      .map((socketId) => {
        const clientData = this.connectedClients.get(socketId);
        if (!clientData) return null;
        return {
          socketId: socketId,
          userId: clientData.userId,
          userInfo: clientData.userInfo,
        };
      })
      .filter((p): p is { socketId: string; userId: string; userInfo: any } => p !== null);
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getConnectedClient(socketId: string) {
    return this.connectedClients.get(socketId);
  }

  getAllConnectedClients() {
    return Array.from(this.connectedClients.values());
  }

  getOnlineUsers(): Array<{ userId: string; socketId: string; userInfo: any }> {
    return Array.from(this.userIdToSocketId.entries()).map(([userId, socketId]) => {
      const clientData = this.connectedClients.get(socketId);
      return {
        userId,
        socketId,
        userInfo: clientData?.userInfo,
      };
    });
  }
}
