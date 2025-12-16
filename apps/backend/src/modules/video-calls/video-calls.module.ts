import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VideoCallsGateway } from './video-calls.gateway';
import { VideoCallsService } from './video-calls.service';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { WsJwtAuthGuard } from '../../auth/guards/ws-jwt-auth.guard';

@Module({
  imports: [
    DatabaseModule, // Required for VideoCallsService (PrismaService)
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [],
  providers: [VideoCallsGateway, VideoCallsService, WsJwtAuthGuard],
  exports: [VideoCallsGateway, VideoCallsService],
})
export class VideoCallsModule {}

