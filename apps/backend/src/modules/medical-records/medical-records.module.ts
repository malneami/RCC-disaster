import { Module } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService, PrismaService],
  exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}
