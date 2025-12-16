import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { CriticalCasesModule } from './modules/critical-cases/critical-cases.module';
import { HospitalTicketsModule } from './modules/hospital-tickets/hospital-tickets.module';
import { PatientsModule } from './modules/patients/patients.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { HealthModule } from './modules/health/health.module';
import { StrokeCasesModule } from './modules/stroke-cases/stroke-cases.module';
import { StrokeTimelineModule } from './modules/stroke-timeline/stroke-timeline.module';
import { TraumaCasesModule } from './modules/trauma-cases/trauma-cases.module';
import { StemiCasesModule } from './modules/stemi-cases/stemi-cases.module';
import { StemiCommandCenterModule } from './modules/stemi-command-center/stemi-command-center.module';
import { StrokeCommandCenterModule } from './modules/stroke-command-center/stroke-command-center.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler.guard';
import { AmbulancesModule } from './modules/ambulances/ambulances.module';
import { EmsAssignmentsModule } from './modules/ems-assignments/ems-assignments.module';
import { AmbulanceTrackingModule } from './modules/ambulance-tracking/ambulance-tracking.module';
import { EmsLocationWorkflowModule } from './modules/ems-location-workflow/ems-location-workflow.module';
import { DriverSchedulesModule } from './modules/driver-schedules/driver-schedules.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { EmsDashboardModule } from './modules/ems-dashboard/ems-dashboard.module';
import { EmsGatewayModule } from './modules/ems-gateway/ems-gateway.module';
import { TimelineEventsModule } from './modules/timeline-events/timeline-events.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RepliesModule } from './modules/replies/replies.module';
import { VideoCallsModule } from './modules/video-calls/video-calls.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 100, // Increased from 3 to 100 for development
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 500, // Increased from 20 to 500 for development
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 1000, // Increased from 100 to 1000 for development
      },
    ]),
    DatabaseModule,
    
    // EMS Modules
    AmbulancesModule,
    EmsAssignmentsModule,
    AmbulanceTrackingModule,
    EmsLocationWorkflowModule,
    DriverSchedulesModule,
    DriversModule,
    EmsDashboardModule,
    EmsGatewayModule,
    TimelineEventsModule,
    NotificationsModule,
    RepliesModule,
    VideoCallsModule,
    
    AuthModule,
    UsersModule,
    HospitalsModule,
    CriticalCasesModule,
    HospitalTicketsModule,
    PatientsModule,
    TicketsModule,
    ActivitiesModule,
    MedicalRecordsModule,
    HealthModule,
    StrokeCasesModule,
    StrokeTimelineModule,
    TraumaCasesModule,
    StemiCasesModule,
    StemiCommandCenterModule,
    StrokeCommandCenterModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },
  ],
})
export class AppModule {}