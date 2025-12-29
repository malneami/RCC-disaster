import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EmsGateway } from './ems.gateway';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    }),
  ],
  providers: [EmsGateway],
  exports: [EmsGateway],
})
export class EmsGatewayModule {}


