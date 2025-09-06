import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStrokeCaseDto } from './dto/create-stroke-case.dto';
import { CreateStrokeCaseV2Dto } from './dto/create-stroke-case-v2.dto';
import { UpdateStrokeCaseDto } from './dto/update-stroke-case.dto';
import { StrokeCase, StrokeStatus, StrokeType, TicketPriority, TicketPathway } from '@prisma/client';
import { PatientMergeService } from '../patients/patient-merge.service';

@Injectable()
export class StrokeCasesService {
  constructor(
    private prisma: PrismaService,
    private patientMergeService: PatientMergeService
  ) {}

  async create(createStrokeCaseDto: CreateStrokeCaseV2Dto, userId: string): Promise<StrokeCase> {
    try {
      console.log('=== STROKE CASE SERVICE CREATE ===');
      console.log('DTO:', JSON.stringify(createStrokeCaseDto, null, 2));
      console.log('User ID:', userId);
      
      let patientId = createStrokeCaseDto.patientId;
      let ticketId = createStrokeCaseDto.ticketId;

    // Auto-create patient if not provided but patientInfo is provided
    if (!patientId && createStrokeCaseDto.patientInfo) {
      console.log('=== PATIENT PROCESSING ===');
      console.log('Patient Info:', createStrokeCaseDto.patientInfo);
      
      // Check for existing patient by National ID first (primary identifier)
      if (createStrokeCaseDto.patientInfo.nationalId && createStrokeCaseDto.patientInfo.nationalId.trim()) {
        console.log('Checking for existing patient by National ID:', createStrokeCaseDto.patientInfo.nationalId);
        
        try {
          // Use patient merge service to find and merge duplicates
          const existingPatientId = await this.patientMergeService.findAndMergeDuplicatesByNationalId(
            createStrokeCaseDto.patientInfo.nationalId.trim()
          );
          
          if (existingPatientId) {
            console.log('Found existing patient (or merged duplicates):', existingPatientId);
            patientId = existingPatientId;
          } else {
            console.log('No existing patient found with National ID, will create new patient');
          }
        } catch (error) {
          console.error('Error checking for duplicate patients:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw new BadRequestException(`Error checking for duplicate patients: ${errorMessage}`);
        }
      }
      
      // If no existing patient found, create new one
      if (!patientId) {
        console.log('Creating new patient...');
        
        // Validate required fields
        if (!createStrokeCaseDto.patientInfo.firstName || !createStrokeCaseDto.patientInfo.lastName) {
          throw new BadRequestException('Patient first name and last name are required');
        }
        
        const patientData: any = {
          firstName: createStrokeCaseDto.patientInfo.firstName.trim(),
          lastName: createStrokeCaseDto.patientInfo.lastName.trim(),
          nationalId: createStrokeCaseDto.patientInfo.nationalId?.trim() || null,
          mrn: createStrokeCaseDto.patientInfo.mrn?.trim() || null,
          phoneNumber: createStrokeCaseDto.patientInfo.phoneNumber?.trim() || null,
          email: createStrokeCaseDto.patientInfo.email?.trim() || null,
          createdById: userId,
        };
        
        // Handle required fields with defaults if not provided
        if (createStrokeCaseDto.patientInfo.dateOfBirth) {
          patientData.dateOfBirth = new Date(createStrokeCaseDto.patientInfo.dateOfBirth);
        } else {
          patientData.dateOfBirth = new Date('1900-01-01'); // Default date
        }
        
        if (createStrokeCaseDto.patientInfo.gender) {
          patientData.gender = createStrokeCaseDto.patientInfo.gender;
        } else {
          patientData.gender = 'UNKNOWN'; // Default gender
        }
        
        console.log('Creating new patient with data:', patientData);
        
        try {
          const patient = await this.prisma.patient.create({
            data: patientData,
          });
          console.log('New patient created:', patient.id);
          patientId = patient.id;
        } catch (error: any) {
          console.error('Error creating patient:', error);
          
          // If it's a unique constraint violation, try to find the existing patient
          if (error.code === 'P2002') {
            console.log('Unique constraint violation, attempting to find existing patient...');
            
            if (createStrokeCaseDto.patientInfo.nationalId) {
              const existingPatient = await this.prisma.patient.findUnique({
                where: { nationalId: createStrokeCaseDto.patientInfo.nationalId.trim() }
              });
              if (existingPatient) {
                console.log('Found existing patient after constraint violation:', existingPatient.id);
                patientId = existingPatient.id;
              }
            }
            
            if (!patientId) {
              throw new BadRequestException('Patient with this National ID already exists');
            }
          } else {
            throw error;
          }
        }
      }
    }

    // Auto-create ticket if not provided
    if (!ticketId && patientId) {
      // Generate a unique ticket number
      const ticketCount = await this.prisma.ticket.count();
      const ticketNumber = `STK-${Date.now()}-${(ticketCount + 1).toString().padStart(4, '0')}`;
      
      const ticketData = {
        ticketNumber,
        patientId: patientId,
        originHospitalId: createStrokeCaseDto.originHospitalId,
        priority: TicketPriority.HIGH,
        pathway: TicketPathway.STROKE,
        chiefComplaint: createStrokeCaseDto.chiefComplaint || 'Stroke symptoms',
        isEmergency: true,
        createdById: userId,
      };
      console.log('Creating ticket with data:', ticketData);
      const ticket = await this.prisma.ticket.create({
        data: ticketData,
      });
      console.log('Ticket created:', ticket.id);
      ticketId = ticket.id;
    }

    // Validate that we have both patient and ticket
    if (!patientId) {
      throw new BadRequestException('Patient ID or patient information is required');
    }
    if (!ticketId) {
      throw new BadRequestException('Ticket ID is required or could not be created');
    }

    // Validate that the ticket exists and is a stroke pathway
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.pathway !== 'STROKE') {
      throw new BadRequestException('Ticket must be a stroke pathway');
    }

    // Calculate KPIs automatically
    console.log('Calculating KPIs...');
    const kpiData = this.calculateKPIs(createStrokeCaseDto);
    console.log('KPIs calculated:', kpiData);

    // Extract only the fields that exist in the CreateStrokeCaseV2Dto
    const strokeCaseData = {
        ticketId,
        patientId,
        originHospitalId: createStrokeCaseDto.originHospitalId,
        chiefComplaint: createStrokeCaseDto.chiefComplaint,
        presentingSymptoms: createStrokeCaseDto.presentingSymptoms,
        strokeType: createStrokeCaseDto.strokeType,
        currentStatus: createStrokeCaseDto.currentStatus,
        strokeSeverity: createStrokeCaseDto.strokeSeverity,
        selectedTreatment: createStrokeCaseDto.selectedTreatment,
        createdById: userId,
        ...kpiData,
      };

    console.log('Creating stroke case with data:', strokeCaseData);
    const strokeCase = await this.prisma.strokeCase.create({
      data: strokeCaseData,
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            pathway: true,
            status: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            mrn: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        originHospital: {
          select: {
            id: true,
            name: true,
            hasStrokeUnit: true,
            hasThrombolysis: true,
            hasThrombectomy: true,
          },
        },
        destinationHospital: {
          select: {
            id: true,
            name: true,
            hasStrokeUnit: true,
            hasThrombolysis: true,
            hasThrombectomy: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        timeline: {
          orderBy: { eventTimestamp: 'asc' },
          take: 10,
        },
      },
    });

    // Create initial timeline event for case creation
    console.log('Creating initial timeline event...');
    await this.prisma.strokeTimeline.create({
      data: {
        strokeCaseId: strokeCase.id,
        ticketId: ticketId,
        fromStatus: null,
        toStatus: createStrokeCaseDto.currentStatus,
        eventTimestamp: new Date(),
        eventDescription: `Stroke case created - ${createStrokeCaseDto.strokeType} stroke`,
        eventLocation: 'ED',
        eventType: 'ARRIVAL',
        triggeredBy: userId,
        createdById: userId,
      },
    });

    console.log('Stroke case and initial timeline event created successfully');
    return strokeCase;
    } catch (error) {
      console.error('=== STROKE CASE CREATION ERROR ===');
      console.error('Error:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  async findAll(filters?: {
    hospitalId?: string;
    strokeType?: StrokeType;
    status?: StrokeStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<StrokeCase[]> {
    const where: any = {
      deletedAt: null,
    };

    if (filters?.hospitalId) {
      where.OR = [
        { originHospitalId: filters.hospitalId },
        { destinationHospitalId: filters.hospitalId },
      ];
    }

    if (filters?.strokeType) {
      where.strokeType = filters.strokeType;
    }

    if (filters?.status) {
      where.currentStatus = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    return this.prisma.strokeCase.findMany({
      where,
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            pathway: true,
            status: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            mrn: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        originHospital: {
          select: {
            id: true,
            name: true,
            hasStrokeUnit: true,
          },
        },
        destinationHospital: {
          select: {
            id: true,
            name: true,
            hasStrokeUnit: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<StrokeCase> {
    console.log('=== FINDONE DEBUG ===');
    console.log('Looking for stroke case ID:', id);
    const strokeCase = await this.prisma.strokeCase.findUnique({
      where: { id, deletedAt: null },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            pathway: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            mrn: true,
            dateOfBirth: true,
            gender: true,
            phoneNumber: true,
            medicalHistory: true,
            riskFactors: true,
          },
        },
        originHospital: {
          select: {
            id: true,
            name: true,
            address: true,
            hasStrokeUnit: true,
            hasThrombolysis: true,
            hasThrombectomy: true,
            strokeUnitBeds: true,
            strokeUnitBedsAvailable: true,
          },
        },
        destinationHospital: {
          select: {
            id: true,
            name: true,
            address: true,
            hasStrokeUnit: true,
            hasThrombolysis: true,
            hasThrombectomy: true,
            strokeUnitBeds: true,
            strokeUnitBedsAvailable: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        timeline: {
          orderBy: { eventTimestamp: 'asc' },
          include: {
            triggeredByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        // assessmentScores: {
        //   orderBy: { assessmentDateTime: 'asc' },
        // },
        // rehabilitation: {
        //   include: {
        //     therapist: {
        //       select: {
        //         id: true,
        //         firstName: true,
        //         lastName: true,
        //       },
        //     },
        //     rehabilitationCenter: {
        //       select: {
        //         id: true,
        //         name: true,
        //       },
        //     },
        //   },
        // },
      },
    });

    if (!strokeCase) {
      throw new NotFoundException('Stroke case not found');
    }

    console.log('=== FINDONE RESULT ===');
    console.log('Patient data:', JSON.stringify(strokeCase.patient, null, 2));
    return strokeCase;
  }

  async update(id: string, updateStrokeCaseDto: UpdateStrokeCaseDto, userId: string): Promise<StrokeCase> {
    const existingCase = await this.findOne(id);

    // Calculate updated KPIs
    const kpiData = this.calculateKPIs({ ...existingCase, ...updateStrokeCaseDto });

    return this.prisma.strokeCase.update({
      where: { id },
      data: {
        ...updateStrokeCaseDto,
        symptomOnset: updateStrokeCaseDto.symptomOnset ? new Date(updateStrokeCaseDto.symptomOnset) : undefined,
        lastKnownWell: updateStrokeCaseDto.lastKnownWell ? new Date(updateStrokeCaseDto.lastKnownWell) : undefined,
        pathwayStarted: updateStrokeCaseDto.pathwayStarted ? new Date(updateStrokeCaseDto.pathwayStarted) : undefined,
        pathwayCompleted: updateStrokeCaseDto.pathwayCompleted ? new Date(updateStrokeCaseDto.pathwayCompleted) : undefined,
        strokeUnitAdmissionTime: updateStrokeCaseDto.strokeUnitAdmissionTime ? new Date(updateStrokeCaseDto.strokeUnitAdmissionTime) : undefined,
        dischargeDate: updateStrokeCaseDto.dischargeDate ? new Date(updateStrokeCaseDto.dischargeDate) : undefined,
        followUpCallDate: updateStrokeCaseDto.followUpCallDate ? new Date(updateStrokeCaseDto.followUpCallDate) : undefined,
        updatedAt: new Date(),
        ...kpiData,
      },
      include: {
        ticket: true,
        patient: true,
        originHospital: true,
        destinationHospital: true,
        createdBy: true,
        timeline: {
          orderBy: { eventTimestamp: 'asc' },
          take: 10,
        },
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if exists

    await this.prisma.strokeCase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getKPISummary(hospitalId?: string, year?: number, month?: number) {
    const where: any = {
      deletedAt: null,
    };

    if (hospitalId) {
      where.OR = [
        { originHospitalId: hospitalId },
        { destinationHospitalId: hospitalId },
      ];
    }

    if (year) {
      where.createdAt = {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      };
    }

    if (month && year) {
      where.createdAt = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      };
    }

    const cases = await this.prisma.strokeCase.findMany({
      where,
      select: {
        strokeType: true,
        doorToImagingMinutes: true,
        doorToNeedleMinutes: true,
        doorToGroinMinutes: true,
        strokeUnitAdmissionTime: true,
        dysphagiaScreeningMinutes: true,
        earlyMobilizationHours: true,
        secondaryPrevention: true,
        dischargeDestination: true,
        metKpi1: true,
        metKpi2: true,
        metKpi3: true,
        metKpi4: true,
        metKpi5: true,
        metKpi6: true,
        metKpi7: true,
        metKpi8: true,
        successful: true,
        thirtyDayReadmission: true,
        ninetyDayMortality: true,
        lengthOfStayDays: true,
        // mrsDischarge: true,
      },
    });

    return this.calculateKPISummary(cases);
  }

  private calculateKPIs(data: any) {
    const kpis = {
      metKpi1: false,
      metKpi2: false,
      metKpi3: false,
      metKpi4: false,
      metKpi5: false,
      metKpi6: false,
      metKpi7: false,
      metKpi8: false,
    };

    // KPI 1: Door to imaging ≤25min
    if (data.doorToImagingMinutes !== null && data.doorToImagingMinutes !== undefined) {
      kpis.metKpi1 = data.doorToImagingMinutes <= 25;
    }

    // KPI 2: Door to needle ≤60min
    if (data.doorToNeedleMinutes !== null && data.doorToNeedleMinutes !== undefined) {
      kpis.metKpi2 = data.doorToNeedleMinutes <= 60;
    }

    // KPI 3: Door to groin ≤90min
    if (data.doorToGroinMinutes !== null && data.doorToGroinMinutes !== undefined) {
      kpis.metKpi3 = data.doorToGroinMinutes <= 90;
    }

    // KPI 4: Stroke unit admission ≤4hr (240min)
    if (data.strokeUnitAdmissionTime && data.pathwayStarted) {
      const admissionTime = new Date(data.strokeUnitAdmissionTime);
      const pathwayStart = new Date(data.pathwayStarted);
      const minutesToAdmission = (admissionTime.getTime() - pathwayStart.getTime()) / (1000 * 60);
      kpis.metKpi4 = minutesToAdmission <= 240;
    }

    // KPI 5: Dysphagia screening ≤4hr (240min)
    if (data.dysphagiaScreeningMinutes !== null && data.dysphagiaScreeningMinutes !== undefined) {
      kpis.metKpi5 = data.dysphagiaScreeningMinutes <= 240;
    }

    // KPI 6: Early mobilization ≤24hr (1440min)
    if (data.earlyMobilizationHours !== null && data.earlyMobilizationHours !== undefined) {
      kpis.metKpi6 = data.earlyMobilizationHours <= 24;
    }

    // KPI 7: Secondary prevention prescribed
    kpis.metKpi7 = !!data.secondaryPrevention;

    // KPI 8: Appropriate rehabilitation referral
    kpis.metKpi8 = data.dischargeDestination === 'REHABILITATION' || data.dischargeDestination === 'HOME';

    return kpis;
  }

  private calculateKPISummary(cases: any[]) {
    const totalCases = cases.length;
    const ischemicCases = cases.filter(c => c.strokeType === 'ISCHEMIC').length;
    const hemorrhagicCases = cases.filter(c => c.strokeType === 'HEMORRHAGIC').length;
    const tiaCases = cases.filter(c => c.strokeType === 'TIA').length;

    const kpi1Met = cases.filter(c => c.metKpi1).length;
    const kpi2Met = cases.filter(c => c.metKpi2).length;
    const kpi3Met = cases.filter(c => c.metKpi3).length;
    const kpi4Met = cases.filter(c => c.metKpi4).length;
    const kpi5Met = cases.filter(c => c.metKpi5).length;
    const kpi6Met = cases.filter(c => c.metKpi6).length;
    const kpi7Met = cases.filter(c => c.metKpi7).length;
    const kpi8Met = cases.filter(c => c.metKpi8).length;

    const avgDoorToImaging = this.calculateAverage(cases.map(c => c.doorToImagingMinutes));
    const avgDoorToNeedle = this.calculateAverage(cases.map(c => c.doorToNeedleMinutes));
    const avgDoorToGroin = this.calculateAverage(cases.map(c => c.doorToGroinMinutes));

    const successfulCases = cases.filter(c => c.successful).length;
    const readmissionCases = cases.filter(c => c.thirtyDayReadmission).length;
    const mortalityCases = cases.filter(c => c.ninetyDayMortality).length;
    const avgLengthOfStay = this.calculateAverage(cases.map(c => c.lengthOfStayDays));
    const independentDischarge = cases.filter(c => c.mrsDischarge && c.mrsDischarge <= 2).length;

    return {
      totalCases,
      strokeTypeBreakdown: {
        ischemic: ischemicCases,
        hemorrhagic: hemorrhagicCases,
        tia: tiaCases,
      },
      kpiPerformance: {
        kpi1: { met: kpi1Met, total: totalCases, percentage: totalCases > 0 ? (kpi1Met / totalCases) * 100 : 0 },
        kpi2: { met: kpi2Met, total: totalCases, percentage: totalCases > 0 ? (kpi2Met / totalCases) * 100 : 0 },
        kpi3: { met: kpi3Met, total: totalCases, percentage: totalCases > 0 ? (kpi3Met / totalCases) * 100 : 0 },
        kpi4: { met: kpi4Met, total: totalCases, percentage: totalCases > 0 ? (kpi4Met / totalCases) * 100 : 0 },
        kpi5: { met: kpi5Met, total: totalCases, percentage: totalCases > 0 ? (kpi5Met / totalCases) * 100 : 0 },
        kpi6: { met: kpi6Met, total: totalCases, percentage: totalCases > 0 ? (kpi6Met / totalCases) * 100 : 0 },
        kpi7: { met: kpi7Met, total: totalCases, percentage: totalCases > 0 ? (kpi7Met / totalCases) * 100 : 0 },
        kpi8: { met: kpi8Met, total: totalCases, percentage: totalCases > 0 ? (kpi8Met / totalCases) * 100 : 0 },
      },
      averageTimings: {
        doorToImaging: avgDoorToImaging,
        doorToNeedle: avgDoorToNeedle,
        doorToGroin: avgDoorToGroin,
      },
      outcomes: {
        successRate: totalCases > 0 ? (successfulCases / totalCases) * 100 : 0,
        readmissionRate: totalCases > 0 ? (readmissionCases / totalCases) * 100 : 0,
        mortalityRate: totalCases > 0 ? (mortalityCases / totalCases) * 100 : 0,
        averageLengthOfStay: avgLengthOfStay,
        independentDischargeRate: totalCases > 0 ? (independentDischarge / totalCases) * 100 : 0,
      },
    };
  }

  private calculateAverage(values: (number | null | undefined)[]): number {
    const validValues = values.filter(v => v !== null && v !== undefined) as number[];
    return validValues.length > 0 ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;
  }
}
