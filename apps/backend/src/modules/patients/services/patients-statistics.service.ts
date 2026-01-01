import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PatientsStatisticsService {
  constructor(private prisma: PrismaService) {}

  async getStatistics(filters?: { startDate?: string; endDate?: string; hospitalId?: string }) {
    // Base where clause - only exclude deleted patients
    const whereClause: any = { deletedAt: null };
    
    // Note: Date filters are only used for "recent activity" metric, not for total counts
    // This ensures all existing patients are included in statistics

    const [
      total,
      byGender,
      byPrivacyLevel,
      byBloodType,
      byMaritalStatus,
      withInsurance,
      withoutInsurance,
      recentActivity,
      byCaseType,
      byAgeGroup,
    ] = await Promise.all([
      // Total patients
      this.prisma.patient.count({ where: whereClause }),

      // By gender
      this.prisma.patient.groupBy({
        by: ['gender'],
        where: whereClause,
        _count: true,
      }),

      // By privacy level
      this.prisma.patient.groupBy({
        by: ['privacyLevel'],
        where: whereClause,
        _count: true,
      }),

      // By blood type
      this.prisma.patient.groupBy({
        by: ['bloodType'],
        where: whereClause,
        _count: true,
      }),

      // By marital status
      this.prisma.patient.groupBy({
        by: ['maritalStatus'],
        where: whereClause,
        _count: true,
      }),

      // With insurance
      this.prisma.patient.count({
        where: {
          ...whereClause,
          OR: [
            { insuranceProvider: { not: null } },
            { insuranceNumber: { not: null } },
          ],
        },
      }),

      // Without insurance
      this.prisma.patient.count({
        where: {
          ...whereClause,
          AND: [
            { insuranceProvider: null },
            { insuranceNumber: null },
          ],
        },
      }),

      // Recent activity - use date filters if provided, otherwise default to last 30 days
      this.prisma.patient.count({
        where: {
          ...whereClause,
          updatedAt: {
            gte: filters?.startDate 
              ? new Date(filters.startDate)
              : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            ...(filters?.endDate && {
              lte: new Date(filters.endDate + 'T23:59:59.999Z'),
            }),
          },
        },
      }),

      // By case type (stroke, trauma, stemi)
      Promise.all([
        this.prisma.patient.count({
          where: {
            ...whereClause,
            strokeCases: { some: { deletedAt: null } },
          },
        }),
        this.prisma.patient.count({
          where: {
            ...whereClause,
            traumaCases: { some: { deletedAt: null } },
          },
        }),
        this.prisma.patient.count({
          where: {
            ...whereClause,
            stemiCases: { some: { deletedAt: null } },
          },
        }),
      ]),

      // By age group
      this.prisma.patient.findMany({
        where: whereClause,
        select: { dateOfBirth: true },
      }),
    ]);

    // Helper to calculate age from DoB
    const calculateAge = (dob: Date | string | null): number | null => {
        if (!dob) return null;
        const birth = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    // Process age groups
    const ageGroups = {
      '0-17': 0,
      '18-30': 0,
      '31-50': 0,
      '51-70': 0,
      '71+': 0,
      unknown: 0,
    };

    byAgeGroup.forEach((patient: { dateOfBirth: Date | null }) => {
      const age = calculateAge(patient.dateOfBirth);
      
      if (age === null) {
        ageGroups.unknown++;
      } else if (age <= 17) {
        ageGroups['0-17']++;
      } else if (age <= 30) {
        ageGroups['18-30']++;
      } else if (age <= 50) {
        ageGroups['31-50']++;
      } else if (age <= 70) {
        ageGroups['51-70']++;
      } else {
        ageGroups['71+']++;
      }
    });

    return {
      total,
      byGender: byGender.reduce((acc: Record<string, number>, item: any) => {
        acc[item.gender] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byPrivacyLevel: byPrivacyLevel.reduce((acc: Record<string, number>, item: any) => {
        acc[item.privacyLevel] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byBloodType: byBloodType.reduce((acc: Record<string, number>, item: any) => {
        if (item.bloodType) {
          acc[item.bloodType] = item._count;
        }
        return acc;
      }, {} as Record<string, number>),
      byMaritalStatus: byMaritalStatus.reduce((acc: Record<string, number>, item: any) => {
        if (item.maritalStatus) {
          acc[item.maritalStatus] = item._count;
        }
        return acc;
      }, {} as Record<string, number>),
      insurance: {
        with: withInsurance,
        without: withoutInsurance,
        percentage: total > 0 ? ((withInsurance / total) * 100).toFixed(2) : '0.00',
      },
      recentActivity,
      byCaseType: {
        stroke: byCaseType[0],
        trauma: byCaseType[1],
        stemi: byCaseType[2],
      },
      byAgeGroup: ageGroups,
    };
  }
}
