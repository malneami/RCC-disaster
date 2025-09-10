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

  async createStemiCase(createStemiCaseDto: any, userId: string) {
    const { patientInfo, admissionTime, modeOfArrival, criticalTimestamps, interventionsAndTreatments, clinicalAssessment, ...stemiData } = createStemiCaseDto;

    try {
      // Create or update patient
      console.log('Creating patient with data:', JSON.stringify(patientInfo, null, 2));
      const patient = await this.stemiPatientService.createOrUpdatePatient(patientInfo, userId);
      console.log('Patient created successfully:', patient.id);

      // Create ticket first
      const ticket = await this.prisma.ticket.create({
        data: {
          ticketNumber: `STEMI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          patientId: patient.id,
          originHospitalId: patientInfo.originHospitalId,
          destinationHospitalId: patientInfo.destinationHospitalId,
          priority: 'CRITICAL',
          status: 'PENDING',
          pathway: 'STEMI',
          chiefComplaint: clinicalAssessment.presentingSymptoms || 'Chest pain - suspected STEMI',
          vitals: JSON.stringify({}), // Will be populated later
          isEmergency: true,
          emergencyType: 'STEMI',
          emergencySeverity: 'CRITICAL',
          notes: `STEMI case: ${clinicalAssessment.presentingSymptoms}`,
          createdById: userId,
          
          // Basic ticket fields only
        }
      });

      // Create STEMI case
      const stemiCase = await this.prisma.stemiCase.create({
        data: {
          ticketId: ticket.id,
          patientId: patient.id,
          originHospitalId: patientInfo.originHospitalId,
          destinationHospitalId: patientInfo.destinationHospitalId,
          
          // Clinical Assessment
          heartScore: clinicalAssessment.heartScore,
          clinicalRiskLevel: clinicalAssessment.clinicalRiskLevel,
          presentingSymptoms: clinicalAssessment.presentingSymptoms,
          symptomOnset: clinicalAssessment.symptomOnset ? new Date(clinicalAssessment.symptomOnset) : null,
          symptomDuration: clinicalAssessment.symptomDuration,
          
          // Pathway Execution
          currentStatus: stemiData.currentStatus || 'SUSPECTED',
          selectedTreatment: stemiData.selectedTreatment,
          pathwayStarted: admissionTime ? new Date(admissionTime) : new Date(),
          modeOfArrival: modeOfArrival,
          
          // ECG Results
          ecgResult: stemiData.ecgResult,
          ecgFindings: stemiData.ecgFindings,
          
          // Critical Timestamps
          triageTime: criticalTimestamps.triageTime ? new Date(criticalTimestamps.triageTime) : null,
          firstEcgTime: criticalTimestamps.firstEcgTime ? new Date(criticalTimestamps.firstEcgTime) : null,
          
          // Interventions and Treatments
          eligibleForPrimaryPci: interventionsAndTreatments.eligibleForPrimaryPci,
          pciLocation: interventionsAndTreatments.pciLocation,
          doorOutTime: interventionsAndTreatments.doorOutTime ? new Date(interventionsAndTreatments.doorOutTime) : null,
          balloonInflationTime: interventionsAndTreatments.balloonInflationTime ? new Date(interventionsAndTreatments.balloonInflationTime) : null,
          thrombolyticGiven: interventionsAndTreatments.thrombolyticGiven,
          thrombolyticAdminTime: interventionsAndTreatments.thrombolyticAdminTime ? new Date(interventionsAndTreatments.thrombolyticAdminTime) : null,
          
          // Additional STEMI-specific fields (removed non-existent fields)
          
          createdById: userId,
        }
      });

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
      },
      criticalTimestamps: {
        triageTime: stemiCase.triageTime,
        firstEcgTime: stemiCase.firstEcgTime,
      },
      interventionsAndTreatments: {
        eligibleForPrimaryPci: stemiCase.eligibleForPrimaryPci,
        pciLocation: stemiCase.pciLocation,
        doorOutTime: stemiCase.doorOutTime,
        balloonInflationTime: stemiCase.balloonInflationTime,
        thrombolyticGiven: stemiCase.thrombolyticGiven,
        thrombolyticAdminTime: stemiCase.thrombolyticAdminTime,
      },
    };
  }

  async updateStemiCase(id: string, updateStemiCaseDto: UpdateStemiCaseDto, userId: string) {
    console.log('updateStemiCase called with:', JSON.stringify({ id, updateStemiCaseDto, userId }, null, 2));
    
    const existingCase = await this.getStemiCaseById(id);
    
    const { patientInfo, ...stemiData } = updateStemiCaseDto;
    
    console.log('Extracted data:', JSON.stringify({ patientInfo, stemiData }, null, 2));

    try {
      // Update patient if patientInfo provided
      if (patientInfo) {
        await this.stemiPatientService.updatePatient(existingCase.patientId, patientInfo);
      }

      // Update ticket
      await this.prisma.ticket.update({
        where: { id: existingCase.ticketId },
        data: {
          // Update hospital fields if provided
          ...(patientInfo?.originHospitalId && {
            originHospitalId: patientInfo.originHospitalId,
          }),
          ...(patientInfo?.destinationHospitalId && {
            destinationHospitalId: patientInfo.destinationHospitalId,
          }),
        }
      });

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
      if (patientInfo?.destinationHospitalId !== undefined && patientInfo?.destinationHospitalId !== null && patientInfo?.destinationHospitalId !== '') {
        updateData.destinationHospitalId = patientInfo.destinationHospitalId;
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
          }),
          
          // Update critical timestamps if provided
          ...(stemiData.criticalTimestamps && {
            triageTime: stemiData.criticalTimestamps.triageTime ? new Date(stemiData.criticalTimestamps.triageTime) : undefined,
            firstEcgTime: stemiData.criticalTimestamps.firstEcgTime ? new Date(stemiData.criticalTimestamps.firstEcgTime) : undefined,
          }),
          
          // Update interventions and treatments if provided
          ...(stemiData.interventionsAndTreatments && {
            eligibleForPrimaryPci: stemiData.interventionsAndTreatments.eligibleForPrimaryPci,
            pciLocation: stemiData.interventionsAndTreatments.pciLocation,
            doorOutTime: stemiData.interventionsAndTreatments.doorOutTime ? new Date(stemiData.interventionsAndTreatments.doorOutTime) : undefined,
            balloonInflationTime: stemiData.interventionsAndTreatments.balloonInflationTime ? new Date(stemiData.interventionsAndTreatments.balloonInflationTime) : undefined,
            thrombolyticGiven: stemiData.interventionsAndTreatments.thrombolyticGiven,
            thrombolyticAdminTime: stemiData.interventionsAndTreatments.thrombolyticAdminTime ? new Date(stemiData.interventionsAndTreatments.thrombolyticAdminTime) : undefined,
          }),
        }
      });

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

      // Delete associated ticket
      await this.prisma.ticket.delete({
        where: { id: existingCase.ticketId }
      });

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
}
