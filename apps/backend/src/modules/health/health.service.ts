import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private prisma: PrismaService) {}

  async checkHealth() {
    const checks = {
      database: false,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
    }

    return {
      status: checks.database ? 'healthy' : 'unhealthy',
      checks,
    };
  }

  async getSystemStats() {
    try {
      const [
        totalUsers,
        totalHospitals,
        totalPatients,
        activeTickets,
        totalActivities,
      ] = await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.hospital.count({ where: { deletedAt: null } }),
        this.prisma.patient.count({ where: { deletedAt: null } }),
        this.prisma.ticket.count({
          where: {
            deletedAt: null,
            status: { in: ['PENDING', 'ASSIGNED', 'IN_TRANSPORT'] },
          },
        }),
        this.prisma.activity.count(),
      ]);

      return {
        users: totalUsers,
        hospitals: totalHospitals,
        patients: totalPatients,
        activeTickets,
        activities: totalActivities,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get system stats:', error);
      return null;
    }
  }
}