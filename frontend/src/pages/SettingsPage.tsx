import React, { useState, useEffect, useRef } from 'react';
import { useClinic } from '../context/ClinicContext.js';
import { Header } from '../components/layout/Header.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Input } from '../components/ui/Input.js';
import { Textarea } from '../components/ui/Textarea.js';
import { Button } from '../components/ui/Button.js';
import { Tabs } from '../components/ui/Tabs.js';
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
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('brand'); // brand, appearance, contact, legal

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        clinicName: settings.clinicName || 'PsychoCare Consultorio',
        tagline: settings.tagline || 'Centro de Psicología y Bienestar Emocional',
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
    setSuccessMessage(false);

    try {
      await updateSettings(formData);
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3500);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'brand', label: 'Marca & Logotipo', icon: <Building2 className="w-4 h-4" /> },
    { id: 'appearance', label: 'Color de la Interfaz & Tema', icon: <Palette className="w-4 h-4" /> },
    { id: 'contact', label: 'Ubicación & Contacto', icon: <MapPin className="w-4 h-4" /> },
    { id: 'legal', label: 'Datos Fiscales & Textos Legales', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Personalización del Consultorio"
        subtitle="Configura el logo, colores globales de la interfaz, membrete y datos de la clínica"
      />

      <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Configuración de la clínica guardada y aplicada exitosamente en toda la interfaz.</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Live Preview Card */}
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

        {/* Formulario con Pestañas */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

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
                      label="Eslogan o Subtítulo Institucional"
                      name="tagline"
                      placeholder="Ej. Psicoterapia Individual, Pareja y Familiar"
                      value={formData.tagline}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Subida de Archivo de Logotipo */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1">
                      Logotipo del Consultorio
                    </label>
                    <p className="text-xs text-slate-500">
                      Puedes subir una imagen desde tu dispositivo (PNG, JPG, SVG) o ingresar un enlace web.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Caja de subida directa */}
                    <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-5 text-center transition-colors bg-slate-50/50 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">Cargar imagen desde tu equipo</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Formatos PNG, JPG, SVG hasta 2MB</p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                        id="logoUploadInput"
                      />
                      <label
                        htmlFor="logoUploadInput"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Seleccionar Imagen
                      </label>
                    </div>

                    {/* Previsualización del logo actual */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center">
                      <span className="text-xs font-semibold text-slate-500 mb-2">Logo Actual:</span>
                      {formData.logoUrl ? (
                        <div className="flex flex-col items-center gap-3">
                          <img
                            src={formData.logoUrl}
                            alt="Logo actual"
                            className="max-h-20 max-w-[160px] object-contain rounded-xl p-1 bg-slate-50 border border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={handleClearLogo}
                            className="text-xs text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Quitar Logo
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 py-3">
                          <BrainCircuit className="w-10 h-10 mx-auto mb-1 text-slate-300" />
                          <p className="text-xs">Sin logotipo personalizado</p>
                          <p className="text-[10px]">Se utiliza el isotipo clínico por defecto</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Isotipos Predeterminados */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      O elige uno de nuestros isotipos sugeridos:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {LOGO_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, logoUrl: preset.url }))}
                          className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/40 text-center flex flex-col items-center gap-1.5 transition-all"
                        >
                          <img src={preset.url} alt={preset.name} className="w-6 h-6" />
                          <span className="text-[11px] font-medium text-slate-700 line-clamp-1">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: COLOR DE LA INTERFAZ & TEMA */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>Colores de la Interfaz & Estilo Visual</CardTitle>
                    <p className="text-xs text-slate-500">
                      Personaliza los colores de acento, el menú lateral y la apariencia global del sistema
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 1. Estilo de la Barra Lateral */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Layout className="w-4 h-4 text-teal-600" />
                    Estilo del Menú Lateral (Sidebar)
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Elige cómo deseas visualizar la barra de navegación principal.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, sidebarStyle: 'dark' }))}
                      className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        formData.sidebarStyle === 'dark'
                          ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                        🖤
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Oscuro Elegante</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Fondo grafito/azul oscuro profesional</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, sidebarStyle: 'brand' }))}
                      className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        formData.sidebarStyle === 'brand'
                          ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-xl text-white flex items-center justify-center flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: formData.primaryColor }}
                      >
                        🎨
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Color de Marca</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Tono del color primario de la clínica</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, sidebarStyle: 'light' }))}
                      className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        formData.sidebarStyle === 'light'
                          ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-300 text-slate-700 flex items-center justify-center flex-shrink-0">
                        ⚪
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Blanco Minimalista</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Aspecto limpio y moderno con bordes suaves</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Paleta de Colores Primarios */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-600" />
                    Color Primario de la Aplicación
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Afecta a los botones, enlaces, tarjetas activas, calendario e indicadores.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {COLOR_PRESETS.map((preset) => {
                      const isSelected = formData.primaryColor.toLowerCase() === preset.primary.toLowerCase();
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleSelectColorPreset(preset)}
                          className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-xs bg-slate-50'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <span
                            className="w-7 h-7 rounded-xl shadow-xs flex items-center justify-center text-white flex-shrink-0 font-bold text-xs"
                            style={{ backgroundColor: preset.primary }}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{preset.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{preset.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        id="customColor"
                        name="primaryColor"
                        value={formData.primaryColor}
                        onChange={handleChange}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-1"
                      />
                      <div>
                        <label htmlFor="customColor" className="text-xs font-bold text-slate-800 cursor-pointer block">
                          Color Personalizado Hexadecimal
                        </label>
                        <span className="text-[11px] font-mono text-teal-700">{formData.primaryColor}</span>
                      </div>
                    </div>
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
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>Canales de Contacto y Ubicación del Consultorio</CardTitle>
                    <p className="text-xs text-slate-500">
                      Información de atención y dirección que aparecerá en citas y recetas
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Dirección Física del Consultorio / Instalaciones"
                      name="address"
                      placeholder="Calle, número, piso/consultorio, colonia, ciudad y código postal"
                      leftIcon={<MapPin className="w-4 h-4" />}
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>

                  <Input
                    label="Teléfono / WhatsApp de Recepción"
                    name="phone"
                    placeholder="+52 55 1234 5678"
                    leftIcon={<Phone className="w-4 h-4" />}
                    value={formData.phone}
                    onChange={handleChange}
                  />

                  <Input
                    label="Correo Electrónico para Citas y Pacientes"
                    type="email"
                    name="email"
                    placeholder="contacto@clinicapsicologica.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                    value={formData.email}
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

          {/* Botón Guardar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="submit" size="lg" isLoading={loading} leftIcon={<Check className="w-4 h-4" />}>
              Guardar y Aplicar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
