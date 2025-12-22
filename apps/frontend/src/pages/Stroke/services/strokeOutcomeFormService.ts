import { apiClient } from '../../../services/apiClient';

export interface StrokeOutcomeFormData {
  dischargeType?: string;
  followUpNotCompletedReason?: string;
  followUpSpecify?: string;
  followUpType?: string;
  dischargeModifiedRankinScale?: number;
  followUpModifiedRankinScale?: number;
  closureReport?: string;
  functionalStatus?: string;
  mortality?: string;
  outcomeFormCompletionDate?: string;
  outcomePercentageCompleteness?: number;
}

export interface StrokeOutcomeFormResponse {
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
  dischargeType?: string;
  followUpNotCompletedReason?: string;
  followUpSpecify?: string;
  followUpType?: string;
  dischargeModifiedRankinScale?: number;
  followUpModifiedRankinScale?: number;
  closureReport?: string;
  functionalStatus?: string;
  mortality?: string;
  outcomeFormCompletionDate?: string;
  outcomePercentageCompleteness?: number;
  dischargeDestination?: string;
  dischargeDate?: string;
  lengthOfStayDays?: number;
  complications?: string;
  followUpCallCompleted?: boolean;
  followUpCallDate?: string;
  threeMonthFollowupComplete?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StrokeCaseWithCompleteness {
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
  strokeType: string;
  createdAt: string;
  updatedAt: string;
  dischargeType?: string;
  followUpNotCompletedReason?: string;
  followUpSpecify?: string;
  followUpType?: string;
  dischargeModifiedRankinScale?: number;
  followUpModifiedRankinScale?: number;
  closureReport?: string;
  functionalStatus?: string;
  mortality?: string;
  outcomeFormCompletionDate?: string;
  outcomePercentageCompleteness?: number;
  outcomeFormCompleteness: number;
}

export interface StrokeOutcomeFormStats {
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

class StrokeOutcomeFormService {
  /**
   * Update stroke case outcome form
   */
  async updateOutcomeForm(
    strokeCaseId: string,
    data: StrokeOutcomeFormData
  ): Promise<StrokeOutcomeFormResponse> {
    const response = await apiClient.put(
      `/stroke-cases/outcome-form/${strokeCaseId}`,
      data
    );
    return response.data;
  }

  /**
   * Get stroke case outcome form data
   */
  async getOutcomeForm(strokeCaseId: string): Promise<StrokeOutcomeFormResponse> {
    const response = await apiClient.get(`/stroke-cases/outcome-form/${strokeCaseId}`);
    return response.data;
  }

  /**
   * Get stroke cases with outcome form completeness
   */
  async getCasesWithCompleteness(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: StrokeCaseWithCompleteness[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await apiClient.get('/stroke-cases/outcome-form', {
      params: { page, limit },
    });
    return response.data;
  }

  /**
   * Get outcome form statistics
   */
  async getOutcomeFormStats(): Promise<StrokeOutcomeFormStats> {
    const response = await apiClient.get('/stroke-cases/outcome-form/stats/overview');
    return response.data;
  }

  /**
   * Calculate outcome form completeness percentage
   */
  calculateCompleteness(caseData: Partial<StrokeOutcomeFormData>): number {
    const outcomeFields = [
      'dischargeType',
      'followUpNotCompletedReason',
      'followUpSpecify',
      'followUpType',
      'dischargeModifiedRankinScale',
      'followUpModifiedRankinScale',
      'closureReport',
      'functionalStatus',
      'mortality',
    ];

    const completedFields = outcomeFields.filter(field => {
      const value = caseData[field as keyof StrokeOutcomeFormData];
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
   * Format Modified Rankin Scale value
   */
  formatModifiedRankinScale(value?: number): string {
    if (value === undefined || value === null) return 'Not specified';
    
    const scale = {
      0: 'No symptoms',
      1: 'No significant disability',
      2: 'Slight disability',
      3: 'Moderate disability',
      4: 'Moderately severe disability',
      5: 'Severe disability',
      6: 'Dead',
    };
    
    return `${value} - ${scale[value as keyof typeof scale]}`;
  }

  /**
   * Format discharge type
   */
  formatDischargeType(type?: string): string {
    if (!type) return 'Not specified';
    
    const types = {
      PLANNED: 'Planned',
      UNPLANNED: 'Unplanned',
      AGAINST_MEDICAL_ADVICE: 'Against Medical Advice',
      TRANSFER: 'Transfer',
      OTHER: 'Other',
    };
    
    return types[type as keyof typeof types] || type;
  }

  /**
   * Format functional status
   */
  formatFunctionalStatus(status?: string): string {
    if (!status) return 'Not specified';
    
    const statuses = {
      INDEPENDENT: 'Independent',
      ASSISTANCE_REQUIRED: 'Assistance Required',
      DEPENDENT: 'Dependent',
      SEVERELY_DEPENDENT: 'Severely Dependent',
    };
    
    return statuses[status as keyof typeof statuses] || status;
  }

  /**
   * Format mortality status
   */
  formatMortalityStatus(status?: string): string {
    if (!status) return 'Not specified';
    
    const statuses = {
      ALIVE: 'Alive',
      DEAD: 'Dead',
      UNKNOWN: 'Unknown',
    };
    
    return statuses[status as keyof typeof statuses] || status;
  }

  /**
   * Format follow-up type
   */
  formatFollowUpType(type?: string): string {
    if (!type) return 'Not specified';
    
    const types = {
      PHONE: 'Phone',
      IN_PERSON: 'In Person',
      TELEHEALTH: 'Telehealth',
      MAIL: 'Mail',
      NOT_COMPLETED: 'Not Completed',
    };
    
    return types[type as keyof typeof types] || type;
  }
}

export const strokeOutcomeFormService = new StrokeOutcomeFormService();
