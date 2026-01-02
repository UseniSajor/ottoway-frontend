import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../lib/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await authApi.me();
          setUser(userData as User);
          setToken(storedToken);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const response = await authApi.login(email, password);
      console.log('Login response received:', { hasUser: !!response?.user, hasToken: !!response?.token });
      
      if (!response || !response.user || !response.token) {
        throw new Error('Invalid response from server');
      }

      const { user: userData, token: newToken } = response as { user: User; token: string };
      setUser(userData);
      setToken(newToken);
      localStorage.setItem('token', newToken);
      console.log('Login successful, user set:', userData.email);
    } catch (error: any) {
      console.error('Login error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        isNetworkError: error?.isNetworkError,
        originalError: error?.originalError,
      });

      // Extract error message with priority: response message > network error > generic
      let errorMessage = 'Login failed';
      
      if (error?.isNetworkError) {
        errorMessage = error.message || 'Cannot connect to server. Please check if the backend is running.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.details) {
        errorMessage = `${error.response.data.message || 'Login failed'}: ${error.response.data.details}`;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }) => {
    try {
      const response = await authApi.register(data);
      const { user: userData, token: newToken } = response as { user: User; token: string };
      setUser(userData);
      setToken(newToken);
      localStorage.setItem('token', newToken);
    } catch (error: any) {
      console.error('Registration error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        isNetworkError: error?.isNetworkError,
        isConfigError: error?.isConfigError,
        originalError: error?.originalError,
      });

      // Extract error message with priority: config error > network error > server message > generic
      let errorMessage = 'Registration failed';
      
      if (error?.isConfigError) {
        errorMessage = error.message || 'API not reachable—check VITE_API_URL. Cannot connect to localhost in production.';
      } else if (error?.isNetworkError) {
        errorMessage = error.message || 'API not reachable—check VITE_API_URL. Cannot connect to server.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
        // Include details if available (e.g., validation errors)
        if (error.response.data.details) {
          errorMessage = `${errorMessage}: ${error.response.data.details}`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};



