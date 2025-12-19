import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class EmsDashboardService {
  private readonly logger = new Logger(EmsDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(): Promise<any> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const [
      totalAmbulances,
      activeAmbulances,
      availableAmbulances,
      activeAssignments, // This will be deprecated or mapped to 'Assigned'
      activeSchedules,
      recentAlerts,
      todayCompletedAssignments,
      recentAssignments,
      upcomingSchedules,
      pendingTickets,
      assignedAssignments,
      inTransportAssignments,
      totalCompletedAssignments,
    ] = await Promise.all([
      this.prisma.ambulance.count({ where: { deletedAt: null } }),
      this.prisma.ambulance.count({ where: { status: 'IN_USE', isActive: true } }),
      this.prisma.ambulance.count({ where: { status: 'AVAILABLE', isActive: true } }),
      // Keep legacy activeAssignments for backward compatibility (all non-completed)
      this.prisma.eMSAssignment.count({
        where: {
          status: { in: ['ASSIGNED', 'EN_ROUTE', 'AT_PICKUP', 'PATIENT_LOADED', 'EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED'] },
          deletedAt: null,
        },
      }),
      this.prisma.driverSchedule.count({ where: { status: 'ACTIVE' } }),
      this.prisma.eMSAlert.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          ambulance: { select: { callSign: true } },
          driver: { select: { firstName: true, lastName: true } },
        },
      }),
      // Today's completed assignments
      this.prisma.eMSAssignment.count({
        where: {
          status: 'ARRIVED',
          journeyEndTime: { gte: startOfToday },
          deletedAt: null,
        },
      }),
      // Recent assignments (last 10, including active and completed)
      this.prisma.eMSAssignment.findMany({
        where: { deletedAt: null },
        orderBy: { assignedAt: 'desc' },
        take: 10,
        include: {
          ticket: {
            select: {
              ticketNumber: true,
              priority: true,
              patient: { select: { firstName: true, lastName: true } },
            },
          },
          ambulance: { select: { callSign: true } },
          driver: { select: { firstName: true, lastName: true } },
        },
      }),
      // Upcoming schedules (next 24 hours)
      this.prisma.driverSchedule.findMany({
        where: {
          status: 'ACTIVE',
          shiftStart: { gte: new Date() },
        },
        orderBy: { shiftStart: 'asc' },
        take: 5,
        include: {
          driver: { select: { firstName: true, lastName: true } },
        },
      }),
      // New Metric: Pending Tickets (Status is PENDING, waiting for assignment)
      this.prisma.ticket.count({
        where: {
          status: 'PENDING',
          deletedAt: null,
        },
      }),
      // New Metric: Assigned (Crew assigned and contacted, but not yet en route)
      this.prisma.eMSAssignment.count({
        where: {
          status: { in: ['ASSIGNED', 'EMS_CONTACT'] },
          deletedAt: null,
        },
      }),
      // New Metric: In Transport (Active mission - en route, at pickup, or transporting patient)
      this.prisma.eMSAssignment.count({
        where: {
          status: { in: ['EN_ROUTE', 'EMS_ARRIVAL', 'AT_PICKUP', 'PATIENT_LOADED', 'DEPARTED'] },
          deletedAt: null,
        },
      }),
      // Total Completed (All Time)
      this.prisma.eMSAssignment.count({
        where: {
          status: 'ARRIVED',
          deletedAt: null,
        },
      }),
    ]);

    // Calculate today's average response time
    const todayAssignments = await this.prisma.eMSAssignment.findMany({
      where: {
        status: 'ARRIVED',
        actualArrivalTime: { gte: startOfToday },
      },
      select: {
          assignedAt: true,
          actualArrivalTime: true,
      }
    });

    let totalResponseTime = 0;
    todayAssignments.forEach(a => {
        if (a.assignedAt && a.actualArrivalTime) {
            const diff = (new Date(a.actualArrivalTime).getTime() - new Date(a.assignedAt).getTime()) / (1000 * 60);
             totalResponseTime += diff;
        }
    });
    
    const avgResponseTime = todayAssignments.length > 0 ? Math.round(totalResponseTime / todayAssignments.length) : 0;
    const currentResponseTime = avgResponseTime;

    // Calculate total assignments (all time)
    const totalAssignments = await this.prisma.eMSAssignment.count({
      where: { deletedAt: null },
    });

    // Calculate assignments by status for breakdown
    const assignmentsByStatus = await this.prisma.eMSAssignment.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    });

    return {
      summary: {
        totalAmbulances,
        activeAmbulances, // This is effectively "In Use"
        availableAmbulances,
        activeAssignments,
        activeSchedules,
        responseTime: currentResponseTime,
        averageResponseTime: avgResponseTime,
        totalAssignments,
        todayCompletedAssignments,
        pendingTickets,      // NEW
        assignedAssignments, // NEW
        inTransportAssignments, // NEW
        totalCompletedAssignments, // NEW
      },
      recentAlerts,
      recentAssignments: recentAssignments.map(a => ({
        id: a.id,
        ticketNumber: a.ticket?.ticketNumber,
        status: a.status,
        assignedAt: a.assignedAt,
        patientName: a.ticket?.patient ? `${a.ticket.patient.firstName} ${a.ticket.patient.lastName}` : 'Unknown',
        ambulanceCallSign: a.ambulance?.callSign,
        driverName: a.driver ? `${a.driver.firstName} ${a.driver.lastName}` : null,
        priority: a.ticket?.priority,
      })),
      upcomingSchedules: upcomingSchedules.map(s => ({
        id: s.id,
        shiftStart: s.shiftStart,
        shiftEnd: s.shiftEnd,
        driverName: s.driver ? `${s.driver.firstName} ${s.driver.lastName}` : 'Unassigned',
      })),
      assignmentsByStatus: assignmentsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      timestamp: new Date().toISOString(),
    };
  }

  async getAmbulanceStatus(ambulanceId: string): Promise<any> {
    const ambulance = await this.prisma.ambulance.findUnique({
      where: { id: ambulanceId },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        assignments: {
          where: {
            status: { in: ['EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED'] },
            deletedAt: null,
          },
          include: {
            ticket: {
              select: {
                id: true,
                ticketNumber: true,
                priority: true,
                patient: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        gpsTrackingLogs: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
        alerts: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ambulance) {
      throw new Error(`Ambulance ${ambulanceId} not found`);
    }

    return {
      ambulance: {
        id: ambulance.id,
        callSign: ambulance.callSign,
        plateNumber: ambulance.plateNumber,
        type: ambulance.type,
        status: ambulance.status,
        baseStation: ambulance.baseStation,
      },
      driver: ambulance.driver,
      currentLocation: ambulance.gpsTrackingLogs[0] ? {
        latitude: ambulance.gpsTrackingLogs[0].latitude,
        longitude: ambulance.gpsTrackingLogs[0].longitude,
        speed: ambulance.gpsTrackingLogs[0].speed,
        direction: ambulance.gpsTrackingLogs[0].direction,
        timestamp: ambulance.gpsTrackingLogs[0].timestamp,
        address: ambulance.gpsTrackingLogs[0].locationAddress,
      } : null,
      activeAssignment: ambulance.assignments[0] || null,
      alertCount: ambulance.alerts.length,
      alerts: ambulance.alerts,
    };
  }

  async getPerformanceReport(startDate: Date, endDate: Date): Promise<any> {
    // Validate dates
    const validStartDate = startDate instanceof Date && !isNaN(startDate.getTime()) 
      ? startDate 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
    
    const validEndDate = endDate instanceof Date && !isNaN(endDate.getTime()) 
      ? endDate 
      : new Date(); // Default to now

    try {
      // Fetch ALL assignments in the period for total count, including ticket info for case type filtering
      const allAssignments = await this.prisma.eMSAssignment.findMany({
        where: {
          assignedAt: {
            gte: validStartDate,
            lte: validEndDate,
          },
          deletedAt: null,
        },
        include: {
          ambulance: true,
          ticket: {
            select: {
              emergencyType: true,
              stemiCases: { select: { id: true }, take: 1 },
              strokeCases: { select: { id: true }, take: 1 },
            },
          },
        }
      });
      
      // Filter for completed assignments (ARRIVED) for time-based metrics
      const assignments = allAssignments.filter(a => a.status === 'ARRIVED');
      
      this.logger.log(`Performance Report: Found ${allAssignments.length} total assignments, ${assignments.length} completed (ARRIVED) in date range ${validStartDate.toISOString()} to ${validEndDate.toISOString()}`);

      // Calculate Operational Metrics
      let totalResponseTime = 0;
      let totalCPT = 0;
      let cptCount = 0; // CPT only for STEMI/Stroke cases
      let totalAssignmentDuration = 0;
      let totalTransferTime = 0;
      let onTimeCount = 0;
      let totalCompleted = assignments.length;
      let totalDistance = 0;

      assignments.forEach(a => {
        // Determine case type for this assignment
        const isStemiCase = a.ticket?.emergencyType === 'STEMI' || (a.ticket?.stemiCases && a.ticket.stemiCases.length > 0);
        const isStrokeCase = a.ticket?.emergencyType === 'STROKE' || (a.ticket?.strokeCases && a.ticket.strokeCases.length > 0);
        const isCriticalCase = isStemiCase || isStrokeCase;

        // 1. EMS Response Time: Contact -> Arrival at Origin
        // assignedAt (Dispatch/Contact) -> actualArrivalTime (Arrival at Origin)
        if (a.assignedAt && a.actualArrivalTime) {
            const responseTime = (new Date(a.actualArrivalTime).getTime() - new Date(a.assignedAt).getTime()) / (1000 * 60);
            totalResponseTime += responseTime;
        }

        // 2. Case Preparation Time (CPT): Arrival -> Departure (door-out)
        // Calculate CPT for all assignments (time spent at origin hospital preparing the case)
        // This represents the time from EMS arrival at origin to departure with patient
        if (a.journeyStartTime && a.actualArrivalTime) {
             const cpt = (new Date(a.journeyStartTime).getTime() - new Date(a.actualArrivalTime).getTime()) / (1000 * 60);
             // Only count positive values (journeyStartTime should be after actualArrivalTime)
             if (cpt > 0) {
               totalCPT += cpt;
               cptCount++;
             } else if (cpt < 0) {
               // Log warning if timestamps are out of order
               this.logger.warn(`Assignment ${a.id}: journeyStartTime (${a.journeyStartTime}) is before actualArrivalTime (${a.actualArrivalTime})`);
             }
        } else {
          // Log when timestamps are missing for debugging
          if (!a.actualArrivalTime) {
            this.logger.debug(`Assignment ${a.id}: Missing actualArrivalTime for CPT calculation`);
          }
          if (!a.journeyStartTime) {
            this.logger.debug(`Assignment ${a.id}: Missing journeyStartTime for CPT calculation`);
          }
        }

        // 3. Assignment Duration: Door-out -> Arrival at Receiving.
        // journeyStartTime (Depart) -> journeyEndTime (Arrive Dest).
        if (a.journeyEndTime && a.journeyStartTime) {
            const duration = (new Date(a.journeyEndTime).getTime() - new Date(a.journeyStartTime).getTime()) / (1000 * 60);
            totalAssignmentDuration += duration;
        }

         // 4. Total Transfer Time: Contact -> Dest Arrival.
         // assignedAt -> journeyEndTime.
         if (a.journeyEndTime && a.assignedAt) {
             const transferTime = (new Date(a.journeyEndTime).getTime() - new Date(a.assignedAt).getTime()) / (1000 * 60);
             totalTransferTime += transferTime;
         }

         // 5. On-Time Arrival Rate: Based on total transfer time meeting target
         // Per spec: ≤75 min for STEMI, ≤90 min for Stroke, default 75 min for others
         if (a.journeyEndTime && a.assignedAt) {
             const totalTime = (new Date(a.journeyEndTime).getTime() - new Date(a.assignedAt).getTime()) / (1000 * 60);
             let targetTime = 75; // Default target
             if (isStrokeCase) {
               targetTime = 90; // 90 min for Stroke cases
             } else if (isStemiCase) {
               targetTime = 75; // 75 min for STEMI cases
             }
             if (totalTime <= targetTime) onTimeCount++;
         }

         if (a.distanceKm) {
             totalDistance += a.distanceKm;
         }
      });

      const avgResponseTime = totalCompleted > 0 ? totalResponseTime / totalCompleted : 0;
      // CPT is calculated for all assignments that have both timestamps
      const avgCPT = cptCount > 0 ? totalCPT / cptCount : 0;
      
      // Log diagnostic info if CPT is 0
      if (avgCPT === 0 && totalCompleted > 0) {
        this.logger.warn(`Case Preparation Time is 0.0 min. Total completed assignments: ${totalCompleted}, Assignments with both timestamps: ${cptCount}`);
      }
      const avgAssignmentDuration = totalCompleted > 0 ? totalAssignmentDuration / totalCompleted : 0;
      const avgTransferTime = totalCompleted > 0 ? totalTransferTime / totalCompleted : 0;
      const onTimeRate = totalCompleted > 0 ? Math.round((onTimeCount / totalCompleted) * 100) : 0;


      // Count active drivers: only those assigned to tickets with status "EN_ROUTE"
      const enRouteAssignments = allAssignments.filter(a => a.status === 'EN_ROUTE');
      const uniqueDrivers = new Set(enRouteAssignments.map(a => a.driverId).filter(id => id));
      const activeDriversCount = uniqueDrivers.size;

      // Fetch Fleet Data for "Snapshot" metrics (Readiness)
      const allAmbulances = await this.prisma.ambulance.findMany();
      const totalFleet = allAmbulances.length;
      const operationalFleet = allAmbulances.filter(a => a.status === 'AVAILABLE' || a.status === 'IN_USE').length;
      const availableAmbulances = allAmbulances.filter(a => a.status === 'AVAILABLE').length;
      const inUseAmbulances = allAmbulances.filter(a => a.status === 'IN_USE').length;

      const vehicleReadiness = totalFleet > 0 ? (operationalFleet / totalFleet) * 100 : 0;
      
      // Driver Utilization: Total Assignment Time / (Active Drivers * Period Length in Hours)
      // This is an approximation.
      const periodHours = (validEndDate.getTime() - validStartDate.getTime()) / (1000 * 60 * 60);
      const totalDriverHours = activeDriversCount * (periodHours > 0 ? periodHours : 24); // Avoid div by 0
      // utilizing totalAssignmentDuration (minutes) / 60
      const driverUtilization = totalDriverHours > 0 ? ((totalAssignmentDuration / 60) / totalDriverHours) * 100 : 0;


      return {
        summary: {
          totalAssignments: allAssignments.length, // Show ALL assignments, not just completed
          completedAssignments: totalCompleted, // Completed assignments for reference
          avgResponseTime: parseFloat(avgResponseTime.toFixed(1)),
          avgCasePreparationTime: parseFloat(avgCPT.toFixed(1)),
          avgAssignmentDuration: parseFloat(avgAssignmentDuration.toFixed(1)),
          avgTotalTransferTime: parseFloat(avgTransferTime.toFixed(1)),
          onTimeArrivals: onTimeRate,
          totalDistance: parseFloat(totalDistance.toFixed(1)),
        },
        fleet: {
            activeDrivers: activeDriversCount,
            totalAmbulances: totalFleet,
            availableAmbulances,
            inUseAmbulances,
            // Availability percentage: Available / Total (target ≥85%)
            availabilityPercentage: totalFleet > 0 ? parseFloat(((availableAmbulances / totalFleet) * 100).toFixed(1)) : 0,
            vehicleReadiness: parseFloat(vehicleReadiness.toFixed(1)),
            driverUtilization: parseFloat(driverUtilization.toFixed(1))
        },
        metrics: [], // We don't need detailed per-day metrics for the KPI cards right now
        period: {
          startDate: validStartDate.toISOString(),
          endDate: validEndDate.toISOString(),
        },
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error generating performance report:', error);
      return {
        summary: {
          totalAssignments: 0,
          avgResponseTime: 0,
          avgCasePreparationTime: 0,
          avgAssignmentDuration: 0,
          avgTotalTransferTime: 0,
          onTimeArrivals: 0,
          totalDistance: 0,
        },
        metrics: [],
        period: {
          startDate: validStartDate.toISOString(),
          endDate: validEndDate.toISOString(),
        },
        generatedAt: new Date().toISOString(),
        error: 'Failed to generate performance report',
      };
    }
  }

  async getFleetStatus(): Promise<any> {
    const ambulances = await this.prisma.ambulance.findMany({
      where: { isActive: true },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        gpsTrackingLogs: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
        assignments: {
          where: {
            status: { in: ['EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED'] },
            deletedAt: null,
          },
          include: {
            ticket: {
              select: {
                ticketNumber: true,
                priority: true,
              },
            },
          },
        },
        alerts: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { callSign: 'asc' },
    });

    const fleetSummary = this.calculateFleetSummary(ambulances);

    return {
      summary: fleetSummary,
      ambulances: ambulances.map(ambulance => this.mapAmbulanceToFleetStatus(ambulance)),
      lastUpdated: new Date().toISOString(),
    };
  }

  async getDriverPerformance(driverId: string, days: number = 30): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [assignments, schedules, driver] = await Promise.all([
      this.getDriverAssignments(driverId, startDate, endDate),
      this.getDriverSchedules(driverId, startDate, endDate),
      this.getDriver(driverId),
    ]);

    if (!driver) {
      throw new Error(`Driver ${driverId} not found`);
    }

    const performance = this.calculateDriverPerformance(assignments, schedules);

    return {
      driver,
      performance,
      assignments,
      schedules,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days,
      },
      generatedAt: new Date().toISOString(),
    };
  }


  private calculatePerformanceSummary(metrics: any[]): any {
    return {
      totalTransfers: metrics.reduce((sum, m) => sum + m.totalTransfers, 0),
      averageResponseTime: metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + (m.averageResponseTime || 0), 0) / metrics.length 
        : 0,
      averageTransferTime: metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + (m.averageTransferTime || 0), 0) / metrics.length 
        : 0,
      totalDistance: metrics.reduce((sum, m) => sum + (m.totalDistanceKm || 0), 0),
      onTimeArrivals: metrics.reduce((sum, m) => sum + (m.onTimeArrivals || 0), 0),
      delayedArrivals: metrics.reduce((sum, m) => sum + (m.delayedArrivals || 0), 0),
      cancelledTransfers: metrics.reduce((sum, m) => sum + (m.cancelledTransfers || 0), 0),
      equipmentFailures: metrics.reduce((sum, m) => sum + (m.equipmentFailures || 0), 0),
    };
  }

  private calculateFleetSummary(ambulances: any[]): any {
    return {
      total: ambulances.length,
      available: ambulances.filter(a => a.status === 'AVAILABLE').length,
      inUse: ambulances.filter(a => a.status === 'IN_USE').length,
      offline: ambulances.filter(a => a.status === 'OFFLINE').length,
      withAlerts: ambulances.filter(a => a.alerts.length > 0).length,
    };
  }

  private mapAmbulanceToFleetStatus(ambulance: any): any {
    return {
      id: ambulance.id,
      callSign: ambulance.callSign,
      plateNumber: ambulance.plateNumber,
      type: ambulance.type,
      status: ambulance.status,
      baseStation: ambulance.baseStation,
      driver: ambulance.driver,
      currentLocation: ambulance.gpsTrackingLogs[0] ? {
        latitude: ambulance.gpsTrackingLogs[0].latitude,
        longitude: ambulance.gpsTrackingLogs[0].longitude,
        speed: ambulance.gpsTrackingLogs[0].speed,
        timestamp: ambulance.gpsTrackingLogs[0].timestamp,
      } : null,
      activeAssignment: ambulance.assignments[0] || null,
      alertCount: ambulance.alerts.length,
      alerts: ambulance.alerts,
    };
  }

  private async getDriverAssignments(driverId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.prisma.eMSAssignment.findMany({
      where: {
        driverId,
        assignedAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      include: {
        ambulance: { select: { callSign: true, plateNumber: true } },
        ticket: { select: { ticketNumber: true, priority: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  private async getDriverSchedules(driverId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.prisma.driverSchedule.findMany({
      where: {
        driverId,
        shiftStart: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      orderBy: { shiftStart: 'desc' },
    });
  }

  private async getDriver(driverId: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
      },
    });
  }

  private calculateDriverPerformance(assignments: any[], schedules: any[]): any {
    return {
      totalAssignments: assignments.length,
      completedAssignments: assignments.filter(a => a.status === 'COMPLETED').length,
      cancelledAssignments: assignments.filter(a => a.status === 'CANCELLED').length,
      totalSchedules: schedules.length,
      totalOvertimeHours: schedules.reduce((sum, s) => sum + (s.overtimeHours || 0), 0),
      averageResponseTime: 0,
      onTimeArrivals: 0,
    };
  }

  /**
   * Generate performance metrics for a specific date (defaults to yesterday)
   * This should be scheduled to run daily
   */
  async generateDailyPerformanceMetric(date?: Date): Promise<void> {
    const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    this.logger.log(`Generating performance metrics for ${startOfDay.toISOString()}`);

    try {
      // Get all active ambulances
      const ambulances = await this.prisma.ambulance.findMany({
        where: { isActive: true },
      });

      for (const ambulance of ambulances) {
        // Get assignments for this ambulance on this day
        const assignments = await this.prisma.eMSAssignment.findMany({
          where: {
            ambulanceId: ambulance.id,
            status: 'ARRIVED', // Only completed assignments
            journeyEndTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
            deletedAt: null,
          },
          include: {
            ticket: true,
          }
        });

        // Calculate metrics
        const totalTransfers = assignments.length;
        
        let totalResponseTime = 0;
        let totalTransferTime = 0;
        let onTimeArrivals = 0;
        let delayedArrivals = 0;

        for (const assignment of assignments) {
          // Response time: Assigned -> EMS Arrival
          if (assignment.actualArrivalTime && assignment.assignedAt) {
            const responseTime = (new Date(assignment.actualArrivalTime).getTime() - new Date(assignment.assignedAt).getTime()) / (1000 * 60);
            totalResponseTime += Math.max(0, responseTime);
          }

          // Transfer time: Journey Start -> Journey End (or EMS Arrival -> Arrived)
          if (assignment.journeyEndTime && assignment.journeyStartTime) {
             const transferTime = (new Date(assignment.journeyEndTime).getTime() - new Date(assignment.journeyStartTime).getTime()) / (1000 * 60);
             totalTransferTime += Math.max(0, transferTime);
          } else if (assignment.journeyEndTime && assignment.actualArrivalTime) {
             // Fallback
             const transferTime = (new Date(assignment.journeyEndTime).getTime() - new Date(assignment.actualArrivalTime).getTime()) / (1000 * 60);
             totalTransferTime += Math.max(0, transferTime);
          }

          // Check on-time performance (e.g., 30 mins)
          if (assignment.journeyEndTime && assignment.assignedAt) {
             const totalDuration = (new Date(assignment.journeyEndTime).getTime() - new Date(assignment.assignedAt).getTime()) / (1000 * 60);
             if (totalDuration <= 30) {
               onTimeArrivals++;
             } else {
               delayedArrivals++;
             }
          }
        }

        const averageResponseTime = totalTransfers > 0 ? totalResponseTime / totalTransfers : 0;
        const averageTransferTime = totalTransfers > 0 ? totalTransferTime / totalTransfers : 0;

        // Upsert metric record
        const existingMetric = await this.prisma.eMSPerformanceMetric.findFirst({
          where: {
            ambulanceId: ambulance.id,
            date: startOfDay,
          }
        });

        const data = {
            ambulanceId: ambulance.id,
            date: startOfDay,
            totalTransfers,
            averageResponseTime,
            averageTransferTime,
            totalDistanceKm: totalTransfers * 15.0, // Mock estimate
            onTimeArrivals,
            delayedArrivals,
            cancelledTransfers: 0, 
            equipmentFailures: 0,
        };

        if (existingMetric) {
           await this.prisma.eMSPerformanceMetric.update({
             where: { id: existingMetric.id },
             data
           });
        } else {
           await this.prisma.eMSPerformanceMetric.create({
             data
           });
        }
      }

      this.logger.log(`Generated performance metrics for ${ambulances.length} ambulances`);

    } catch (error) {
      this.logger.error('Error generating daily performance metrics:', error);
      throw error;
    }
  }

  async getAssignmentStatusDistribution(startDate: Date, endDate: Date): Promise<any> {
    const validStartDate = startDate instanceof Date && !isNaN(startDate.getTime()) 
      ? startDate 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const validEndDate = endDate instanceof Date && !isNaN(endDate.getTime()) 
      ? endDate 
      : new Date();

    try {
      // Get all assignments in the period
      const assignments = await this.prisma.eMSAssignment.findMany({
        where: {
          assignedAt: {
            gte: validStartDate,
            lte: validEndDate,
          },
          deletedAt: null,
        },
        select: {
          status: true,
        },
      });

      // Count by status
      const statusCounts: Record<string, number> = {};
      assignments.forEach(a => {
        const status = a.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // Map to chart-friendly format
      const distribution = [
        { name: 'Arrived', value: statusCounts['ARRIVED'] || 0 },
        { name: 'In Progress', value: (statusCounts['EMS_CONTACT'] || 0) + (statusCounts['EMS_ARRIVAL'] || 0) + (statusCounts['DEPARTED'] || 0) + (statusCounts['EN_ROUTE'] || 0) + (statusCounts['AT_PICKUP'] || 0) + (statusCounts['PATIENT_LOADED'] || 0) },
        { name: 'Cancelled', value: statusCounts['CANCELLED'] || 0 },
      ].filter(item => item.value > 0);

      return distribution;
    } catch (error) {
      this.logger.error('Error getting assignment status distribution:', error);
      return [
        { name: 'Arrived', value: 0 },
        { name: 'In Progress', value: 0 },
        { name: 'Cancelled', value: 0 },
      ];
    }
  }

  async getResponseTimeTrends(startDate: Date, endDate: Date): Promise<any> {
    const validStartDate = startDate instanceof Date && !isNaN(startDate.getTime()) 
      ? startDate 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const validEndDate = endDate instanceof Date && !isNaN(endDate.getTime()) 
      ? endDate 
      : new Date();

    try {
      // Get assignments that have reached EMS_ARRIVAL or later (so we have actualArrivalTime)
      const assignments = await this.prisma.eMSAssignment.findMany({
        where: {
          status: { in: ['EMS_ARRIVAL', 'DEPARTED', 'ARRIVED'] },
          assignedAt: {
            gte: validStartDate,
            lte: validEndDate,
          },
          actualArrivalTime: { not: null },
          deletedAt: null,
        },
        select: {
          assignedAt: true,
          actualArrivalTime: true,
        },
      });

      // Group by day and calculate average response time per day
      const dayMap: Record<string, { total: number; count: number }> = {};
      
      assignments.forEach(a => {
        if (a.assignedAt && a.actualArrivalTime) {
          const day = new Date(a.assignedAt).toISOString().split('T')[0];
          const responseTime = (new Date(a.actualArrivalTime).getTime() - new Date(a.assignedAt).getTime()) / (1000 * 60);
          
          if (!dayMap[day]) {
            dayMap[day] = { total: 0, count: 0 };
          }
          dayMap[day].total += responseTime;
          dayMap[day].count += 1;
        }
      });

      // Convert to chart format
      const trends = Object.keys(dayMap)
        .sort()
        .map(day => {
          const dayData = dayMap[day];
          const avg = dayData.count > 0 ? dayData.total / dayData.count : 0;
          const date = new Date(day);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          
          return {
            name: dayName,
            avg: parseFloat(avg.toFixed(1)),
            target: 10, // Target response time in minutes
          };
        });

      return trends;
    } catch (error) {
      this.logger.error('Error getting response time trends:', error);
      return [];
    }
  }
}