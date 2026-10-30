import { Module } from '@nestjs/common';
import { NicuCapacityService } from './nicu-capacity.service';
import { NicuCapacityController } from './nicu-capacity.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [NicuCapacityController],
  providers: [NicuCapacityService, PrismaService],
  exports: [NicuCapacityService],
})
export class NicuCapacityModule {}
