import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { VideoCallsGateway } from './video-calls.gateway';
import { VideoCallsService } from './video-calls.service';
import { VideoCallsController } from './video-calls.controller';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { RecordingsModule } from '../recordings/recordings.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    RecordingsModule,
  ],
  controllers: [VideoCallsController],
  providers: [VideoCallsGateway, VideoCallsService],
  exports: [VideoCallsGateway, VideoCallsService],
})
export class VideoCallsModule { }

