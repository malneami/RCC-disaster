import { Module } from '@nestjs/common';
import { StrokeCasesService } from './stroke-cases.service';
import { StrokeCasesController } from './stroke-cases.controller';
import { PrismaService } from '../../database/prisma.service';
import { PatientMergeService } from '../patients/patient-merge.service';

@Module({
  imports: [],
  controllers: [StrokeCasesController],
  providers: [StrokeCasesService, PrismaService, PatientMergeService],
  exports: [StrokeCasesService],
})
export class StrokeCasesModule {}

