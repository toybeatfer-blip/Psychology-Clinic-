import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    professionalId?: string;
    specialty?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('psychocare_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('psychocare_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const savedToken = localStorage.getItem('psychocare_token');
      if (savedToken) {
        try {
          const res = await api.get<{ success: boolean; data: User }>('/auth/me');
          setUser(res.data);
          localStorage.setItem('psychocare_user', JSON.stringify(res.data));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{
      success: boolean;
      data: { user: User; token: string };
    }>('/auth/login', { email, password });

    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem('psychocare_token', res.data.token);
    localStorage.setItem('psychocare_user', JSON.stringify(res.data.user));
  };

  const register = async (data: {
    fullName: string;
    email: string;
    password: string;
    professionalId?: string;
    specialty?: string;
    phone?: string;
  }) => {
    const res = await api.post<{
      success: boolean;
      data: { user: User; token: string };
    }>('/auth/register', data);

    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem('psychocare_token', res.data.token);
    localStorage.setItem('psychocare_user', JSON.stringify(res.data.user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('psychocare_token');
    localStorage.removeItem('psychocare_user');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('psychocare_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
