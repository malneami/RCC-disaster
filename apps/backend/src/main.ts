import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { Server as SocketIOServer, ServerOptions } from 'socket.io';
import { AppModule } from './app.module';
import { EgressClient, RoomServiceClient } from 'livekit-server-sdk';
import { RecordingsService } from './modules/recordings/recordings.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global validation pipe - permissive for updates
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
      skipMissingProperties: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('RCC Healthcare Platform API')
      .setDescription('Healthcare coordination platform for patient transfers')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    logger.log('📚 API Documentation available at http://localhost:3002/api/docs');
  }

  const port = configService.get('PORT') || 3002;
  const host = configService.get('HOST') || '0.0.0.0';

  await app.listen(port, host);

  const recordingsService = app.get(RecordingsService);
  const livekitUrl = configService.get('LIVEKIT_URL') || 'http://localhost:7880';
  const livekitApiKey = configService.get('LIVEKIT_API_KEY') || 'devkey';
  const livekitApiSecret = configService.get('LIVEKIT_API_SECRET') || 'secret';

  const roomService = new RoomServiceClient(livekitUrl, livekitApiKey, livekitApiSecret);

  async function checkRoomReady(roomId: string, minParticipants: number = 2): Promise<boolean> {
    try {
      const rooms = await roomService.listRooms();
      const room = rooms.find((r) => r.name === roomId || r.sid === roomId);

      if (!room) {
        return false;
      }

      let participantCount = 0;
      if (room.numParticipants !== undefined) {
        participantCount = room.numParticipants;
      } else {
        const participants = await roomService.listParticipants(roomId);
        participantCount = participants.length;
      }

      return participantCount >= minParticipants;
    } catch (error) {
      logger.warn(` Error checking room ${roomId}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  async function getAllRoomParticipants(roomId: string): Promise<string[]> {
    try {
      const participants = await roomService.listParticipants(roomId);
      return participants
        .map(p => p.identity || p.sid)
        .filter(id => id && !id.startsWith('EG_')) as string[];
    } catch (error) {
      logger.warn(`Error getting participants for room ${roomId}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async function startRecordingWithRetry(
    roomId: string,
    callerId: string,
    calleeIds: string | string[],
    hasVideo: boolean = false,
    maxRetries: number = 5,
    retryDelay: number = 2000
  ): Promise<string | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const isReady = await checkRoomReady(roomId, 2);
        if (!isReady) {
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          } else {
            logger.error(` Room ${roomId} never became ready after ${maxRetries} attempts`);
            return null;
          }
        }

        let finalCalleeIds: string[] = Array.isArray(calleeIds) ? calleeIds : [calleeIds];

        if (finalCalleeIds.length === 1) {
          try {
            const roomParticipants = await getAllRoomParticipants(roomId);
            finalCalleeIds = roomParticipants.filter(id => id !== callerId);
            if (finalCalleeIds.length > 0) {
              logger.log(`📋 Found ${finalCalleeIds.length} participant(s) in room ${roomId}: ${finalCalleeIds.join(', ')}`);
            }
          } catch (error) {
            logger.warn(`Could not fetch room participants, using provided calleeIds`);
          }
        }

        const egressId = await recordingsService.startRecording(roomId, callerId, finalCalleeIds, hasVideo);
        if (egressId) {
          return egressId;
        }
      } catch (error) {
        logger.warn(` Recording attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    logger.error(` All ${maxRetries} recording attempts failed for ${roomId}`);
    return null;
  }

  async function checkAndStopRecording(roomId: string) {
    try {
      const roomParticipants = await getAllRoomParticipants(roomId);
      if (roomParticipants.length < 2) {
        logger.log(`⏹️ Room ${roomId} has ${roomParticipants.length} participants left. Stopping recording.`);
        const callerId = recordingsService.getCallerIdForRoom(roomId);
        await recordingsService.stopRecording(roomId, roomParticipants, callerId || undefined);
      } else {
        logger.log(`⏺️ Room ${roomId} still has ${roomParticipants.length} participants. Recording continues.`);
        // Update callees if needed
        const callerId = recordingsService.getCallerIdForRoom(roomId);
        if (callerId) {
          await recordingsService.updateRecordingCallees(roomId, roomParticipants, callerId);
        }
      }
    } catch (error) {
      logger.error(`❌ Error in checkAndStopRecording for room ${roomId}: ${error}`);
    }
  }

  const httpServer = app.getHttpServer();

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
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
    transports: ['polling', 'websocket'], // polling first for reliability
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Make io available globally
  (global as any).socketIoServer = io;

  // === Communication NAMESPACE ===
  const videoCallsNsp = io.of('/video-calls');
  const connectedUsers = new Map<string, { socketId: string; userInfo: any }>();
  const userIdToSocketId = new Map<string, string>();

  videoCallsNsp.on('connection', (socket) => {
    logger.log(`🔌 [/video-calls] Client connected: ${socket.id}`);

    // Store user info from handshake
    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    const userInfo = socket.handshake.auth?.userInfo || {};

    if (userId) {
      userIdToSocketId.set(userId, socket.id);
      connectedUsers.set(socket.id, { socketId: socket.id, userInfo: { ...userInfo, id: userId } });
      logger.log(`👤 User ${userId} connected with socket ${socket.id}`);
    }

    // Emit connection success
    socket.emit('connected', { socketId: socket.id, userId });

    // Handle callUser - Forward signaling (recording starts when call is answered)
    socket.on('callUser', async (data) => {
      logger.log(` callUser event from ${socket.id}:`, JSON.stringify(data));

      const { userToCall, userIdToCall, emailToCall, signalData, from, name } = data;
      const roomId = signalData?.roomId;

      if (!roomId) {
        logger.error(' No roomId in callUser data');
        socket.emit('callError', { message: 'Missing roomId' });
        return;
      }

      // Forward signaling to target user
      let targetSocketId: string | undefined;
      if (userIdToCall && userIdToSocketId.has(userIdToCall)) {
        targetSocketId = userIdToSocketId.get(userIdToCall);
      }

      if (targetSocketId) {
        socket.to(targetSocketId).emit('callUser', {
          signal: signalData,
          from: socket.id,
          name
        });
        logger.log(`📞 Forwarded call to ${targetSocketId}`);
      } else {
        socket.emit('callError', {
          message: 'User is not online or not found',
          targetUserId: userIdToCall,
          targetEmail: emailToCall
        });
        logger.log(`⚠️ Call failed: Target user ${userIdToCall || userToCall} not found`);
      }
    });
    socket.on('answerCall', async (data) => {
      logger.log(`📞 answerCall event from ${socket.id}:`, JSON.stringify(data));
      const { signal, to, roomId } = data;

      // Get caller and callee info
      const callerSocketId = to;
      const callerData = connectedUsers.get(callerSocketId);
      const answererData = connectedUsers.get(socket.id);

      const callerId = callerData?.userInfo?.id || callerSocketId;
      const calleeId = answererData?.userInfo?.id || socket.id;

      // Forward call acceptance
      socket.to(to).emit('callAccepted', { signal, from: socket.id });


      if (roomId) {
        const hasCamera = data.signal?.hasCamera || false;
        const hasScreenShare = data.signal?.hasScreenShare || false;
        const hasVideo = hasCamera || hasScreenShare;

        setTimeout(async () => {
          await startRecordingWithRetry(roomId, callerId, calleeId, hasVideo, 5, 2000).catch((error) => {
            logger.error(` Failed to start recording for ${roomId}: ${error}`);
          });
        }, 2500); // Give time for LiveKit room connection to establish
      } else {
        logger.warn(`⚠️ No roomId in answerCall, cannot start recording`);
      }
    });


    socket.on('endCall', async (data) => {
      logger.log(`📞 endCall event from ${socket.id}:`, JSON.stringify(data));

      const { roomId } = data;

      if (roomId) {
        await checkAndStopRecording(roomId);
      }

      socket.broadcast.emit('callEnded', { from: socket.id });
    });

    // Handle media state change
    socket.on('mediaStateChange', async (data) => {
      const { video, screenShare } = data;
      const roomId = data.roomId || Array.from(socket.rooms).find(r => r !== socket.id);

      if (roomId) {
        if (video || screenShare) {
          await recordingsService.startVideoRecording(roomId);
        } else {
          // Note: We don't automatically stop video here because other participants might still be on video
          // and startRoomCompositeEgress records the whole room. 
          // stopVideoRecording is usually called when the specific video use stops or the call ends.
        }
      }

      socket.broadcast.emit('mediaStateChange', { ...data, from: socket.id });
    });

    // Handle get online users
    socket.on('getOnlineUsers', () => {
      const onlineUsers = Array.from(connectedUsers.entries()).map(([socketId, data]) => ({
        socketId,
        ...data.userInfo
      }));
      socket.emit('onlineUsers', onlineUsers);
    });

    // Handle join room  
    socket.on('joinRoom', async (data) => {
      const { roomId } = data;
      socket.join(roomId);
      socket.to(roomId).emit('userJoined', { socketId: socket.id, roomId });
      logger.log(`🚪 Socket ${socket.id} joined room ${roomId}`);

      try {
        const roomParticipants = await getAllRoomParticipants(roomId);
        if (roomParticipants.length > 0) {
          const callerId = recordingsService.getCallerIdForRoom(roomId);

          if (callerId) {
            await recordingsService.updateRecordingCallees(roomId, roomParticipants, callerId);
          } else {
            logger.debug(`No active recording found for room ${roomId}, skipping callee update`);
          }
        }
      } catch (error) {
        logger.warn(`Error updating recording for joined room ${roomId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    // Handle leave room
    socket.on('leaveRoom', async (data) => {
      const { roomId } = data;
      socket.leave(roomId);
      socket.to(roomId).emit('userLeft', { socketId: socket.id, roomId });
      logger.log(`🚪 Socket ${socket.id} left room ${roomId}`);

      if (roomId) {
        await checkAndStopRecording(roomId);
      }
    });

    socket.on('disconnecting', async () => {
      const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
      for (const roomId of rooms) {
        await checkAndStopRecording(roomId);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.log(`🔌 [/video-calls] Client disconnected: ${socket.id}, reason: ${reason}`);

      // Clean up user mappings
      const userData = connectedUsers.get(socket.id);
      if (userData?.userInfo?.id) {
        userIdToSocketId.delete(userData.userInfo.id);
      }
      connectedUsers.delete(socket.id);

      // Notify others
      socket.broadcast.emit('userDisconnected', { socketId: socket.id });
    });
  });

  // === NOTIFICATIONS NAMESPACE ===
  const notificationsNsp = io.of('/notifications');
  notificationsNsp.on('connection', (socket) => {
    logger.log(`🔌 [/notifications] Client connected: ${socket.id}`);
    socket.emit('connected', { namespace: '/notifications', clientId: socket.id });

    socket.on('disconnect', (reason) => {
      logger.log(`🔌 [/notifications] Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  // === EMS NAMESPACE ===
  const emsNsp = io.of('/ems');
  emsNsp.on('connection', (socket) => {
    logger.log(`🔌 [/ems] Client connected: ${socket.id}`);
    socket.emit('connected', { namespace: '/ems', clientId: socket.id });

    socket.on('disconnect', (reason) => {
      logger.log(`🔌 [/ems] Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  // === HOSPITALS NAMESPACE ===
  const hospitalsNsp = io.of('/hospitals');
  hospitalsNsp.on('connection', (socket) => {
    logger.log(`🔌 [/hospitals] Client connected: ${socket.id}`);
    socket.emit('connected', { namespace: '/hospitals', clientId: socket.id });

    socket.on('disconnect', (reason) => {
      logger.log(`🔌 [/hospitals] Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  // Log default namespace connections
  io.on('connection', (socket) => {
    logger.log(`🔌 [default] Socket.IO client connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      logger.log(`🔌 [default] Socket.IO client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  logger.log(`🚀 RCC Healthcare Platform Backend running on ${host}:${port}`);
  logger.log(`🏥 Health check available at ${host}:${port}/api/v1/health`);
  logger.log(`🔌 Socket.IO server listening on ${host}:${port}/socket.io/`);
  logger.log(`📡 Namespaces: /video-calls, /notifications, /ems, /hospitals`);
}

bootstrap();
