import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DisasterService } from './disaster.service';
import { DisasterController } from './disaster.controller';
import { DisasterGateway } from './disaster.gateway';
import { DisasterNotificationService } from './disaster-notification.service';
import { DisasterEscalationMonitorService } from './disaster-escalation-monitor.service';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SupportModule } from '../support/support.module';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { VideoCallsModule } from '../video-calls/video-calls.module';

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
    SupportModule,
    HospitalsModule,
    VideoCallsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'disaster-secret',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DisasterController],
  providers: [
    DisasterService,
    DisasterGateway,
    DisasterNotificationService,
    DisasterEscalationMonitorService,
  ],
  exports: [DisasterService, DisasterNotificationService],
})
export class DisasterModule {}
