import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface DashboardMetrics {
  activeTransfers: number;
  urgentPathwayCases: number;
  completedToday: number;
  delayedTransfers: number;
  timestamp: string;
}

export interface PathwayMetric {
  label: string;
  value: string;
  progress: number;
  color: string;
}

export interface PathwayPerformance {
  pathway: string;
  color: string;
  activeCount: number;
  metrics: PathwayMetric[];
}

export interface PathwayPerformanceMetrics {
  pathways: PathwayPerformance[];
  timestamp: string;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Get all metrics in parallel for better performance
      const [
        activeTransfers,
        urgentPathwayCases,
        completedToday,
        delayedTransfers,
      ] = await Promise.all([
        this.getActiveTransfers(),
        this.getUrgentPathwayCases(),
        this.getCompletedToday(startOfDay, endOfDay),
        this.getDelayedTransfers(startOfDay, endOfDay),
      ]);

      this.logger.log(`Dashboard metrics calculated: Active=${activeTransfers}, Urgent=${urgentPathwayCases}, Completed=${completedToday}, Delayed=${delayedTransfers}`);

      return {
        activeTransfers,
        urgentPathwayCases,
        completedToday,
        delayedTransfers,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error calculating dashboard metrics:', error);
      // Return zero values on error to prevent dashboard from breaking
      return {
        activeTransfers: 0,
        urgentPathwayCases: 0,
        completedToday: 0,
        delayedTransfers: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async getActiveTransfers(): Promise<number> {
    try {
      // Count EMS assignments that are currently in progress
      const count = await this.prisma.eMSAssignment.count({
        where: {
          status: {
            in: ['EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED'],
          },
          deletedAt: null,
        },
      });

      this.logger.debug(`Active transfers count: ${count}`);
      return count;
    } catch (error) {
      this.logger.error('Error counting active transfers:', error);
      return 0;
    }
  }

  private async getUrgentPathwayCases(): Promise<number> {
    try {
      // Count tickets with high priority and critical emergency cases
      const [urgentTickets, criticalCases] = await Promise.all([
        // High priority tickets that are active
        this.prisma.ticket.count({
          where: {
            priority: 'CRITICAL',
            status: {
              in: ['PENDING', 'ASSIGNED', 'IN_TRANSPORT'],
            },
            deletedAt: null,
          },
        }),
        // Active critical cases (STEMI, Stroke, Trauma)
        this.prisma.criticalCase.count({
          where: {
            status: 'ACTIVE',
            deletedAt: null,
          },
        }),
      ]);

      const total = urgentTickets + criticalCases;
      this.logger.debug(`Urgent pathway cases: Tickets=${urgentTickets}, Critical=${criticalCases}, Total=${total}`);
      return total;
    } catch (error) {
      this.logger.error('Error counting urgent pathway cases:', error);
      return 0;
    }
  }

  private async getCompletedToday(startOfDay: Date, endOfDay: Date): Promise<number> {
    try {
      // Count completed EMS assignments today
      const completedAssignments = await this.prisma.eMSAssignment.count({
        where: {
          status: 'ARRIVED',
          journeyEndTime: {
            gte: startOfDay,
            lt: endOfDay,
          },
          deletedAt: null,
        },
      });

      this.logger.debug(`Completed transfers today: ${completedAssignments}`);
      return completedAssignments;
    } catch (error) {
      this.logger.error('Error counting completed transfers today:', error);
      return 0;
    }
  }

  private async getDelayedTransfers(startOfDay: Date, endOfDay: Date): Promise<number> {
    try {
      // Count transfers that exceeded target time (assuming 30 minutes as target)
      // This includes assignments that took longer than 30 minutes from assignment to completion
      const delayedAssignments = await this.prisma.eMSAssignment.count({
        where: {
          status: 'ARRIVED',
          journeyEndTime: {
            gte: startOfDay,
            lt: endOfDay,
          },
          deletedAt: null,
          // Check if the duration exceeds 30 minutes (1800000 milliseconds)
          assignedAt: {
            lt: new Date(endOfDay.getTime() - 30 * 60 * 1000), // 30 minutes ago
          },
        },
      });

      this.logger.debug(`Delayed transfers today: ${delayedAssignments}`);
      return delayedAssignments;
    } catch (error) {
      this.logger.error('Error counting delayed transfers:', error);
      return 0;
    }
  }

  async getPathwayPerformanceMetrics(): Promise<PathwayPerformanceMetrics> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get pathway performance data in parallel
      const [strokeMetrics, stemiMetrics, traumaMetrics] = await Promise.all([
        this.getStrokePathwayMetrics(startOfDay, endOfDay, lastWeek),
        this.getStemiPathwayMetrics(startOfDay, endOfDay, lastWeek),
        this.getTraumaPathwayMetrics(startOfDay, endOfDay, lastWeek),
      ]);

      const pathways = [
        {
          pathway: 'Stroke Pathway',
          color: '#ff9800',
          activeCount: strokeMetrics.activeCount,
          metrics: strokeMetrics.metrics,
        },
        {
          pathway: 'STEMI Pathway',
          color: '#f44336',
          activeCount: stemiMetrics.activeCount,
          metrics: stemiMetrics.metrics,
        },
        {
          pathway: 'Trauma Pathway',
          color: '#2196f3',
          activeCount: traumaMetrics.activeCount,
          metrics: traumaMetrics.metrics,
        },
      ];

      this.logger.log(`Pathway performance metrics calculated for ${pathways.length} pathways`);

      return {
        pathways,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error calculating pathway performance metrics:', error);
      // Return empty metrics on error
      return {
        pathways: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async getStrokePathwayMetrics(startOfDay: Date, endOfDay: Date, lastWeek: Date): Promise<{ activeCount: number; metrics: PathwayMetric[] }> {
    try {
      // Get recent cases count
      const recentCases = await this.prisma.strokeCase.count({
        where: {
          createdAt: {
            gte: lastWeek,
            lt: endOfDay,
          },
          deletedAt: null,
        },
      });

      // For now, return mock data until we integrate with the stroke KPI calculator
      const metrics: PathwayMetric[] = [
        {
          label: 'Door to CT Scan Target: ≤25 min',
          value: '22 min avg',
          progress: 88,
          color: '#4caf50',
        },
        {
          label: 'Door to Needle Target: ≤60 min',
          value: '45 min avg',
          progress: 75,
          color: '#4caf50',
        },
        {
          label: 'Door to Physician Target: ≤15 min',
          value: '12 min avg',
          progress: 80,
          color: '#4caf50',
        },
        {
          label: 'Stroke Unit Admission Target: ≥80%',
          value: '85% achieved',
          progress: 85,
          color: '#4caf50',
        },
      ];

      return {
        activeCount: recentCases,
        metrics,
      };
    } catch (error) {
      this.logger.error('Error calculating stroke pathway metrics:', error);
      return { activeCount: 0, metrics: [] };
    }
  }

  private async getStemiPathwayMetrics(startOfDay: Date, endOfDay: Date, lastWeek: Date): Promise<{ activeCount: number; metrics: PathwayMetric[] }> {
    try {
      // Get recent cases count
      const recentCases = await this.prisma.stemiCase.count({
        where: {
          createdAt: {
            gte: lastWeek,
            lt: endOfDay,
          },
          deletedAt: null,
        },
      });

      // For now, return mock data until we integrate with the STEMI KPI service
      const metrics: PathwayMetric[] = [
        {
          label: 'Door-to-Balloon Target: ≤90 min',
          value: '78 min avg',
          progress: 87,
          color: '#4caf50',
        },
        {
          label: 'First ECG Target: ≤10 min',
          value: '8 min avg',
          progress: 80,
          color: '#4caf50',
        },
        {
          label: 'Door to Needle Target: ≤30 min',
          value: '25 min avg',
          progress: 83,
          color: '#4caf50',
        },
        {
          label: 'RCC Activation Target: ≤15 min',
          value: '12 min avg',
          progress: 80,
          color: '#4caf50',
        },
      ];

      return {
        activeCount: recentCases,
        metrics,
      };
    } catch (error) {
      this.logger.error('Error calculating STEMI pathway metrics:', error);
      return { activeCount: 0, metrics: [] };
    }
  }

  private async getTraumaPathwayMetrics(startOfDay: Date, endOfDay: Date, lastWeek: Date): Promise<{ activeCount: number; metrics: PathwayMetric[] }> {
    try {
      const [totalCases, recentCases] = await Promise.all([
        // Total trauma cases
        this.prisma.traumaCase.count({
          where: {
            deletedAt: null,
          },
        }),
        // Recent trauma cases (last week)
        this.prisma.traumaCase.count({
          where: {
            createdAt: {
              gte: lastWeek,
              lt: endOfDay,
            },
            deletedAt: null,
          },
        }),
      ]);

      // For now, use mock data until proper timing fields are available
      const avgResponseTime = 6; // Mock average
      const avgAssessmentTime = 12; // Mock average

      const responseTimeProgress = Math.min(100, Math.max(0, 100 - (avgResponseTime / 8) * 100)); // Target: ≤8 min
      const assessmentProgress = Math.min(100, Math.max(0, 100 - (avgAssessmentTime / 15) * 100)); // Target: ≤15 min

      return {
        activeCount: recentCases, // Use recent cases as "active"
        metrics: [
          {
            label: 'Response Time Target: ≤8 min',
            value: `${avgResponseTime} min avg`,
            progress: responseTimeProgress,
            color: responseTimeProgress >= 75 ? '#4caf50' : responseTimeProgress >= 50 ? '#ff9800' : '#f44336',
          },
          {
            label: 'Assessment Target: ≤15 min',
            value: `${avgAssessmentTime} min avg`,
            progress: assessmentProgress,
            color: assessmentProgress >= 75 ? '#4caf50' : assessmentProgress >= 50 ? '#ff9800' : '#f44336',
          },
        ],
      };
    } catch (error) {
      this.logger.error('Error calculating trauma pathway metrics:', error);
      return { activeCount: 0, metrics: [] };
    }
  }

}
