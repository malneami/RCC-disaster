import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { McpAuditService } from './mcp-audit.service';
import { AuditDimension } from '@prisma/client';

@Injectable()
export class McpAuditCronService {
  private readonly logger = new Logger(McpAuditCronService.name);
  private readonly enabled: boolean;

  constructor(
    private mcpAuditService: McpAuditService,
    private configService: ConfigService,
  ) {
    this.enabled = this.configService.get<boolean>('mcpAudit.enabled', false);
    if (this.enabled) {
      this.logger.log('MCP Audit Cron Service initialized');
    } else {
      this.logger.warn('MCP Audit Cron Service is disabled');
    }
  }

  /**
   * Daily comprehensive audit at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runDailyAudit() {
    if (!this.enabled) {
      return;
    }

    this.logger.log('Running daily comprehensive audit');

    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

      const result = await this.mcpAuditService.generateComprehensiveReport(
        {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: Object.values(AuditDimension),
        },
        'system',
        true, // Submit to MCP
      );

      this.logger.log(`Daily audit completed. Overall score: ${result.overallScore}%`);
      this.logger.log(`Report ID: ${result.reportId}`);
    } catch (error: any) {
      this.logger.error(`Daily audit failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Weekly detailed report (Sundays at midnight)
   */
  @Cron('0 0 * * 0')
  async runWeeklyAudit() {
    if (!this.enabled) {
      return;
    }

    this.logger.log('Running weekly detailed audit');

    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

      const result = await this.mcpAuditService.generateComprehensiveReport(
        {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: Object.values(AuditDimension),
        },
        'system',
        true, // Submit to MCP
      );

      this.logger.log(`Weekly audit completed. Overall score: ${result.overallScore}%`);
      this.logger.log(`Report ID: ${result.reportId}`);
    } catch (error: any) {
      this.logger.error(`Weekly audit failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Hourly timeliness check
   */
  @Cron(CronExpression.EVERY_HOUR)
  async runTimelinessCheck() {
    if (!this.enabled) {
      return;
    }

    this.logger.log('Running hourly timeliness check');

    try {
      const result = await this.mcpAuditService.auditTimeliness({});

      if (result.invalidRecords > 0) {
        this.logger.warn(
          `Timeliness check found ${result.invalidRecords} issues (score: ${result.score}%)`,
        );
      } else {
        this.logger.log(`Timeliness check passed (score: ${result.score}%)`);
      }
    } catch (error: any) {
      this.logger.error(`Timeliness check failed: ${error.message}`, error.stack);
    }
  }
}
