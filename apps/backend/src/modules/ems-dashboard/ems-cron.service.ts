import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmsDashboardService } from './ems-dashboard.service';

@Injectable()
export class EmsCronService {
  private readonly logger = new Logger(EmsCronService.name);

  constructor(private readonly emsDashboardService: EmsDashboardService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyPerformanceMetrics() {
    this.logger.log('Starting daily EMS performance metric generation...');
    try {
        // Generate for yesterday
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await this.emsDashboardService.generateDailyPerformanceMetric(yesterday);
        this.logger.log('Daily EMS performance metric generation completed.');
    } catch (error) {
        this.logger.error('Failed to generate daily EMS performance metrics', error);
    }
  }
}
