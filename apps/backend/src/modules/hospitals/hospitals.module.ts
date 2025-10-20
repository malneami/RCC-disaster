import { Module } from '@nestjs/common';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';
import { HospitalsGateway } from './hospitals.gateway';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    }),
  ],
  controllers: [HospitalsController],
  providers: [HospitalsService, HospitalsGateway],
  exports: [HospitalsService, HospitalsGateway],
})
export class HospitalsModule {}