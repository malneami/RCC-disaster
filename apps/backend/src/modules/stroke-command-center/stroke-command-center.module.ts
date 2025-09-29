import { Module } from '@nestjs/common';
import { StrokeCommandCenterController } from './stroke-command-center.controller';
import { StrokeCommandCenterService } from './stroke-command-center.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [StrokeCommandCenterController],
  providers: [StrokeCommandCenterService],
  exports: [StrokeCommandCenterService],
})
export class StrokeCommandCenterModule {}
