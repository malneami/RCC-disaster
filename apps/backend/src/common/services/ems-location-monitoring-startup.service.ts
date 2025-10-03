import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmsAssignmentsService } from '../../modules/ems-assignments/ems-assignments.service';

@Injectable()
export class EmsLocationMonitoringStartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EmsLocationMonitoringStartupService.name);

  constructor(private readonly emsAssignmentsService: EmsAssignmentsService) {}

  async onApplicationBootstrap() {
    try {
      this.logger.log('🚀 Starting EMS location monitoring for all active assignments...');
      
      // Wait a bit for the database to be fully ready
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await this.emsAssignmentsService.startLocationMonitoringForAllActiveAssignments();
      
      this.logger.log('✅ EMS location monitoring startup completed successfully');
    } catch (error) {
      this.logger.error(`❌ Failed to start EMS location monitoring on startup: ${(error as Error).message}`);
      // Don't throw error to prevent server startup failure
    }
  }

  /**
   * Periodically check for new assignments that need monitoring
   * This runs every 10 minutes to catch any assignments created after server startup
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkForNewAssignmentsNeedingMonitoring() {
    try {
      this.logger.log('🔍 Checking for new assignments that need location monitoring...');
      
      const activeAssignments = await this.emsAssignmentsService.getActiveAssignmentsForMonitoring();
      
      if (activeAssignments.length === 0) {
        this.logger.log('ℹ️ No active assignments found for monitoring');
        return;
      }

      this.logger.log(`Found ${activeAssignments.length} active assignments. Starting monitoring for any new ones...`);
      
      // Start monitoring for assignments that might not have it yet
      // Note: The existing startLocationMonitoring method will skip if already monitoring
      for (const assignment of activeAssignments) {
        const assignmentWithAmbulance = assignment as any;
        if (assignmentWithAmbulance.ambulance?.vehicleImei) {
          try {
            await this.emsAssignmentsService.startLocationMonitoring(assignment.id);
          } catch (error) {
            // This is expected if monitoring is already running for this assignment
            this.logger.debug(`Monitoring already active for assignment ${assignment.id}`);
          }
        }
      }
      
      this.logger.log('✅ Periodic assignment monitoring check completed');
    } catch (error) {
      this.logger.error(`❌ Error in periodic assignment monitoring check: ${(error as Error).message}`);
    }
  }
}
