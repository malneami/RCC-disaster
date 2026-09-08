import { TraumaService, CreateTraumaCaseData } from './traumaService';
import { StrokeService, CreateStrokeCaseData } from './strokeService';
import { StemiService, CreateStemiCaseData } from '../pages/Stemi/services/stemiService';
import { neurosurgicalService } from './neurosurgicalService';
import { Ticket } from './ticketService';
import { Patient } from './patientService';
import { BedAssignmentFormData } from '../pages/Trauma/types/traumaTypes';
import { bedService } from '../pages/Beds/services/bedService';

export interface AutoCaseCreationResult {
  success: boolean;
  caseId?: string;
  caseType?: 'trauma' | 'stroke' | 'stemi' | 'neurosurgical';
  error?: string;
}

class AutoCaseCreationService {
  /**
   * Automatically creates trauma, stroke, or STEMI cases based on ticket pathway
   */
  async createCaseFromTicket(
    ticket: Ticket,
    patient: Patient,
    timeFields?: { triageTime?: string; symptomOnsetTime?: string },
    bedAssignment?: BedAssignmentFormData,
    neurosurgicalOptions?: { severity?: 'RED' | 'ORANGE' },
  ): Promise<AutoCaseCreationResult> {
    try {
      const pathway = ticket.pathway?.toUpperCase();
      
      let result: AutoCaseCreationResult;
      
      switch (pathway) {
        case 'TRAUMA':
          result = await this.createTraumaCase(ticket, patient);
          break;
        case 'STROKE':
          result = await this.createStrokeCase(ticket, patient, timeFields);
          break;
        case 'STEMI':
          result = await this.createStemiCase(ticket, patient, timeFields);
          break;
        case 'NEUROSURGICAL':
          result = await this.createNeurosurgicalCase(ticket, patient, neurosurgicalOptions);
          break;
        default:
          return {
            success: false,
            error: `No automatic case creation for pathway: ${pathway}`
          };
      }

      if (result.success && result.caseId && bedAssignment && bedAssignment.bedId) {
        try {
          const caseTypeMap: Record<string, 'TRAUMA' | 'STROKE' | 'STEMI'> = {
            'trauma': 'TRAUMA',
            'stroke': 'STROKE',
            'stemi': 'STEMI',
          };
          
          await bedService.assignBed(bedAssignment.bedId, {
            patientId: patient.id,
            caseId: result.caseId,
            caseType: result.caseType ? caseTypeMap[result.caseType] : undefined,
            arrivalDate: bedAssignment.arrivalDate,
          });
          
          // Dispatch event to update hospital capacity
          window.dispatchEvent(new CustomEvent('hospital-capacity-changed'));
        } catch (bedError: any) {
          console.error('Error assigning bed after case creation:', bedError);
          // Don't fail the case creation if bed assignment fails
          return {
            ...result,
            error: result.error || `Case created but bed assignment failed: ${bedError?.response?.data?.message || bedError?.message || 'Unknown error'}`,
          };
        }
      }

      return result;
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
        modeOfArrival: 'AMBULANCE_RED_CRESCENT', // Default, can be updated later
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
    patient: Patient,
    timeFields?: { triageTime?: string; symptomOnsetTime?: string }
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
        timeOfSymptomOnset: timeFields?.symptomOnsetTime ? new Date(timeFields.symptomOnsetTime).toISOString() : undefined,
        
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
    patient: Patient,
    timeFields?: { triageTime?: string; symptomOnsetTime?: string }
  ): Promise<AutoCaseCreationResult> {
    try {
      const stemiData: CreateStemiCaseData = {
        ticketId: ticket.id, // Link to existing ticket to prevent duplicate creation
        
        patientInfo: {
          firstName: patient.firstName,
          lastName: patient.lastName,
          nationalId: patient.nationalId || '',
          dateOfBirth: patient.dateOfBirth,
          gender: (['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'].includes(patient.gender?.toUpperCase()) 
            ? patient.gender.toUpperCase() 
            : 'UNKNOWN') as 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN',
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
        modeOfArrival: 'AMBULANCE_RED_CRESCENT', // Default, can be updated later
        
        // Critical timestamps - will be filled as pathway progresses
        criticalTimestamps: {
          triageTime: timeFields?.triageTime ? new Date(timeFields.triageTime).toISOString() : new Date().toISOString(),
        },
        
        // Interventions and treatments - will be filled as pathway progresses
        interventionsAndTreatments: {
          eligibleForPrimaryPci: true, // Default assumption for STEMI
        },
        
        // Clinical assessment - will be filled as pathway progresses
        clinicalAssessment: {
          presentingSymptoms: ticket.chiefComplaint,
          symptomOnset: timeFields?.symptomOnsetTime ? new Date(timeFields.symptomOnsetTime).toISOString() : new Date().toISOString(), // Use from timeFields or default to now
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

  private async createNeurosurgicalCase(
    ticket: Ticket,
    patient: Patient,
    options?: { severity?: 'RED' | 'ORANGE' },
  ): Promise<AutoCaseCreationResult> {
    try {
      const neuroCase = await neurosurgicalService.create({
        ticketId: ticket.id,
        patientId: patient.id,
        originHospitalId: ticket.originHospitalId,
        destinationHospitalId: ticket.destinationHospitalId,
        triggerReason: 'OTHER',
        triggerReasonOther: 'Auto-created from ticket pathway',
        severity: options?.severity || 'ORANGE',
        // User-selected severity at ticket create is intentional (no GCS yet)
        severityOverrideReason: options?.severity
          ? 'Selected at ticket creation'
          : undefined,
        notes: ticket.chiefComplaint || undefined,
      });

      return {
        success: true,
        caseId: neuroCase.id,
        caseType: 'neurosurgical',
      };
    } catch (error) {
      console.error('Error creating neurosurgical case:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create neurosurgical case',
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
    const supportedPathways = ['TRAUMA', 'STROKE', 'STEMI', 'NEUROSURGICAL'];
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
        case 'neurosurgical':
          caseType = 'Neurosurgical';
          break;
      }
      return `${caseType} case created successfully`;
    } else {
      return `Failed to create case: ${result.error}`;
    }
  }
}

export const autoCaseCreationService = new AutoCaseCreationService();
