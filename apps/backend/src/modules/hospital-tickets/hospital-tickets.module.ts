import { Module } from '@nestjs/common';
import { HospitalTicketsService } from './hospital-tickets.service';
import { HospitalTicketsController } from './hospital-tickets.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [],
  controllers: [HospitalTicketsController],
  providers: [HospitalTicketsService, PrismaService],
  exports: [HospitalTicketsService],
})
export class HospitalTicketsModule {}
