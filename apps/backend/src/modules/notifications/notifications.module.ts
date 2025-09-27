import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TestNotificationsController } from './test.controller';
import { CaseNotesController } from './case-notes.controller';
import { CaseNotesService } from './case-notes.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [TestNotificationsController, CaseNotesController, NotificationsController],
  providers: [CaseNotesService, NotificationsService, NotificationsGateway, PrismaService],
  exports: [CaseNotesService, NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
