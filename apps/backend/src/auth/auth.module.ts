import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../modules/users/users.module';
import { ActivitiesModule } from '../modules/activities/activities.module';

import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    UsersModule,
    ActivitiesModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtRefreshStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}