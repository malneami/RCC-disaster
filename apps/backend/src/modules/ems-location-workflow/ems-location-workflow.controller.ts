import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { EmsLocationWorkflowService } from '../../common/services/ems-location-workflow.service';

@Controller('ems-location-workflow')
export class EmsLocationWorkflowController {
  private readonly logger = new Logger(EmsLocationWorkflowController.name);
  private lastRequestAtByAssignment: Record<string, number> = {};

  constructor(
    private emsLocationWorkflowService: EmsLocationWorkflowService
  ) {}

  /**
   * Process ambulance location update for EMS assignment (fetches real-time GPS data)
   */
  @Post('location-update/:assignmentId')
  async processLocationUpdate(@Param('assignmentId') assignmentId: string) {
    this.logger.log(`Processing location update for assignment ${assignmentId}`);
    // Throttle: prevent multiple updates per minute per assignment
    const now = Date.now();
    const last = this.lastRequestAtByAssignment[assignmentId];
    if (last && now - last < 60_000) {
      this.logger.warn(`Throttled location update for ${assignmentId}. Last call ${(now - last) / 1000}s ago.`);
      return { throttled: true, nextAllowedInSeconds: Math.ceil((60_000 - (now - last)) / 1000) };
    }
    this.lastRequestAtByAssignment[assignmentId] = now;
    return await this.emsLocationWorkflowService.processLocationUpdate(assignmentId);
  }

  /**
   * Get EMS assignment status with location info
   */
  @Get('assignment/:assignmentId/status')
  async getAssignmentStatus(@Param('assignmentId') assignmentId: string) {
    return await this.emsLocationWorkflowService.getAssignmentStatus(assignmentId);
  }

  /**
   * Simulate ambulance movement for testing
   */
  @Post('assignment/:assignmentId/simulate')
  async simulateAmbulanceMovement(@Param('assignmentId') assignmentId: string) {
    this.logger.log(`Starting ambulance movement simulation for assignment ${assignmentId}`);
    return await this.emsLocationWorkflowService.simulateAmbulanceMovement(assignmentId);
  }

  /**
   * Test endpoint to send mock coordinates and see status transitions
   */
  @Post('test-location/:assignmentId')
  async testLocation(@Param('assignmentId') assignmentId: string) {
    this.logger.log(`Testing location for assignment ${assignmentId} (fetching real-time GPS data)`);
    
    return await this.emsLocationWorkflowService.processLocationUpdate(assignmentId);
  }
}
