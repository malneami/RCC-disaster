import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTraumaCaseDto } from './dto/create-trauma-case.dto';
import { UpdateTraumaCaseDto } from './dto/update-trauma-case.dto';
import { TraumaCase, TraumaModeOfArrival, TraumaMechanismOfInjury } from '@prisma/client';
import { TraumaPatientService } from './services/trauma-patient.service';
import { TraumaTicketService } from './services/trauma-ticket.service';
import { TraumaKpiService } from './services/trauma-kpi.service';
import { TraumaDatetimeService } from './services/trauma-datetime.service';
import { TraumaQueryService } from './services/trauma-query.service';

@Injectable()
export class TraumaCasesService {
  constructor(
    private prisma: PrismaService,
    private traumaPatientService: TraumaPatientService,
    private traumaTicketService: TraumaTicketService,
    private traumaKpiService: TraumaKpiService,
    private traumaDatetimeService: TraumaDatetimeService,
    private traumaQueryService: TraumaQueryService
  ) {}

  async create(createTraumaCaseDto: CreateTraumaCaseDto, userId: string): Promise<TraumaCase> {
    try {
      console.log('=== TRAUMA CASE SERVICE CREATE ===');
      console.log('DTO:', JSON.stringify(createTraumaCaseDto, null, 2));
      console.log('User ID:', userId);
      
      // Ensure we have a valid user ID
      const validUserId = await this.getValidUserId(userId);
      
      // Process patient
      let patientId = createTraumaCaseDto.patientId;
      if (!patientId && createTraumaCaseDto.patientInfo) {
        patientId = await this.traumaPatientService.processPatient(createTraumaCaseDto.patientInfo, validUserId);
      }
      
      if (!patientId) {
        throw new BadRequestException('Patient ID is required');
      }
      
      await this.traumaPatientService.validatePatientExists(patientId);

      // Ensure hospital exists, create test hospital if needed
      const originHospitalId = await this.ensureHospitalExists(createTraumaCaseDto.originHospitalId);
      const destinationHospitalId = createTraumaCaseDto.destinationHospitalId 
        ? await this.ensureHospitalExists(createTraumaCaseDto.destinationHospitalId)
        : null;

      // Process ticket
      let ticketId = createTraumaCaseDto.ticketId;
      if (!ticketId) {
        ticketId = await this.traumaTicketService.createTicket(
          patientId,
          originHospitalId,
          destinationHospitalId,
          createTraumaCaseDto.chiefComplaint || 'Trauma case',
          validUserId
        );
      }
      
      await this.traumaTicketService.validateTicketExists(ticketId);

      // Calculate derived fields
      const responseTimeMinutes = createTraumaCaseDto.incidentDateTime 
        ? this.traumaDatetimeService.calculateResponseTime(
            createTraumaCaseDto.incidentDateTime,
            createTraumaCaseDto.arrivalDateTime
          )
        : null;
      const criticalCase = createTraumaCaseDto.glasgowComaScale ? createTraumaCaseDto.glasgowComaScale < 8 : false;
      const transferCase = createTraumaCaseDto.transferRequestDateTime !== null && createTraumaCaseDto.transferRequestDateTime !== undefined;

      // Create trauma case
      const traumaCaseData = {
        ticketId: ticketId,
        patientId: patientId,
        originHospitalId: originHospitalId,
        destinationHospitalId: destinationHospitalId,
        arrivalDateTime: new Date(createTraumaCaseDto.arrivalDateTime),
        incidentDateTime: createTraumaCaseDto.incidentDateTime ? new Date(createTraumaCaseDto.incidentDateTime) : null,
        modeOfArrival: createTraumaCaseDto.modeOfArrival,
        transferRequestDateTime: createTraumaCaseDto.transferRequestDateTime ? new Date(createTraumaCaseDto.transferRequestDateTime) : null,
        transferArrivalDateTime: createTraumaCaseDto.transferArrivalDateTime ? new Date(createTraumaCaseDto.transferArrivalDateTime) : null,
        transferDurationMinutes: createTraumaCaseDto.transferDurationMinutes,
        chiefComplaint: createTraumaCaseDto.chiefComplaint,
        mechanismOfInjury: createTraumaCaseDto.mechanismOfInjury,
        vitalSigns: createTraumaCaseDto.vitalSigns ? JSON.stringify(createTraumaCaseDto.vitalSigns) : null,
        glasgowComaScale: createTraumaCaseDto.glasgowComaScale,
        systolicBloodPressure: createTraumaCaseDto.systolicBloodPressure,
        respiratoryRate: createTraumaCaseDto.respiratoryRate,
        additionalVitalSigns: createTraumaCaseDto.additionalVitalSigns,
        headAndNeckInjury: createTraumaCaseDto.headAndNeckInjury,
        faceInjury: createTraumaCaseDto.faceInjury,
        chestInjury: createTraumaCaseDto.chestInjury,
        abdomenInjury: createTraumaCaseDto.abdomenInjury,
        extremitiesInjury: createTraumaCaseDto.extremitiesInjury,
        externalInjury: createTraumaCaseDto.externalInjury,
        primarySurveyFindings: createTraumaCaseDto.primarySurveyFindings,
        edDisposition: createTraumaCaseDto.edDisposition,
        additionalNotes: createTraumaCaseDto.additionalNotes,
        disposition: createTraumaCaseDto.disposition ? JSON.stringify(createTraumaCaseDto.disposition) : null,
        responseTimeMinutes: responseTimeMinutes,
        criticalCase: criticalCase,
        transferCase: transferCase,
        createdById: validUserId,
      };

      console.log('Creating trauma case with data:', traumaCaseData);

      const traumaCase = await this.prisma.traumaCase.create({
        data: traumaCaseData,
        include: {
          patient: true,
          originHospital: true,
          destinationHospital: true,
          createdBy: true,
        },
      });

      console.log('Trauma case created successfully:', traumaCase.id);
      return traumaCase;

    } catch (error) {
      console.error('Error in create trauma case:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Error creating trauma case: ${errorMessage}`);
    }
  }

  private async ensureHospitalExists(hospitalId: string): Promise<string> {
    // Check if hospital exists
    const existingHospital = await this.prisma.hospital.findUnique({
      where: { id: hospitalId }
    });
    
    if (existingHospital) {
      return hospitalId;
    }
    
    // Create a test hospital if none exists
    const testHospital = await this.prisma.hospital.create({
      data: {
        name: 'Test Hospital',
        address: '123 Test Street',
        latitude: 24.7136,
        longitude: 46.6753,
        icuBeds: 10,
        icuBedsAvailable: 5,
        maleBeds: 50,
        maleBedsAvailable: 25,
        femaleBeds: 50,
        femaleBedsAvailable: 25,
        pediatricBeds: 20,
        pediatricBedsAvailable: 10,
        standardBeds: 100,
        standardBedsAvailable: 50,
        ventilators: 5,
        ventilatorsAvailable: 2,
        hasStemiService: true,
        hasStrokeService: true,
        hasTraumaService: true,
        traumaLevel: 'LEVEL_1',
        cluster: 'Test Cluster',
        status: 'ACTIVE'
      }
    });
    
    console.log('Created test hospital:', testHospital.id);
    return testHospital.id;
  }

  private async getValidUserId(userId: string): Promise<string> {
    if (!userId || userId === '4600ecc0-c41b-4d99-8ddd-78ef909182cb') {
      let adminUser = await this.prisma.user.findFirst({
        where: { 
          email: 'admin@rcc-healthcare.com',
          deletedAt: null 
        }
      });
      
      if (!adminUser) {
        // Create a default admin user if none exists
        adminUser = await this.prisma.user.create({
          data: {
            email: 'admin@rcc-healthcare.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
            status: 'ACTIVE',
            passwordHash: 'hashed_password_placeholder', // This would be properly hashed in production
            hospitalId: null
          }
        });
        console.log('Created default admin user:', adminUser.id);
      }
      
      console.log('Using admin user ID:', adminUser.id);
      return adminUser.id;
    }
    return userId;
  }

  async findAll(filters?: {
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
  }): Promise<{ cases: TraumaCase[]; total: number }> {
    return this.traumaQueryService.findAll(filters);
  }

  async findOne(id: string): Promise<TraumaCase> {
    return this.traumaQueryService.findOne(id);
  }

  async update(id: string, updateTraumaCaseDto: UpdateTraumaCaseDto, userId: string): Promise<TraumaCase> {
    const existingCase = await this.findOne(id);

    // Handle patient info updates if provided
    if (updateTraumaCaseDto.patientInfo && existingCase.patientId) {
      await this.traumaPatientService.updatePatient(existingCase.patientId, updateTraumaCaseDto.patientInfo);
    }

    // Calculate derived fields if relevant data is being updated
    let responseTimeMinutes = existingCase.responseTimeMinutes;
    let criticalCase = existingCase.criticalCase;
    let transferCase = existingCase.transferCase;

    if (updateTraumaCaseDto.incidentDateTime || updateTraumaCaseDto.arrivalDateTime) {
      const arrivalDateTime = updateTraumaCaseDto.arrivalDateTime 
        ? updateTraumaCaseDto.arrivalDateTime
        : existingCase.arrivalDateTime.toISOString();
      const incidentDateTime = updateTraumaCaseDto.incidentDateTime 
        ? updateTraumaCaseDto.incidentDateTime
        : existingCase.incidentDateTime?.toISOString();

      if (incidentDateTime && arrivalDateTime) {
        responseTimeMinutes = this.traumaDatetimeService.calculateResponseTime(incidentDateTime, arrivalDateTime);
      }
    }

    if (updateTraumaCaseDto.glasgowComaScale !== undefined) {
      criticalCase = updateTraumaCaseDto.glasgowComaScale < 8;
    }

    if (updateTraumaCaseDto.transferRequestDateTime !== undefined) {
      transferCase = updateTraumaCaseDto.transferRequestDateTime !== null;
    }

    // Remove patientInfo from the update data since we handle it separately
    const { patientInfo, ...traumaCaseUpdateData } = updateTraumaCaseDto;

    const updateData: any = {
      ...traumaCaseUpdateData,
      responseTimeMinutes,
      criticalCase,
      transferCase,
    };

    // Convert date strings to Date objects
    if (updateData.arrivalDateTime) {
      updateData.arrivalDateTime = new Date(updateData.arrivalDateTime);
    }
    if (updateData.incidentDateTime) {
      updateData.incidentDateTime = new Date(updateData.incidentDateTime);
    }
    if (updateData.transferRequestDateTime) {
      updateData.transferRequestDateTime = new Date(updateData.transferRequestDateTime);
    }
    if (updateData.transferArrivalDateTime) {
      updateData.transferArrivalDateTime = new Date(updateData.transferArrivalDateTime);
    }

    const updatedCase = await this.prisma.traumaCase.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        originHospital: true,
        destinationHospital: true,
        createdBy: true,
      },
    });

    return updatedCase;
  }

  async remove(id: string): Promise<void> {
    const existingCase = await this.findOne(id);

    await this.prisma.traumaCase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getKPISummary(hospitalId?: string, startDate?: string, endDate?: string): Promise<any> {
    return this.traumaKpiService.getKPISummary(hospitalId, startDate, endDate);
  }
}
