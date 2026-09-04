import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index';
import { api } from '../lib/api';
import { syncLocalWithCloud } from '../lib/cloudSync';

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
    try {
      const savedUser = localStorage.getItem('psychocare_user');
      if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
        return JSON.parse(savedUser);
      }
    } catch {
      localStorage.removeItem('psychocare_user');
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const savedToken = localStorage.getItem('psychocare_token');
      if (savedToken && savedToken !== 'undefined' && savedToken !== 'null') {
        return savedToken;
      }
    } catch {
      localStorage.removeItem('psychocare_token');
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const savedToken = localStorage.getItem('psychocare_token');
        if (savedToken && savedToken !== 'undefined' && savedToken !== 'null') {
          const res = await api.get<{ success: boolean; data: User }>('/auth/me');
          if (res && res.data) {
            setUser(res.data);
            localStorage.setItem('psychocare_user', JSON.stringify(res.data));
          }
        }
      } catch (err) {
        console.warn('Verificación de sesión no activa.');
      }
    };

    verifyAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const isSuperAdmin = (email || '').trim().toLowerCase().startsWith('fernando');
    if (!isSuperAdmin) {
      await Promise.race([
        syncLocalWithCloud(),
        new Promise((r) => setTimeout(r, 1500)),
      ]).catch(() => {});
    }

    const res = await api.post<{
      success: boolean;
      data: { user: User; token: string };
    }>('/auth/login', { email, password });

    if (res && res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
      try {
        localStorage.setItem('psychocare_token', res.data.token);
        localStorage.setItem('psychocare_user', JSON.stringify(res.data.user));
      } catch {}
      // Sincronizar de inmediato en segundo plano
      setTimeout(() => {
        syncLocalWithCloud().catch(() => {});
      }, 50);
    }
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

    if (res && res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
      try {
        localStorage.setItem('psychocare_token', res.data.token);
        localStorage.setItem('psychocare_user', JSON.stringify(res.data.user));
      } catch {}
    }
  };

  // Guardado automático y respaldo garantizado de toda la base de datos al cerrar sesión
  const logout = () => {
    try {
      const uId = user?.id || 'default_user';
      const autoBackupSnapshot = {
        exportedAt: new Date().toISOString(),
        therapist: user,
        patients: JSON.parse(localStorage.getItem(`psychocare_db_patients_${uId}`) || localStorage.getItem('psychocare_db_patients') || '[]'),
        appointments: JSON.parse(localStorage.getItem(`psychocare_db_appointments_${uId}`) || localStorage.getItem('psychocare_db_appointments') || '[]'),
        clinicalNotes: JSON.parse(localStorage.getItem(`psychocare_db_notes_${uId}`) || localStorage.getItem('psychocare_db_notes') || '[]'),
        attachments: JSON.parse(localStorage.getItem(`psychocare_db_attachments_${uId}`) || localStorage.getItem('psychocare_db_attachments') || '[]'),
        clinicSettings: JSON.parse(localStorage.getItem(`psychocare_clinic_settings_${uId}`) || localStorage.getItem('psychocare_clinic_settings') || 'null'),
      };

      localStorage.setItem('psychocare_last_auto_backup', JSON.stringify(autoBackupSnapshot));
      localStorage.setItem('psychocare_last_backup_date', new Date().toLocaleString());
      console.log('✅ Base de datos guardada y respaldada automáticamente al cerrar sesión.');
    } catch (e) {
      console.warn('Error al generar snapshot de respaldo:', e);
    }

    // Solo se borra el token de sesión activo. TODOS los usuarios registrados y bases de datos se preservan al 100%.
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('psychocare_token');
      localStorage.removeItem('psychocare_user');
    } catch {}
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    try {
      localStorage.setItem('psychocare_user', JSON.stringify(updatedUser));
      const users: any[] = JSON.parse(localStorage.getItem('psychocare_db_users') || '[]');
      const idx = users.findIndex((u) => u.id === updatedUser.id || (u.email && updatedUser.email && u.email.toLowerCase() === updatedUser.email.toLowerCase()));
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updatedUser };
      } else {
        users.push(updatedUser);
      }
      localStorage.setItem('psychocare_db_users', JSON.stringify(users));
    } catch {}
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
