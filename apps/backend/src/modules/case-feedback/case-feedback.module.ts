import { Module } from '@nestjs/common';
import { CaseFeedbackController } from './case-feedback.controller';
import { CaseFeedbackService } from './case-feedback.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CaseFeedbackController],
  providers: [CaseFeedbackService],
  exports: [CaseFeedbackService],
})
export class CaseFeedbackModule {}
