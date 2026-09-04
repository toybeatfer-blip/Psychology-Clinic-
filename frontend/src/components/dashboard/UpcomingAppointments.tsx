import React from 'react';
import { Appointment } from '../../types/index';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatTime, formatDateTime } from '../../lib/utils';
import { Calendar, Video, MapPin, User, ArrowRight, MessageSquareQuote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { openWhatsAppReminder, isAppointmentInNext24to48Hours } from '../../lib/whatsapp';

interface UpcomingAppointmentsProps {
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  onOpenAppointmentModal: (appointment?: Appointment) => void;
}

export const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  todayAppointments,
  upcomingAppointments,
  onOpenAppointmentModal,
}) => {
  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="primary">Programada</Badge>;
      case 'CONFIRMED':
        return <Badge variant="info">Confirmada</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Realizada</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelada</Badge>;
      case 'NO_SHOW':
        return <Badge variant="warning">No asistió</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent, appt: Appointment) => {
    e.stopPropagation();
    openWhatsAppReminder(appt.patient, appt, 'Consultorio Psicológico');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Citas de Hoy */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <CardTitle>Citas de Hoy</CardTitle>
            </div>
            <Link
              to="/calendar"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              Ver calendario <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-100">
          {todayAppointments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500 font-medium">No hay citas programadas para hoy</p>
              <p className="text-xs text-slate-400 mt-1">¡Tómate un descanso o aprovecha para revisar expedientes!</p>
            </div>
          ) : (
            todayAppointments.map((appt) => (
              <div
                key={appt.id}
                onClick={() => onOpenAppointmentModal(appt)}
                className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3.5">
                  <div className="bg-teal-50 text-teal-700 font-bold px-3 py-2 rounded-xl text-center min-w-[65px] border border-teal-100">
                    <span className="text-xs block text-teal-500 uppercase font-medium">Hora</span>
                    <span className="text-sm">{formatTime(appt.startDateTime)}</span>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {appt.patient?.fullName || 'Paciente'}
                    </h5>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        {appt.modality === 'ONLINE' ? (
                          <>
                            <Video className="w-3 h-3 text-indigo-500" /> En línea
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3 h-3 text-emerald-500" /> Presencial
                          </>
                        )}
                      </span>
                      {appt.locationNotes && <span>• {appt.locationNotes}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {appt.patient?.phone && (
                    <button
                      type="button"
                      title="Enviar recordatorio por WhatsApp"
                      onClick={(e) => handleWhatsAppClick(e, appt)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all border border-emerald-200 shadow-2xs flex items-center gap-1 text-xs font-semibold"
                    >
                      <span className="text-sm">💬</span>
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>
                  )}
                  {getStatusBadge(appt.status)}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Próximas Citas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <CardTitle>Próximas Sesiones (Recordatorios 24h)</CardTitle>
            </div>
            <Link
              to="/calendar"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-100">
          {upcomingAppointments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500 font-medium">No hay próximas sesiones en los siguientes días</p>
            </div>
          ) : (
            upcomingAppointments.map((appt) => {
              const is24h = isAppointmentInNext24to48Hours(appt.startDateTime);
              return (
                <div
                  key={appt.id}
                  onClick={() => onOpenAppointmentModal(appt)}
                  className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-semibold text-slate-800">{appt.patient?.fullName || 'Paciente'}</h5>
                      {is24h && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full border border-amber-300 animate-pulse">
                          ⏰ Próximas 24h
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(appt.startDateTime)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {appt.patient?.phone && (
                      <button
                        type="button"
                        title="Enviar recordatorio automático por WhatsApp"
                        onClick={(e) => handleWhatsAppClick(e, appt)}
                        className={`p-2 rounded-xl transition-all border shadow-2xs flex items-center gap-1 text-xs font-semibold ${
                          is24h
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <span className="text-sm">💬</span>
                        <span className="hidden sm:inline">WhatsApp 24h</span>
                      </button>
                    )}
                    <Badge variant={appt.modality === 'ONLINE' ? 'secondary' : 'primary'} size="sm">
                      {appt.modality === 'ONLINE' ? 'Online' : 'Presencial'}
                    </Badge>
                    {getStatusBadge(appt.status)}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};
