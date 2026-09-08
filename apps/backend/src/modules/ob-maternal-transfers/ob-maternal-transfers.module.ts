import { Module } from '@nestjs/common';
import { ObMaternalTransfersService } from './ob-maternal-transfers.service';
import { ObMaternalTransfersController } from './ob-maternal-transfers.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [ObMaternalTransfersController],
  providers: [ObMaternalTransfersService, PrismaService],
  exports: [ObMaternalTransfersService],
})
export class ObMaternalTransfersModule {}
