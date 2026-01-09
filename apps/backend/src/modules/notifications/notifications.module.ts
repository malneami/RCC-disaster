import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { TestNotificationsController } from './test.controller';
import { CaseNotesController } from './case-notes.controller';
import { CaseNotesService } from './case-notes.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaService } from '../../database/prisma.service';
import { KpiStatusTrackerService } from './services/kpi-status-tracker.service';
import { KpiMonitorService } from './services/kpi-monitor.service';
import { CriticalTimeMonitorService } from './services/critical-time-monitor.service';
import { EmsLateMonitorService } from './services/ems-late-monitor.service';
import { StemiCasesModule } from '../stemi-cases/stemi-cases.module';
import { StrokeCasesModule } from '../stroke-cases/stroke-cases.module';
import { TraumaCasesModule } from '../trauma-cases/trauma-cases.module';

@Module({
  imports: [
    ScheduleModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
      signOptions: { expiresIn: '1h' },
    }),
    forwardRef(() => StemiCasesModule),
    forwardRef(() => StrokeCasesModule),
    forwardRef(() => TraumaCasesModule),
  ],
  controllers: [TestNotificationsController, CaseNotesController, NotificationsController],
  providers: [
    CaseNotesService,
    NotificationsService,
    NotificationsGateway,
    PrismaService,
    KpiStatusTrackerService,
    KpiMonitorService,
    CriticalTimeMonitorService,
    EmsLateMonitorService,
  ],
  exports: [
    CaseNotesService,
    NotificationsService,
    NotificationsGateway,
    KpiMonitorService,
    CriticalTimeMonitorService,
    EmsLateMonitorService,
  ],
})
export class NotificationsModule {}
