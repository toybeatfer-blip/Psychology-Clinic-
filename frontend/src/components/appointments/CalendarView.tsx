import React, { useState } from 'react';
import { Appointment } from '../../types/index';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  MapPin,
  Clock,
  User,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn, formatTime } from '../../lib/utils';

interface CalendarViewProps {
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
  onNewAppointment: (date?: Date) => void;
}

type CalendarViewMode = 'month' | 'week' | 'day';

export const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  onSelectAppointment,
  onNewAppointment,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Navegación
  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-sky-50 border-sky-300 text-sky-800 hover:bg-sky-100';
      case 'COMPLETED':
        return 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100';
      case 'CANCELLED':
        return 'bg-rose-50 border-rose-200 text-rose-600 line-through opacity-70';
      case 'NO_SHOW':
        return 'bg-amber-50 border-amber-300 text-amber-800';
      case 'SCHEDULED':
      default:
        return 'bg-teal-50 border-teal-300 text-teal-800 hover:bg-teal-100';
    }
  };

  // -------------------------------------------------------------
  // VISTA MENSUAL
  // -------------------------------------------------------------
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cabecera de días de la semana */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center text-xs font-bold text-slate-600 py-3">
          {weekDays.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Cuadrícula de días */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {days.map((day) => {
            const dayAppointments = appointments.filter((appt) =>
              isSameDay(new Date(appt.startDateTime), day)
            );
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={day.toISOString()}
                onClick={() => onNewAppointment(day)}
                className={cn(
                  'min-h-[110px] p-2 transition-colors cursor-pointer group hover:bg-teal-50/30 flex flex-col justify-between',
                  !isCurrentMonth && 'bg-slate-50/50 text-slate-300',
                  isToday && 'bg-teal-50/20'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                      isToday
                        ? 'bg-teal-600 text-white shadow-xs'
                        : isCurrentMonth
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewAppointment(day);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-teal-600 hover:bg-teal-100 rounded-md transition-opacity"
                    title="Nueva cita"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Lista de citas del día */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[75px]">
                  {dayAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAppointment(appt);
                      }}
                      className={cn(
                        'px-1.5 py-1 rounded-md text-[11px] font-medium border flex items-center justify-between truncate transition-all shadow-2xs',
                        getStatusColor(appt.status)
                      )}
                    >
                      <span className="truncate">
                        {formatTime(appt.startDateTime)} {appt.patient?.fullName?.split(' ')[0]}
                      </span>
                      {appt.modality === 'ONLINE' ? (
                        <Video className="w-2.5 h-2.5 flex-shrink-0 ml-1 opacity-70" />
                      ) : (
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0 ml-1 opacity-70" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // VISTA SEMANAL
  // -------------------------------------------------------------
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center divide-x divide-slate-200">
          {days.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className={cn('py-3 px-2', isToday && 'bg-teal-50/50')}>
                <p className="text-xs font-medium text-slate-500 uppercase">
                  {format(day, 'EEE', { locale: es })}
                </p>
                <p
                  className={cn(
                    'text-base font-bold mt-0.5 inline-block px-2.5 py-0.5 rounded-full',
                    isToday ? 'bg-teal-600 text-white' : 'text-slate-800'
                  )}
                >
                  {format(day, 'd')}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[500px]">
          {days.map((day) => {
            const dayAppointments = appointments.filter((appt) =>
              isSameDay(new Date(appt.startDateTime), day)
            );

            return (
              <div
                key={day.toISOString()}
                onClick={() => onNewAppointment(day)}
                className="p-3 space-y-2 cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                {dayAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAppointment(appt);
                    }}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs shadow-xs transition-all cursor-pointer',
                      getStatusColor(appt.status)
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{formatTime(appt.startDateTime)}</span>
                      {appt.modality === 'ONLINE' ? (
                        <Badge variant="secondary" size="sm">Virtual</Badge>
                      ) : (
                        <Badge variant="primary" size="sm">Presencial</Badge>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900 truncate">
                      {appt.patient?.fullName}
                    </p>
                    {appt.locationNotes && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {appt.locationNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // VISTA DIARIA
  // -------------------------------------------------------------
  const renderDayView = () => {
    const dayAppointments = appointments.filter((appt) =>
      isSameDay(new Date(appt.startDateTime), currentDate)
    );

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {dayAppointments.length} sesiones agendadas para hoy
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => onNewAppointment(currentDate)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nueva Cita
          </Button>
        </div>

        {dayAppointments.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Sin citas agendadas para este día</p>
            <p className="text-xs text-slate-400 mt-1">Haz clic en el botón para agendar una nueva cita.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayAppointments.map((appt) => (
              <div
                key={appt.id}
                onClick={() => onSelectAppointment(appt)}
                className={cn(
                  'p-4 rounded-2xl border flex items-center justify-between cursor-pointer hover:shadow-md transition-all',
                  getStatusColor(appt.status)
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="px-3 py-2 bg-white/80 rounded-xl font-bold text-center border border-slate-200">
                    <span className="text-xs block text-slate-400 font-normal">Hora</span>
                    <span className="text-sm text-slate-800">{formatTime(appt.startDateTime)}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      {appt.patient?.fullName}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                      <span>Tel: {appt.patient?.phone}</span>
                      {appt.locationNotes && <span>• {appt.locationNotes}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={appt.modality === 'ONLINE' ? 'secondary' : 'primary'}>
                    {appt.modality === 'ONLINE' ? 'Online' : 'Presencial'}
                  </Badge>
                  <Badge variant="neutral">{appt.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controles de Vista y Navegación de Fecha */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h2 className="text-base font-bold text-slate-800 ml-2 capitalize">
            {viewMode === 'month' && format(currentDate, "MMMM 'de' yyyy", { locale: es })}
            {viewMode === 'week' && `Semana del ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "d 'de' MMM", { locale: es })}`}
            {viewMode === 'day' && format(currentDate, "d 'de' MMMM, yyyy", { locale: es })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de Modos */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all',
                viewMode === 'month' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'hover:text-slate-900'
              )}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all',
                viewMode === 'week' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'hover:text-slate-900'
              )}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all',
                viewMode === 'day' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'hover:text-slate-900'
              )}
            >
              Día
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => onNewAppointment(currentDate)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Agendar Cita
          </Button>
        </div>
      </div>

      {/* Renderizado de la vista elegida */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </div>
  );
};
