import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types/index';
import { api } from '../lib/api';
import { Header } from '../components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import {
  Award,
  Phone,
  MapPin,
  DollarSign,
  UserCheck,
  ShieldCheck,
  Check,
  Database,
  Download,
  Upload,
  HardDrive,
  RefreshCw,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    professionalId: '',
    specialty: '',
    phone: '',
    clinicAddress: '',
    bio: '',
    hourlyRate: 60,
    currency: 'USD',
  });

  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        professionalId: user.profile?.professionalId || '',
        specialty: user.profile?.specialty || '',
        phone: user.profile?.phone || '',
        clinicAddress: user.profile?.clinicAddress || '',
        bio: user.profile?.bio || '',
        hourlyRate: user.profile?.hourlyRate ? Number(user.profile.hourlyRate) : 60,
        currency: user.profile?.currency || 'USD',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.put<{ success: boolean; data: User }>('/profile', {
        ...formData,
        hourlyRate: Number(formData.hourlyRate),
      });
      updateUser(res.data);
      setSuccessMessage('Perfil profesional actualizado correctamente en la base de datos.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  // Descargar Copia de Seguridad completa de la base de datos
  const handleExportBackup = async () => {
    setBackupLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: any }>('/profile/backup');
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `Respaldo_Consultorio_${new Date().toISOString().substring(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setSuccessMessage('Copia de seguridad generada y descargada con éxito.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al exportar el respaldo');
    } finally {
      setBackupLoading(false);
    }
  };

  // Restaurar / Importar Copia de Seguridad
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      setRestoreLoading(true);
      setError(null);
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = async (event) => {
        try {
          const parsedData = JSON.parse(event.target?.result as string);
          const res = await api.post<{ success: boolean; data: { message: string } }>('/profile/restore', parsedData);
          setSuccessMessage(res.data.message);
          setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err: any) {
          setError(err.message || 'El archivo seleccionado no es un respaldo válido.');
        } finally {
          setRestoreLoading(false);
        }
      };
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Perfil Profesional & Base de Datos"
        subtitle="Configuración del consultorio y administración de base de datos propia"
      />

      <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Información Profesional y de Contacto</CardTitle>
                  <p className="text-xs text-slate-500">Datos visibles para recetas, consentimientos e informes</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre Completo *"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                />

                <Input
                  label="Cédula / Colegiado Profesional"
                  name="professionalId"
                  placeholder="Ej. PSI-849201"
                  leftIcon={<Award className="w-4 h-4" />}
                  value={formData.professionalId}
                  onChange={handleChange}
                />

                <div className="sm:col-span-2">
                  <Input
                    label="Especialidad y Enfoque Clínico"
                    name="specialty"
                    placeholder="Ej. Psicología Clínica y Psicoterapia Cognitivo-Conductual"
                    value={formData.specialty}
                    onChange={handleChange}
                  />
                </div>

                <Input
                  label="Teléfono de Consultorio"
                  name="phone"
                  placeholder="+52 55 1234 5678"
                  leftIcon={<Phone className="w-4 h-4" />}
                  value={formData.phone}
                  onChange={handleChange}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Tarifa por Sesión"
                    type="number"
                    name="hourlyRate"
                    leftIcon={<DollarSign className="w-4 h-4" />}
                    value={formData.hourlyRate}
                    onChange={handleChange}
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Moneda</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="MXN">MXN ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="COP">COP ($)</option>
                      <option value="ARS">ARS ($)</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Dirección del Consultorio Físico"
                    name="clinicAddress"
                    placeholder="Av. Principal #123, Consultorio 402, Ciudad"
                    leftIcon={<MapPin className="w-4 h-4" />}
                    value={formData.clinicAddress}
                    onChange={handleChange}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Textarea
                    label="Biografía / Presentación Profesional"
                    name="bio"
                    rows={3}
                    placeholder="Especialista en intervención psicoterapéutica..."
                    value={formData.bio}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" size="lg" isLoading={loading}>
                  Guardar Perfil Profesional
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Centro de Base de Datos Propia y Respaldos */}
        <Card className="border-teal-200 shadow-sm">
          <CardHeader className="bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Base de Datos Propia & Copias de Seguridad</CardTitle>
                <p className="text-xs text-slate-500">
                  Tus pacientes, citas y notas se graban automáticamente en disco en tiempo real
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {/* Estado de la Base de Datos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-teal-50/50 rounded-2xl border border-teal-100 text-xs">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-teal-600" />
                <div>
                  <span className="text-slate-400 block font-medium">Archivo de Base de Datos</span>
                  <span className="font-bold text-slate-800">backend/prisma/dev.db</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="text-slate-400 block font-medium">Modo de Persistencia</span>
                  <span className="font-bold text-emerald-700">Automático en disco</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-slate-400 block font-medium">Aislamiento de Terapeuta</span>
                  <span className="font-bold text-slate-800">Activo (UUID único)</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Cada nuevo paciente, nota de evolución, diagnóstico o cita que registras durante tu sesión se guarda permanentemente en la base de datos local en el instante en que lo creas. Al cerrar el navegador, apagar el equipo o cerrar sesión, **todos tus datos permanecen intactos y disponibles para tu próxima sesión**.
            </p>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Exportar / Importar Respaldo
                </h5>
                <p className="text-[11px] text-slate-500">
                  Descarga una copia completa de todos tus expedientes para tener un respaldo externo.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportBackup}
                  isLoading={backupLoading}
                  leftIcon={<Download className="w-4 h-4 text-teal-600" />}
                >
                  Descargar Respaldo JSON
                </Button>

                <label className="cursor-pointer">
                  <span className="inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm px-3 py-1.5 text-xs gap-1.5">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    {restoreLoading ? 'Restaurando...' : 'Restaurar Respaldo'}
                  </span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportBackup}
                    disabled={restoreLoading}
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
