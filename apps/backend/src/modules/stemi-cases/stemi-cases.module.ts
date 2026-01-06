import { Module, forwardRef } from '@nestjs/common';
import { StemiCasesController } from './stemi-cases.controller';
import { StemiOutcomeFormController } from './stemi-outcome-form.controller';
import { StemiCasesService } from './services/stemi-cases.service';
import { StemiQueryService } from './services/stemi-query.service';
import { StemiPatientService } from './services/stemi-patient.service';
import { StemiKpiService } from './services/stemi-kpi.service';
import { StemiExportService } from './services/stemi-export.service';
import { StemiOutcomeFormService } from './services/stemi-outcome-form.service';
import { PrismaService } from '../../database/prisma.service';
import { CommonModule } from '../../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CommonModule, forwardRef(() => NotificationsModule)],
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
