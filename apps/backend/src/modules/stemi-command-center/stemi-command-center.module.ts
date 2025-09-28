import { Module } from '@nestjs/common';
import { StemiCommandCenterController } from './stemi-command-center.controller';
import { StemiCommandCenterService } from './stemi-command-center.service';
import { DatabaseModule } from '../../database/database.module';
import { StemiCasesModule } from '../stemi-cases/stemi-cases.module';

@Module({
  imports: [DatabaseModule, StemiCasesModule],
  controllers: [StemiCommandCenterController],
  providers: [StemiCommandCenterService],
  exports: [StemiCommandCenterService],
})
export class StemiCommandCenterModule {}
