import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { Server as SocketIOServer } from 'socket.io';
import { AppModule } from './app.module';

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
    
    logger.log('📚 API Documentation available at http://localhost:3001/api/docs');
  }

  const port = configService.get('PORT') || 3001;
  const host = configService.get('HOST') || '0.0.0.0';
  
  await app.listen(port, host);

  // Get the underlying HTTP server and attach Socket.IO directly
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

  // === VIDEO CALLS NAMESPACE ===
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
    
    // Handle call user event
    socket.on('callUser', (data) => {
      logger.log(`📞 callUser event from ${socket.id}:`, JSON.stringify(data));
      const { userToCall, userIdToCall, emailToCall, signalData, from, name } = data;
      
      // Find target socket
      let targetSocketId: string | undefined;
      if (userIdToCall && userIdToSocketId.has(userIdToCall)) {
        targetSocketId = userIdToSocketId.get(userIdToCall);
      }
      
      if (targetSocketId) {
        socket.to(targetSocketId).emit('callUser', { signal: signalData, from: socket.id, name });
        logger.log(`📞 Forwarded call to ${targetSocketId}`);
      } else {
        // Target user not found or offline
        socket.emit('callError', { message: 'User is not online or not found', targetUserId: userIdToCall, targetEmail: emailToCall });
        logger.log(`⚠️ Call failed: Target user ${userIdToCall || userToCall} not found`);
      }
    });
    
    // Handle answer call event
    socket.on('answerCall', (data) => {
      logger.log(`📞 answerCall event from ${socket.id}:`, JSON.stringify(data));
      const { signal, to, name } = data;
      socket.to(to).emit('callAccepted', { signal, from: socket.id, name });
    });
    
    // Handle end call event
    socket.on('endCall', (data) => {
      logger.log(`📞 endCall event from ${socket.id}:`, JSON.stringify(data));
      socket.broadcast.emit('callEnded', { from: socket.id });
    });
    
    // Handle media state change
    socket.on('mediaStateChange', (data) => {
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
    socket.on('joinRoom', (data) => {
      const { roomId } = data;
      socket.join(roomId);
      socket.to(roomId).emit('userJoined', { socketId: socket.id, roomId });
      logger.log(`🚪 Socket ${socket.id} joined room ${roomId}`);
    });
    
    // Handle leave room
    socket.on('leaveRoom', (data) => {
      const { roomId } = data;
      socket.leave(roomId);
      socket.to(roomId).emit('userLeft', { socketId: socket.id, roomId });
      logger.log(`🚪 Socket ${socket.id} left room ${roomId}`);
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
