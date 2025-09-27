import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RepliesController } from './replies.controller';
import { RepliesService } from './replies.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [RepliesController],
  providers: [RepliesService, PrismaService],
  exports: [RepliesService],
})
export class RepliesModule {}
