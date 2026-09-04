import React from 'react';
import { Users, CalendarCheck, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

interface MetricCardsProps {
  metrics: {
    totalPatients: number;
    activePatients: number;
    todayAppointmentsCount: number;
    monthCompletedAppointments: number;
  };
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics }) => {
  const cards = [
    {
      title: 'Pacientes Activos',
      value: metrics.activePatients,
      subValue: `de ${metrics.totalPatients} pacientes totales`,
      icon: Users,
      color: 'teal',
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-teal-100',
    },
    {
      title: 'Citas para Hoy',
      value: metrics.todayAppointmentsCount,
      subValue: 'programadas en agenda',
      icon: CalendarCheck,
      color: 'indigo',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },
    {
      title: 'Sesiones Completadas',
      value: metrics.monthCompletedAppointments,
      subValue: 'durante este mes',
      icon: CheckCircle2,
      color: 'emerald',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    {
      title: 'Privacidad de Datos',
      value: '100%',
      subValue: 'Aislamiento y cifrado activo',
      icon: FileText,
      color: 'amber',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="hover:border-slate-300 transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <h4 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {card.value}
                </h4>
                <p className="text-xs text-slate-400 mt-1">{card.subValue}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${card.bg} ${card.text} flex items-center justify-center border ${card.border}`}>
                <Icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
