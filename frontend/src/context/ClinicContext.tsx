import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClinicSettings } from '../types/index.js';
import { api } from '../lib/api.js';
import { useAuth } from './AuthContext.js';

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
    const saved = localStorage.getItem('psychocare_clinic_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Aplicar tema dinámico (Color primario y modo oscuro) a toda la interfaz
  useEffect(() => {
    const root = document.documentElement;
    const primaryColor = settings.primaryColor || '#0d9488';

    root.style.setProperty('--clinic-primary', primaryColor);
    root.style.setProperty('--clinic-primary-10', `${primaryColor}1a`);
    root.style.setProperty('--clinic-primary-20', `${primaryColor}33`);

    if (settings.themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.primaryColor, settings.themeMode]);

  const fetchSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: ClinicSettings }>('/clinic-settings');
      setSettings(res.data);
      localStorage.setItem('psychocare_clinic_settings', JSON.stringify(res.data));
    } catch {
      // Usar defaults si aún no hay conexión
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const updateSettings = async (newSettings: Partial<ClinicSettings>): Promise<ClinicSettings> => {
    const res = await api.put<{ success: boolean; data: ClinicSettings }>(
      '/clinic-settings',
      newSettings
    );
    setSettings(res.data);
    localStorage.setItem('psychocare_clinic_settings', JSON.stringify(res.data));
    return res.data;
  };

  return (
    <ClinicContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic debe ser utilizado dentro de un ClinicProvider');
  }
  return context;
};
