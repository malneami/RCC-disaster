import { apiClient } from './apiClient';

export interface CreateUserRegistrationRequestDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
  requestedRole: string;
  hospitalId?: string;
  justification?: string;
}

export interface UserRegistrationRequest {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  requestedRole: string;
  hospitalId?: string;
  justification?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  hospital?: {
    id: string;
    name: string;
  };
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewedAt?: string;
  adminComments?: string;
}

export interface RegistrationRequestStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface Hospital {
  id: string;
  name: string;
}

class UserRegistrationService {
  async createRegistrationRequest(data: CreateUserRegistrationRequestDto): Promise<UserRegistrationRequest> {
    const response = await apiClient.post('/user-registration/request', data);
    return response.data;
  }

  async getAllRegistrationRequests(status?: string): Promise<UserRegistrationRequest[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get('/user-registration/requests', { params });
    return response.data;
  }

  async getRegistrationRequestById(id: string): Promise<UserRegistrationRequest> {
    const response = await apiClient.get(`/user-registration/requests/${id}`);
    return response.data;
  }

  async approveRegistrationRequest(id: string, adminComments?: string): Promise<{
    request: UserRegistrationRequest;
    user: any;
    temporaryPassword: string;
  }> {
    const response = await apiClient.patch(`/user-registration/requests/${id}/approve`, {
      adminComments,
    });
    return response.data;
  }

  async rejectRegistrationRequest(id: string, adminComments: string): Promise<UserRegistrationRequest> {
    const response = await apiClient.patch(`/user-registration/requests/${id}/reject`, {
      adminComments,
    });
    return response.data;
  }

  async getRegistrationRequestStats(): Promise<RegistrationRequestStats> {
    const response = await apiClient.get('/user-registration/stats');
    return response.data;
  }

  async getHospitals(): Promise<Hospital[]> {
    const response = await apiClient.get('/hospitals/for-registration');
    return response.data;
  }
}

export const userRegistrationService = new UserRegistrationService();
