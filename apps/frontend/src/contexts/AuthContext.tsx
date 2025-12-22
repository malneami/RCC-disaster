import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthUser } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        authService.setToken(token);
        const userProfile = await authService.getProfile();
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      // Save login time for profile display
      localStorage.setItem('lastLoginTime', new Date().toISOString());
      
      authService.setToken(response.accessToken);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('lastLoginTime');
    setUser(null);
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        return false;
      }

      const response = await authService.refreshToken(refreshTokenValue);
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      authService.setToken(response.accessToken);
      
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  const updateUser = (userData: AuthUser) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshToken, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};