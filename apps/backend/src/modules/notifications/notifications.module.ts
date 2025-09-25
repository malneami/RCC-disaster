import { Module } from '@nestjs/common';
import { TestNotificationsController } from './test.controller';
import { CaseNotesController } from './case-notes.controller';
import { CaseNotesService } from './case-notes.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [TestNotificationsController, CaseNotesController, NotificationsController],
  providers: [CaseNotesService, NotificationsService],
  exports: [CaseNotesService, NotificationsService],
})
export class NotificationsModule {}
