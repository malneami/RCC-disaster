import { Module, forwardRef } from '@nestjs/common';
import { StrokeCasesService } from './stroke-cases.service';
import { StrokeCasesController } from './stroke-cases.controller';
import { StrokeOutcomeFormController } from './stroke-outcome-form.controller';
import { StrokeExportService } from './services/stroke-export.service';
import { StrokeOutcomeFormService } from './services/stroke-outcome-form.service';
import { StrokeKPICalculatorService } from './services/stroke-kpi-calculator.service';
import { PrismaService } from '../../database/prisma.service';
import { PatientMergeService } from '../patients/patient-merge.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => NotificationsModule)],
  controllers: [StrokeCasesController, StrokeOutcomeFormController],
  providers: [
    StrokeCasesService, 
    StrokeExportService, 
    StrokeOutcomeFormService,
    StrokeKPICalculatorService,
    PrismaService, 
    PatientMergeService
  ],
  exports: [StrokeCasesService, StrokeOutcomeFormService, StrokeKPICalculatorService],
})
export class StrokeCasesModule {}

