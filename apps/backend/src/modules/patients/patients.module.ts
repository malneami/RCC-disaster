import { Module, forwardRef } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { PatientMergeService } from './patient-merge.service';
import { DuplicateDetectionService } from './services/duplicate-detection.service';
import { PatientsExportService } from './services/patients-export.service';
import { PatientsStatisticsService } from './services/patients-statistics.service';
import { MedicalRecordsService } from '../medical-records/medical-records.service';
import { CommonModule } from '../../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CommonModule, forwardRef(() => NotificationsModule)],
  controllers: [PatientsController],
  providers: [
    PatientsService, 
    PatientMergeService, 
    DuplicateDetectionService, 
    PatientsExportService, 
    PatientsStatisticsService,
    MedicalRecordsService
  ],
  exports: [PatientsService, PatientMergeService, DuplicateDetectionService],
})
export class PatientsModule {}