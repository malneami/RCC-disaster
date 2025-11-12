import { Module } from '@nestjs/common';
import { TraumaCasesService } from './trauma-cases.service';
import { TraumaCasesController } from './trauma-cases.controller';
import { PrismaService } from '../../database/prisma.service';
import { PatientMergeService } from '../patients/patient-merge.service';
import { TraumaPatientService } from './services/trauma-patient.service';
import { TraumaTicketService } from './services/trauma-ticket.service';
import { TraumaKpiService } from './services/trauma-kpi.service';
import { TraumaDatetimeService } from './services/trauma-datetime.service';
import { TraumaQueryService } from './services/trauma-query.service';
import { TraumaExportService } from './services/trauma-export.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [TraumaCasesController],
  providers: [
    TraumaCasesService, 
    PrismaService, 
    PatientMergeService,
    TraumaPatientService,
    TraumaTicketService,
    TraumaKpiService,
    TraumaDatetimeService,
    TraumaQueryService,
    TraumaExportService,
  ],
  exports: [
    TraumaCasesService,
    TraumaExportService,
  ],
})
export class TraumaCasesModule {}