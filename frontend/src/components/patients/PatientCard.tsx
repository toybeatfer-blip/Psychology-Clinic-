import React from 'react';
import { Patient } from '../../types/index.js';
import { Card, CardContent } from '../ui/Card.js';
import { Badge } from '../ui/Badge.js';
import { calculateAge } from '../../lib/utils.js';
import { Phone, Mail, Calendar, FileText, ChevronRight, Edit3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PatientCardProps {
  patient: Patient;
  onEdit: (patient: Patient) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onEdit }) => {
  return (
    <Card className="hover:shadow-md hover:border-teal-200 transition-all flex flex-col justify-between group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-base border border-teal-100 shadow-xs">
              {patient.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <Link
                to={`/patients/${patient.id}`}
                className="font-bold text-slate-800 hover:text-teal-600 transition-colors line-clamp-1 group-hover:text-teal-600"
              >
                {patient.fullName}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 font-medium">
                  {patient.occupation || 'Paciente'}
                </span>
                {patient.birthDate && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400">{calculateAge(patient.birthDate)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={patient.isActive ? 'success' : 'neutral'} size="sm">
              {patient.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
            <button
              onClick={() => onEdit(patient)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Editar datos"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Motivo Inicial */}
        <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Motivo de Consulta
          </p>
          <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed font-normal">
            {patient.initialReason}
          </p>
        </div>

        {/* Contact Info */}
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{patient.phone}</span>
          </div>
          {patient.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{patient.email}</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Footer Stats & Button */}
      <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            {patient._count?.clinicalNotes || 0} notas
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            {patient._count?.appointments || 0} citas
          </span>
        </div>

        <Link
          to={`/patients/${patient.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 group-hover:translate-x-0.5 transition-transform"
        >
          Ver Expediente <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};
