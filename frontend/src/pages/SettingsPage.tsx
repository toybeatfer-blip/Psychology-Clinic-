import React, { useState, useEffect, useRef } from 'react';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import {
  Palette,
  MapPin,
  FileText,
  Building2,
  Phone,
  Mail,
  Globe,
  Check,
  BrainCircuit,
  UploadCloud,
  Trash2,
  Sun,
  Moon,
  Layout,
  Image as ImageIcon,
  CheckCircle2,
  Database,
  Download,
  Upload,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  Users,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Send,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';

const COLOR_PRESETS = [
  { name: 'Teal Esmeralda (Clásico)', primary: '#0d9488', secondary: '#0f766e', desc: 'Salud y Confianza' },
  { name: 'Azul Índigo (Clínico)', primary: '#4f46e5', secondary: '#4338ca', desc: 'Profesional y Médico' },
  { name: 'Azul Océano (Serenidad)', primary: '#0284c7', secondary: '#0369a1', desc: 'Calma y Claridad' },
  { name: 'Verde Bosque (Vitalidad)', primary: '#059669', secondary: '#047857', desc: 'Crecimiento y Equilibrio' },
  { name: 'Púrpura Terapéutico', primary: '#7c3aed', secondary: '#6d28d9', desc: 'Reflexión y Psicoterapia' },
  { name: 'Rosa Coral (Empatía)', primary: '#e11d48', secondary: '#be123c', desc: 'Calidez y Acompañamiento' },
  { name: 'Ámbar Cálido (Optimismo)', primary: '#d97706', secondary: '#b45309', desc: 'Energía y Esperanza' },
  { name: 'Grafito Moderno', primary: '#334155', secondary: '#1e293b', desc: 'Sobrio y Minimalista' },
];

const LOGO_PRESETS = [
  { name: 'Cerebro Dinámico', url: 'https://api.iconify.design/lucide:brain-circuit.svg?color=%230d9488' },
  { name: 'Mente & Corazón', url: 'https://api.iconify.design/lucide:heart-pulse.svg?color=%230d9488' },
  { name: 'Árbol de Vida / Crecimiento', url: 'https://api.iconify.design/lucide:trees.svg?color=%230d9488' },
  { name: 'Equilibrio & Bienestar', url: 'https://api.iconify.design/lucide:sparkles.svg?color=%230d9488' },
  { name: 'Escudo de Confidencialidad', url: 'https://api.iconify.design/lucide:shield-check.svg?color=%230d9488' },
];

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useClinic();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('brand'); // brand, appearance, whatsapp, contact, legal, backup

  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    clinicName: '',
    tagline: '',
    logoUrl: '',
    primaryColor: '#0d9488',
    secondaryColor: '#0f766e',
    themeMode: 'light' as 'light' | 'dark' | 'system',
    sidebarStyle: 'dark' as 'dark' | 'brand' | 'light',
    phone: '',
    email: '',
    website: '',
    address: '',
    taxId: '',
    receiptFooter: '',
    appointmentNotice: '',
  });

  const [testPhone, setTestPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados para Copias de Seguridad y Base de Datos
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [dbStats, setDbStats] = useState({
    patientsCount: 0,
    notesCount: 0,
    appointmentsCount: 0,
    attachmentsCount: 0,
    lastBackupDate: localStorage.getItem('psychocare_last_backup_date') || 'Guardado automático activo',
  });

  const loadDbStats = () => {
    try {
      const patients = JSON.parse(localStorage.getItem('psychocare_db_patients') || '[]');
      const notes = JSON.parse(localStorage.getItem('psychocare_db_notes') || '[]');
      const appointments = JSON.parse(localStorage.getItem('psychocare_db_appointments') || '[]');
      const attachments = JSON.parse(localStorage.getItem('psychocare_db_attachments') || '[]');
      setDbStats({
        patientsCount: Array.isArray(patients) ? patients.length : 0,
        notesCount: Array.isArray(notes) ? notes.length : 0,
        appointmentsCount: Array.isArray(appointments) ? appointments.length : 0,
        attachmentsCount: Array.isArray(attachments) ? attachments.length : 0,
        lastBackupDate: localStorage.getItem('psychocare_last_backup_date') || 'Guardado automático activo',
      });
    } catch {}
  };

  useEffect(() => {
    if (settings) {
      setFormData({
        clinicName: settings.clinicName || 'Consultorio Psicológico',
        tagline: settings.tagline || 'Atención Clínica y Psicoterapia Especializada',
        logoUrl: settings.logoUrl || '',
        primaryColor: settings.primaryColor || '#0d9488',
        secondaryColor: settings.secondaryColor || '#0f766e',
        themeMode: (settings.themeMode as 'light' | 'dark') || 'light',
        sidebarStyle: (settings.sidebarStyle as 'dark' | 'brand' | 'light') || 'dark',
        phone: settings.phone || '',
        email: settings.email || '',
        website: settings.website || '',
        address: settings.address || '',
        taxId: settings.taxId || '',
        receiptFooter: settings.receiptFooter || '',
        appointmentNotice: settings.appointmentNotice || '',
      });
    }
    loadDbStats();
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setFormData((prev) => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
    }));
  };

  // Subir archivo de logotipo local (convierte a Base64)
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('El archivo de imagen no debe superar los 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64String = uploadEvent.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        logoUrl: base64String,
      }));
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await updateSettings(formData);
      setSuccessMessage('Configuración de la clínica guardada y aplicada exitosamente.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // GESTIÓN DE COPIAS DE SEGURIDAD Y RESPALDOS
  // =========================================================================
  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: any }>('/profile/backup');
      const backupData = res.data || {
        exportedAt: new Date().toISOString(),
        therapist: user,
        clinicSettings: settings,
        patients: JSON.parse(localStorage.getItem('psychocare_db_patients') || '[]'),
        appointments: JSON.parse(localStorage.getItem('psychocare_db_appointments') || '[]'),
        clinicalNotes: JSON.parse(localStorage.getItem('psychocare_db_notes') || '[]'),
        attachments: JSON.parse(localStorage.getItem('psychocare_db_attachments') || '[]'),
      };

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      const fileName = `Respaldo_PsychoCare_${dateStr}_${timeStr}.json`;

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', fileName);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      localStorage.setItem('psychocare_last_backup_date', now.toLocaleString());
      loadDbStats();

      setSuccessMessage('Copia de seguridad completa descargada con éxito.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al generar la copia de seguridad.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const parsed = JSON.parse(jsonContent);

        if (!parsed || (typeof parsed !== 'object')) {
          throw new Error('El archivo no contiene un formato de respaldo válido.');
        }

        const patientsList = Array.isArray(parsed.patients) ? parsed.patients : [];
        const apptsList = Array.isArray(parsed.appointments) ? parsed.appointments : [];
        const notesList = Array.isArray(parsed.clinicalNotes) ? parsed.clinicalNotes : [];
        const attsList = Array.isArray(parsed.attachments) ? parsed.attachments : [];

        localStorage.setItem('psychocare_db_patients', JSON.stringify(patientsList));
        localStorage.setItem('psychocare_db_appointments', JSON.stringify(apptsList));
        localStorage.setItem('psychocare_db_notes', JSON.stringify(notesList));
        localStorage.setItem('psychocare_db_attachments', JSON.stringify(attsList));

        if (parsed.clinicSettings) {
          localStorage.setItem('psychocare_clinic_settings', JSON.stringify(parsed.clinicSettings));
        }

        loadDbStats();
        setSuccessMessage(
          `¡Base de datos restaurada con éxito! Se recuperaron ${patientsList.length} pacientes, ${notesList.length} notas y ${apptsList.length} citas.`
        );

        if (restoreFileInputRef.current) restoreFileInputRef.current.value = '';

        setTimeout(() => {
          window.location.reload();
        }, 1800);
      } catch (err: any) {
        setError(err.message || 'No se pudo leer el archivo de respaldo. Asegúrate de que sea un archivo .json válido generado por PsychoCare.');
      } finally {
        setRestoreLoading(false);
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleDeleteClinic = async () => {
    if (
      !window.confirm(
        '⚠️ ATENCIÓN SUPER USUARIO: ¿Estás seguro de que deseas eliminar permanentemente la configuración de esta clínica? Esta acción restablecerá el consultorio a sus valores iniciales.'
      )
    ) {
      return;
    }

    try {
      await api.delete('/clinic-settings');
      setSuccessMessage('Configuración de la clínica eliminada exitosamente por el Super Administrador.');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la clínica.');
    }
  };

  // Enviar mensaje de prueba de WhatsApp
  const handleSendTestWhatsApp = () => {
    if (!testPhone.trim()) {
      setError('Por favor ingresa un número de teléfono con lada para enviar el recordatorio de prueba.');
      return;
    }
    const cleanPhone = testPhone.replace(/\D/g, '');
    const sampleMsg = `👋 Hola, este es un mensaje de prueba del sistema de recordatorios automáticos de 24 horas de *${formData.clinicName || 'tu consultorio'}*.\n\n📅 Cita programada para mañana a las 10:00 AM.\n\n¡Los recordatorios de WhatsApp están funcionando correctamente!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(sampleMsg)}`, '_blank', 'noopener,noreferrer');
  };

  const tabs = [
    { id: 'brand', label: 'Marca & Logotipo', icon: <Building2 className="w-4 h-4" /> },
    { id: 'appearance', label: 'Color de la Interfaz & Tema', icon: <Palette className="w-4 h-4" /> },
    { id: 'whatsapp', label: 'Recordatorios WhatsApp (24h)', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'contact', label: 'Ubicación & Contacto', icon: <MapPin className="w-4 h-4" /> },
    { id: 'legal', label: 'Datos Fiscales & Textos Legales', icon: <FileText className="w-4 h-4" /> },
    { id: 'backup', label: 'Copia de Seguridad & Base de Datos', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Personalización & Configuración del Consultorio"
        subtitle="Configura el logo, colores globales, recordatorios por WhatsApp, membrete y respaldos"
      />

      <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Live Preview Card */}
        {activeTab !== 'backup' && activeTab !== 'whatsapp' && (
          <Card className="overflow-hidden shadow-sm border-slate-200">
            <div
              className="p-6 text-white transition-all duration-300"
              style={{ backgroundColor: formData.primaryColor }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {formData.logoUrl ? (
                    <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center flex-shrink-0 border border-white/40">
                      <img
                        src={formData.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-contain rounded-xl"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/30 shadow-md flex-shrink-0">
                      <BrainCircuit className="w-9 h-9" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                      Previsualización en Vivo de tu Marca
                    </span>
                    <h3 className="text-xl font-black tracking-tight mt-1">{formData.clinicName}</h3>
                    <p className="text-xs text-white/80 font-medium">{formData.tagline}</p>
                  </div>
                </div>

                <div className="text-right text-xs text-white/90 space-y-0.5 sm:border-l sm:border-white/20 sm:pl-5">
                  {formData.phone && <p>📞 {formData.phone}</p>}
                  {formData.email && <p>✉️ {formData.email}</p>}
                  {formData.address && <p className="truncate max-w-xs">📍 {formData.address}</p>}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Formulario con Pestañas */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* TAB DE WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-teal-50/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Recordatorios Automáticos por WhatsApp (24h Antes)</CardTitle>
                      <p className="text-xs text-slate-500">
                        Envío de confirmación de citas directo a los pacientes sin agregarlos a tus contactos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp 1-Click Activo</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cuando falten 24 horas para la sesión de un paciente, el sistema destacará la cita con el distintivo{' '}
                  <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">⏰ Próximas 24h</span>{' '}
                  en el Dashboard, Calendario y Expedientes. Podrás enviar el mensaje personalizado con fecha, hora, modalidad y enlace con un solo clic.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vista Previa del Mensaje de WhatsApp */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <CardTitle className="text-sm">Mensaje que Recibirá el Paciente</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-[#e5ddd5] p-4 rounded-2xl border border-slate-200">
                    <div className="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-xs text-xs text-slate-800 space-y-2 border border-slate-100">
                      <p className="font-bold text-emerald-800 flex items-center gap-1">
                        <span>💬 {formData.clinicName || 'Consultorio Psicológico'}</span>
                      </p>
                      <p>
                        👋 Hola <strong>[Nombre del Paciente]</strong>, te recordamos tu cita de psicoterapia programada para mañana <strong>[Fecha]</strong> a las <strong>[Hora]</strong> (Sesión Presencial en Consultorio).
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        📍 Ubicación: {formData.address || 'Consultorio Principal'}
                      </p>
                      <p className="pt-1 text-slate-600">
                        Por favor confirma tu asistencia respondiendo a este mensaje. ¡Te esperamos!
                      </p>
                      <div className="text-[10px] text-slate-400 text-right">10:00 AM ✓✓</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    Los datos de fecha, hora, enlace o dirección se rellenan automáticamente según cada cita.
                  </p>
                </CardContent>
              </Card>

              {/* Prueba de Envío de WhatsApp */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-teal-600" />
                    <CardTitle className="text-sm">Probar Envío de Recordatorio</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-slate-600">
                    Ingresa tu número de celular para comprobar cómo se abre WhatsApp con el mensaje estructurado:
                  </p>

                  <Input
                    label="Número de Teléfono con Lada (Ej. +52 55 1234 5678)"
                    placeholder="+52 55 1234 5678"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    leftIcon={<Phone className="w-4 h-4" />}
                  />

                  <Button
                    type="button"
                    onClick={handleSendTestWhatsApp}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="lg"
                    leftIcon={<MessageSquare className="w-4 h-4" />}
                  >
                    Enviar Mensaje de Prueba a mi WhatsApp
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 5: COPIA DE SEGURIDAD & BASE DE DATOS */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <Card className="border-teal-100 bg-gradient-to-br from-teal-50/50 to-indigo-50/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Estado Actual de tu Base de Datos</CardTitle>
                      <p className="text-xs text-slate-500">
                        Guardado automático activo en cada cambio y al cerrar sesión
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100/80 border border-emerald-300 text-emerald-800 rounded-full text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Sincronización Activa</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs text-center">
                    <Users className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                    <span className="text-2xl font-black text-slate-800">{dbStats.patientsCount}</span>
                    <p className="text-xs text-slate-500 font-medium">Pacientes</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs text-center">
                    <FileText className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    <span className="text-2xl font-black text-slate-800">{dbStats.notesCount}</span>
                    <p className="text-xs text-slate-500 font-medium">Notas de Evolución</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs text-center">
                    <Calendar className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                    <span className="text-2xl font-black text-slate-800">{dbStats.appointmentsCount}</span>
                    <p className="text-xs text-slate-500 font-medium">Citas Agendadas</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs text-center">
                    <HardDrive className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <span className="text-2xl font-black text-slate-800">{dbStats.attachmentsCount}</span>
                    <p className="text-xs text-slate-500 font-medium">Archivos y Consentimientos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Opción 1: Descargar Copia de Seguridad */}
              <Card className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Descargar Copia de Seguridad</CardTitle>
                      <p className="text-xs text-slate-500">
                        Exporta toda tu base de datos a un archivo .json seguro
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-xs text-slate-600">
                    <p>
                      El archivo incluye todos los expedientes clínicos, diagnósticos DSM-5, historial de citas,
                      notas de evolución y personalización de tu consultorio.
                    </p>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <p className="font-semibold text-slate-700">🔒 Confidencialidad Total:</p>
                      <p className="text-[11px] text-slate-500">
                        Tus datos son 100% tuyos. Puedes guardarlo en una memoria USB, disco duro o nube privada.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleDownloadBackup}
                    isLoading={backupLoading}
                    className="w-full mt-4"
                    size="lg"
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Descargar Respaldo Completo (.json)
                  </Button>
                </CardContent>
              </Card>

              {/* Opción 2: Cargar / Restaurar Base de Datos */}
              <Card className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Cargar & Restaurar Base de Datos</CardTitle>
                      <p className="text-xs text-slate-500">
                        Recupera tu consultorio en caso de pérdida o cambio de equipo
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-xs text-slate-600">
                    <p>
                      Selecciona un archivo de respaldo previo (<code>.json</code>) generado por PsychoCare para restaurar
                      inmediatamente todos tus pacientes y expedientes.
                    </p>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                      <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Reemplazo Seguro de Datos:
                      </p>
                      <p className="text-[11px] text-amber-700">
                        Al restaurar, se integrarán los expedientes y notas del archivo seleccionado.
                      </p>
                    </div>
                  </div>

                  <div>
                    <input
                      ref={restoreFileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleRestoreBackupFile}
                      className="hidden"
                      id="restore-db-input"
                    />
                    <label htmlFor="restore-db-input">
                      <Button
                        type="button"
                        variant="secondary"
                        isLoading={restoreLoading}
                        onClick={() => restoreFileInputRef.current?.click()}
                        className="w-full cursor-pointer mt-4"
                        size="lg"
                        leftIcon={<Upload className="w-4 h-4" />}
                      >
                        Cargar Archivo de Respaldo (.json)
                      </Button>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* FORMULARIO DE OTRAS PESTAÑAS */}
        {activeTab !== 'backup' && activeTab !== 'whatsapp' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* TAB 1: MARCA Y LOGOTIPO */}
            {activeTab === 'brand' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Identidad y Logotipo de la Clínica</CardTitle>
                      <p className="text-xs text-slate-500">
                        Sube tu logotipo propio o selecciona un isotipo representativo
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Input
                        label="Nombre del Consultorio o Clínica *"
                        name="clinicName"
                        required
                        placeholder="Ej. Centro de Psicología & Bienestar"
                        value={formData.clinicName}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Input
                        label="Lema o Eslogan de la Clínica"
                        name="tagline"
                        placeholder="Ej. Psicoterapia con enfoque humano y científico"
                        value={formData.tagline}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Sección de Carga de Logo Propio */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Logotipo Propio de tu Consultorio:
                    </label>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {formData.logoUrl ? (
                        <div className="relative group">
                          <img
                            src={formData.logoUrl}
                            alt="Logo seleccionado"
                            className="w-20 h-20 rounded-2xl object-contain bg-white p-2 border border-slate-200 shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={handleClearLogo}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-md hover:bg-rose-600 transition-colors"
                            title="Eliminar logo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                          <ImageIcon className="w-6 h-6 mb-1" />
                          <span className="text-[10px]">Sin logo</span>
                        </div>
                      )}

                      <div className="space-y-2 flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                          id="logo-upload-input"
                        />
                        <label htmlFor="logo-upload-input">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            leftIcon={<UploadCloud className="w-4 h-4" />}
                            className="cursor-pointer"
                          >
                            Subir Imagen de Logo (PNG, JPG, SVG)
                          </Button>
                        </label>
                        <p className="text-[11px] text-slate-400">
                          Recomendado: Imagen cuadrada o con fondo transparente (máx. 2MB).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Isotipos Predefinidos */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      O selecciona un Isotipo Clínico Predefinido:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {LOGO_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, logoUrl: preset.url }))}
                          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                            formData.logoUrl === preset.url
                              ? 'border-teal-600 bg-teal-50/50 shadow-sm ring-2 ring-teal-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-8 h-8" />
                          <span className="text-[11px] font-semibold text-slate-700">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 2: COLORES & TEMA */}
            {activeTab === 'appearance' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Color de Marca y Estilo de Interfaz</CardTitle>
                      <p className="text-xs text-slate-500">
                        Los colores seleccionados se aplicarán automáticamente a botones, barras de menú y tarjetas
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-3">
                      Paletas de Color Diseñadas para Psicología:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleSelectColorPreset(preset)}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            formData.primaryColor === preset.primary
                              ? 'border-slate-900 bg-slate-50 shadow-sm ring-2 ring-slate-900/10'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-6 h-6 rounded-full shadow-xs flex-shrink-0"
                              style={{ backgroundColor: preset.primary }}
                            />
                            <span className="text-xs font-bold text-slate-800">{preset.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">{preset.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Color Primario Personalizado (HEX):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          name="primaryColor"
                          value={formData.primaryColor}
                          onChange={handleChange}
                          className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5"
                        />
                        <Input
                          name="primaryColor"
                          value={formData.primaryColor}
                          onChange={handleChange}
                          placeholder="#0d9488"
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Color Secundario / Acento (HEX):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          name="secondaryColor"
                          value={formData.secondaryColor}
                          onChange={handleChange}
                          className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5"
                        />
                        <Input
                          name="secondaryColor"
                          value={formData.secondaryColor}
                          onChange={handleChange}
                          placeholder="#0f766e"
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-3">
                      Estilo de la Barra Lateral de Navegación:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'dark', name: 'Oscuro Profesional (Predeterminado)', desc: 'Fondo negro grafito elegante' },
                        { id: 'brand', name: 'Color de Marca', desc: 'Fondo con tu color principal' },
                        { id: 'light', name: 'Claro Minimalista', desc: 'Fondo blanco con bordes sutiles' },
                      ].map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, sidebarStyle: style.id as any }))}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            formData.sidebarStyle === style.id
                              ? 'border-teal-600 bg-teal-50/40 shadow-sm ring-2 ring-teal-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800">{style.name}</span>
                            {formData.sidebarStyle === style.id && (
                              <CheckCircle2 className="w-4 h-4 text-teal-600" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{style.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 3: CONTACTO & UBICACIÓN */}
            {activeTab === 'contact' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Información de Contacto y Ubicación</CardTitle>
                      <p className="text-xs text-slate-500">
                        Estos datos se incluirán automáticamente en recetas, consentimientos y recordatorios de citas
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Teléfono de la Clínica o Consultorio"
                      name="phone"
                      placeholder="+52 55 1234 5678"
                      leftIcon={<Phone className="w-4 h-4" />}
                      value={formData.phone}
                      onChange={handleChange}
                    />

                    <Input
                      label="Correo Electrónico de Contacto"
                      type="email"
                      name="email"
                      placeholder="contacto@consultorio.com"
                      leftIcon={<Mail className="w-4 h-4" />}
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <Textarea
                    label="Dirección Física del Consultorio"
                    name="address"
                    rows={2}
                    placeholder="Ej. Calle Principal 123, Consultorio 402, Colonia Centro"
                    value={formData.address}
                    onChange={handleChange}
                  />

                  <div className="sm:col-span-2">
                    <Input
                      label="Sitio Web o Enlace de Reservas"
                      type="url"
                      name="website"
                      placeholder="https://www.tuconsultoriopsicologico.com"
                      leftIcon={<Globe className="w-4 h-4" />}
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 4: DATOS FISCALES & LEGALES */}
            {activeTab === 'legal' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle>Datos Fiscales y Leyendas Legales</CardTitle>
                      <p className="text-xs text-slate-500">
                        Textos predeterminados para notas de evolución, recibos y consentimientos informados
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Identificación Fiscal de la Clínica (RFC / CUIT / RUC / NIF)"
                    name="taxId"
                    placeholder="Ej. MPC-920318-XYZ"
                    value={formData.taxId}
                    onChange={handleChange}
                  />

                  <Textarea
                    label="Pie de Página Legal y Aviso de Confidencialidad"
                    name="receiptFooter"
                    rows={3}
                    placeholder="Texto que aparecerá al final de notas e informes clínicos..."
                    value={formData.receiptFooter}
                    onChange={handleChange}
                    helperText="Ampara el secreto profesional y cumplimiento de normativas de protección de datos médicos."
                  />

                  <Textarea
                    label="Términos y Política de Cancelación de Citas"
                    name="appointmentNotice"
                    rows={2}
                    placeholder="Ej. Las citas deben cancelarse con 24 horas de antelación para evitar recargos."
                    value={formData.appointmentNotice}
                    onChange={handleChange}
                  />
                </CardContent>
              </Card>
            )}

            {/* ZONA DE PELIGRO: EXCLUSIVA PARA SUPER USUARIO */}
            {user?.role === 'ADMIN' && (
              <Card className="border-rose-200 bg-rose-50/40">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-rose-900">Zona de Peligro (Exclusivo Super Administrador)</CardTitle>
                      <p className="text-xs text-rose-600">
                        Opciones avanzadas visibles únicamente para el creador del sistema
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Al eliminar este consultorio o clínica, se eliminará permanentemente la personalización institucional, logotipos y membretes del terapeuta.
                  </p>
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="danger"
                      onClick={handleDeleteClinic}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Eliminar Configuración de esta Clínica
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botón Guardar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="submit" size="lg" isLoading={loading} leftIcon={<Check className="w-4 h-4" />}>
                Guardar y Aplicar Cambios
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
