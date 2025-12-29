import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateStemiCaseDto, UpdateStemiCaseDto } from '../dto/create-stemi-case.dto';
import { StemiFilterDto } from '../dto/stemi-filter.dto';
import { StemiQueryService } from './stemi-query.service';
import { StemiPatientService } from './stemi-patient.service';
import { StemiKpiService } from './stemi-kpi.service';

@Injectable()
export class StemiCasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stemiQueryService: StemiQueryService,
    private readonly stemiPatientService: StemiPatientService,
    private readonly stemiKpiService: StemiKpiService,
  ) {}

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

  async createStemiCase(createStemiCaseDto: any, userId: string) {
    const { patientInfo, admissionTime, modeOfArrival, criticalTimestamps, interventionsAndTreatments, clinicalAssessment, ...stemiData } = createStemiCaseDto;

    try {
      // Ensure we have a valid user ID
      const validUserId = await this.getValidUserId(userId);

      // Determine case type based on hospital services
      const originHospital = await this.prisma.hospital.findUnique({
        where: { id: patientInfo.originHospitalId },
        select: { hasStemiService: true }
      });

      if (!originHospital) {
        throw new BadRequestException('Origin hospital not found');
      }

      let caseType: 'DIRECT' | 'TRANSFER' = 'DIRECT';
      
      if (!originHospital.hasStemiService) {
        // Origin hospital doesn't have STEMI service, must be transfer case
        if (!patientInfo.destinationHospitalId) {
          throw new BadRequestException('Destination hospital is required when origin hospital does not have STEMI service');
        }
        
        const destinationHospital = await this.prisma.hospital.findUnique({
          where: { id: patientInfo.destinationHospitalId },
          select: { hasStemiService: true }
        });

        if (!destinationHospital) {
          throw new BadRequestException('Destination hospital not found');
        }

        if (!destinationHospital.hasStemiService) {
          throw new BadRequestException('Destination hospital must have STEMI service for transfer cases');
        }

        caseType = 'TRANSFER';
      } else if (patientInfo.destinationHospitalId && patientInfo.destinationHospitalId !== patientInfo.originHospitalId) {
        // Origin has STEMI service but destination is different - still transfer
        caseType = 'TRANSFER';
      }

      // Create or update patient
      console.log('Creating patient with data:', JSON.stringify(patientInfo, null, 2));
      const patient = await this.stemiPatientService.createOrUpdatePatient(patientInfo, validUserId);
      console.log('Patient created successfully:', patient.id);

      // Create ticket only if there's a destination hospital (transfer case) and no existing ticketId provided
      let ticket = null;
      if (createStemiCaseDto.ticketId) {
        console.log('Using existing ticket ID:', createStemiCaseDto.ticketId);
        // Verify the ticket exists
        ticket = await this.prisma.ticket.findUnique({
          where: { id: createStemiCaseDto.ticketId }
        });
        if (!ticket) {
          throw new BadRequestException(`Ticket with ID ${createStemiCaseDto.ticketId} not found`);
        }
        console.log('Linked to existing ticket:', ticket.id);
      } else if (patientInfo.destinationHospitalId) {
        console.log('Creating transfer ticket for STEMI case with destination hospital:', patientInfo.destinationHospitalId);
        ticket = await this.prisma.ticket.create({
          data: {
            ticketNumber: `STEMI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            patientId: patient.id,
            originHospitalId: patientInfo.originHospitalId,
            destinationHospitalId: patientInfo.destinationHospitalId,
            priority: 'CRITICAL',
            status: 'PENDING',
            pathway: 'STEMI',
            vitals: JSON.stringify({}), // Will be populated later
            isEmergency: true,
            emergencyType: 'STEMI',
            emergencySeverity: 'CRITICAL',
            notes: `STEMI case: ${clinicalAssessment.presentingSymptoms}`,
            createdById: validUserId,
            
            // Basic ticket fields only
          }
        });
        console.log('Transfer ticket created successfully:', ticket.id);
      } else {
        console.log('No destination hospital specified - creating standalone STEMI case without transfer ticket');
      }

      // Validate hospital IDs before creating STEMI case
      const originHospitalData = await this.prisma.hospital.findUnique({
        where: { id: patientInfo.originHospitalId }
      });
      
      if (!originHospitalData) {
        throw new BadRequestException(`Origin hospital with ID ${patientInfo.originHospitalId} not found`);
      }

      let destinationHospital = null;
      if (patientInfo.destinationHospitalId) {
        destinationHospital = await this.prisma.hospital.findUnique({
          where: { id: patientInfo.destinationHospitalId }
        });
        
        if (!destinationHospital) {
          console.warn(`Destination hospital with ID ${patientInfo.destinationHospitalId} not found - creating standalone case`);
          // Don't throw error, just create standalone case
        }
      }

      // Create STEMI case
      const stemiCase = await this.prisma.stemiCase.create({
        data: {
          ticketId: ticket?.id, // Can be null for standalone cases
          patientId: patient.id,
          originHospitalId: patientInfo.originHospitalId,
          destinationHospitalId: destinationHospital ? patientInfo.destinationHospitalId : null, // Use validated hospital or null
          
          // Clinical Assessment
          heartScore: clinicalAssessment.heartScore,
          clinicalRiskLevel: clinicalAssessment.clinicalRiskLevel,
          presentingSymptoms: clinicalAssessment.presentingSymptoms,
          symptomOnset: clinicalAssessment.symptomOnset ? new Date(clinicalAssessment.symptomOnset) : null,
          symptomDuration: clinicalAssessment.symptomDuration,
          miType: clinicalAssessment.miType,
          outcome: clinicalAssessment.outcome,
          
          // Pathway Execution
          currentStatus: stemiData.currentStatus || 'SUSPECTED',
          selectedTreatment: stemiData.selectedTreatment,
          pathwayStarted: admissionTime ? new Date(admissionTime) : new Date(),
          modeOfArrival: modeOfArrival,
          caseType: caseType,
          transferRequestDateTime: createStemiCaseDto.transferRequestDateTime ? new Date(createStemiCaseDto.transferRequestDateTime) : null,
          transferArrivalDateTime: createStemiCaseDto.transferArrivalDateTime ? new Date(createStemiCaseDto.transferArrivalDateTime) : null,
          
          // ECG Results
          ecgResult: stemiData.ecgResult,
          ecgFindings: stemiData.ecgFindings,

          // Additional Clinical Fields
          troponinValue: stemiData.troponinValue,
          isTroponinPositive: stemiData.isTroponinPositive,
          additionalNotes: stemiData.additionalNotes,
          
          // Critical Timestamps
          triageTime: criticalTimestamps.triageTime ? new Date(criticalTimestamps.triageTime) : null,
          firstEcgTime: criticalTimestamps.firstEcgTime ? new Date(criticalTimestamps.firstEcgTime) : null,
          
          // Interventions and Treatments
          eligibleForPrimaryPci: interventionsAndTreatments.eligibleForPrimaryPci,
          pciType: interventionsAndTreatments.pciType,
          pciLocation: interventionsAndTreatments.pciLocation,
          doorOutTime: interventionsAndTreatments.doorOutTime ? new Date(interventionsAndTreatments.doorOutTime) : null,
          balloonInflationTime: interventionsAndTreatments.balloonInflationTime ? new Date(interventionsAndTreatments.balloonInflationTime) : null,
          thrombolyticGiven: interventionsAndTreatments.thrombolyticGiven,
          thrombolyticAdminTime: interventionsAndTreatments.thrombolyticAdminTime ? new Date(interventionsAndTreatments.thrombolyticAdminTime) : null,
          fibrinolyticAbsoluteContraindications: interventionsAndTreatments.fibrinolyticAbsoluteContraindications,
          fibrinolyticRelativeContraindications: interventionsAndTreatments.fibrinolyticRelativeContraindications,
          
          // Additional STEMI-specific fields (removed non-existent fields)
          
          createdById: validUserId,
        }
      });

      // Calculate and store quality metrics
      await this.calculateAndUpdateQualityMetrics(stemiCase.id);

      // Timeline events will be handled separately if needed

      return await this.getStemiCaseById(stemiCase.id);
    } catch (error: any) {
      console.error('Error creating STEMI case:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error code:', error.code);
      console.error('Error meta:', error.meta);
      throw new BadRequestException(`Failed to create STEMI case: ${error.message}`);
    }
  }

  async getStemiCases(filters: StemiFilterDto) {
    try {
      return await this.stemiQueryService.getStemiCases(filters);
    } catch (error) {
      console.error('Error in getStemiCases:', error);
      throw error;
    }
  }

  async getStemiCaseById(id: string) {
    const stemiCase = await this.prisma.stemiCase.findUnique({
      where: { id },
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
            dateOfBirth: true,
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
            hasCardiologyCenter: true,
          }
        },
        destinationHospital: {
          select: {
            id: true,
            name: true,
            cluster: true,
            hasCardiologyCenter: true,
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
    });

    if (!stemiCase) {
      throw new NotFoundException('STEMI case not found');
    }

    // Transform the data to match the expected frontend format
    return {
      ...stemiCase,
      patientInfo: stemiCase.patient,
      clinicalAssessment: {
        heartScore: stemiCase.heartScore,
        clinicalRiskLevel: stemiCase.clinicalRiskLevel,
        presentingSymptoms: stemiCase.presentingSymptoms,
        symptomOnset: stemiCase.symptomOnset,
        symptomDuration: stemiCase.symptomDuration,
        miType: stemiCase.miType,
        outcome: stemiCase.outcome,
      },
      criticalTimestamps: {
        triageTime: stemiCase.triageTime,
        firstEcgTime: stemiCase.firstEcgTime,
      },
      interventionsAndTreatments: {
        eligibleForPrimaryPci: stemiCase.eligibleForPrimaryPci,
        pciType: stemiCase.pciType,
        pciLocation: stemiCase.pciLocation,
        doorOutTime: stemiCase.doorOutTime,
        balloonInflationTime: stemiCase.balloonInflationTime,
        thrombolyticGiven: stemiCase.thrombolyticGiven,
        thrombolyticAdminTime: stemiCase.thrombolyticAdminTime,
        fibrinolyticAbsoluteContraindications: stemiCase.fibrinolyticAbsoluteContraindications,
        fibrinolyticRelativeContraindications: stemiCase.fibrinolyticRelativeContraindications,
      },
    };
  }

  async updateStemiCase(id: string, updateStemiCaseDto: UpdateStemiCaseDto, userId: string, ipAddress?: string, userAgent?: string) {
    console.log('updateStemiCase called with:', JSON.stringify({ id, updateStemiCaseDto, userId }, null, 2));
    
    const existingCase = await this.getStemiCaseById(id);
    
    const { patientInfo, ...stemiData } = updateStemiCaseDto;
    
    console.log('Extracted data:', JSON.stringify({ patientInfo, stemiData }, null, 2));

    try {
      // Ensure we have a valid user ID
      const validUserId = await this.getValidUserId(userId);

      // Determine the effective origin and destination hospital IDs
      const effectiveOriginHospitalId = patientInfo?.originHospitalId ?? existingCase.originHospitalId;
      const effectiveDestinationHospitalId = patientInfo?.destinationHospitalId !== undefined 
        ? (patientInfo.destinationHospitalId || null)
        : existingCase.destinationHospitalId;

      // Automatically determine case type based on destination hospital
      // If destination hospital is added/changed (and different from origin), set to TRANSFER
      // If destination hospital is removed or same as origin, set to DIRECT
      let determinedCaseType = existingCase.caseType || 'DIRECT';
      if (patientInfo?.destinationHospitalId !== undefined) {
        if (effectiveDestinationHospitalId && 
            effectiveOriginHospitalId && 
            effectiveDestinationHospitalId !== effectiveOriginHospitalId) {
          determinedCaseType = 'TRANSFER';
        } else {
          determinedCaseType = 'DIRECT';
        }
      } else if (effectiveDestinationHospitalId && 
                 effectiveOriginHospitalId && 
                 effectiveDestinationHospitalId !== effectiveOriginHospitalId) {
        // Destination hospital exists and is different from origin
        determinedCaseType = 'TRANSFER';
      }

      // Update patient if patientInfo provided
      if (patientInfo) {
        await this.stemiPatientService.updatePatient(existingCase.patientId, patientInfo, validUserId, ipAddress, userAgent);
      }

      // Update ticket only if it exists
      if (existingCase.ticketId) {
        await this.prisma.ticket.update({
          where: { id: existingCase.ticketId },
          data: {
            // Update hospital fields if provided
            ...(patientInfo?.originHospitalId && {
              originHospitalId: patientInfo.originHospitalId,
            }),
            ...(patientInfo?.destinationHospitalId !== undefined && {
              destinationHospitalId: patientInfo.destinationHospitalId || null,
            }),
          }
        });
      }

      // Build update data dynamically - use proper existence checks instead of truthiness
      const updateData: any = {};
      
      // Always update these fields if they exist in the payload
      if (stemiData.currentStatus !== undefined) {
        updateData.currentStatus = stemiData.currentStatus;
      }
      if (stemiData.selectedTreatment !== undefined) {
        updateData.selectedTreatment = stemiData.selectedTreatment;
      }
      if (stemiData.ecgResult !== undefined) {
        updateData.ecgResult = stemiData.ecgResult;
      }
      if (stemiData.ecgFindings !== undefined) {
        updateData.ecgFindings = stemiData.ecgFindings;
      }
      
      // Set case type: use explicitly provided value, or auto-determined value
      if (stemiData.caseType !== undefined) {
        updateData.caseType = stemiData.caseType;
      } else {
        // Automatically update case type based on destination hospital
        updateData.caseType = determinedCaseType;
      }
      
      // Add admission details if provided (check for existence, not truthiness)
      if (stemiData.admissionTime !== undefined && stemiData.admissionTime !== null && stemiData.admissionTime !== '') {
        updateData.pathwayStarted = new Date(stemiData.admissionTime);
      }
      if (stemiData.modeOfArrival !== undefined && stemiData.modeOfArrival !== null) {
        updateData.modeOfArrival = stemiData.modeOfArrival;
      }
      
      // Add hospital fields if provided (check for existence, not truthiness)
      if (patientInfo?.originHospitalId !== undefined && patientInfo?.originHospitalId !== null && patientInfo?.originHospitalId !== '') {
        updateData.originHospitalId = patientInfo.originHospitalId;
      }
      if (patientInfo?.destinationHospitalId !== undefined) {
        updateData.destinationHospitalId = patientInfo.destinationHospitalId || null;
      }

      // Add transfer dates if provided (check for existence)
      if (updateStemiCaseDto.transferRequestDateTime !== undefined) {
        updateData.transferRequestDateTime = updateStemiCaseDto.transferRequestDateTime ? new Date(updateStemiCaseDto.transferRequestDateTime) : null;
      }
      if (updateStemiCaseDto.transferArrivalDateTime !== undefined) {
        updateData.transferArrivalDateTime = updateStemiCaseDto.transferArrivalDateTime ? new Date(updateStemiCaseDto.transferArrivalDateTime) : null;
      }

      // Add additional clinical fields
      if (stemiData.troponinValue !== undefined) {
        updateData.troponinValue = stemiData.troponinValue;
      }
      if (stemiData.isTroponinPositive !== undefined) {
        updateData.isTroponinPositive = stemiData.isTroponinPositive;
      }
      if (stemiData.additionalNotes !== undefined) {
        updateData.additionalNotes = stemiData.additionalNotes;
      }

      // Update STEMI case
      const updatedCase = await this.prisma.stemiCase.update({
        where: { id },
        data: {
          ...updateData,
          
          // Update clinical assessment if provided
          ...(stemiData.clinicalAssessment && {
            heartScore: stemiData.clinicalAssessment.heartScore,
            clinicalRiskLevel: stemiData.clinicalAssessment.clinicalRiskLevel,
            presentingSymptoms: stemiData.clinicalAssessment.presentingSymptoms,
            symptomOnset: stemiData.clinicalAssessment.symptomOnset ? new Date(stemiData.clinicalAssessment.symptomOnset) : undefined,
            symptomDuration: stemiData.clinicalAssessment.symptomDuration,
            miType: stemiData.clinicalAssessment.miType,
            outcome: stemiData.clinicalAssessment.outcome,
          }),
          
          // Update critical timestamps if provided
          ...(stemiData.criticalTimestamps && {
            triageTime: stemiData.criticalTimestamps.triageTime ? new Date(stemiData.criticalTimestamps.triageTime) : undefined,
            firstEcgTime: stemiData.criticalTimestamps.firstEcgTime ? new Date(stemiData.criticalTimestamps.firstEcgTime) : undefined,
          }),
          
          // Update interventions and treatments if provided
          ...(stemiData.interventionsAndTreatments && {
            eligibleForPrimaryPci: stemiData.interventionsAndTreatments.eligibleForPrimaryPci,
            pciType: stemiData.interventionsAndTreatments.pciType,
            pciLocation: stemiData.interventionsAndTreatments.pciLocation,
            doorOutTime: stemiData.interventionsAndTreatments.doorOutTime ? new Date(stemiData.interventionsAndTreatments.doorOutTime) : undefined,
            balloonInflationTime: stemiData.interventionsAndTreatments.balloonInflationTime ? new Date(stemiData.interventionsAndTreatments.balloonInflationTime) : undefined,
            thrombolyticGiven: stemiData.interventionsAndTreatments.thrombolyticGiven,
            thrombolyticAdminTime: stemiData.interventionsAndTreatments.thrombolyticAdminTime ? new Date(stemiData.interventionsAndTreatments.thrombolyticAdminTime) : undefined,
            fibrinolyticAbsoluteContraindications: stemiData.interventionsAndTreatments.fibrinolyticAbsoluteContraindications,
            fibrinolyticRelativeContraindications: stemiData.interventionsAndTreatments.fibrinolyticRelativeContraindications,
          }),
        }
      });

      // Recalculate quality metrics after update
      await this.calculateAndUpdateQualityMetrics(id);

      return await this.getStemiCaseById(id);
    } catch (error) {
      console.error('Error updating STEMI case:', error);
      throw new BadRequestException('Failed to update STEMI case');
    }
  }

  async deleteStemiCase(id: string) {
    const existingCase = await this.getStemiCaseById(id);
    
    try {
      // Delete STEMI case (this will cascade to timeline)
      await this.prisma.stemiCase.delete({
        where: { id }
      });

      // Delete associated ticket only if it exists
      if (existingCase.ticketId) {
        await this.prisma.ticket.delete({
          where: { id: existingCase.ticketId }
        });
      }

      return { message: 'STEMI case deleted successfully' };
    } catch (error) {
      console.error('Error deleting STEMI case:', error);
      throw new BadRequestException('Failed to delete STEMI case');
    }
  }

  async getKpiSummary(hospitalId?: string, startDate?: string, endDate?: string) {
    try {
      return await this.stemiKpiService.getKpiSummary(hospitalId, startDate, endDate);
    } catch (error) {
      console.error('Error in getKpiSummary:', error);
      throw error;
    }
  }

  /**
   * Calculate and update quality metrics for a STEMI case
   */
  private async calculateAndUpdateQualityMetrics(stemiCaseId: string) {
    try {
      const stemiCase = await this.prisma.stemiCase.findUnique({
        where: { id: stemiCaseId }
      });

      if (!stemiCase) {
        console.warn(`STEMI case ${stemiCaseId} not found for quality metrics calculation`);
        return;
      }

      const admissionTime = stemiCase.pathwayStarted;
      const updateData: any = {};

      // Calculate Door to ECG (triage to first ECG)
      if (stemiCase.triageTime && stemiCase.firstEcgTime) {
        updateData.doorToEcgMinutes = this.calculateTimeDifference(stemiCase.triageTime, stemiCase.firstEcgTime);
        updateData.metKpi1 = updateData.doorToEcgMinutes <= 10; // Door to ECG ≤10min
      }

      // Calculate Door to Balloon (triage to balloon inflation) - only for PCI-eligible cases
      if (stemiCase.triageTime && stemiCase.balloonInflationTime && stemiCase.eligibleForPrimaryPci) {
        updateData.doorToBalloonMinutes = this.calculateTimeDifference(stemiCase.triageTime, stemiCase.balloonInflationTime);
        
        // Set KPI based on case type
        if (stemiCase.caseType === 'DIRECT') {
          updateData.metKpi2 = updateData.doorToBalloonMinutes <= 90; // Direct: ≤90min
          updateData.metKpi2Direct = updateData.doorToBalloonMinutes <= 90;
          updateData.metKpi2Transfer = false; // Not applicable for direct cases
        } else if (stemiCase.caseType === 'TRANSFER') {
          updateData.metKpi2 = updateData.doorToBalloonMinutes <= 120; // Transfer: ≤120min
          updateData.metKpi2Direct = false; // Not applicable for transfer cases
          updateData.metKpi2Transfer = updateData.doorToBalloonMinutes <= 120;
        } else {
          // Fallback for legacy cases without caseType
          updateData.metKpi2 = updateData.doorToBalloonMinutes <= 90;
          updateData.metKpi2Direct = updateData.doorToBalloonMinutes <= 90;
          updateData.metKpi2Transfer = false;
        }
      }

      // Calculate Door to Needle (triage to thrombolytic administration) - only for thrombolytic cases
      if (stemiCase.triageTime && stemiCase.thrombolyticAdminTime && stemiCase.thrombolyticGiven) {
        updateData.doorToNeedleMinutes = this.calculateTimeDifference(stemiCase.triageTime, stemiCase.thrombolyticAdminTime);
        updateData.metKpi3 = updateData.doorToNeedleMinutes <= 30; // Door to Needle ≤30min
      }

      // Calculate Door In Door Out (triage to door out) - only for transfer cases
      if (stemiCase.triageTime && stemiCase.doorOutTime && stemiCase.caseType === 'TRANSFER') {
        updateData.doorInDoorOutMinutes = this.calculateTimeDifference(stemiCase.triageTime, stemiCase.doorOutTime);
        if (stemiCase.eligibleForPrimaryPci) {
          updateData.metKpi5 = updateData.doorInDoorOutMinutes <= 30; // Door In Door Out ≤30min
        }
      }

      // Calculate RCC Activation KPI (KPI4) - only for transfer cases
      if (stemiCase.caseType === 'TRANSFER' && stemiCase.ticketId) {
        // For transfer cases: EMS contact to door out ≤15 minutes
        const ticket = await this.prisma.ticket.findUnique({
          where: { id: stemiCase.ticketId },
          select: { emsContactTime: true }
        });
        
        if (ticket?.emsContactTime && stemiCase.doorOutTime) {
          const emsContact = new Date(ticket.emsContactTime);
          const doorOut = new Date(stemiCase.doorOutTime);
          const diffMinutes = (doorOut.getTime() - emsContact.getTime()) / (1000 * 60);
          updateData.rccActivationToDoorOutMinutes = diffMinutes;
          updateData.metKpi4 = diffMinutes <= 15;
        } 
      } else {
        console.log(`Skipping RCC activation calculation - caseType: ${stemiCase.caseType}, ticketId: ${stemiCase.ticketId}`);
      }
      // Direct cases are excluded from RCC Activation KPI calculation

      // Update the case with calculated metrics
      if (Object.keys(updateData).length > 0) {
        await this.prisma.stemiCase.update({
          where: { id: stemiCaseId },
          data: updateData
        });
        console.log(`Updated quality metrics for STEMI case ${stemiCaseId}:`, updateData);
      }
    } catch (error) {
      console.error('Error calculating quality metrics:', error);
      // Don't throw error to avoid breaking case creation
    }
  }

  /**
   * Calculate time difference in minutes between two dates
   */
  private calculateTimeDifference(startTime: Date, endTime: Date): number | null {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
  }
}
