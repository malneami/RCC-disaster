import { Module } from '@nestjs/common';
import { EmsLocationWorkflowController } from './ems-location-workflow.controller';
import { EmsLocationWorkflowService } from '../../common/services/ems-location-workflow.service';
import { HospitalBoundsService } from '../../common/services/hospital-bounds.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EmsLocationWorkflowController],
  providers: [EmsLocationWorkflowService, HospitalBoundsService],
  exports: [EmsLocationWorkflowService, HospitalBoundsService],
})
export class EmsLocationWorkflowModule {}
