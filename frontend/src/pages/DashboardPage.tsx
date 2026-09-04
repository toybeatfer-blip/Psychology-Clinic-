import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardData, Appointment, Patient } from '../types/index';
import { api } from '../lib/api';
import { Header } from '../components/layout/Header';
import { MetricCards } from '../components/dashboard/MetricCards';
import { UpcomingAppointments } from '../components/dashboard/UpcomingAppointments';
import { PatientFormModal } from '../components/patients/PatientFormModal';
import { AppointmentModal } from '../components/appointments/AppointmentModal';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatDate } from '../lib/utils';
import { UserPlus, CalendarPlus, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const fetchDashboardData = React.useCallback(async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const [dashRes, patientsRes] = await Promise.all([
        api.get<{ success: boolean; data: any }>('/dashboard'),
        api.get<{ success: boolean; data: Patient[] }>('/patients?limit=100'),
      ]);
      if (dashRes && dashRes.data) {
        setDashboardData(dashRes.data);
      }
      if (patientsRes && patientsRes.data) {
        setPatients(patientsRes.data);
      }
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(false);

    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 6000);

    const handleFocus = () => {
      fetchDashboardData(true);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchDashboardData]);

  const handleOpenAppointmentModal = (appointment?: Appointment) => {
    setSelectedAppointment(appointment || null);
    setIsAppointmentModalOpen(true);
  };

  const metrics = dashboardData?.metrics || {
    totalPatients: patients.length,
    activePatients: patients.filter((p) => p.isActive).length,
    todayAppointmentsCount: 0,
    monthCompletedAppointments: 0,
  };

  const todayAppointments = dashboardData?.todayAppointments || [];
  const upcomingAppointments = dashboardData?.upcomingAppointments || [];
  const recentNotes = (dashboardData as any)?.recentNotes || (dashboardData as any)?.recentClinicalNotes || [];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title={`Bienvenido, ${user?.fullName || 'Terapeuta'}`}
        subtitle="Panel de control del consultorio y resumen de actividad clínica"
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPatientModalOpen(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Nuevo Paciente
            </Button>
            <Button
              size="sm"
              onClick={() => handleOpenAppointmentModal()}
              leftIcon={<CalendarPlus className="w-4 h-4" />}
            >
              Agendar Cita
            </Button>
          </div>
        }
      />

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-2 font-medium">Cargando métricas...</p>
          </div>
        ) : (
          <>
            {/* Metric Cards */}
            <MetricCards metrics={metrics} />

            {/* Upcoming Appointments & Today Schedule */}
            <UpcomingAppointments
              todayAppointments={todayAppointments}
              upcomingAppointments={upcomingAppointments}
              onOpenAppointmentModal={handleOpenAppointmentModal}
            />

            {/* Recent Clinical Notes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle>Notas de Evolución Clínicas Recientes</CardTitle>
                      <p className="text-xs text-slate-500">Últimas sesiones psicológicas documentadas</p>
                    </div>
                  </div>
                  <Link
                    to="/patients"
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    Ver pacientes <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-100">
                {recentNotes.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-500 font-medium">No hay notas de evolución recientes</p>
                    <p className="text-xs text-slate-400 mt-1">Crea notas desde la ficha de cada paciente.</p>
                  </div>
                ) : (
                  recentNotes.map((note: any) => (
                    <div
                      key={note.id}
                      className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/patients/${note.patientId}`}
                            className="text-sm font-bold text-slate-900 hover:text-teal-600 transition-colors"
                          >
                            {note.patient?.fullName || 'Paciente'}
                          </Link>
                          <Badge variant="primary" size="sm">
                            Sesión #{note.sessionNumber || '1'}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            • {formatDate(note.sessionDate)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          <span className="font-semibold text-slate-700">Motivo:</span> {note.reasonForSession}
                        </p>
                        {note.diagnosisHypothesis && (
                          <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            <span className="font-semibold text-slate-600">Diagnóstico / Hipótesis:</span> {note.diagnosisHypothesis}
                          </p>
                        )}
                      </div>

                      <Link
                        to={`/patients/${note.patientId}`}
                        className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 flex-shrink-0"
                      >
                        Abrir Expediente <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Modales */}
      <PatientFormModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />

      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        appointmentToEdit={selectedAppointment}
        patients={patients}
        onSuccess={() => fetchDashboardData()}
      />
    </div>
  );
};
