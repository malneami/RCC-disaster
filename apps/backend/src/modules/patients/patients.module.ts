import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { PatientMergeService } from './patient-merge.service';
import { DuplicateDetectionService } from './services/duplicate-detection.service';
import { MedicalRecordsService } from '../medical-records/medical-records.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [PatientsController],
  providers: [PatientsService, PatientMergeService, DuplicateDetectionService, MedicalRecordsService],
  exports: [PatientsService, PatientMergeService, DuplicateDetectionService],
})
export class PatientsModule {}