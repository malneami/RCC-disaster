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

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  phoneNumber?: string;
  hospitalId?: string;
}

export interface UpdateUserDto {
  role?: string;
  hospitalId?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  adminComments?: string;
  email?: string;
}

export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateUserResponse {
  user: User;
}

export interface ResetPasswordResponse {
  user: User;
}

export interface DeleteUserResponse {
  message: string;
  user: User;
}

class UserManagementService {
  async getAllUsers(page = 1, limit = 10, role?: string, search?: string): Promise<UsersResponse> {
    const params: any = { page, limit };
    if (role) params.role = role;
    if (search) params.search = search;
    
    const response = await apiClient.get('/users', { params });
    return response.data;
  }

  async createUser(userData: CreateUserDto): Promise<CreateUserResponse> {
    const response = await apiClient.post('/users', userData);
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

  async deleteUser(userId: string): Promise<DeleteUserResponse> {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  }
}

export const userManagementService = new UserManagementService();

