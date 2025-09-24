import { Module } from '@nestjs/common';
import { StemiCommandCenterController } from './stemi-command-center.controller';
import { StemiCommandCenterService } from './stemi-command-center.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [StemiCommandCenterController],
  providers: [StemiCommandCenterService],
  exports: [StemiCommandCenterService],
})
export class StemiCommandCenterModule {}
