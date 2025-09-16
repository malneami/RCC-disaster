import { TraumaService, CreateTraumaCaseData } from './traumaService';
import { StrokeService, CreateStrokeCaseData } from './strokeService';
import { StemiService, CreateStemiCaseData } from '../pages/Stemi/services/stemiService';
import { Ticket } from './ticketService';
import { Patient } from './patientService';

export interface AutoCaseCreationResult {
  success: boolean;
  caseId?: string;
  caseType?: 'trauma' | 'stroke' | 'stemi';
  error?: string;
}

class AutoCaseCreationService {
  /**
   * Automatically creates trauma, stroke, or STEMI cases based on ticket pathway
   */
  async createCaseFromTicket(
    ticket: Ticket,
    patient: Patient
  ): Promise<AutoCaseCreationResult> {
    try {
      const pathway = ticket.pathway?.toUpperCase();
      
      switch (pathway) {
        case 'TRAUMA':
          return await this.createTraumaCase(ticket, patient);
        case 'STROKE':
          return await this.createStrokeCase(ticket, patient);
        case 'STEMI':
          return await this.createStemiCase(ticket, patient);
        default:
          return {
            success: false,
            error: `No automatic case creation for pathway: ${pathway}`
          };
      }
    } catch (error) {
      console.error('Error in auto case creation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Creates a trauma case from ticket data
   */
  private async createTraumaCase(
    ticket: Ticket,
    patient: Patient
  ): Promise<AutoCaseCreationResult> {
    try {
      const traumaData: CreateTraumaCaseData = {
        ticketId: ticket.id,
        patientId: patient.id,
        originHospitalId: ticket.originHospitalId,
        destinationHospitalId: ticket.destinationHospitalId,
        
        // Required fields with defaults
        arrivalDateTime: new Date().toISOString(),
        modeOfArrival: 'AMBULANCE', // Default, can be updated later
        mechanismOfInjury: 'OTHER', // Default, can be updated later
        
        // Optional fields from ticket data
        chiefComplaint: ticket.chiefComplaint,
        
        // Patient information for auto-creation
        patientInfo: {
          firstName: patient.firstName,
          lastName: patient.lastName,
          mrn: patient.mrn,
          nationalId: patient.nationalId,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender as any,
          phoneNumber: patient.phoneNumber,
          email: patient.email,
        },
      };

      const traumaCase = await TraumaService.createTraumaCase(traumaData);
      
      return {
        success: true,
        caseId: traumaCase.id,
        caseType: 'trauma'
      };
    } catch (error) {
      console.error('Error creating trauma case:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create trauma case'
      };
    }
  }

  /**
   * Creates a stroke case from ticket data
   */
  private async createStrokeCase(
    ticket: Ticket,
    patient: Patient
  ): Promise<AutoCaseCreationResult> {
    try {
      const strokeData: CreateStrokeCaseData = {
        ticketId: ticket.id,
        patientId: patient.id,
        originHospitalId: ticket.originHospitalId,
        destinationHospitalId: ticket.destinationHospitalId,
        
        // Required fields with defaults
        strokeType: 'UNKNOWN', // Default, can be updated after assessment
        currentStatus: 'SUSPECTED', // Initial status
        
        // Optional fields from ticket data
        chiefComplaint: ticket.chiefComplaint,
        
        // Patient information for auto-creation
        patientInfo: {
          firstName: patient.firstName,
          lastName: patient.lastName,
          mrn: patient.mrn,
          nationalId: patient.nationalId,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender as any,
          phoneNumber: patient.phoneNumber,
          email: patient.email,
        },
        
        // Set severity based on priority
        strokeSeverity: this.mapPriorityToStrokeSeverity(ticket.priority),
      };

      const strokeCase = await StrokeService.createStrokeCase(strokeData);
      
      return {
        success: true,
        caseId: strokeCase.id,
        caseType: 'stroke'
      };
    } catch (error) {
      console.error('Error creating stroke case:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create stroke case'
      };
    }
  }

  /**
   * Creates a STEMI case from ticket data
   */
  private async createStemiCase(
    ticket: Ticket,
    patient: Patient
  ): Promise<AutoCaseCreationResult> {
    try {
      const stemiData: CreateStemiCaseData = {
        patientInfo: {
          firstName: patient.firstName,
          lastName: patient.lastName,
          nationalId: patient.nationalId || '',
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender as 'MALE' | 'FEMALE',
          phoneNumber: patient.phoneNumber,
          address: patient.address,
          emergencyContact: patient.emergencyContact,
          emergencyPhone: patient.emergencyPhone,
          medicalHistory: patient.medicalHistory,
          allergies: patient.allergies,
          medications: patient.medications,
          originHospitalId: ticket.originHospitalId,
          destinationHospitalId: ticket.destinationHospitalId,
        },
        
        // Required fields with defaults
        admissionTime: new Date().toISOString(),
        modeOfArrival: 'AMBULANCE', // Default, can be updated later
        
        // Critical timestamps - will be filled as pathway progresses
        criticalTimestamps: {
          triageTime: new Date().toISOString(),
        },
        
        // Interventions and treatments - will be filled as pathway progresses
        interventionsAndTreatments: {
          eligibleForPrimaryPci: true, // Default assumption for STEMI
        },
        
        // Clinical assessment - will be filled as pathway progresses
        clinicalAssessment: {
          presentingSymptoms: ticket.chiefComplaint,
          symptomOnset: new Date().toISOString(), // Default to now, can be updated
        },
        
        // Initial status
        currentStatus: 'SUSPECTED',
        
        // ECG results - will be filled as pathway progresses
        ecgResult: 'PENDING',
      };

      const stemiCase = await StemiService.createStemiCase(stemiData);
      
      return {
        success: true,
        caseId: stemiCase.id,
        caseType: 'stemi'
      };
    } catch (error) {
      console.error('Error creating STEMI case:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create STEMI case'
      };
    }
  }

  /**
   * Maps ticket priority to stroke severity
   */
  private mapPriorityToStrokeSeverity(priority: string): 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL' {
    switch (priority.toUpperCase()) {
      case 'EMERGENCY':
      case 'CRITICAL':
        return 'CRITICAL';
      case 'HIGH':
        return 'SEVERE';
      case 'MEDIUM':
        return 'MODERATE';
      case 'LOW':
        return 'MILD';
      default:
        return 'MODERATE';
    }
  }

  /**
   * Checks if a pathway supports automatic case creation
   */
  supportsAutoCaseCreation(pathway: string): boolean {
    const supportedPathways = ['TRAUMA', 'STROKE', 'STEMI'];
    return supportedPathways.includes(pathway.toUpperCase());
  }

  /**
   * Gets the case creation status message
   */
  getCaseCreationMessage(result: AutoCaseCreationResult): string {
    if (result.success) {
      let caseType = 'Case';
      switch (result.caseType) {
        case 'trauma':
          caseType = 'Trauma';
          break;
        case 'stroke':
          caseType = 'Stroke';
          break;
        case 'stemi':
          caseType = 'STEMI';
          break;
      }
      return `${caseType} case created successfully`;
    } else {
      return `Failed to create case: ${result.error}`;
    }
  }
}

export const autoCaseCreationService = new AutoCaseCreationService();
