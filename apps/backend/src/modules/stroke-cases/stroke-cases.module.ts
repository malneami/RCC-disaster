import { Module } from '@nestjs/common';
import { StrokeCasesService } from './stroke-cases.service';
import { StrokeCasesController } from './stroke-cases.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [],
  controllers: [StrokeCasesController],
  providers: [StrokeCasesService, PrismaService],
  exports: [StrokeCasesService],
})
export class StrokeCasesModule {}

