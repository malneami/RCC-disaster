import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Patient } from '@prisma/client';

export interface PatientSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  mrn: string;
  dateOfBirth: Date;
  gender: string;
  phoneNumber?: string;
  email?: string;
  strokeCasesCount: number;
  lastVisit?: Date;
}

@Injectable()
export class PatientSearchService {
  private readonly logger = new Logger(PatientSearchService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Search for patients by National ID (partial match after 4th digit)
   */
  async searchByNationalId(partialNationalId: string): Promise<PatientSearchResult[]> {
    if (!partialNationalId || partialNationalId.length < 4) {
      return [];
    }

    this.logger.log(`Searching patients by National ID: ${partialNationalId}`);

    try {
      const patients = await this.prisma.patient.findMany({
        where: {
          nationalId: {
            startsWith: partialNationalId,
          },
          deletedAt: null,
        },
        include: {
          strokeCases: {
            select: {
              id: true,
              createdAt: true,
              strokeType: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1, // Get most recent stroke case for last visit
          },
          _count: {
            select: {
              strokeCases: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10, // Limit to 10 results
      });

      return patients.map(patient => ({
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        nationalId: patient.nationalId,
        mrn: patient.mrn,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        phoneNumber: patient.phoneNumber,
        email: patient.email,
        strokeCasesCount: patient._count.strokeCases,
        lastVisit: patient.strokeCases[0]?.createdAt,
      }));
    } catch (error) {
      this.logger.error('Error searching patients by National ID:', error);
      return [];
    }
  }

  /**
   * Search for patients by name (first name or last name)
   */
  async searchByName(query: string): Promise<PatientSearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();
    this.logger.log(`Searching patients by name: ${searchTerm}`);

    try {
      const patients = await this.prisma.patient.findMany({
        where: {
          OR: [
            {
              firstName: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              lastName: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              AND: [
                {
                  firstName: {
                    contains: searchTerm.split(' ')[0],
                    mode: 'insensitive',
                  },
                },
                {
                  lastName: {
                    contains: searchTerm.split(' ')[1] || '',
                    mode: 'insensitive',
                  },
                },
              ],
            },
          ],
          deletedAt: null,
        },
        include: {
          strokeCases: {
            select: {
              id: true,
              createdAt: true,
              strokeType: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
          _count: {
            select: {
              strokeCases: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      return patients.map(patient => ({
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        nationalId: patient.nationalId,
        mrn: patient.mrn,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        phoneNumber: patient.phoneNumber,
        email: patient.email,
        strokeCasesCount: patient._count.strokeCases,
        lastVisit: patient.strokeCases[0]?.createdAt,
      }));
    } catch (error) {
      this.logger.error('Error searching patients by name:', error);
      return [];
    }
  }

  /**
   * Get patient timeline (all stroke cases) by patient ID
   */
  async getPatientTimeline(patientId: string): Promise<any[]> {
    this.logger.log(`Getting timeline for patient: ${patientId}`);

    try {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          strokeCases: {
            include: {
              timeline: {
                orderBy: {
                  eventTimestamp: 'asc',
                },
              },
              originHospital: {
                select: {
                  id: true,
                  name: true,
                },
              },
              destinationHospital: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!patient) {
        return [];
      }

      // Flatten timeline events from all stroke cases
      const timelineEvents = [];
      
      for (const strokeCase of patient.strokeCases) {
        for (const event of strokeCase.timeline) {
          timelineEvents.push({
            ...event,
            strokeCase: {
              id: strokeCase.id,
              strokeType: strokeCase.strokeType,
              currentStatus: strokeCase.currentStatus,
              createdAt: strokeCase.createdAt,
              originHospital: strokeCase.originHospital,
              destinationHospital: strokeCase.destinationHospital,
            },
            patient: {
              id: patient.id,
              firstName: patient.firstName,
              lastName: patient.lastName,
              nationalId: patient.nationalId,
              mrn: patient.mrn,
            },
          });
        }
      }

      // Sort all events by timestamp
      return timelineEvents.sort((a, b) => 
        new Date(a.eventTimestamp).getTime() - new Date(b.eventTimestamp).getTime()
      );
    } catch (error) {
      this.logger.error('Error getting patient timeline:', error);
      return [];
    }
  }

  /**
   * Get patient timeline by National ID
   */
  async getPatientTimelineByNationalId(nationalId: string): Promise<any[]> {
    const patient = await this.prisma.patient.findUnique({
      where: { nationalId },
      select: { id: true },
    });

    if (!patient) {
      return [];
    }

    return this.getPatientTimeline(patient.id);
  }
}
