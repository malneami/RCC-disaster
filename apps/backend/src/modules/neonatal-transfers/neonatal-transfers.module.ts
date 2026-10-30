import { Module } from '@nestjs/common';
import { NeonatalTransfersService } from './neonatal-transfers.service';
import { NeonatalTransfersController } from './neonatal-transfers.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [NeonatalTransfersController],
  providers: [NeonatalTransfersService, PrismaService],
  exports: [NeonatalTransfersService],
})
export class NeonatalTransfersModule {}
