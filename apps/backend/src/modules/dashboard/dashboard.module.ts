import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DatabaseModule } from '../../database/database.module';
import { PatientsModule } from '../patients/patients.module';
import { StrokeKPICalculatorService } from '../stroke-cases/services/stroke-kpi-calculator.service';
import { StemiKpiService } from '../stemi-cases/services/stemi-kpi.service';
import { TraumaKpiService } from '../trauma-cases/services/trauma-kpi.service';
import { StrokeCasesService } from '../stroke-cases/stroke-cases.service';

@Module({
  imports: [DatabaseModule, PatientsModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    StrokeKPICalculatorService,
    StemiKpiService,
    TraumaKpiService,
    StrokeCasesService,
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
