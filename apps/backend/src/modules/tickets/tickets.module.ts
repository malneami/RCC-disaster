import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketsGateway } from './tickets.gateway';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { WsJwtAuthGuard } from '../../auth/guards/ws-jwt-auth.guard';
import { EmsAssignmentsModule } from '../ems-assignments/ems-assignments.module';
import { AmbulancesModule } from '../ambulances/ambulances.module';

@Module({
  imports: [
    DatabaseModule, 
    AuthModule,
    EmsAssignmentsModule,
    AmbulancesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-for-development-only',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsGateway, WsJwtAuthGuard],
  exports: [TicketsService, TicketsGateway],
})
export class TicketsModule {}