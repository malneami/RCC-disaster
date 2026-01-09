import { Module } from '@nestjs/common';
import { EmsAssignmentsController } from './ems-assignments.controller';
import { EmsAssignmentsService } from './ems-assignments.service';
import { DatabaseModule } from '../../database/database.module';
import { TimelineEventsModule } from '../timeline-events/timeline-events.module';
import { EmsLocationWorkflowModule } from '../ems-location-workflow/ems-location-workflow.module';
import { EmsLocationMonitoringStartupService } from '../../common/services/ems-location-monitoring-startup.service';
import { EmsAssignmentExportService } from './services/ems-assignment-export.service';

import { EMSETAService } from '../../common/services/ems-eta.service';

@Module({
  imports: [DatabaseModule, TimelineEventsModule, EmsLocationWorkflowModule],
  controllers: [EmsAssignmentsController],
  providers: [EmsAssignmentsService, EmsLocationMonitoringStartupService, EmsAssignmentExportService],
  exports: [EmsAssignmentsService],
})
export class EmsAssignmentsModule {}


