import { Module } from '@nestjs/common';
import { StemiCasesController } from './stemi-cases.controller';
import { StemiCasesService } from './services/stemi-cases.service';
import { StemiQueryService } from './services/stemi-query.service';
import { StemiPatientService } from './services/stemi-patient.service';
import { StemiKpiService } from './services/stemi-kpi.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [],
  controllers: [StemiCasesController],
  providers: [
    PrismaService,
    StemiCasesService,
    StemiQueryService,
    StemiPatientService,
    StemiKpiService,
  ],
  exports: [
    StemiCasesService,
    StemiQueryService,
    StemiPatientService,
    StemiKpiService,
  ],
})
export class StemiCasesModule {}
