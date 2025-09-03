import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { MedicalRecordsService } from '../medical-records/medical-records.service';

@Module({
  controllers: [PatientsController],
  providers: [PatientsService, MedicalRecordsService],
  exports: [PatientsService],
})
export class PatientsModule {}