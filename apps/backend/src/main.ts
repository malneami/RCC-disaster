import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { IoAdapter } from '@nestjs/platform-socket.io';
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

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // CORS configuration
  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL') || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5175',
      'https://rcc-front.onrender.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global validation pipe - permissive for updates
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // Don't remove non-whitelisted properties
      forbidNonWhitelisted: false, // Allow non-whitelisted properties
      transform: true,
      skipMissingProperties: true, // Skip validation for missing properties
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  if (configService.get('NODE_ENV') === 'development') {
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

  logger.log(`🚀 RCC Healthcare Platform Backend running on ${host}:${port}`);
  logger.log(`🏥 Health check available at ${host}:${port}/api/v1/health`);
  logger.log(`🔌 WebSocket server available at ${host}:${port}/socket.io/`);
}

bootstrap();
