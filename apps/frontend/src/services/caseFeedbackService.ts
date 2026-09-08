import apiClient from './apiClient';

export interface CreateCaseFeedbackData {
  ticketId: string;
  reviewerName: string;
  reviewDate: string;
  receivingConsultant?: string;

  // Section B - Operational Performance
  activationAppropriateness: string;
  activationInappropriateReason?: string;
  activationOtherReason?: string;

  conferenceCallEffectiveness: string;
  conferenceCallIssue?: string;
  conferenceCallIssueOther?: string;

  destinationAppropriateness: string;
  destinationIssueReason?: string;
  destinationIssueOther?: string;

  transportSafety: string;
  transportSafetyIssue?: string;
  transportSafetyIssueOther?: string;

  teamSuitability: string;
  teamInadequacyReason?: string;
  teamInadequacyOther?: string;

  documentationQuality: string;
  documentationMissingElements?: string[];
  documentationMissingOther?: string;

  // Section C - Pathway-Specific
  pathwayEvaluation?: any;

  // Section D - Outcome Assessment
  patientOutcome: string;
  perinatalOutcome?: string;
  complicationPreventable?: string;
  preventableStage?: string;
  preventableStageOther?: string;

  // Section E - Overall Evaluation
  rccCoordinationRating: number;
  additionalComments?: string;
}

export interface CaseFeedbackFilters {
  hospitalId?: string;
  pathway?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PendingFeedback {
  ticketId: string;
  ticketNumber: string;
  pathway: string;
  patientName: string;
  referringHospital: string;
  completedAt: Date;
  daysOverdue: number;
}

export interface CaseFeedback {
  id: string;
  ticketId: string;
  ticketNumber: string;
  pathway: string;
  reviewerName: string;
  reviewDate: string;
  rccCoordinationRating: number;
  status: string;
  activationAppropriateness?: string;
  destinationAppropriateness?: string;
  transportSafety?: string;
  patientOutcome?: string;
  additionalComments?: string;
  ticket: {
    ticketNumber: string;
    patient: {
      firstName: string;
      lastName: string;
    };
  };
  referringFacility: {
    name: string;
  };
  destinationFacility: {
    name: string;
  };
  reviewer: {
    firstName: string;
    lastName: string;
  };
}

export interface FeedbackListResponse {
  items: CaseFeedback[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FeedbackAnalytics {
  totalFeedbacks: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
  activationAppropriatenessDistribution: Record<string, number>;
  destinationAppropriatenessDistribution: Record<string, number>;
  transportSafetyDistribution: Record<string, number>;
  documentationQualityDistribution: Record<string, number>;
  patientOutcomeDistribution: Record<string, number>;
  byPathway: Array<{
    pathway: string;
    count: number;
    averageRating: number;
  }>;
  trends: Array<{
    period: string;
    count: number;
    averageRating: number;
  }>;
}

export const caseFeedbackService = {
  /**
   * Create new feedback
   */
  async create(data: CreateCaseFeedbackData): Promise<CaseFeedback> {
    const response = await apiClient.post('/case-feedback', data);
    return response.data;
  },

  /**
   * Get pending feedbacks for hospital
   */
  async getPending(hospitalId: string): Promise<PendingFeedback[]> {
    const response = await apiClient.get('/case-feedback/pending', {
      params: { hospitalId },
    });
    return response.data;
  },

  /**
   * Get all feedbacks with filters
   */
  async getAll(filters: CaseFeedbackFilters): Promise<FeedbackListResponse> {
    const response = await apiClient.get('/case-feedback', { params: filters });
    return response.data;
  },

  /**
   * Get feedback by ID
   */
  async getById(id: string): Promise<CaseFeedback> {
    const response = await apiClient.get(`/case-feedback/${id}`);
    return response.data;
  },

  /**
   * Get analytics
   */
  async getAnalytics(
    hospitalId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<FeedbackAnalytics> {
    const response = await apiClient.get('/case-feedback/analytics', {
      params: { hospitalId, startDate, endDate },
    });
    return response.data;
  },

  /**
   * Export to Excel
   */
  async exportToExcel(filters: CaseFeedbackFilters): Promise<Blob> {
    const response = await apiClient.get('/case-feedback/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Update feedback
   */
  async update(id: string, data: Partial<CreateCaseFeedbackData>): Promise<CaseFeedback> {
    const response = await apiClient.patch(`/case-feedback/${id}`, data);
    return response.data;
  },

  /**
   * Archive feedback
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/case-feedback/${id}`);
  },
};
