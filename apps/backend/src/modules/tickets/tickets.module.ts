import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketsGateway } from './tickets.gateway';
import { TicketExportService } from './services/ticket-export.service';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { WsJwtAuthGuard } from '../../auth/guards/ws-jwt-auth.guard';
import { EmsAssignmentsModule } from '../ems-assignments/ems-assignments.module';
import { CommonModule } from '../../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    DatabaseModule, 
    AuthModule,
    EmsAssignmentsModule,
    CommonModule,
    forwardRef(() => NotificationsModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-for-development-only',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsGateway, TicketExportService, WsJwtAuthGuard],
  exports: [TicketsService, TicketsGateway],
})
export class TicketsModule {}