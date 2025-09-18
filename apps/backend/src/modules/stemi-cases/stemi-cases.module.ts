import { Module } from '@nestjs/common';
import { StemiCasesController } from './stemi-cases.controller';
import { StemiOutcomeFormController } from './stemi-outcome-form.controller';
import { StemiCasesService } from './services/stemi-cases.service';
import { StemiQueryService } from './services/stemi-query.service';
import { StemiPatientService } from './services/stemi-patient.service';
import { StemiKpiService } from './services/stemi-kpi.service';
import { StemiExportService } from './services/stemi-export.service';
import { StemiOutcomeFormService } from './services/stemi-outcome-form.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [],
  controllers: [StemiCasesController, StemiOutcomeFormController],
  providers: [
    PrismaService,
    StemiCasesService,
    StemiQueryService,
    StemiPatientService,
    StemiKpiService,
    StemiExportService,
    StemiOutcomeFormService,
  ],
  exports: [
    StemiCasesService,
    StemiQueryService,
    StemiPatientService,
    StemiKpiService,
    StemiExportService,
    StemiOutcomeFormService,
  ],
})
export class StemiCasesModule {}
