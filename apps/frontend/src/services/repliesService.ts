import { apiClient } from './apiClient';

// Types
export interface Reply {
  id: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  caseNoteId: string;
  parentReplyId?: string;
  caseType: 'STEMI' | 'STROKE' | 'TRAUMA';
  caseId: string;
  patientId: string;
  patientName: string;
  ticketId?: string;
  isEdited: boolean;
  editedAt?: string;
  deletedAt?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  caseNote: {
    id: string;
    content: string;
    priority: string;
  };
  parentReply?: {
    id: string;
    content: string;
    createdBy: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  childReplies?: Reply[];
}

export interface CreateReplyData {
  content: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  caseNoteId: string;
  parentReplyId?: string;
  caseType: 'STEMI' | 'STROKE' | 'TRAUMA';
  caseId: string;
  patientId: string;
  patientName: string;
  ticketId?: string;
  metadata?: string;
}

export interface UpdateReplyData {
  content?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  metadata?: string;
}

// Replies Service
class RepliesService {
  private baseUrl = '/replies';

  async createReply(data: CreateReplyData): Promise<Reply> {
    const response = await apiClient.post(this.baseUrl, data);
    return response.data;
  }

  async getRepliesByCaseNote(caseNoteId: string): Promise<Reply[]> {
    const response = await apiClient.get(`${this.baseUrl}/case-note/${caseNoteId}`);
    return response.data;
  }

  async getRepliesByCase(caseType: string, caseId: string): Promise<Reply[]> {
    const response = await apiClient.get(`${this.baseUrl}/case/${caseType}/${caseId}`);
    return response.data;
  }

  async getReplyById(id: string): Promise<Reply> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async updateReply(id: string, data: UpdateReplyData): Promise<Reply> {
    const response = await apiClient.patch(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteReply(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }
}

export const repliesService = new RepliesService();
