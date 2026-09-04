import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ClinicSettings } from '../types/index';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

interface ClinicContextType {
  settings: ClinicSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<ClinicSettings>) => Promise<ClinicSettings>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: ClinicSettings = {
  id: '',
  userId: '',
  clinicName: 'PsychoCare Consultorio',
  tagline: 'Centro de Psicología y Bienestar Emocional',
  logoUrl: '',
  primaryColor: '#0d9488',
  secondaryColor: '#0f766e',
  themeMode: 'light',
  sidebarStyle: 'dark',
  phone: '+52 55 1234 5678',
  email: 'contacto@psychocare.com',
  website: '',
  address: 'Av. Insurgentes Sur 1450, Consultorio 402, CDMX',
  taxId: '',
  receiptFooter: 'Este documento contiene información clínica confidencial amparada por el secreto profesional médico.',
  appointmentNotice: 'Por favor notificar cancelaciones o reprogramaciones con al menos 24 horas de anticipación.',
  createdAt: '',
  updatedAt: '',
};

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ClinicSettings>(() => {
    try {
      const saved = localStorage.getItem('psychocare_clinic_settings');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        return JSON.parse(saved);
      }
    } catch {
      localStorage.removeItem('psychocare_clinic_settings');
    }
    return defaultSettings;
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Aplicar tema dinámico (Color primario y modo oscuro) a toda la interfaz
  useEffect(() => {
    try {
      const root = document.documentElement;
      const primaryColor = settings?.primaryColor || '#0d9488';

      root.style.setProperty('--clinic-primary', primaryColor);
      root.style.setProperty('--clinic-primary-10', `${primaryColor}1a`);
      root.style.setProperty('--clinic-primary-20', `${primaryColor}33`);

      if (settings?.themeMode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } catch {}
  }, [settings?.primaryColor, settings?.themeMode]);

  const fetchSettings = useCallback(async (silent: boolean = false) => {
    if (!user) return;
    try {
      if (!silent) setLoading(true);
      const res = await api.get<{ success: boolean; data: ClinicSettings }>('/clinic-settings');
      if (res?.data) {
        setSettings(res.data);
        localStorage.setItem('psychocare_clinic_settings', JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Configuración sincronizada.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user]);

  // Sincronización automática periódica y al enfocar ventana
  useEffect(() => {
    if (user) {
      fetchSettings(false);

      const interval = setInterval(() => {
        fetchSettings(true);
      }, 10000);

      const handleFocus = () => {
        fetchSettings(true);
      };

      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleFocus);

      const handleCloudSynced = () => {
        fetchSettings(true);
      };
      window.addEventListener('psychocare_cloud_synced', handleCloudSynced);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleFocus);
        window.removeEventListener('psychocare_cloud_synced', handleCloudSynced);
      };
    }
  }, [user, fetchSettings]);

  const updateSettings = async (newSettings: Partial<ClinicSettings>): Promise<ClinicSettings> => {
    setLoading(true);
    try {
      const res = await api.put<{ success: boolean; data: ClinicSettings }>('/clinic-settings', newSettings);
      const updated = res?.data || { ...settings, ...newSettings };
      setSettings(updated);
      localStorage.setItem('psychocare_clinic_settings', JSON.stringify(updated));
      return updated;
    } catch (err: any) {
      const fallback = { ...settings, ...newSettings };
      setSettings(fallback);
      localStorage.setItem('psychocare_clinic_settings', JSON.stringify(fallback));
      return fallback;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClinicContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        refreshSettings: async () => fetchSettings(false),
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
