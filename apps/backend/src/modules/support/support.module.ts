import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { TelegramService } from './telegram.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [SupportController],
  providers: [SupportService, TelegramService, PrismaService],
  exports: [SupportService, TelegramService],
})
export class SupportModule {}

