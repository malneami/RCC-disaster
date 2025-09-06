import { Module } from '@nestjs/common';
import { StrokeTimelineService } from './stroke-timeline.service';
import { StrokeTimelineController } from './stroke-timeline.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [],
  controllers: [StrokeTimelineController],
  providers: [StrokeTimelineService, PrismaService],
  exports: [StrokeTimelineService],
})
export class StrokeTimelineModule {}

