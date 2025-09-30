import { apiClient } from './apiClient';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  phoneNumber?: string;
  hospitalId?: string;
  createdAt: string;
  lastLogin?: string;
  hospital?: {
    id: string;
    name: string;
  };
}

export interface UpdateUserDto {
  role?: string;
  hospitalId?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  adminComments?: string;
}

export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ResetPasswordResponse {
  user: User;
}

class UserManagementService {
  async getAllUsers(page = 1, limit = 10, role?: string): Promise<UsersResponse> {
    const params: any = { page, limit };
    if (role) params.role = role;
    
    const response = await apiClient.get('/users', { params });
    return response.data;
  }

  async resetUserPassword(userId: string, password: string, adminComments?: string): Promise<ResetPasswordResponse> {
    const response = await apiClient.patch(`/users/${userId}/reset-password`, {
      password,
      adminComments,
    });
    return response.data;
  }

  async updateUser(userId: string, updateData: UpdateUserDto): Promise<ResetPasswordResponse> {
    const response = await apiClient.patch(`/users/${userId}`, updateData);
    return response.data;
  }
}

export const userManagementService = new UserManagementService();
