import { apiClient } from '../../../services/apiClient';

export interface StemiOutcomeFormData {
  // PCI Procedure Phase
  cathLabActivationTime?: string;
  cathLabArrivalTime?: string;
  pciProcedureStartTime?: string;
  pciProcedureCompleteTime?: string;

  // Post-PCI Management Phase
  postPciComplications?: string;
  dischargeStatus?: string;
  dischargeMedications?: string;
  followUpAppointmentDate?: string;
  followUpAppointmentProvider?: string;

  // Outcome Form Management
  outcomeFormCompleted?: boolean;
  outcomeFormCompletionDate?: string;
  outcomePercentageCompleteness?: number;
}

export interface StemiOutcomeFormResponse {
  id: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
  };
  originHospital: {
    id: string;
    name: string;
  };
  destinationHospital?: {
    id: string;
    name: string;
  };
  // PCI Procedure Phase
  cathLabActivationTime?: string;
  cathLabArrivalTime?: string;
  pciProcedureStartTime?: string;
  pciProcedureCompleteTime?: string;
  // Post-PCI Management Phase
  postPciComplications?: string;
  dischargeStatus?: string;
  dischargeMedications?: string;
  followUpAppointmentDate?: string;
  followUpAppointmentProvider?: string;
  // Outcome form management
  outcomeFormCompleted: boolean;
  outcomeFormCompletionDate?: string;
  outcomePercentageCompleteness?: number;
  // Existing fields
  successful?: boolean;
  complications?: string;
  dischargeDate?: string;
  thirtyDayReadmission?: boolean;
  followUpCallCompleted?: boolean;
  followUpCallDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StemiCaseWithCompleteness {
  id: string;
  patient: {
    firstName: string;
    lastName: string;
    nationalId: string;
  };
  originHospital: {
    name: string;
  };
  destinationHospital?: {
    name: string;
  };
  currentStatus: string;
  selectedTreatment?: string;
  createdAt: string;
  updatedAt: string;
  // PCI Procedure Phase
  cathLabActivationTime?: string;
  cathLabArrivalTime?: string;
  pciProcedureStartTime?: string;
  pciProcedureCompleteTime?: string;
  // Post-PCI Management Phase
  postPciComplications?: string;
  dischargeStatus?: string;
  dischargeMedications?: string;
  followUpAppointmentDate?: string;
  followUpAppointmentProvider?: string;
  // Outcome form management
  outcomeFormCompleted: boolean;
  outcomeFormCompletionDate?: string;
  outcomePercentageCompleteness?: number;
  outcomeFormCompleteness: number;
}

export interface StemiOutcomeFormStats {
  totalCases: number;
  completedForms: number;
  incompleteForms: number;
  completionRate: number;
  completenessDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

class StemiOutcomeFormService {
  /**
   * Update STEMI case outcome form
   */
  async updateOutcomeForm(
    stemiCaseId: string,
    data: StemiOutcomeFormData
  ): Promise<StemiOutcomeFormResponse> {
    const response = await apiClient.put(
      `/stemi-cases/outcome-form/${stemiCaseId}`,
      data
    );
    return response.data;
  }

  /**
   * Get STEMI case outcome form data
   */
  async getOutcomeForm(stemiCaseId: string): Promise<StemiOutcomeFormResponse> {
    const response = await apiClient.get(`/stemi-cases/outcome-form/${stemiCaseId}`);
    return response.data;
  }

  /**
   * Get STEMI cases with outcome form completeness
   */
  async getCasesWithCompleteness(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: StemiCaseWithCompleteness[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await apiClient.get('/stemi-cases/outcome-form', {
      params: { page, limit },
    });
    return response.data;
  }

  /**
   * Get outcome form statistics
   */
  async getOutcomeFormStats(): Promise<StemiOutcomeFormStats> {
    const response = await apiClient.get('/stemi-cases/outcome-form/stats/overview');
    return response.data;
  }

  /**
   * Calculate outcome form completeness percentage
   */
  calculateCompleteness(caseData: Partial<StemiOutcomeFormData>): number {
    const outcomeFields = [
      'cathLabActivationTime',
      'cathLabArrivalTime',
      'pciProcedureStartTime',
      'pciProcedureCompleteTime',
      'postPciComplications',
      'dischargeStatus',
      'dischargeMedications',
      'followUpAppointmentProvider',
    ];

    // Add followUpAppointmentDate only if followUpAppointmentProvider is YES
    if (caseData.followUpAppointmentProvider === 'YES') {
      outcomeFields.push('followUpAppointmentDate');
    }

    const completedFields = outcomeFields.filter(field => {
      const value = caseData[field as keyof StemiOutcomeFormData];
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((completedFields.length / outcomeFields.length) * 100);
  }

  /**
   * Get completeness status color
   */
  getCompletenessColor(percentage: number): 'success' | 'warning' | 'error' {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  }

  /**
   * Get completeness status text
   */
  getCompletenessStatus(percentage: number): string {
    if (percentage >= 80) return 'High';
    if (percentage >= 50) return 'Medium';
    return 'Low';
  }

  /**
   * Format discharge status
   */
  formatDischargeStatus(status?: string): string {
    if (!status) return 'Not specified';
    
    const statuses = {
      DISCHARGED_HOME: 'Discharged Home',
      TRANSFER_TO_ANOTHER_FACILITY: 'Transfer to Another Facility',
      EXTENDED_OBSERVATION: 'Extended Observation',
      DECEASED: 'Deceased',
      ICU_TRANSFER: 'ICU Transfer',
      OTHER: 'Other',
    };
    
    return statuses[status as keyof typeof statuses] || status;
  }

  /**
   * Format date for display
   */
  formatDate(dateString?: string): string {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleString();
  }

  /**
   * Format appointment provider
   */
  formatAppointmentProvider(provider?: string): string {
    if (!provider) return 'Not specified';
    if (provider === 'YES') return 'Yes';
    if (provider === 'NO') return 'No';
    return provider;
  }
}

export const stemiOutcomeFormService = new StemiOutcomeFormService();
