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

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler.guard';

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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}