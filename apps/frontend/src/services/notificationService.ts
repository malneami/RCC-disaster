import { apiClient } from './apiClient';

// Enhanced error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition?: (error: ApiError) => boolean;
}

// Types
export interface Notification {
  id: string;
  type: 'CASE_COMMENT' | 'CASE_UPDATE' | 'CASE_ASSIGNMENT' | 'CASE_COMPLETION' | 'CASE_ESCALATION' | 'EMS_LATE_CASE' | 'CRITICAL_CASE_INCOMING' | 'INCOMPLETE_PATIENT_DATA' | 'KPI_THRESHOLD_BREACH' | 'CRITICAL_TIME_LIMIT_APPROACHING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  caseType: 'GENERAL' | 'STEMI' | 'STROKE' | 'TRAUMA';
  caseId: string;
  ticketId?: string;
  patientId: string;
  patientName: string;
  category?: 'PATIENTS' | 'EMS' | 'HOSPITALS' | 'TICKETS';
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  isRead: boolean;
  readAt?: string;
  readBy?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  readByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    age?: number;
    gender: string;
  };
  recipients: Array<{
    id: string;
    isRead: boolean;
    readAt?: string;
    deliveryStatus: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
    deliveryMethod: 'IN_APP' | 'EMAIL' | 'SMS' | 'ALL';
  }>;
}

export interface CaseNote {
  id: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  caseType: 'STEMI' | 'STROKE' | 'TRAUMA';
  caseId: string;
  ticketId?: string;
  patientId: string;
  patientName: string;
  notifyTeam: boolean;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    age?: number;
    gender: string;
  };
  recipients: Array<{
    id: string;
    isRead: boolean;
    readAt?: string;
    deliveryStatus: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
    deliveryMethod: 'IN_APP' | 'EMAIL' | 'SMS' | 'ALL';
  }>;
}

export interface NotificationSummary {
  totalNotifications: number;
  unreadNotifications: number;
  highPriorityNotifications: number;
  highPriorityUnreadNotifications: number;
  mediumPriorityUnreadNotifications: number;
  emailNotifications: number;
  smsNotifications: number;
  disasterUnreadNotifications?: number;
}

export interface DisasterNotification {
  id: string;
  disasterIncidentId: string;
  type: 'INCIDENT_CREATED' | 'ANNOUNCEMENT_SENT' | 'AMBULANCE_ASSIGNED' | 'INCIDENT_RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  status: 'UNREAD' | 'READ';
  createdById: string;
  createdAt: string;
  createdBy: { id: string; firstName: string; lastName: string; email: string };
  disasterIncident: { id: string; incidentType: string; locationAddress: string | null; status: string };
  _recipientMeta?: { isRead: boolean; readAt: string | null };
}

export interface NotificationCategory {
  type: string;
  count: number;
}

export interface NotificationFilter {
  type?: string;
  priority?: string;
  caseType?: string;
  patientId?: string;
  caseId?: string;
  isRead?: string; // Changed to string to match URL parameter handling like caseType
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  limit?: string;
  category?: string;
}

export interface CreateNotificationData {
  type: 'CASE_COMMENT' | 'CASE_UPDATE' | 'CASE_ASSIGNMENT' | 'CASE_COMPLETION' | 'CASE_ESCALATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  message: string;
  caseType: 'STEMI' | 'STROKE' | 'TRAUMA';
  caseId: string;
  ticketId?: string;
  patientId: string;
  patientName: string;
  metadata?: string;
  recipientUserIds: string[];
  deliveryMethod?: 'IN_APP' | 'EMAIL' | 'SMS' | 'ALL';
}

export interface CreateCaseNoteData {
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  caseType: 'STEMI' | 'STROKE' | 'TRAUMA';
  caseId: string;
  ticketId?: string;
  patientId: string;
  patientName: string;
  notifyTeam: boolean;
  metadata?: string;
  recipientUserIds?: string[];
  deliveryMethod?: 'IN_APP' | 'EMAIL' | 'SMS' | 'ALL';
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'RCC' | 'EMS' | 'DATA_COLLECTOR' | 'CATH_LAB_USER' | 'HOSPITAL_USER';
}

// Utility functions for enhanced error handling
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createApiError = (error: any): ApiError => {
  if (error.response) {
    return {
      message: error.response.data?.message || error.message || 'An error occurred',
      status: error.response.status,
      code: error.response.data?.code || error.code,
      details: error.response.data
    };
  } else if (error.request) {
    return {
      message: 'Network error - please check your connection',
      code: 'NETWORK_ERROR',
      details: error.request
    };
  } else {
    return {
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'UNKNOWN_ERROR',
      details: error
    };
  }
};

const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  config: RetryConfig = { maxRetries: 3, retryDelay: 1000 }
): Promise<T> => {
  let lastError: ApiError;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = createApiError(error);
      
      // Don't retry on client errors (4xx) except 408, 429
      if (lastError.status && lastError.status >= 400 && lastError.status < 500) {
        if (lastError.status !== 408 && lastError.status !== 429) {
          throw lastError;
        }
      }
      
      // Check custom retry condition
      if (config.retryCondition && !config.retryCondition(lastError)) {
        throw lastError;
      }
      
      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await sleep(config.retryDelay * Math.pow(2, attempt)); // Exponential backoff
    }
  }
  
  throw lastError!;
};

// API Functions
export const notificationService = {
  // Get notifications with filtering
  async getNotifications(filter: NotificationFilter = {}): Promise<{
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    return retryRequest(async () => {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        // Skip undefined, null, and empty strings (empty strings mean "all" for filters)
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const url = `/notifications?${params.toString()}`;
      console.log('Making API call to:', url);
      console.log('Filter object:', filter);
      console.log('URL params:', params.toString());

      const response = await apiClient.get(url);
      console.log('API response status:', response.status);
      return response.data;
    }, {
      maxRetries: 2,
      retryDelay: 1000,
      retryCondition: (error) => error.status === 408 || error.status === 429 || error.code === 'NETWORK_ERROR'
    });
  },

  // Get unified notifications (case + disaster)
  async getUnifiedNotifications(limit = 50): Promise<{
    notifications: Notification[];
    disasterNotifications: DisasterNotification[];
  }> {
    const response = await apiClient.get(`/notifications/unified?limit=${limit}`);
    return response.data;
  },

  // Get unified summary including disaster counts
  async getUnifiedSummary(): Promise<NotificationSummary> {
    const response = await apiClient.get('/notifications/unified-summary');
    return response.data;
  },

  // Mark disaster notification as read
  async markDisasterNotificationRead(notificationId: string): Promise<{ success: boolean }> {
    const response = await apiClient.put(`/notifications/disaster/${notificationId}/read`);
    return response.data;
  },

  // Get notification summary with optional filters
  async getNotificationSummary(filter?: NotificationFilter): Promise<NotificationSummary> {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        // Skip undefined, null, and empty strings (empty strings mean "all" for filters)
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const url = `/notifications/summary${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get notification categories
  async getNotificationCategories(): Promise<NotificationCategory[]> {
    const response = await apiClient.get('/notifications/categories');
    return response.data;
  },

  // Get case type counts for tabs
  async getCaseTypeCounts(): Promise<{
    ALL: number;
    STEMI: number;
    STROKE: number;
    TRAUMA: number;
  }> {
    const response = await apiClient.get('/notifications/case-type-counts');
    return response.data;
  },

  // Get notification by ID
  async getNotificationById(id: string): Promise<Notification> {
    const response = await apiClient.get(`/notifications/${id}`);
    return response.data;
  },

  // Create notification
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    const response = await apiClient.post('/notifications', data);
    return response.data;
  },

  // Mark notifications as read
  async markNotificationsAsRead(notificationIds: string[]): Promise<{ count: number }> {
    const response = await apiClient.put('/notifications/mark-read', {
      notificationIds,
    });
    return response.data;
  },

  // Delete notification (soft delete for current user)
  async deleteNotification(id: string): Promise<{ count: number }> {
    const response = await apiClient.delete(`/notifications/${id}/user`);
    return response.data;
  },

  // Case Notes API
  async createCaseNote(data: CreateCaseNoteData): Promise<CaseNote> {
    const response = await apiClient.post('/case-notes', data);
    return response.data;
  },

  async getCaseNotes(caseType: string, caseId: string): Promise<CaseNote[]> {
    const response = await apiClient.get(`/case-notes/case/${caseType}/${caseId}`);
    return response.data;
  },

  async getCaseNoteById(id: string): Promise<CaseNote> {
    const response = await apiClient.get(`/case-notes/${id}`);
    return response.data;
  },

  async updateCaseNote(id: string, data: Partial<CreateCaseNoteData>): Promise<CaseNote> {
    const response = await apiClient.put(`/case-notes/${id}`, data);
    return response.data;
  },

  async markCaseNoteAsRead(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.put(`/case-notes/${id}/mark-read`);
    return response.data;
  },

  async deleteCaseNote(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/case-notes/${id}`);
    return response.data;
  },

  // Users API (for recipient selection)
  async getUsers(): Promise<User[]> {
    const response = await apiClient.get('/users/for-communication?page=1&limit=10000');
    return response.data.data; // The backend returns { data: users[], total, page, limit, pages }
  },
};

export default notificationService;
