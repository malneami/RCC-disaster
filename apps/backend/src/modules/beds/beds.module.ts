import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BedsController } from './beds.controller';
import { BedsService } from './beds.service';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    // JwtModule.registerAsync({
    //   imports: [ConfigModule],
    //   useFactory: async (configService: ConfigService) => ({
    //     secret: configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-for-development-only',
    //   }),
    //   inject: [ConfigService],
    // }),
  ],
  controllers: [BedsController],
  providers: [BedsService],
  exports: [BedsService],
})
export class BedsModule {}

