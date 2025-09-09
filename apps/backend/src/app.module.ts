import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler.guard';
import { AmbulancesModule } from './modules/ambulances/ambulances.module';
import { EmsAssignmentsModule } from './modules/ems-assignments/ems-assignments.module';
import { DriverSchedulesModule } from './modules/driver-schedules/driver-schedules.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { EmsDashboardModule } from './modules/ems-dashboard/ems-dashboard.module';
import { EmsGatewayModule } from './modules/ems-gateway/ems-gateway.module';
import { GpsTrackingModule } from './modules/gps-tracking/gps-tracking.module';
import { TimelineEventsModule } from './modules/timeline-events/timeline-events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    
    // EMS Modules
    AmbulancesModule,
    EmsAssignmentsModule,
    DriverSchedulesModule,
    DriversModule,
    EmsDashboardModule,
    EmsGatewayModule,
    GpsTrackingModule,
    TimelineEventsModule,
    
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