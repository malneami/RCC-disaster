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

  private calculateAge(dob: Date | null | undefined): number | undefined {
    if (!dob) return undefined;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

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

    const caseIds = cases.map(c => c.id);
    const beds = await this.prisma.bed.findMany({
      where: {
        caseId: { in: caseIds },
        caseType: 'TRAUMA',
        deletedAt: null,
      },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            bedType: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        currentPatient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            dateOfBirth: true,
            gender: true,
            mrn: true,
          },
        },
      },
    });

    const bedMap = new Map(beds.map(bed => [bed.caseId!, bed]));

    const parsedCases = cases.map(case_ => {
      let vitalSigns = null;
      let disposition = null;
      
      // Handle vitalSigns - could be JSON string or plain text
      if (case_.vitalSigns) {
        try {
          // Try to parse as JSON first
          vitalSigns = JSON.parse(case_.vitalSigns);
        } catch (e) {
          // If not valid JSON, treat as plain text
          vitalSigns = case_.vitalSigns;
        }
      }
      
      // Handle disposition - could be JSON string or plain text
      if (case_.disposition) {
        try {
          // Try to parse as JSON first
          disposition = JSON.parse(case_.disposition);
        } catch (e) {
          // If not valid JSON, treat as plain text
          disposition = case_.disposition;
        }
      }
      
      const assignedBed = bedMap.get(case_.id);

      return {
        ...case_,
        vitalSigns,
        disposition,
        assignedBed: assignedBed ? {
          id: assignedBed.id,
          bedNumber: assignedBed.bedNumber,
          status: assignedBed.status,
          location: assignedBed.location || undefined,
          isOperational: assignedBed.isOperational,
          unit: {
            id: assignedBed.unit.id,
            name: assignedBed.unit.name,
            bedType: assignedBed.unit.bedType,
          },
          hospital: {
            id: assignedBed.hospital.id,
            name: assignedBed.hospital.name,
          },
          currentPatient: assignedBed.currentPatient ? {
            id: assignedBed.currentPatient.id,
            name: `${assignedBed.currentPatient.firstName} ${assignedBed.currentPatient.lastName}`,
            nationalId: assignedBed.currentPatient.nationalId || undefined,
            age: this.calculateAge(assignedBed.currentPatient.dateOfBirth),
            gender: assignedBed.currentPatient.gender || undefined,
            mrn: assignedBed.currentPatient.mrn || undefined,
          } : undefined,
        } : null,
      } as any;
    });

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

    const assignedBed = await this.prisma.bed.findFirst({
      where: {
        caseId: id,
        caseType: 'TRAUMA',
        deletedAt: null,
      },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            bedType: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        currentPatient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            dateOfBirth: true,
            gender: true,
            mrn: true,
          },
        },
      },
    });

    // Parse JSON fields
    let vitalSigns = null;
    let disposition = null;
    
    // Handle vitalSigns - could be JSON string or plain text
    if (traumaCase.vitalSigns) {
      try {
        // Try to parse as JSON first
        vitalSigns = JSON.parse(traumaCase.vitalSigns);
      } catch (e) {
        // If not valid JSON, treat as plain text
        vitalSigns = traumaCase.vitalSigns;
      }
    }
    
    // Handle disposition - could be JSON string or plain text
    if (traumaCase.disposition) {
      try {
        // Try to parse as JSON first
        disposition = JSON.parse(traumaCase.disposition);
      } catch (e) {
        // If not valid JSON, treat as plain text
        disposition = traumaCase.disposition;
      }
    }
    
    return {
      ...traumaCase,
      vitalSigns,
      disposition,
      assignedBed: assignedBed ? {
        id: assignedBed.id,
        bedNumber: assignedBed.bedNumber,
        status: assignedBed.status,
        location: assignedBed.location || undefined,
        isOperational: assignedBed.isOperational,
        unit: {
          id: assignedBed.unit.id,
          name: assignedBed.unit.name,
          bedType: assignedBed.unit.bedType,
        },
        hospital: {
          id: assignedBed.hospital.id,
          name: assignedBed.hospital.name,
        },
        currentPatient: assignedBed.currentPatient ? {
          id: assignedBed.currentPatient.id,
          name: `${assignedBed.currentPatient.firstName} ${assignedBed.currentPatient.lastName}`,
          nationalId: assignedBed.currentPatient.nationalId || undefined,
          age: this.calculateAge(assignedBed.currentPatient.dateOfBirth),
          gender: assignedBed.currentPatient.gender || undefined,
          mrn: assignedBed.currentPatient.mrn || undefined,
        } : undefined,
      } : null,
    } as any;
  }
}
