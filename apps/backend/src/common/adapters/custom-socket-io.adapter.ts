import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication, Logger } from '@nestjs/common';
import { Server, ServerOptions } from 'socket.io';
import { createServer } from 'http';

/**
 * Custom Socket.IO Adapter that explicitly creates and configures the Socket.IO server
 * This ensures the /socket.io path is properly registered
 */
export class CustomSocketIoAdapter extends IoAdapter {
  private readonly logger = new Logger('CustomSocketIoAdapter');
  private ioServer: Server | null = null;

  constructor(private app: INestApplication) {
    super(app);
    this.logger.log('🔌 CustomSocketIoAdapter constructor called');
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    this.logger.log(`📡 createIOServer called with port: ${port}`);
    
    // If port is 0, we're using the existing HTTP server
    if (port === 0) {
      this.logger.log('🔗 Binding Socket.IO to existing HTTP server');
    }
    
    const corsOptions = {
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
    };

    const serverOptions: Partial<ServerOptions> = {
      ...options,
      cors: corsOptions,
      transports: ['websocket', 'polling'],
      allowEIO3: true, // Allow Engine.IO v3 clients
      pingTimeout: 60000,
      pingInterval: 25000,
    };

    this.logger.log(`📊 Creating server with options: ${JSON.stringify({ transports: serverOptions.transports, allowEIO3: serverOptions.allowEIO3 })}`);
    
    const server = super.createIOServer(port, serverOptions);
    this.ioServer = server;
    
    this.logger.log('✅ Socket.IO server created successfully');
    this.logger.log(`📊 Server engine: ${server?.engine ? 'exists' : 'null'}`);
    
    // Log all namespaces
    if (server) {
      server.on('connection', (socket: any) => {
        this.logger.log(`🔌 New connection on default namespace: ${socket.id}`);
      });
    }
    
    return server;
  }
}
