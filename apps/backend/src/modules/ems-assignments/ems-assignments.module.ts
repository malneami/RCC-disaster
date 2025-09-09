import { Module } from '@nestjs/common';
import { EmsAssignmentsController } from './ems-assignments.controller';
import { EmsAssignmentsService } from './ems-assignments.service';
import { DatabaseModule } from '../../database/database.module';
import { TimelineEventsModule } from '../timeline-events/timeline-events.module';

@Module({
  imports: [DatabaseModule, TimelineEventsModule],
  controllers: [EmsAssignmentsController],
  providers: [EmsAssignmentsService],
  exports: [EmsAssignmentsService],
})
export class EmsAssignmentsModule {}


