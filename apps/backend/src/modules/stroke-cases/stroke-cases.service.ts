import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStrokeCaseDto } from './dto/create-stroke-case.dto';
import { CreateStrokeCaseV2Dto } from './dto/create-stroke-case-v2.dto';
import { UpdateStrokeCaseDto } from './dto/update-stroke-case.dto';
import { StrokeCase, StrokeStatus, StrokeType, TicketPriority, TicketPathway, PatientGender } from '@prisma/client';
import { PatientMergeService } from '../patients/patient-merge.service';
import { StrokeKPICalculatorService } from './services/stroke-kpi-calculator.service';

@Injectable()
export class StrokeCasesService {
  constructor(
    private prisma: PrismaService,
    private patientMergeService: PatientMergeService,
    private kpiCalculator: StrokeKPICalculatorService
  ) {}

  async create(createStrokeCaseDto: CreateStrokeCaseV2Dto, userId: string): Promise<StrokeCase> {
    try {
      console.log('=== STROKE CASE SERVICE CREATE ===');
      console.log('DTO:', JSON.stringify(createStrokeCaseDto, null, 2));
      console.log('User ID:', userId);
      
      // Ensure we have a valid user ID
      let validUserId = userId;
      if (!validUserId || validUserId === '4600ecc0-c41b-4d99-8ddd-78ef909182cb') {
        // Try to find the admin user
        const adminUser = await this.prisma.user.findFirst({
          where: { 
            email: 'admin@rcc.com',
            deletedAt: null 
          }
        });
        if (adminUser) {
          validUserId = adminUser.id;
          console.log('Using admin user ID:', validUserId);
        } else {
          // Fallback to first available user for testing
          const firstUser = await this.prisma.user.findFirst({
            where: { deletedAt: null }
          });
          if (firstUser) {
            validUserId = firstUser.id;
            console.log('Using first available user ID:', validUserId);
          } else {
            throw new BadRequestException('No valid user found for creating stroke case');
          }
        }
      }
      
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
          // If there's an error with duplicate checking, try to find the patient directly
          try {
            const existingPatient = await this.prisma.patient.findUnique({
              where: { nationalId: createStrokeCaseDto.patientInfo.nationalId.trim() }
            });
            if (existingPatient) {
              console.log('Found existing patient after error:', existingPatient.id);
              patientId = existingPatient.id;
            } else {
              console.log('No existing patient found, will create new patient');
            }
          } catch (findError) {
            console.error('Error finding patient directly:', findError);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new BadRequestException(`Error checking for duplicate patients: ${errorMessage}`);
          }
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
          age: createStrokeCaseDto.patientInfo.age || null,
          nationalId: createStrokeCaseDto.patientInfo.nationalId?.trim() || null,
          mrn: createStrokeCaseDto.patientInfo.mrn?.trim() || null,
          phoneNumber: createStrokeCaseDto.patientInfo.phoneNumber?.trim() || null,
          email: createStrokeCaseDto.patientInfo.email?.trim() || null,
          createdById: validUserId,
        };
        
        // Handle age field (preferred over dateOfBirth)
        if (createStrokeCaseDto.patientInfo.age !== undefined && createStrokeCaseDto.patientInfo.age !== null) {
          patientData.age = createStrokeCaseDto.patientInfo.age;
        } else if (createStrokeCaseDto.patientInfo.dateOfBirth) {
          // Calculate age from dateOfBirth if age not provided
          const today = new Date();
          const birthDate = new Date(createStrokeCaseDto.patientInfo.dateOfBirth);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          patientData.age = age;
          patientData.dateOfBirth = birthDate;
        } else {
          // Default values if neither provided
          patientData.age = 0; // Default age
          patientData.dateOfBirth = new Date('1900-01-01'); // Default date
        }
        
        if (createStrokeCaseDto.patientInfo.gender) {
          patientData.gender = createStrokeCaseDto.patientInfo.gender as PatientGender;
        } else {
          patientData.gender = PatientGender.MALE; // Default gender
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
            
            // Try to find by National ID first
            if (createStrokeCaseDto.patientInfo.nationalId) {
              const existingPatient = await this.prisma.patient.findUnique({
                where: { nationalId: createStrokeCaseDto.patientInfo.nationalId.trim() }
              });
              if (existingPatient) {
                console.log('Found existing patient after constraint violation:', existingPatient.id);
                patientId = existingPatient.id;
              }
            }
            
            // If not found by National ID, try by MRN
            if (!patientId && createStrokeCaseDto.patientInfo.mrn) {
              const existingPatient = await this.prisma.patient.findUnique({
                where: { mrn: createStrokeCaseDto.patientInfo.mrn.trim() }
              });
              if (existingPatient) {
                console.log('Found existing patient by MRN after constraint violation:', existingPatient.id);
                patientId = existingPatient.id;
              }
            }
            
            if (!patientId) {
              throw new BadRequestException('Patient with this National ID or MRN already exists');
            }
          } else {
            throw error;
          }
        }
      }
    }

    // Auto-create ticket if not provided AND destination hospital is specified
    if (!ticketId && patientId && createStrokeCaseDto.destinationHospitalId) {
      console.log('=== TICKET PROCESSING ===');
      console.log('No ticket ID provided but destination hospital specified, creating new transfer ticket...');
      
      // Generate a unique ticket number
      const ticketCount = await this.prisma.ticket.count();
      const ticketNumber = `STK-${Date.now()}-${(ticketCount + 1).toString().padStart(4, '0')}`;
      
      const ticketData = {
        ticketNumber,
        patientId: patientId,
        originHospitalId: createStrokeCaseDto.originHospitalId,
        destinationHospitalId: createStrokeCaseDto.destinationHospitalId,
        priority: TicketPriority.CRITICAL,
        pathway: TicketPathway.STROKE,
        isEmergency: true,
        createdById: validUserId,
      };
      console.log('Creating transfer ticket with data:', ticketData);
      try {
        const ticket = await this.prisma.ticket.create({
          data: ticketData,
        });
        console.log('Transfer ticket created:', ticket.id);
        ticketId = ticket.id;
      } catch (error: any) {
        console.error('Error creating transfer ticket:', error);
        if (error.code === 'P2002') {
          // Unique constraint violation on ticket number
          console.log('Ticket number collision, generating new number...');
          const newTicketNumber = `STK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
          const ticket = await this.prisma.ticket.create({
            data: { ...ticketData, ticketNumber: newTicketNumber },
          });
          console.log('Transfer ticket created with new number:', ticket.id);
          ticketId = ticket.id;
        } else {
          throw error;
        }
      }
    } else if (!ticketId && patientId && !createStrokeCaseDto.destinationHospitalId) {
      console.log('=== TICKET PROCESSING ===');
      console.log('No ticket ID provided and no destination hospital - creating standalone stroke case without ticket');
    }

    // Validate that we have patient
    if (!patientId) {
      throw new BadRequestException('Patient ID or patient information is required');
    }

    // Validate ticket only if it exists (for transfer cases)
    let ticket = null;
    if (ticketId) {
      ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }
    }

    if (ticket && ticket.pathway !== 'STROKE') {
      throw new BadRequestException('Ticket must be a stroke pathway');
    }

    // Calculate KPIs automatically
    console.log('Calculating KPIs...');
    const kpiData = this.calculateKPIs(createStrokeCaseDto);
    console.log('KPIs calculated:', kpiData);
    console.log('Door to CT Report Minutes:', kpiData.doorToCtReportMinutes);
    console.log('Door to Thrombolysis Order Minutes:', kpiData.doorToThrombolysisOrderMinutes);

    // Extract only the fields that exist in the CreateStrokeCaseV2Dto
    const strokeCaseData = {
        ticketId: ticketId || null,
        patientId,
        originHospitalId: createStrokeCaseDto.originHospitalId,
        destinationHospitalId: createStrokeCaseDto.destinationHospitalId,
        strokeType: createStrokeCaseDto.strokeType,
        currentStatus: createStrokeCaseDto.currentStatus,
        selectedTreatment: createStrokeCaseDto.selectedTreatment,
        createdById: validUserId,
        
        // Include all timing fields from the DTO
        modeOfArrival: createStrokeCaseDto.modeOfArrival,
        srcaCallTime: createStrokeCaseDto.srcaCallTime ? new Date(createStrokeCaseDto.srcaCallTime) : undefined,
        timeOfSymptomOnset: createStrokeCaseDto.timeOfSymptomOnset ? new Date(createStrokeCaseDto.timeOfSymptomOnset) : undefined,
        lastKnownNormal: createStrokeCaseDto.lastKnownNormal ? new Date(createStrokeCaseDto.lastKnownNormal) : undefined,
        dateOfAdmission: createStrokeCaseDto.dateOfAdmission ? new Date(createStrokeCaseDto.dateOfAdmission) : undefined,
        timeOfTriage: createStrokeCaseDto.timeOfTriage ? new Date(createStrokeCaseDto.timeOfTriage) : undefined,
        timeOfPhysicianAssessment: createStrokeCaseDto.timeOfPhysicianAssessment ? new Date(createStrokeCaseDto.timeOfPhysicianAssessment) : undefined,
        
        // Clinical Assessment & Diagnosis
        strokeTypeDetailed: createStrokeCaseDto.strokeTypeDetailed,
        swallowingScreeningPerformed: createStrokeCaseDto.swallowingScreeningPerformed,
        timeOfSwallowingScreening: createStrokeCaseDto.timeOfSwallowingScreening ? new Date(createStrokeCaseDto.timeOfSwallowingScreening) : undefined,
        swallowingScreeningResult: createStrokeCaseDto.swallowingScreeningResult,
        ctScanPerformed: createStrokeCaseDto.ctScanPerformed,
        timeOfCtScanStart: createStrokeCaseDto.timeOfCtScanStart ? new Date(createStrokeCaseDto.timeOfCtScanStart) : undefined,
        timeOfCtReportFinal: createStrokeCaseDto.timeOfCtReportFinal ? new Date(createStrokeCaseDto.timeOfCtReportFinal) : undefined,
        ctFindings: createStrokeCaseDto.ctFindings,
        lvoDetected: createStrokeCaseDto.lvoDetected,
        candidateForIVThrombolysis: createStrokeCaseDto.candidateForIVThrombolysis,
        thrombolysisOrderTime: createStrokeCaseDto.thrombolysisOrderTime ? new Date(createStrokeCaseDto.thrombolysisOrderTime) : undefined,
        ivThrombolysisAdministrationTime: createStrokeCaseDto.ivThrombolysisAdministrationTime ? new Date(createStrokeCaseDto.ivThrombolysisAdministrationTime) : undefined,
        ivThrombolysisGiven: createStrokeCaseDto.ivThrombolysisGiven,
        reasonForNotAdministeringIV: createStrokeCaseDto.reasonForNotAdministeringIV,
        candidateForMechanicalThrombectomy: createStrokeCaseDto.candidateForMechanicalThrombectomy,
        timeOfMechanicalThrombectomyPuncture: createStrokeCaseDto.timeOfMechanicalThrombectomyPuncture ? new Date(createStrokeCaseDto.timeOfMechanicalThrombectomyPuncture) : undefined,
        mechanicalThrombectomyPerformed: createStrokeCaseDto.mechanicalThrombectomyPerformed,
        timeOfThrombectomyComplete: createStrokeCaseDto.timeOfThrombectomyComplete ? new Date(createStrokeCaseDto.timeOfThrombectomyComplete) : undefined,
        
        // Disposition & Transfer Decisions
        facilityHasCt: createStrokeCaseDto.facilityHasCt,
        transferToAnotherHospital: createStrokeCaseDto.transferToAnotherHospital,
        timeOfTransferActivation: createStrokeCaseDto.timeOfTransferActivation ? new Date(createStrokeCaseDto.timeOfTransferActivation) : undefined,
        timeOfTransferDeparture: createStrokeCaseDto.timeOfTransferDeparture ? new Date(createStrokeCaseDto.timeOfTransferDeparture) : undefined,
        prehospitalNotificationBySrca: createStrokeCaseDto.prehospitalNotificationBySrca,
        prehospitalNotificationByUccPhc: createStrokeCaseDto.prehospitalNotificationByUccPhc,
        disposition: createStrokeCaseDto.disposition,
        referralTo: createStrokeCaseDto.referralTo,
        admittedToStrokeUnit: createStrokeCaseDto.admittedToStrokeUnit,
        
        // Follow-up & Outcome Tracking
        followUpContactAttempted: createStrokeCaseDto.followUpContactAttempted,
        modifiedRankinScaleAt90Days: createStrokeCaseDto.modifiedRankinScaleAt90Days,
        
        // Include calculated KPI data
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
            age: true,
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
        ticketId: ticketId || null,
        fromStatus: null,
        toStatus: createStrokeCaseDto.currentStatus,
        eventTimestamp: new Date(),
        eventDescription: `Stroke case created - ${createStrokeCaseDto.strokeType} stroke`,
        eventLocation: 'ED',
        eventType: 'ARRIVAL',
        triggeredBy: validUserId,
        createdById: validUserId,
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
            age: true,
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
            age: true,
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
    try {
      console.log('=== STROKE CASE UPDATE DEBUG ===');
      console.log('Stroke Case ID:', id);
      console.log('Update DTO:', JSON.stringify(updateStrokeCaseDto, null, 2));
      console.log('DTO keys:', Object.keys(updateStrokeCaseDto));
      
      const existingCase = await this.findOne(id);
      console.log('Existing case found:', existingCase.id);

      // Handle patient info updates if provided

      // Calculate updated KPIs
      // Convert Date objects to strings for the DTO
      const existingCaseForKPI = {
        ...existingCase,
        srcaCallTime: existingCase.srcaCallTime ? existingCase.srcaCallTime.toISOString() : null,
        timeOfSymptomOnset: existingCase.timeOfSymptomOnset ? existingCase.timeOfSymptomOnset.toISOString() : null,
        lastKnownNormal: existingCase.lastKnownNormal ? existingCase.lastKnownNormal.toISOString() : null,
        dateOfAdmission: existingCase.dateOfAdmission ? existingCase.dateOfAdmission.toISOString() : null,
        timeOfTriage: existingCase.timeOfTriage ? existingCase.timeOfTriage.toISOString() : null,
        timeOfPhysicianAssessment: existingCase.timeOfPhysicianAssessment ? existingCase.timeOfPhysicianAssessment.toISOString() : null,
        timeOfSwallowingScreening: existingCase.timeOfSwallowingScreening ? existingCase.timeOfSwallowingScreening.toISOString() : null,
        timeOfCtScanStart: existingCase.timeOfCtScanStart ? existingCase.timeOfCtScanStart.toISOString() : null,
        timeOfCtReportFinal: existingCase.timeOfCtReportFinal ? existingCase.timeOfCtReportFinal.toISOString() : null,
        thrombolysisOrderTime: existingCase.thrombolysisOrderTime ? existingCase.thrombolysisOrderTime.toISOString() : null,
        ivThrombolysisAdministrationTime: existingCase.ivThrombolysisAdministrationTime ? existingCase.ivThrombolysisAdministrationTime.toISOString() : null,
        timeOfMechanicalThrombectomyPuncture: existingCase.timeOfMechanicalThrombectomyPuncture ? existingCase.timeOfMechanicalThrombectomyPuncture.toISOString() : null,
        timeOfThrombectomyComplete: existingCase.timeOfThrombectomyComplete ? existingCase.timeOfThrombectomyComplete.toISOString() : null,
        timeOfTransferActivation: existingCase.timeOfTransferActivation ? existingCase.timeOfTransferActivation.toISOString() : null,
        timeOfTransferDeparture: existingCase.timeOfTransferDeparture ? existingCase.timeOfTransferDeparture.toISOString() : null,
      };
      
      console.log('Calculating KPIs...');
      let kpiData = {};
      try {
        kpiData = this.calculateKPIsForUpdate({ ...existingCaseForKPI, ...updateStrokeCaseDto });
        console.log('KPI data calculated:', kpiData);
      } catch (kpiError) {
        console.error('KPI calculation failed, continuing without KPIs:', kpiError);
        kpiData = {};
      }

      // Prepare stroke case update data
      const strokeCaseUpdateData = { ...updateStrokeCaseDto };
      console.log('Preparing update data...');

      // Extract hospital IDs for relation handling
      const { originHospitalId, destinationHospitalId, ...restUpdateData } = strokeCaseUpdateData;

      const updateData = {
        ...restUpdateData,
        // Handle hospital relations properly using Prisma relation syntax
        ...(originHospitalId && { 
          originHospital: { 
            connect: { id: originHospitalId } 
          } 
        }),
        ...(destinationHospitalId && { 
          destinationHospital: { 
            connect: { id: destinationHospitalId } 
          } 
        }),
        // Convert date strings to Date objects for new fields
        srcaCallTime: updateStrokeCaseDto.srcaCallTime ? new Date(updateStrokeCaseDto.srcaCallTime) : undefined,
        timeOfSymptomOnset: updateStrokeCaseDto.timeOfSymptomOnset ? new Date(updateStrokeCaseDto.timeOfSymptomOnset) : undefined,
        lastKnownNormal: updateStrokeCaseDto.lastKnownNormal ? new Date(updateStrokeCaseDto.lastKnownNormal) : undefined,
        dateOfAdmission: updateStrokeCaseDto.dateOfAdmission ? new Date(updateStrokeCaseDto.dateOfAdmission) : undefined,
        timeOfTriage: updateStrokeCaseDto.timeOfTriage ? new Date(updateStrokeCaseDto.timeOfTriage) : undefined,
        timeOfPhysicianAssessment: updateStrokeCaseDto.timeOfPhysicianAssessment ? new Date(updateStrokeCaseDto.timeOfPhysicianAssessment) : undefined,
        timeOfSwallowingScreening: updateStrokeCaseDto.timeOfSwallowingScreening ? new Date(updateStrokeCaseDto.timeOfSwallowingScreening) : undefined,
        timeOfCtScanStart: updateStrokeCaseDto.timeOfCtScanStart ? new Date(updateStrokeCaseDto.timeOfCtScanStart) : undefined,
        timeOfCtReportFinal: updateStrokeCaseDto.timeOfCtReportFinal ? new Date(updateStrokeCaseDto.timeOfCtReportFinal) : undefined,
        thrombolysisOrderTime: updateStrokeCaseDto.thrombolysisOrderTime ? new Date(updateStrokeCaseDto.thrombolysisOrderTime) : undefined,
        ivThrombolysisAdministrationTime: updateStrokeCaseDto.ivThrombolysisAdministrationTime ? new Date(updateStrokeCaseDto.ivThrombolysisAdministrationTime) : undefined,
        timeOfMechanicalThrombectomyPuncture: updateStrokeCaseDto.timeOfMechanicalThrombectomyPuncture ? new Date(updateStrokeCaseDto.timeOfMechanicalThrombectomyPuncture) : undefined,
        timeOfThrombectomyComplete: updateStrokeCaseDto.timeOfThrombectomyComplete ? new Date(updateStrokeCaseDto.timeOfThrombectomyComplete) : undefined,
        timeOfTransferActivation: updateStrokeCaseDto.timeOfTransferActivation ? new Date(updateStrokeCaseDto.timeOfTransferActivation) : undefined,
        timeOfTransferDeparture: updateStrokeCaseDto.timeOfTransferDeparture ? new Date(updateStrokeCaseDto.timeOfTransferDeparture) : undefined,
        updatedAt: new Date(),
        ...kpiData,
      } as any; // Type assertion to handle Prisma's complex relation types
      
      console.log('Final update data:', JSON.stringify(updateData, null, 2));
      console.log('Performing database update...');

      const result = await this.prisma.strokeCase.update({
        where: { id },
        data: updateData,
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
      
      console.log('=== UPDATE SUCCESSFUL ===');
      return result;
    } catch (error) {
      console.error('=== UPDATE ERROR ===');
      console.error('Error:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if exists

    await this.prisma.strokeCase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }


  private calculateKPISummary(cases: any[]) {
    const totalCases = cases.length;
    const ischemicCases = cases.filter(c => c.strokeType === 'ISCHEMIC').length;
    const hemorrhagicCases = cases.filter(c => c.strokeType === 'HEMORRHAGIC').length;
    const tiaCases = cases.filter(c => c.strokeType === 'TIA').length;

    // Calculate KPI metrics based on actual timing data from patients
    // KPI 1: Door to Physician ≤ 15 minutes
    const doorToPhysicianCases = cases.filter(c => c.doorToPhysicianMinutes !== null && c.doorToPhysicianMinutes !== undefined);
    const kpi1Met = doorToPhysicianCases.filter(c => c.doorToPhysicianMinutes <= 15).length;
    const kpi1Total = doorToPhysicianCases.length;

    // KPI 2: Door to CT Scan ≤ 20 minutes (should be based on doorToCtScanMinutes)
    const doorToCtCases = cases.filter(c => c.doorToCtScanMinutes !== null && c.doorToCtScanMinutes !== undefined);
    const kpi2Met = doorToCtCases.filter(c => c.doorToCtScanMinutes <= 20).length;
    const kpi2Total = doorToCtCases.length;

    // KPI 3: Door to Needle ≤ 60 minutes (should be based on doorToNeedleMinutes for ischemic thrombolysis candidates)
    const doorToNeedleCases = cases.filter(c => 
      c.strokeType === 'ISCHEMIC' && 
      c.candidateForIVThrombolysis === 'YES' && 
      c.doorToNeedleMinutes !== null && 
      c.doorToNeedleMinutes !== undefined
    );
    const kpi3Met = doorToNeedleCases.filter(c => c.doorToNeedleMinutes <= 60).length;
    const kpi3Total = doorToNeedleCases.length;

    // Keep other KPIs as they were
    const kpi4Met = cases.filter(c => c.metKpi4).length;
    const kpi5Met = cases.filter(c => c.metKpi5).length;
    const kpi6Met = cases.filter(c => c.metKpi6).length;
    const kpi7Met = cases.filter(c => c.metKpi7).length;
    const kpi8Met = cases.filter(c => c.metKpi8).length;
    const kpi9Met = cases.filter(c => c.metKpi9).length;
    const kpi10Met = cases.filter(c => c.metKpi10).length;
    const kpi11Met = cases.filter(c => c.metKpi11).length;

    const avgDoorToPhysician = this.calculateAverage(cases.map(c => c.doorToPhysicianMinutes).filter(v => v !== null && v !== undefined));
    const avgDoorToCtScan = this.calculateAverage(cases.map(c => c.doorToCtScanMinutes).filter(v => v !== null && v !== undefined));
    const avgDoorToNeedle = this.calculateAverage(
      cases
        .filter(c => c.strokeType === 'ISCHEMIC' && c.candidateForIVThrombolysis === 'YES')
        .map(c => c.doorToNeedleMinutes)
        .filter(v => v !== null && v !== undefined)
    );
    const avgRegistrationToThrombolysis = this.calculateAverage(
      cases
        .filter(c => c.strokeType === 'ISCHEMIC' && c.candidateForIVThrombolysis === 'YES')
        .map(c => c.registrationToThrombolysisMinutes)
        .filter(v => v !== null && v !== undefined)
    );
    const avgSrcaCallToArrival = this.calculateAverage(cases.map(c => c.srcaCallToArrivalMinutes).filter(v => v !== null && v !== undefined));
    const avgTransferActivationToDeparture = this.calculateAverage(cases.map(c => c.transferActivationToDepartureMinutes).filter(v => v !== null && v !== undefined));

    // For outcomes, we'll calculate what we can with the new schema
    const successfulCases = cases.filter(c => c.strokeType === 'ISCHEMIC' && c.ivThrombolysisGiven === 'YES').length;
    const independentDischarge = cases.filter(c => c.modifiedRankinScaleAt90Days && (c.modifiedRankinScaleAt90Days === 'SCORE_0' || c.modifiedRankinScaleAt90Days === 'SCORE_1' || c.modifiedRankinScaleAt90Days === 'SCORE_2')).length;
    
    return {
      totalCases,
      strokeTypeBreakdown: {
        ischemic: ischemicCases,
        hemorrhagic: hemorrhagicCases,
        tia: tiaCases,
      },
      kpiPerformance: {
        kpi1: { met: kpi1Met, total: kpi1Total, percentage: kpi1Total > 0 ? (kpi1Met / kpi1Total) * 100 : 0 },
        kpi2: { met: kpi2Met, total: kpi2Total, percentage: kpi2Total > 0 ? (kpi2Met / kpi2Total) * 100 : 0 },
        kpi3: { met: kpi3Met, total: kpi3Total, percentage: kpi3Total > 0 ? (kpi3Met / kpi3Total) * 100 : 0 },
        kpi4: { met: kpi4Met, total: totalCases, percentage: totalCases > 0 ? (kpi4Met / totalCases) * 100 : 0 },
        kpi5: { met: kpi5Met, total: totalCases, percentage: totalCases > 0 ? (kpi5Met / totalCases) * 100 : 0 },
        kpi6: { met: kpi6Met, total: totalCases, percentage: totalCases > 0 ? (kpi6Met / totalCases) * 100 : 0 },
        kpi7: { met: kpi7Met, total: totalCases, percentage: totalCases > 0 ? (kpi7Met / totalCases) * 100 : 0 },
        kpi8: { met: kpi8Met, total: totalCases, percentage: totalCases > 0 ? (kpi8Met / totalCases) * 100 : 0 },
        kpi9: { met: kpi9Met, total: totalCases, percentage: totalCases > 0 ? (kpi9Met / totalCases) * 100 : 0 },
        kpi10: { met: kpi10Met, total: totalCases, percentage: totalCases > 0 ? (kpi10Met / totalCases) * 100 : 0 },
        kpi11: { met: kpi11Met, total: totalCases, percentage: totalCases > 0 ? (kpi11Met / totalCases) * 100 : 0 },
      },
      averageTimings: {
        doorToPhysician: avgDoorToPhysician,
        doorToCtScan: avgDoorToCtScan,
        doorToNeedle: avgDoorToNeedle,
        registrationToThrombolysis: avgRegistrationToThrombolysis,
        srcaCallToArrival: avgSrcaCallToArrival,
        transferActivationToDeparture: avgTransferActivationToDeparture,
      },
      outcomes: {
        successRate: totalCases > 0 ? (successfulCases / totalCases) * 100 : 0,
        independentDischargeRate: totalCases > 0 ? (independentDischarge / totalCases) * 100 : 0,
      },
    };
  }

  private calculateAverage(values: (number | null | undefined)[]): number {
    const validValues = values.filter(v => v !== null && v !== undefined) as number[];
    return validValues.length > 0 ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;
  }

  /**
   * Calculate KPIs for a stroke case based on the provided data
   */
  private calculateKPIsForUpdate(updateData: any): any {
    try {
      console.log('=== KPI CALCULATION DEBUG ===');
      console.log('Update data for KPI calculation:', JSON.stringify(updateData, null, 2));
      
      // Create a temporary stroke case object for KPI calculation
      const tempStrokeCase: Partial<StrokeCase> = {
      // Patient Arrival & Timing (Step 1)
      modeOfArrival: updateData.modeOfArrival,
      srcaCallTime: updateData.srcaCallTime ? new Date(updateData.srcaCallTime) : undefined,
      timeOfSymptomOnset: updateData.timeOfSymptomOnset ? new Date(updateData.timeOfSymptomOnset) : undefined,
      lastKnownNormal: updateData.lastKnownNormal ? new Date(updateData.lastKnownNormal) : undefined,
      dateOfAdmission: updateData.dateOfAdmission ? new Date(updateData.dateOfAdmission) : undefined,
      timeOfTriage: updateData.timeOfTriage ? new Date(updateData.timeOfTriage) : undefined,
      timeOfPhysicianAssessment: updateData.timeOfPhysicianAssessment ? new Date(updateData.timeOfPhysicianAssessment) : undefined,
      
      // Clinical Assessment & Diagnosis (Step 2)
      strokeTypeDetailed: updateData.strokeTypeDetailed,
      swallowingScreeningPerformed: updateData.swallowingScreeningPerformed,
      timeOfSwallowingScreening: updateData.timeOfSwallowingScreening ? new Date(updateData.timeOfSwallowingScreening) : undefined,
      swallowingScreeningResult: updateData.swallowingScreeningResult,
      ctScanPerformed: updateData.ctScanPerformed,
      timeOfCtScanStart: updateData.timeOfCtScanStart ? new Date(updateData.timeOfCtScanStart) : undefined,
      timeOfCtReportFinal: updateData.timeOfCtReportFinal ? new Date(updateData.timeOfCtReportFinal) : undefined,
      ctFindings: updateData.ctFindings,
      lvoDetected: updateData.lvoDetected,
      candidateForIVThrombolysis: updateData.candidateForIVThrombolysis,
      thrombolysisOrderTime: updateData.thrombolysisOrderTime ? new Date(updateData.thrombolysisOrderTime) : undefined,
      ivThrombolysisAdministrationTime: updateData.ivThrombolysisAdministrationTime ? new Date(updateData.ivThrombolysisAdministrationTime) : undefined,
      ivThrombolysisGiven: updateData.ivThrombolysisGiven,
      reasonForNotAdministeringIV: updateData.reasonForNotAdministeringIV,
      candidateForMechanicalThrombectomy: updateData.candidateForMechanicalThrombectomy,
      timeOfMechanicalThrombectomyPuncture: updateData.timeOfMechanicalThrombectomyPuncture ? new Date(updateData.timeOfMechanicalThrombectomyPuncture) : undefined,
      mechanicalThrombectomyPerformed: updateData.mechanicalThrombectomyPerformed,
      timeOfThrombectomyComplete: updateData.timeOfThrombectomyComplete ? new Date(updateData.timeOfThrombectomyComplete) : undefined,
      
      // Disposition & Transfer Decisions (Step 3)
      facilityHasCt: updateData.facilityHasCt,
      transferToAnotherHospital: updateData.transferToAnotherHospital,
      timeOfTransferActivation: updateData.timeOfTransferActivation ? new Date(updateData.timeOfTransferActivation) : undefined,
      timeOfTransferDeparture: updateData.timeOfTransferDeparture ? new Date(updateData.timeOfTransferDeparture) : undefined,
      prehospitalNotificationBySrca: updateData.prehospitalNotificationBySrca,
      prehospitalNotificationByUccPhc: updateData.prehospitalNotificationByUccPhc,
      disposition: updateData.disposition,
      referralTo: updateData.referralTo,
      admittedToStrokeUnit: updateData.admittedToStrokeUnit,
      
      // Follow-up & Outcome Tracking (Step 4)
      followUpContactAttempted: updateData.followUpContactAttempted,
      modifiedRankinScaleAt90Days: updateData.modifiedRankinScaleAt90Days,
      
      // Legacy fields
      strokeType: updateData.strokeType,
      currentStatus: updateData.currentStatus,
    };

    // Use the KPI calculator service to calculate all KPIs
    const kpiCalculations = this.kpiCalculator.calculateKPIs(tempStrokeCase as StrokeCase);

    // Return the KPI data to be included in the stroke case update
    return {
      // KPI boolean flags
      metKpi1: kpiCalculations.metKpi1,
      metKpi2: kpiCalculations.metKpi2,
      metKpi3: kpiCalculations.metKpi3,
      metKpi4: kpiCalculations.metKpi4,
      metKpi5: kpiCalculations.metKpi5,
      metKpi6: kpiCalculations.metKpi6,
      metKpi7: kpiCalculations.metKpi7,
      metKpi8: kpiCalculations.metKpi8,
      metKpi9: kpiCalculations.metKpi9,
      metKpi10: kpiCalculations.metKpi10,
      metKpi11: kpiCalculations.metKpi11,
      
      // KPI timing calculations
      doorToPhysicianMinutes: kpiCalculations.doorToPhysicianMinutes,
      doorToCtScanMinutes: kpiCalculations.doorToCtScanMinutes,
      doorToCtReportMinutes: kpiCalculations.doorToCtReportMinutes,
      doorToThrombolysisOrderMinutes: kpiCalculations.doorToThrombolysisOrderMinutes,
      doorToNeedleMinutes: kpiCalculations.doorToNeedleMinutes,
      doorToMechanicalThrombectomyMinutes: kpiCalculations.doorToMechanicalThrombectomyMinutes,
      registrationToThrombolysisMinutes: kpiCalculations.registrationToThrombolysisMinutes,
      srcaCallToArrivalMinutes: kpiCalculations.srcaCallToArrivalMinutes,
      transferActivationToDepartureMinutes: kpiCalculations.transferActivationToDepartureMinutes,
      swallowingScreeningWithin4Hours: kpiCalculations.swallowingScreeningWithin4Hours,
    };
    } catch (error) {
      console.error('=== KPI CALCULATION ERROR ===');
      console.error('Error:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  private calculateKPIs(createStrokeCaseDto: CreateStrokeCaseV2Dto): any {
    // Create a temporary stroke case object for KPI calculation
    const tempStrokeCase: Partial<StrokeCase> = {
      // Patient Arrival & Timing (Step 1)
      modeOfArrival: createStrokeCaseDto.modeOfArrival,
      srcaCallTime: createStrokeCaseDto.srcaCallTime ? new Date(createStrokeCaseDto.srcaCallTime) : undefined,
      timeOfSymptomOnset: createStrokeCaseDto.timeOfSymptomOnset ? new Date(createStrokeCaseDto.timeOfSymptomOnset) : undefined,
      lastKnownNormal: createStrokeCaseDto.lastKnownNormal ? new Date(createStrokeCaseDto.lastKnownNormal) : undefined,
      dateOfAdmission: createStrokeCaseDto.dateOfAdmission ? new Date(createStrokeCaseDto.dateOfAdmission) : undefined,
      timeOfTriage: createStrokeCaseDto.timeOfTriage ? new Date(createStrokeCaseDto.timeOfTriage) : undefined,
      timeOfPhysicianAssessment: createStrokeCaseDto.timeOfPhysicianAssessment ? new Date(createStrokeCaseDto.timeOfPhysicianAssessment) : undefined,
      
      // Clinical Assessment & Diagnosis (Step 2)
      strokeTypeDetailed: createStrokeCaseDto.strokeTypeDetailed,
      swallowingScreeningPerformed: createStrokeCaseDto.swallowingScreeningPerformed,
      timeOfSwallowingScreening: createStrokeCaseDto.timeOfSwallowingScreening ? new Date(createStrokeCaseDto.timeOfSwallowingScreening) : undefined,
      swallowingScreeningResult: createStrokeCaseDto.swallowingScreeningResult,
      ctScanPerformed: createStrokeCaseDto.ctScanPerformed,
      timeOfCtScanStart: createStrokeCaseDto.timeOfCtScanStart ? new Date(createStrokeCaseDto.timeOfCtScanStart) : undefined,
      timeOfCtReportFinal: createStrokeCaseDto.timeOfCtReportFinal ? new Date(createStrokeCaseDto.timeOfCtReportFinal) : undefined,
      ctFindings: createStrokeCaseDto.ctFindings,
      lvoDetected: createStrokeCaseDto.lvoDetected,
      candidateForIVThrombolysis: createStrokeCaseDto.candidateForIVThrombolysis,
      thrombolysisOrderTime: createStrokeCaseDto.thrombolysisOrderTime ? new Date(createStrokeCaseDto.thrombolysisOrderTime) : undefined,
      ivThrombolysisAdministrationTime: createStrokeCaseDto.ivThrombolysisAdministrationTime ? new Date(createStrokeCaseDto.ivThrombolysisAdministrationTime) : undefined,
      ivThrombolysisGiven: createStrokeCaseDto.ivThrombolysisGiven,
      reasonForNotAdministeringIV: createStrokeCaseDto.reasonForNotAdministeringIV,
      candidateForMechanicalThrombectomy: createStrokeCaseDto.candidateForMechanicalThrombectomy,
      timeOfMechanicalThrombectomyPuncture: createStrokeCaseDto.timeOfMechanicalThrombectomyPuncture ? new Date(createStrokeCaseDto.timeOfMechanicalThrombectomyPuncture) : undefined,
      mechanicalThrombectomyPerformed: createStrokeCaseDto.mechanicalThrombectomyPerformed,
      timeOfThrombectomyComplete: createStrokeCaseDto.timeOfThrombectomyComplete ? new Date(createStrokeCaseDto.timeOfThrombectomyComplete) : undefined,
      
      // Disposition & Transfer Decisions (Step 3)
      facilityHasCt: createStrokeCaseDto.facilityHasCt,
      transferToAnotherHospital: createStrokeCaseDto.transferToAnotherHospital,
      timeOfTransferActivation: createStrokeCaseDto.timeOfTransferActivation ? new Date(createStrokeCaseDto.timeOfTransferActivation) : undefined,
      timeOfTransferDeparture: createStrokeCaseDto.timeOfTransferDeparture ? new Date(createStrokeCaseDto.timeOfTransferDeparture) : undefined,
      prehospitalNotificationBySrca: createStrokeCaseDto.prehospitalNotificationBySrca,
      prehospitalNotificationByUccPhc: createStrokeCaseDto.prehospitalNotificationByUccPhc,
      disposition: createStrokeCaseDto.disposition,
      referralTo: createStrokeCaseDto.referralTo,
      admittedToStrokeUnit: createStrokeCaseDto.admittedToStrokeUnit,
      
      // Follow-up & Outcome Tracking (Step 4)
      followUpContactAttempted: createStrokeCaseDto.followUpContactAttempted,
      modifiedRankinScaleAt90Days: createStrokeCaseDto.modifiedRankinScaleAt90Days,
      
      // Legacy fields
      strokeType: createStrokeCaseDto.strokeType,
      currentStatus: createStrokeCaseDto.currentStatus,
    };

    // Use the KPI calculator service to calculate all KPIs
    const kpiCalculations = this.kpiCalculator.calculateKPIs(tempStrokeCase as StrokeCase);

    // Return the KPI data to be included in the stroke case creation
    return {
      // KPI boolean flags
      metKpi1: kpiCalculations.metKpi1,
      metKpi2: kpiCalculations.metKpi2,
      metKpi3: kpiCalculations.metKpi3,
      metKpi4: kpiCalculations.metKpi4,
      metKpi5: kpiCalculations.metKpi5,
      metKpi6: kpiCalculations.metKpi6,
      metKpi7: kpiCalculations.metKpi7,
      metKpi8: kpiCalculations.metKpi8,
      metKpi9: kpiCalculations.metKpi9,
      metKpi10: kpiCalculations.metKpi10,
      metKpi11: kpiCalculations.metKpi11,
      
      // KPI timing calculations
      doorToPhysicianMinutes: kpiCalculations.doorToPhysicianMinutes,
      doorToCtScanMinutes: kpiCalculations.doorToCtScanMinutes,
      doorToCtReportMinutes: kpiCalculations.doorToCtReportMinutes,
      doorToThrombolysisOrderMinutes: kpiCalculations.doorToThrombolysisOrderMinutes,
      doorToNeedleMinutes: kpiCalculations.doorToNeedleMinutes,
      doorToMechanicalThrombectomyMinutes: kpiCalculations.doorToMechanicalThrombectomyMinutes,
      registrationToThrombolysisMinutes: kpiCalculations.registrationToThrombolysisMinutes,
      srcaCallToArrivalMinutes: kpiCalculations.srcaCallToArrivalMinutes,
      transferActivationToDepartureMinutes: kpiCalculations.transferActivationToDepartureMinutes,
      swallowingScreeningWithin4Hours: kpiCalculations.swallowingScreeningWithin4Hours,
    };
  }

  /**
   * Get KPI summary for dashboard
   */
  async getKPISummary(filters: {
    hospitalId?: string;
    timeframe?: string;
    startDate?: string;
    endDate?: string;
  }) {
    console.log('getKPISummary called with filters:', filters);
    const whereClause: any = {
      deletedAt: null, // Exclude soft-deleted cases
    };
    
    // Add hospital filter
    if (filters.hospitalId) {
      whereClause.originHospitalId = filters.hospitalId;
    }
    
    // Add date filters
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    } else if (filters.timeframe) {
      const days = parseInt(filters.timeframe);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      whereClause.createdAt = {
        gte: startDate,
      };
    }
    
    console.log('Where clause:', whereClause);

    const cases = await this.prisma.strokeCase.findMany({
      where: whereClause,
      select: {
        id: true,
        strokeType: true,
        candidateForIVThrombolysis: true,
        metKpi1: true,
        metKpi2: true,
        metKpi3: true,
        metKpi4: true,
        metKpi5: true,
        metKpi6: true,
        metKpi7: true,
        metKpi8: true,
        metKpi9: true,
        metKpi10: true,
        metKpi11: true,
        doorToPhysicianMinutes: true,
        doorToCtScanMinutes: true,
        doorToNeedleMinutes: true,
        registrationToCtMinutes: true,
        registrationToThrombolysisMinutes: true,
        srcaCallToArrivalMinutes: true,
        transferActivationToDepartureMinutes: true,
        swallowingScreeningWithin4Hours: true,
        ivThrombolysisGiven: true,
        modifiedRankinScaleAt90Days: true,
      },
    });

    return this.calculateKPISummary(cases);
  }

  /**
   * Get detailed KPI data for a specific KPI
   */
  async getKPIDetails(kpiId: string, filters: {
    hospitalId?: string;
    timeframe?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const whereClause: any = {
      deletedAt: null, // Exclude soft-deleted cases
    };
    
    // Add hospital filter
    if (filters.hospitalId) {
      whereClause.originHospitalId = filters.hospitalId;
    }
    
    // Add date filters
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    } else if (filters.timeframe) {
      const days = parseInt(filters.timeframe);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      whereClause.createdAt = {
        gte: startDate,
      };
    }

    const cases = await this.prisma.strokeCase.findMany({
      where: whereClause,
      select: {
        id: true,
        patientId: true,
        originHospitalId: true,
        strokeType: true,
        createdAt: true,
        metKpi1: true,
        metKpi2: true,
        metKpi3: true,
        metKpi4: true,
        metKpi5: true,
        metKpi6: true,
        metKpi7: true,
        metKpi8: true,
        metKpi9: true,
        metKpi10: true,
        metKpi11: true,
        doorToPhysicianMinutes: true,
        registrationToThrombolysisMinutes: true,
        srcaCallToArrivalMinutes: true,
        transferActivationToDepartureMinutes: true,
        swallowingScreeningWithin4Hours: true,
      },
    });

    return {
      kpiId,
      totalCases: cases.length,
      metCases: cases.filter(c => {
        switch (kpiId) {
          case 'kpi1': return c.metKpi1;
          case 'kpi2': return c.metKpi2;
          case 'kpi3': return c.metKpi3;
          case 'kpi4': return c.metKpi4;
          case 'kpi5': return c.metKpi5;
          case 'kpi6': return c.metKpi6;
          case 'kpi7': return c.metKpi7;
          case 'kpi8': return c.metKpi8;
          case 'kpi9': return c.metKpi9;
          case 'kpi10': return c.metKpi10;
          case 'kpi11': return c.metKpi11;
          default: return false;
        }
      }).length,
      cases: cases.map(c => ({
        id: c.id,
        patientId: c.patientId,
        originHospitalId: c.originHospitalId,
        strokeType: c.strokeType,
        createdAt: c.createdAt,
        metKpi: (() => {
          switch (kpiId) {
            case 'kpi1': return c.metKpi1;
            case 'kpi2': return c.metKpi2;
            case 'kpi3': return c.metKpi3;
            case 'kpi4': return c.metKpi4;
            case 'kpi5': return c.metKpi5;
            case 'kpi6': return c.metKpi6;
            case 'kpi7': return c.metKpi7;
            case 'kpi8': return c.metKpi8;
            case 'kpi9': return c.metKpi9;
            case 'kpi10': return c.metKpi10;
            case 'kpi11': return c.metKpi11;
            default: return false;
          }
        })(),
        timings: {
          doorToPhysician: c.doorToPhysicianMinutes,
          registrationToThrombolysis: c.registrationToThrombolysisMinutes,
          srcaCallToArrival: c.srcaCallToArrivalMinutes,
          transferActivationToDeparture: c.transferActivationToDepartureMinutes,
          swallowingScreeningWithin4Hours: c.swallowingScreeningWithin4Hours,
        },
      })),
    };
  }

}
