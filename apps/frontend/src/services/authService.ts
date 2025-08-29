import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/v1';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  hospitalId?: string;
  hospital?: {
    id: string;
    name: string;
    code: string;
  };
}

interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await axios.post(
      `${API_BASE_URL}/auth/login`,
      { email, password }
    );
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.setToken(null);
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    const response: AxiosResponse<RefreshResponse> = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );
    return response.data;
  }

  async getProfile(): Promise<AuthUser> {
    const response: AxiosResponse<AuthUser> = await axios.get(
      `${API_BASE_URL}/auth/profile`
    );
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await axios.put(`${API_BASE_URL}/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  async forgotPassword(email: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/auth/reset-password`, {
      token,
      newPassword,
    });
  }
}

export const authService = new AuthService();