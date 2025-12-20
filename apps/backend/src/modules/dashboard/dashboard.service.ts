import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StrokeKPICalculatorService } from '../stroke-cases/services/stroke-kpi-calculator.service';
import { StemiKpiService } from '../stemi-cases/services/stemi-kpi.service';
import { TraumaKpiService } from '../trauma-cases/services/trauma-kpi.service';
import { StrokeCasesService } from '../stroke-cases/stroke-cases.service';

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

export interface DashboardFilters {
  hospitalId?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly strokeKpiCalculator: StrokeKPICalculatorService,
    private readonly stemiKpiService: StemiKpiService,
    private readonly traumaKpiService: TraumaKpiService,
    private readonly strokeCasesService: StrokeCasesService,
  ) {}

  async getDashboardMetrics(filters?: DashboardFilters): Promise<DashboardMetrics> {
    try {
      // Parse date filters
      const today = new Date();
      let startOfDay: Date;
      let endOfDay: Date;

      if (filters?.startDate && filters?.endDate) {
        startOfDay = new Date(filters.startDate + 'T00:00:00.000Z');
        endOfDay = new Date(filters.endDate + 'T23:59:59.999Z');
      } else {
        // Default to "All Time" (from Jan 1, 2024) if no date filters provided
        startOfDay = new Date('2024-01-01T00:00:00.000Z');
        endOfDay = new Date();
      }

      // Get all metrics in parallel for better performance
      const [
        activeTransfers,
        urgentPathwayCases,
        completedToday,
        delayedTransfers,
      ] = await Promise.all([
        this.getActiveTransfers(startOfDay, endOfDay, filters?.hospitalId),
        this.getUrgentPathwayCases(startOfDay, endOfDay, filters?.hospitalId),
        this.getCompletedToday(startOfDay, endOfDay, filters?.hospitalId),
        this.getDelayedTransfers(startOfDay, endOfDay, filters?.hospitalId),
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

  private async getActiveTransfers(startOfDay: Date, endOfDay: Date, hospitalId?: string): Promise<number> {
    try {
      // Count tickets that were active during the date range
      const whereClause: any = {
        status: {
          in: ['PENDING', 'ASSIGNED', 'IN_TRANSPORT'],
        },
        OR: [
          {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          {
            updatedAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        ],
        deletedAt: null,
      };

      // Add hospital filter if provided
      if (hospitalId) {
        whereClause.AND = [
          {
            OR: [
              { originHospitalId: hospitalId },
              { destinationHospitalId: hospitalId },
            ],
          },
        ];
      }

      const count = await this.prisma.ticket.count({
        where: whereClause,
      });

      this.logger.debug(`Active transfers count (from tickets) for date range: ${count}`);
      return count;
    } catch (error) {
      this.logger.error('Error counting active transfers:', error);
      return 0;
    }
  }

  private async getUrgentPathwayCases(startOfDay: Date, endOfDay: Date, hospitalId?: string): Promise<number> {
    try {
      // Build where clauses for both queries with date filtering
      const ticketWhereClause: any = {
        priority: 'CRITICAL',
        status: {
          in: ['PENDING', 'ASSIGNED', 'IN_TRANSPORT'],
        },
        OR: [
          {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          {
            updatedAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        ],
        deletedAt: null,
      };

      const criticalCaseWhereClause: any = {
        status: 'ACTIVE',
        OR: [
          {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          {
            updatedAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        ],
        deletedAt: null,
      };

      // Add hospital filter if provided
      if (hospitalId) {
        ticketWhereClause.AND = [
          {
            OR: [
              { originHospitalId: hospitalId },
              { destinationHospitalId: hospitalId },
            ],
          },
        ];
        criticalCaseWhereClause.hospitalId = hospitalId;
      }

      // Count tickets with high priority and critical emergency cases
      const [urgentTickets, criticalCases] = await Promise.all([
        // High priority tickets that are active
        this.prisma.ticket.count({
          where: ticketWhereClause,
        }),
        // Active critical cases (STEMI, Stroke, Trauma)
        this.prisma.criticalCase.count({
          where: criticalCaseWhereClause,
        }),
      ]);

      const total = urgentTickets + criticalCases;
      this.logger.debug(`Urgent pathway cases for date range: Tickets=${urgentTickets}, Critical=${criticalCases}, Total=${total}`);
      return total;
    } catch (error) {
      this.logger.error('Error counting urgent pathway cases:', error);
      return 0;
    }
  }

  private async getCompletedToday(startOfDay: Date, endOfDay: Date, hospitalId?: string): Promise<number> {
    try {
      // Count completed EMS assignments today
      const whereClause: any = {
        status: 'ARRIVED',
        journeyEndTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
        deletedAt: null,
      };

      // Add hospital filter if provided
      if (hospitalId) {
        whereClause.OR = [
          { originHospitalId: hospitalId },
          { destinationHospitalId: hospitalId },
        ];
      }

      const completedAssignments = await this.prisma.eMSAssignment.count({
        where: whereClause,
      });

      this.logger.debug(`Completed transfers today: ${completedAssignments}`);
      return completedAssignments;
    } catch (error) {
      this.logger.error('Error counting completed transfers today:', error);
      return 0;
    }
  }

  private async getDelayedTransfers(startOfDay: Date, endOfDay: Date, hospitalId?: string): Promise<number> {
    try {
      // Count transfers that exceeded target time (assuming 30 minutes as target)
      // This includes assignments that took longer than 30 minutes from assignment to completion
      const whereClause: any = {
        status: 'ARRIVED',
        journeyEndTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
        deletedAt: null,
      };

      // Add hospital filter if provided
      if (hospitalId) {
        whereClause.OR = [
          { originHospitalId: hospitalId },
          { destinationHospitalId: hospitalId },
        ];
      }

      // Fetch timestamps to calculate duration in memory
      // (Prisma doesn't easily support field comparison in where clause)
      const completedAssignments = await this.prisma.eMSAssignment.findMany({
        where: whereClause,
        select: {
          assignedAt: true,
          journeyEndTime: true,
        },
      });

      // Filter for assignments that took > 30 minutes
      const TARGET_DURATION_MS = 30 * 60 * 1000; // 30 minutes
      
      const delayedCount = completedAssignments.filter(assignment => {
        if (!assignment.assignedAt || !assignment.journeyEndTime) return false;
        const duration = new Date(assignment.journeyEndTime).getTime() - new Date(assignment.assignedAt).getTime();
        return duration > TARGET_DURATION_MS;
      }).length;

      this.logger.debug(`Delayed transfers today: ${delayedCount}`);
      return delayedCount;
    } catch (error) {
      this.logger.error('Error counting delayed transfers:', error);
      return 0;
    }
  }

  async getPathwayPerformanceMetrics(filters?: DashboardFilters): Promise<PathwayPerformanceMetrics> {
    try {
      // Parse date filters
      const today = new Date();
      let startOfDay: Date;
      let endOfDay: Date;
      let lastWeek: Date;

      if (filters?.startDate && filters?.endDate) {
        startOfDay = new Date(filters.startDate + 'T00:00:00.000Z');
        endOfDay = new Date(filters.endDate + 'T23:59:59.999Z');
        lastWeek = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        // Default to "All Time" (from Jan 1, 2024) if no date filters provided
        startOfDay = new Date('2024-01-01T00:00:00.000Z');
        endOfDay = new Date();
        // Set "last week" to start of day as well to capture full range for "active/recent" counts when viewing all time
        lastWeek = new Date('2024-01-01T00:00:00.000Z');
      }

      // Get pathway performance data in parallel
      const [strokeMetrics, stemiMetrics, traumaMetrics] = await Promise.all([
        this.getStrokePathwayMetrics(startOfDay, endOfDay, lastWeek, filters?.hospitalId),
        this.getStemiPathwayMetrics(startOfDay, endOfDay, lastWeek, filters?.hospitalId),
        this.getTraumaPathwayMetrics(startOfDay, endOfDay, lastWeek, filters?.hospitalId),
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

  private async getStrokePathwayMetrics(startOfDay: Date, endOfDay: Date, lastWeek: Date, hospitalId?: string): Promise<{ activeCount: number; metrics: PathwayMetric[] }> {
    try {
      // Build where clause for recent cases count
      const whereClause: any = {
        createdAt: {
          gte: lastWeek,
          lt: endOfDay,
        },
        deletedAt: null,
      };

      // Add hospital filter if provided
      if (hospitalId) {
        whereClause.originHospitalId = hospitalId;
      }

      // Get recent cases count
      const recentCases = await this.prisma.strokeCase.count({
        where: whereClause,
      });

      // Get dynamic KPI data using the stroke cases service
      const strokeKpiData = await this.strokeCasesService.getKPISummary({
        hospitalId: hospitalId,
        startDate: startOfDay.toISOString().split('T')[0],
        endDate: endOfDay.toISOString().split('T')[0],
      });

      // Transform KPI data to PathwayMetric format
      const metrics: PathwayMetric[] = [
        {
          label: 'Door to Physician Target: ≤15 min',
          value: strokeKpiData.averageTimings?.doorToPhysician ? `${strokeKpiData.averageTimings.doorToPhysician.toFixed(1)} min avg` : 'No data',
          progress: strokeKpiData.kpiPerformance?.kpi1?.percentage || 0,
          color: this.getKpiColor(strokeKpiData.kpiPerformance?.kpi1?.percentage, 90, false), // Higher percentage is better
        },
        {
          label: 'Door to CT Scan Target: ≤20 min',
          value: strokeKpiData.averageTimings?.doorToCtScan ? `${strokeKpiData.averageTimings.doorToCtScan.toFixed(1)} min avg` : 'No data',
          progress: strokeKpiData.kpiPerformance?.kpi2?.percentage || 0,
          color: this.getKpiColor(strokeKpiData.kpiPerformance?.kpi2?.percentage, 90, false), // Higher percentage is better
        },
        {
          label: 'Door to Needle Target: ≤60 min',
          value: strokeKpiData.averageTimings?.doorToNeedle ? `${strokeKpiData.averageTimings.doorToNeedle.toFixed(1)} min avg` : 'No data',
          progress: strokeKpiData.kpiPerformance?.kpi3?.percentage || 0,
          color: this.getKpiColor(strokeKpiData.kpiPerformance?.kpi3?.percentage, 90, false), // Higher percentage is better
        },
        {
          label: 'Stroke Unit Admission Target: ≥80%',
          value: strokeKpiData.kpiPerformance?.kpi6?.percentage ? `${strokeKpiData.kpiPerformance.kpi6.percentage.toFixed(1)}% achieved` : 'No data',
          progress: strokeKpiData.kpiPerformance?.kpi6?.percentage || 0,
          color: this.getKpiColor(strokeKpiData.kpiPerformance?.kpi6?.percentage, 80, false), // Higher is better
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

  private async getStemiPathwayMetrics(startOfDay: Date, endOfDay: Date, lastWeek: Date, hospitalId?: string): Promise<{ activeCount: number; metrics: PathwayMetric[] }> {
    try {
      // Build where clause for recent cases count
      const whereClause: any = {
        createdAt: {
          gte: lastWeek,
          lt: endOfDay,
        },
        deletedAt: null,
      };

      // Add hospital filter if provided
      if (hospitalId) {
        whereClause.originHospitalId = hospitalId;
      }

      // Get recent cases count
      const recentCases = await this.prisma.stemiCase.count({
        where: whereClause,
      });

      // Get dynamic KPI data using the STEMI KPI service
      const stemiKpiData = await this.stemiKpiService.getKpiSummary(
        hospitalId,
        startOfDay.toISOString().split('T')[0],
        endOfDay.toISOString().split('T')[0]
      );

      // Transform KPI data to PathwayMetric format
      const metrics: PathwayMetric[] = [
        {
          label: 'First ECG Target: ≤10 min',
          value: stemiKpiData.kpi1?.percentage ? `${stemiKpiData.kpi1.percentage}% achieved` : 'No data',
          progress: stemiKpiData.kpi1?.percentage || 0,
          color: this.getKpiColor(stemiKpiData.kpi1?.percentage, 90, false), // Higher percentage is better
        },
        {
          label: 'Door to Needle Target: ≤30 min',
          value: stemiKpiData.averageDoorToNeedleTime ? `${stemiKpiData.averageDoorToNeedleTime} min avg` : 'No data',
          progress: stemiKpiData.kpi3?.percentage || 0,
          color: this.getKpiColor(stemiKpiData.kpi3?.percentage, 90, false), // Higher percentage is better
        },
        {
          label: 'Door In Door Out Target: ≤30 min',
          value: stemiKpiData.kpi5?.percentage ? `${stemiKpiData.kpi5.percentage}% achieved` : 'No data',
          progress: stemiKpiData.kpi5?.percentage || 0,
          color: this.getKpiColor(stemiKpiData.kpi5?.percentage, 90, false), // Higher percentage is better
        },
        {
          label: 'RCC Activation Target: ≤15 min',
          value: stemiKpiData.kpi4?.percentage ? `${stemiKpiData.kpi4.percentage}% achieved` : 'No data',
          progress: stemiKpiData.kpi4?.percentage || 0,
          color: this.getKpiColor(stemiKpiData.kpi4?.percentage, 90, false), // Higher percentage is better
        },
        {
          label: 'Door-to-Balloon Target: ≤90 min',
          value: stemiKpiData.averageDoorToBalloonTime ? `${stemiKpiData.averageDoorToBalloonTime} min avg` : 'No data',
          progress: stemiKpiData.kpi2?.percentage || 0,
          color: this.getKpiColor(stemiKpiData.kpi2?.percentage, 90, false), // Higher percentage is better
        }
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

  private async getTraumaPathwayMetrics(startOfDay: Date, endOfDay: Date, lastWeek: Date, hospitalId?: string): Promise<{ activeCount: number; metrics: PathwayMetric[] }> {
    try {
      // Build where clause for recent cases count
      const recentWhereClause: any = {
        createdAt: {
          gte: lastWeek,
          lt: endOfDay,
        },
        deletedAt: null,
      };

      // Add hospital filter if provided
      if (hospitalId) {
        recentWhereClause.originHospitalId = hospitalId;
      }

      // Get recent cases count
      const recentCases = await this.prisma.traumaCase.count({
        where: recentWhereClause,
      });

      // Get dynamic KPI data using the trauma KPI service
      let traumaKpiData = await this.traumaKpiService.getKPISummary(
        hospitalId,
        startOfDay.toISOString().split('T')[0],
        endOfDay.toISOString().split('T')[0]
      );

      // If no data found with date filtering, try without date filtering to get overall metrics
      if (traumaKpiData.totalCases === 0) {
        this.logger.debug('No trauma cases found with date filtering, trying without date filter');
        traumaKpiData = await this.traumaKpiService.getKPISummary(hospitalId);
      }

      this.logger.debug(`Trauma KPI data for hospital ${hospitalId}:`, {
        totalCases: traumaKpiData.totalCases,
        mortalityRate: traumaKpiData.mortalityRate,
        averageResponseTime: traumaKpiData.averageResponseTime,
        dateRange: `${startOfDay.toISOString().split('T')[0]} to ${endOfDay.toISOString().split('T')[0]}`
      });

      // Transform KPI data to PathwayMetric format
      const metrics: PathwayMetric[] = [
        {
          label: 'Response Time Target: ≤8 min',
          value: traumaKpiData.averageResponseTime ? `${traumaKpiData.averageResponseTime} min avg` : 'No data',
          progress: traumaKpiData.averageResponseTime ? Math.min(100, Math.max(0, 100 - (traumaKpiData.averageResponseTime / 8) * 100)) : 0,
          color: this.getKpiColor(traumaKpiData.averageResponseTime, 8, true), // Lower is better
        },
        {
          label: 'Mortality Rate Target: ≤5%',
          value: traumaKpiData.mortalityRate ? `${traumaKpiData.mortalityRate}% mortality` : 'No data',
          progress: traumaKpiData.mortalityRate ? Math.min(100, Math.max(0, 100 - (traumaKpiData.mortalityRate / 5) * 100)) : 0,
          color: this.getKpiColor(traumaKpiData.mortalityRate, 5, true), // Lower is better
        },
      ];

      return {
        activeCount: recentCases,
        metrics,
      };
    } catch (error) {
      this.logger.error('Error calculating trauma pathway metrics:', error);
      return { activeCount: 0, metrics: [] };
    }
  }

  /**
   * Helper method to determine KPI color based on performance
   */
  private getKpiColor(value: number | undefined, target: number, lowerIsBetter: boolean): string {
    if (value === undefined || value === null) {
      return '#757575'; // Gray for no data
    }

    if (lowerIsBetter) {
      // For time-based KPIs where lower is better
      if (value <= target) return '#4caf50'; // Green
      if (value <= target * 1.5) return '#ff9800'; // Orange
      return '#f44336'; // Red
    } else {
      // For percentage KPIs where higher is better
      if (value >= target) return '#4caf50'; // Green
      if (value >= target * 0.75) return '#ff9800'; // Orange
      return '#f44336'; // Red
    }
  }

}
