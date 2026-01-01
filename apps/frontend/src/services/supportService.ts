import { apiClient } from './apiClient';

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type SupportTicketCategory = 'BUG' | 'ENHANCEMENT' | 'TECHNICAL_ISSUE' | 'FEATURE_REQUEST' | 'OTHER';
export type MessageSenderType = 'USER' | 'SUPPORT';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  description: string;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  resolvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    messages: number;
    attachments: number;
  };
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  content: string;
  senderType: MessageSenderType;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  attachments?: SupportAttachment[];
}

export interface SupportAttachment {
  id: string;
  ticketId: string;
  messageId?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileData: string; // Base64
  uploadedAt: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface SupportTicketWithDetails extends SupportTicket {
  messages: SupportMessage[];
  attachments: SupportAttachment[];
}

export interface SupportTicketListResponse {
  tickets: SupportTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SupportStatistics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byCategory: Array<{
    category: SupportTicketCategory;
    count: number;
  }>;
  resolvedToday: number;
}

class SupportService {
  private baseUrl = '/support';

  /**
   * Create a new support ticket
   */
  async createTicket(data: { description: string; category?: SupportTicketCategory }): Promise<SupportTicket> {
    const response = await apiClient.post(`${this.baseUrl}/tickets`, data);
    return response.data;
  }

  /**
   * Get user's tickets
   */
  async getTickets(filters?: {
    status?: SupportTicketStatus;
    category?: SupportTicketCategory;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<SupportTicketListResponse> {
    const queryString = filters
      ? Object.entries(filters)
          .filter(([_, value]) => value !== undefined && value !== null && value !== '')
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&')
      : '';
    const url = `${this.baseUrl}/tickets${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Get ticket by ID
   */
  async getTicket(ticketId: string): Promise<SupportTicketWithDetails> {
    const response = await apiClient.get(`${this.baseUrl}/tickets/${ticketId}`);
    return response.data;
  }

  /**
   * Send a message on a ticket
   */
  async sendMessage(ticketId: string, content: string): Promise<SupportMessage> {
    const response = await apiClient.post(`${this.baseUrl}/tickets/${ticketId}/messages`, { content });
    return response.data;
  }

  /**
   * Upload attachment to ticket
   */
  async uploadAttachment(ticketId: string, file: File): Promise<SupportAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`${this.baseUrl}/tickets/${ticketId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Upload attachment to message
   */
  async uploadMessageAttachment(ticketId: string, messageId: string, file: File): Promise<SupportAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(
      `${this.baseUrl}/tickets/${ticketId}/messages/${messageId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  // ========== Support Team Methods ==========

  /**
   * Get all tickets (Support Team)
   */
  async getAllTickets(filters?: {
    status?: SupportTicketStatus;
    category?: SupportTicketCategory;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<SupportTicketListResponse> {
    const queryString = filters
      ? Object.entries(filters)
          .filter(([_, value]) => value !== undefined && value !== null && value !== '')
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&')
      : '';
    const url = `${this.baseUrl}/admin/tickets${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Get ticket by ID (Support Team)
   */
  async getTicketAdmin(ticketId: string): Promise<SupportTicketWithDetails> {
    const response = await apiClient.get(`${this.baseUrl}/admin/tickets/${ticketId}`);
    return response.data;
  }

  /**
   * Reply to ticket (Support Team)
   */
  async replyToTicket(ticketId: string, content: string): Promise<SupportMessage> {
    const response = await apiClient.post(`${this.baseUrl}/admin/tickets/${ticketId}/messages`, { content });
    return response.data;
  }

  /**
   * Update ticket status (Support Team)
   */
  async updateTicketStatus(ticketId: string, status: SupportTicketStatus): Promise<SupportTicket> {
    const response = await apiClient.patch(`${this.baseUrl}/admin/tickets/${ticketId}/status`, { status });
    return response.data;
  }

  /**
   * Get statistics (Support Team)
   */
  async getStatistics(): Promise<SupportStatistics> {
    const response = await apiClient.get(`${this.baseUrl}/admin/stats`);
    return response.data;
  }
}

export const supportService = new SupportService();

