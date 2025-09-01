import { Module } from '@nestjs/common';
import { CriticalCasesService } from './critical-cases.service';
import { CriticalCasesController } from './critical-cases.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [],
  controllers: [CriticalCasesController],
  providers: [CriticalCasesService, PrismaService],
  exports: [CriticalCasesService],
})
export class CriticalCasesModule {}
