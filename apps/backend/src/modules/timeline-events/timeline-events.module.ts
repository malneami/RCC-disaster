import { Module } from '@nestjs/common';
import { TimelineEventsService } from './timeline-events.service';
import { TimelineEventsController } from './timeline-events.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TimelineEventsController],
  providers: [TimelineEventsService],
  exports: [TimelineEventsService],
})
export class TimelineEventsModule {}
