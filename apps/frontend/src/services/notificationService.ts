import { apiClient } from './apiClient';

// Types
export interface Notification {
  id: string;
  type: 'CASE_COMMENT' | 'CASE_UPDATE' | 'CASE_ASSIGNMENT' | 'CASE_COMPLETION' | 'CASE_ESCALATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  message: string;
  caseType: 'STEMI' | 'STROKE' | 'TRAUMA';
  caseId: string;
  ticketId?: string;
  patientId: string;
  patientName: string;
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
  emailNotifications: number;
  smsNotifications: number;
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
  isRead?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  limit?: string;
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
  role: 'ADMIN' | 'RCC' | 'EMS' | 'DATA_COLLECTOR' | 'CATH_LAB_USER';
}

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
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/notifications?${params.toString()}`);
    return response.data;
  },

  // Get notification summary
  async getNotificationSummary(): Promise<NotificationSummary> {
    const response = await apiClient.get('/notifications/summary');
    return response.data;
  },

  // Get notification categories
  async getNotificationCategories(): Promise<NotificationCategory[]> {
    const response = await apiClient.get('/notifications/categories');
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
    const response = await apiClient.delete(`/notifications/${id}`);
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
    const response = await apiClient.get('/users?page=1&limit=100');
    return response.data.data; // The backend returns { data: users[], total, page, limit, pages }
  },
};

export default notificationService;
