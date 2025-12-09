import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StemiFilterDto } from '../dto/stemi-filter.dto';

@Injectable()
export class StemiQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getStemiCases(filters: StemiFilterDto) {
    const {
      patientId,
      originHospitalId,
      destinationHospitalId,
      modeOfArrival,
      currentStatus,
      selectedTreatment,
      ecgResult,
      eligibleForPrimaryPci,
      thrombolyticGiven,
      isTroponinPositive,
      rccActivated,
      startDate,
      endDate,
      limit = 20,
      offset = 0,
      search,
    } = filters;

    const where: any = {};

    // Apply filters
    if (patientId) {
      where.patientId = patientId;
    }

    if (originHospitalId) {
      where.originHospitalId = originHospitalId;
    }

    if (destinationHospitalId) {
      where.destinationHospitalId = destinationHospitalId;
    }

    if (modeOfArrival) {
      where.modeOfArrival = modeOfArrival;
    }

    if (currentStatus) {
      where.currentStatus = currentStatus;
    }

    if (ecgResult) {
      where.ecgResult = ecgResult;
    }

    if (selectedTreatment) {
      where.selectedTreatment = selectedTreatment;
    }

    if (eligibleForPrimaryPci !== undefined) {
      where.eligibleForPrimaryPci = eligibleForPrimaryPci;
    }

    if (thrombolyticGiven !== undefined) {
      where.thrombolyticGiven = thrombolyticGiven;
    }

    if (rccActivated !== undefined) {
      where.rccActivated = rccActivated;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        {
          patient: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { nationalId: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          presentingSymptoms: { contains: search, mode: 'insensitive' },
        },
        {
          ticket: {
            ticketNumber: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Get total count
    const total = await this.prisma.stemiCase.count({ where });

    // Get cases with pagination
    const cases = await this.prisma.stemiCase.findMany({
      where,
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            priority: true,
            status: true,
            pathway: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            age: true,
            gender: true,
            phoneNumber: true,
            address: true,
            emergencyContact: true,
            emergencyPhone: true,
            medicalHistory: true,
            allergies: true,
            medications: true,
          }
        },
        originHospital: {
          select: {
            id: true,
            name: true,
            cluster: true,
          }
        },
        destinationHospital: {
          select: {
            id: true,
            name: true,
            cluster: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    return {
      cases,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
