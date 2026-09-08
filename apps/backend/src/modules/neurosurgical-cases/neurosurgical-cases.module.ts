import { Module } from '@nestjs/common';
import { NeurosurgicalCasesService } from './neurosurgical-cases.service';
import { NeurosurgicalCasesController } from './neurosurgical-cases.controller';
import { NeurosurgicalKPICalculatorService } from './services/neurosurgical-kpi-calculator.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [NeurosurgicalCasesController],
  providers: [NeurosurgicalCasesService, NeurosurgicalKPICalculatorService, PrismaService],
  exports: [NeurosurgicalCasesService],
})
export class NeurosurgicalCasesModule {}
