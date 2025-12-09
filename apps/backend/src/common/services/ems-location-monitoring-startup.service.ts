import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmsAssignmentsService } from '../../modules/ems-assignments/ems-assignments.service';

@Injectable()
export class EmsLocationMonitoringStartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EmsLocationMonitoringStartupService.name);

  constructor(private readonly emsAssignmentsService: EmsAssignmentsService) {}

  async onApplicationBootstrap() {
    try {
      this.logger.log('🚀 Starting EMS location monitoring service...');
      
      // Wait a bit for the database to be fully ready
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Perform an initial check for all active assignments
      await this.emsAssignmentsService.checkAllLocations();
      
      this.logger.log('✅ EMS location monitoring startup completed successfully');
    } catch (error) {
      this.logger.error(`❌ Failed to start EMS location monitoring on startup: ${(error as Error).message}`);
      // Don't throw error to prevent server startup failure
    }
  }

  /**
   * Periodically check locations for all active assignments
   * This runs every minute to ensure we catch arrivals even if real-time updates are missed
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkLocationsPeriodic() {
    try {
      this.logger.debug('⏱️ Running periodic location check for all active assignments...');
      await this.emsAssignmentsService.checkAllLocations();
    } catch (error) {
      this.logger.error(`❌ Error in periodic location check: ${(error as Error).message}`);
    }
  }

  /**
   * Periodically check for stuck ambulances and sync ticket EMS status
   * This runs every 5 minutes to ensure ambulances don't get stuck in IN_USE
   * and ticket EMS status stays synced with assignment status
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupStuckAmbulances() {
    try {
      this.logger.debug('🧹 Running periodic ambulance status cleanup...');
      await this.emsAssignmentsService.cleanupStuckAmbulances();
    } catch (error) {
      this.logger.error(`❌ Error in ambulance cleanup: ${(error as Error).message}`);
    }
  }
}
