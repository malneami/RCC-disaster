import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { TraumaCase, TraumaModeOfArrival, TraumaMechanismOfInjury } from '@prisma/client';

export interface TraumaFilters {
  patientId?: string;
  originHospitalId?: string;
  destinationHospitalId?: string;
  modeOfArrival?: TraumaModeOfArrival;
  mechanismOfInjury?: TraumaMechanismOfInjury;
  criticalCase?: boolean;
  transferCase?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class TraumaQueryService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: TraumaFilters): Promise<{ cases: TraumaCase[]; total: number }> {
    const where: any = {
      deletedAt: null, // Only show non-deleted records
    };

    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters?.originHospitalId) {
      where.originHospitalId = filters.originHospitalId;
    }

    if (filters?.destinationHospitalId) {
      where.destinationHospitalId = filters.destinationHospitalId;
    }

    if (filters?.modeOfArrival) {
      where.modeOfArrival = filters.modeOfArrival;
    }

    if (filters?.mechanismOfInjury) {
      where.mechanismOfInjury = filters.mechanismOfInjury;
    }

    if (filters?.criticalCase !== undefined) {
      where.criticalCase = filters.criticalCase;
    }

    if (filters?.transferCase !== undefined) {
      where.transferCase = filters.transferCase;
    }

    if (filters?.startDate || filters?.endDate) {
      where.arrivalDateTime = {};
      if (filters.startDate) {
        where.arrivalDateTime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.arrivalDateTime.lte = new Date(filters.endDate);
      }
    }

    const [cases, total] = await Promise.all([
      this.prisma.traumaCase.findMany({
        where,
        include: {
          patient: true,
          originHospital: true,
          destinationHospital: true,
          createdBy: true,
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.traumaCase.count({ where }),
    ]);

    // Parse JSON fields for each case
    const parsedCases = cases.map(case_ => ({
      ...case_,
      vitalSigns: case_.vitalSigns ? JSON.parse(case_.vitalSigns) : null,
      disposition: case_.disposition ? JSON.parse(case_.disposition) : null,
    }));

    return { cases: parsedCases, total };
  }

  async findOne(id: string): Promise<TraumaCase> {
    const traumaCase = await this.prisma.traumaCase.findUnique({
      where: { 
        id,
        deletedAt: null, // Only show non-deleted records
      },
      include: {
        patient: true,
        originHospital: true,
        destinationHospital: true,
        createdBy: true,
      },
    });

    if (!traumaCase) {
      throw new NotFoundException('Trauma case not found');
    }

    // Parse JSON fields
    return {
      ...traumaCase,
      vitalSigns: traumaCase.vitalSigns ? JSON.parse(traumaCase.vitalSigns) : null,
      disposition: traumaCase.disposition ? JSON.parse(traumaCase.disposition) : null,
    };
  }
}
