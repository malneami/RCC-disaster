import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { PatientMergeService } from './patient-merge.service';
import { PatientSearchService } from './patient-search.service';
import { MedicalRecordsService } from '../medical-records/medical-records.service';

@Module({
  controllers: [PatientsController],
  providers: [PatientsService, PatientMergeService, PatientSearchService, MedicalRecordsService],
  exports: [PatientsService, PatientMergeService, PatientSearchService],
})
export class PatientsModule {}