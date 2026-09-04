import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/layout/Header';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../lib/api';
import { syncLocalWithCloud, getDeterministicUserId } from '../lib/cloudSync';
import { RegisteredUserSummary, Patient, Appointment, ClinicalNote } from '../types/index';
import { formatDate, formatTime } from '../lib/utils';
import {
  ShieldCheck,
  Users,
  Search,
  Trash2,
  Building2,
  Calendar,
  FileText,
  Mail,
  Phone,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Award,
  Radio,
  PauseCircle,
  PlayCircle,
  Ban,
  CheckCircle2,
  Eye,
  Activity,
  X,
  Stethoscope,
  Clock,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<RegisteredUserSummary[]>(() => {
    try {
      const raw = localStorage.getItem('psychocare_db_users');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((u: any) => ({
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            role: u.role,
            status: u.status || 'ACTIVE',
            isSuspended: !!u.isSuspended,
            createdAt: u.createdAt || new Date().toISOString(),
            patientsCount: 0,
            appointmentsCount: 0,
            notesCount: 0,
            patients: [],
            appointments: [],
            notes: [],
            profile: u.profile,
            clinicSettings: u.clinicSettings,
          }));
        }
      }
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Modal de Inspección de Actividad en Vivo
  const [inspectingUser, setInspectingUser] = useState<RegisteredUserSummary | null>(null);
  const [inspectTab, setInspectTab] = useState<'patients' | 'appointments' | 'notes'>('patients');

  const fetchUsers = useCallback(async (silent: boolean = false) => {
    if (!silent && users.length === 0) setLoading(true);
    setError(null);
    try {
      // 1. Sincronizar con la nube primero para tener la última fotografía global
      const cloudState = await syncLocalWithCloud();

      // 2. Obtener usuarios consolidados
      const res = await api.get<{ success: boolean; data: RegisteredUserSummary[] }>('/admin/users');
      let summaries = res.data || [];

      // Si cloudState contiene información de tenants más completa, fusionar directamente
      if (cloudState && cloudState.tenants) {
        summaries = summaries.map((u) => {
          const emailKey = (u.email || '').toLowerCase();
          const cleanEmail = emailKey.replace(/[^a-z0-9]/g, '_');
          const canonicalId = u.id;

          let tenant =
            cloudState.tenants[canonicalId] ||
            cloudState.tenants[getDeterministicUserId(u.email)] ||
            cloudState.tenants[emailKey];

          if (!tenant) {
            const foundKey = Object.keys(cloudState.tenants).find(
              (k) => (cleanEmail && k.includes(cleanEmail)) || (canonicalId && canonicalId.startsWith('therapist-') && k.includes(canonicalId))
            );
            if (foundKey) {
              tenant = cloudState.tenants[foundKey];
            }
          }

          if (tenant) {
            const finalPatients = (tenant.patients && tenant.patients.length > 0) ? tenant.patients : (u.patients || []);
            const finalAppts = (tenant.appointments && tenant.appointments.length > 0) ? tenant.appointments : (u.appointments || []);
            const finalNotes = (tenant.notes && tenant.notes.length > 0) ? tenant.notes : (u.notes || []);
            return {
              ...u,
              patientsCount: finalPatients.length,
              appointmentsCount: finalAppts.length,
              notesCount: finalNotes.length,
              patients: finalPatients,
              appointments: finalAppts,
              notes: finalNotes,
              lastActivityAt: tenant.lastActivityAt || u.lastActivityAt,
            };
          }
          return u;
        });
      }

      setUsers(summaries);
      const now = new Date();
      setLastSyncTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
          now.getSeconds()
        ).padStart(2, '0')}`
      );
    } catch (err: any) {
      if (!silent) {
        setError(err.message || 'Error al cargar los usuarios registrados.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Actualización automática continua en tiempo real (Polling cada 4s)
  useEffect(() => {
    fetchUsers(false);

    const interval = setInterval(() => {
      fetchUsers(true);
    }, 4000);

    const handleFocus = () => {
      fetchUsers(true);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchUsers]);

  const handleManualSync = async () => {
    setSyncingNow(true);
    await fetchUsers(false);
    setSuccessMessage('Sincronización en vivo completada con éxito.');
    setTimeout(() => setSuccessMessage(null), 3000);
    setSyncingNow(false);
  };

  // Suspender o Reactivar Licencia
  const handleToggleSuspension = async (targetUser: RegisteredUserSummary) => {
    if (targetUser.email === 'Fernando01' || targetUser.role === 'ADMIN') {
      alert('No puedes suspender la cuenta de Super Administrador principal.');
      return;
    }

    const nextSuspendedState = !targetUser.isSuspended && targetUser.status !== 'SUSPENDED';
    const actionName = nextSuspendedState ? 'suspender' : 'reactivar';

    if (
      !window.confirm(
        `¿Estás seguro de que deseas ${actionName} la licencia del terapeuta "${targetUser.fullName}"? ${
          nextSuspendedState
            ? 'El terapeuta no podrá ingresar a su consultorio mientras su cuenta permanezca suspendida.'
            : 'El terapeuta recuperará el acceso inmediato a su consultorio.'
        }`
      )
    ) {
      return;
    }

    try {
      await api.put(`/admin/users/${targetUser.id}/suspension`, {
        isSuspended: nextSuspendedState,
      });
      setSuccessMessage(
        `Licencia de "${targetUser.fullName}" ${nextSuspendedState ? 'suspendida' : 'reactivada'} con éxito.`
      );
      setTimeout(() => setSuccessMessage(null), 3500);
      fetchUsers(true);
    } catch (err: any) {
      setError(err.message || 'Error al modificar estado de la licencia.');
    }
  };

  // Eliminar Licencia y Consultorio Permanentemente
  const handleDeleteUser = async (userToDelete: RegisteredUserSummary) => {
    if (userToDelete.email === 'Fernando01' || userToDelete.role === 'ADMIN') {
      alert('No puedes eliminar la cuenta de Super Administrador principal.');
      return;
    }

    if (
      !window.confirm(
        `⚠️ ¿Estás seguro de que deseas eliminar permanentemente al terapeuta "${userToDelete.fullName}" (${userToDelete.email}) y todos sus pacientes, citas y notas? Esta acción se sincronizará en la nube y no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      setSuccessMessage(`Terapeuta "${userToDelete.fullName}" y su consultorio eliminados permanentemente.`);
      setTimeout(() => setSuccessMessage(null), 3500);
      fetchUsers(true);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario');
    }
  };

  const handlePurgeAllTestData = async () => {
    if (
      !window.confirm(
        '🧹 ¿Deseas limpiar todos los datos de prueba y pacientes residuales que puedan quedar en el servidor o navegador?'
      )
    ) {
      return;
    }

    setPurging(true);
    try {
      await api.post('/admin/purge-test-data');
      setSuccessMessage('¡Datos de prueba y ejemplos residuales eliminados con éxito!');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error al purgar datos de prueba');
      setPurging(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch =
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.profile?.specialty && u.profile.specialty.toLowerCase().includes(term));

    const isSuspended = u.isSuspended || u.status === 'SUSPENDED';

    if (!matchesSearch) return false;
    if (statusFilter === 'ACTIVE') return !isSuspended;
    if (statusFilter === 'SUSPENDED') return isSuspended;
    return true;
  });

  const totalPatients = users.reduce((acc, u) => acc + (u.patientsCount || 0), 0);
  const totalAppointments = users.reduce((acc, u) => acc + (u.appointmentsCount || 0), 0);
  const totalNotes = users.reduce((acc, u) => acc + (u.notesCount || 0), 0);

  const activeCount = users.filter((u) => !u.isSuspended && u.status !== 'SUSPENDED').length;
  const suspendedCount = users.filter((u) => u.isSuspended || u.status === 'SUSPENDED').length;

  // Formateador de tiempo relativo de actividad
  const getActivityBadge = (lastActivityAt?: string) => {
    if (!lastActivityAt) return <span className="text-[11px] text-slate-400">Sin actividad registrada</span>;
    const diffHours = (new Date().getTime() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Activo Hoy
        </span>
      );
    } else if (diffHours < 168) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
          Activo esta semana
        </span>
      );
    } else {
      return (
        <span className="text-[11px] text-slate-400">
          Última actividad: {formatDate(lastActivityAt)}
        </span>
      );
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md w-full text-center p-6 border-rose-200">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Acceso Restringido</h2>
          <p className="text-xs text-slate-500 mt-1">
            Esta sección es exclusiva para el creador y Super Administrador del sistema (Fernando01).
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Panel Maestro del Super Administrador"
        subtitle="Control global en tiempo real de licencias, consultorios y actividad en vivo"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              isLoading={syncingNow}
              leftIcon={<RefreshCw className={`w-4 h-4 text-teal-600 ${syncingNow ? 'animate-spin' : ''}`} />}
              title="Forzar actualización inmediata desde la nube global"
            >
              Sincronizar en Vivo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePurgeAllTestData}
              isLoading={purging}
              leftIcon={<Sparkles className="w-4 h-4 text-teal-400" />}
            >
              Limpiar Datos Prueba
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner de Sincronización Automática en Vivo */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-teal-500/20">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Sincronización Global en Vivo Activa</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  ● 4s Live Polling
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Los consultorios registrados y su actividad en cualquier dispositivo se reflejan automáticamente.
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400">
            Última comprobación: <span className="text-teal-300 font-mono font-bold">{lastSyncTime || 'Sincronizando...'}</span>
          </div>
        </div>

        {/* Mensajes de Notificación */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tarjetas de Métricas Globales del Sistema */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Terapeutas / Licencias</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{users.length}</h3>
                <p className="text-[11px] text-teal-600 mt-1 font-semibold">{activeCount} activas • {suspendedCount} suspendidas</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                <Users className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Pacientes Globales</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{totalPatients}</h3>
                <p className="text-[11px] text-indigo-600 mt-1 font-semibold">En todos los consultorios</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Building2 className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Citas Agendadas</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{totalAppointments}</h3>
                <p className="text-[11px] text-purple-600 mt-1 font-semibold">Sesiones de psicoterapia</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Calendar className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Notas Clínicas</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{totalNotes}</h3>
                <p className="text-[11px] text-amber-600 mt-1 font-semibold">Registros de evolución</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <FileText className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros de Estado & Búsqueda */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <Input
              placeholder="Buscar por nombre, correo o especialidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({users.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Activos ({activeCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('SUSPENDED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'SUSPENDED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Suspendidos ({suspendedCount})</span>
            </button>
          </div>
        </div>

        {/* Listado de Consultorios y Licencias */}
        {loading && users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Cargando licencias y terapeutas registrados...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-slate-300">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No se encontraron terapeutas</h4>
            <p className="text-xs text-slate-400 mt-1">Intenta con otro filtro o término de búsqueda.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUsers.map((u) => {
              const isSuperAdmin = u.role === 'ADMIN' || u.email === 'Fernando01';
              const isSuspended = u.isSuspended || u.status === 'SUSPENDED';

              return (
                <Card
                  key={u.id}
                  className={`hover:shadow-md transition-all flex flex-col justify-between ${
                    isSuperAdmin
                      ? 'border-indigo-300 bg-gradient-to-br from-indigo-50/40 to-white'
                      : isSuspended
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Encabezado del Usuario & Badge de Licencia */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shadow-xs shrink-0 ${
                            isSuperAdmin
                              ? 'bg-indigo-600 text-white'
                              : isSuspended
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-teal-50 text-teal-700 border border-teal-100'
                          }`}
                        >
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            {isSuperAdmin && (
                              <span title="Super Administrador">
                                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                              </span>
                            )}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {u.profile?.specialty || (isSuperAdmin ? 'Creador del Sistema' : 'Psicólogo Clínico')}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {isSuperAdmin ? (
                          <Badge variant="primary" size="sm">
                            Super Admin
                          </Badge>
                        ) : isSuspended ? (
                          <Badge variant="danger" size="sm">
                            🔴 Suspendida
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            🟢 Activa
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Estado de Actividad en Vivo */}
                    <div className="flex items-center justify-between border-y border-slate-100 py-2">
                      <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <Activity className="w-3.5 h-3.5 text-teal-600" />
                        <span>Actividad:</span>
                      </span>
                      {getActivityBadge(u.lastActivityAt)}
                    </div>

                    {/* Datos de Contacto y Registro */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">{u.email}</span>
                      </div>
                      {u.profile?.phone && (
                        <div className="flex items-center gap-2 truncate">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.profile.phone}</span>
                        </div>
                      )}
                      {u.profile?.clinicAddress && (
                        <div className="text-[11px] text-slate-500 font-medium truncate pt-0.5">
                          📍 {u.profile.clinicAddress}
                        </div>
                      )}
                      {u.profile?.professionalId && (
                        <div className="text-[11px] text-slate-500 font-medium pt-0.5">
                          🪪 Cédula: {u.profile.professionalId}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 pt-0.5">
                        📅 Registrado: {formatDate(u.createdAt)}
                      </div>
                    </div>

                    {/* Estadísticas de su Consultorio */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                        <span className="text-base font-black text-slate-800">{u.patientsCount}</span>
                        <p className="text-[10px] text-slate-400 font-medium">Pacientes</p>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                        <span className="text-base font-black text-slate-800">{u.appointmentsCount}</span>
                        <p className="text-[10px] text-slate-400 font-medium">Citas</p>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                        <span className="text-base font-black text-slate-800">{u.notesCount}</span>
                        <p className="text-[10px] text-slate-400 font-medium">Notas</p>
                      </div>
                    </div>
                  </CardContent>

                  {/* Acciones de Gestión de Licencias & Inspección */}
                  <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setInspectingUser(u)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Ver expedientes y citas de este consultorio"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Actividad</span>
                    </button>

                    {!isSuperAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleSuspension(u)}
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isSuspended
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                              : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                          }`}
                          title={isSuspended ? 'Reactivar licencia de acceso' : 'Suspender licencia temporalmente'}
                        >
                          {isSuspended ? (
                            <>
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Reactivar</span>
                            </>
                          ) : (
                            <>
                              <PauseCircle className="w-3.5 h-3.5" />
                              <span>Suspender</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar permanentemente este consultorio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Inspección de Actividad en Vivo */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Cabecera */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>Consultorio de {inspectingUser.fullName}</span>
                    <Badge variant={inspectingUser.isSuspended ? 'danger' : 'success'} size="sm">
                      {inspectingUser.isSuspended ? 'Suspendida' : 'Activa'}
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-400">{inspectingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas de Inspección */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center gap-2">
              <button
                onClick={() => setInspectTab('patients')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inspectTab === 'patients'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Pacientes ({inspectingUser.patientsCount})
              </button>
              <button
                onClick={() => setInspectTab('appointments')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inspectTab === 'appointments'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Citas ({inspectingUser.appointmentsCount})
              </button>
              <button
                onClick={() => setInspectTab('notes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inspectTab === 'notes'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Notas ({inspectingUser.notesCount})
              </button>
            </div>

            {/* Contenido de la Inspección */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
              {inspectTab === 'patients' && (
                <div className="space-y-2">
                  {(!inspectingUser.patients || inspectingUser.patients.length === 0) ? (
                    <div className="text-center py-8 text-slate-400">
                      Este terapeuta aún no ha registrado pacientes en su consultorio.
                    </div>
                  ) : (
                    inspectingUser.patients.map((p) => (
                      <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{p.fullName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Tel: {p.phone} • Motivo: {p.initialReason}
                          </p>
                        </div>
                        <Badge variant={p.isActive ? 'success' : 'neutral'} size="sm">
                          {p.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              )}

              {inspectTab === 'appointments' && (
                <div className="space-y-2">
                  {(!inspectingUser.appointments || inspectingUser.appointments.length === 0) ? (
                    <div className="text-center py-8 text-slate-400">
                      Sin citas agendadas por el momento.
                    </div>
                  ) : (
                    inspectingUser.appointments.map((a) => (
                      <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">
                            {a.modality === 'ONLINE' ? '💻 Sesión Virtual' : '🏢 Presencial'}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            📅 {formatDate(a.startDateTime)} • ⏰ {formatTime(a.startDateTime)}
                          </p>
                        </div>
                        <Badge variant="primary" size="sm">
                          {a.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              )}

              {inspectTab === 'notes' && (
                <div className="space-y-2">
                  {(!inspectingUser.notes || inspectingUser.notes.length === 0) ? (
                    <div className="text-center py-8 text-slate-400">
                      Sin notas de evolución clínica redactadas.
                    </div>
                  ) : (
                    inspectingUser.notes.map((n) => (
                      <div key={n.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900">
                            Sesión N° {n.sessionNumber || 1} • {formatDate(n.sessionDate)}
                          </p>
                          <Badge variant="neutral" size="sm">
                            {n.isConfidential ? '🔒 Confidencial' : 'Evolución'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {n.reasonForSession}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Pie */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setInspectingUser(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
