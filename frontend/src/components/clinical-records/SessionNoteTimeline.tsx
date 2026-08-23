import React from 'react';
import { ClinicalNote } from '../../types/index.js';
import { Card, CardContent } from '../ui/Card.js';
import { Badge } from '../ui/Badge.js';
import { formatDate } from '../../lib/utils.js';
import {
  FileText,
  Brain,
  Sparkles,
  CheckSquare,
  ClipboardList,
  Edit3,
  Trash2,
  Lock,
} from 'lucide-react';
import { Button } from '../ui/Button.js';

interface SessionNoteTimelineProps {
  notes: ClinicalNote[];
  onEditNote: (note: ClinicalNote) => void;
  onDeleteNote: (noteId: string) => void;
}

export const SessionNoteTimeline: React.FC<SessionNoteTimelineProps> = ({
  notes,
  onEditNote,
  onDeleteNote,
}) => {
  if (notes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-800">Sin notas de evolución registradas</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Aún no se han documentado sesiones clínicas para este paciente. Utiliza el botón superior para crear la primera nota estructurada.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-teal-200">
      {notes.map((note) => (
        <div key={note.id} className="relative group">
          {/* Bullet indicador en la línea temporal */}
          <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-white border-4 border-teal-500 flex items-center justify-center shadow-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
          </div>

          <Card className="hover:border-teal-300 transition-all shadow-xs">
            {/* Header de la Nota */}
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Badge variant="primary" className="font-bold text-xs">
                  Sesión #{note.sessionNumber || '1'}
                </Badge>
                <span className="text-sm font-semibold text-slate-800">
                  {formatDate(note.sessionDate)}
                </span>
                {note.isConfidential && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Lock className="w-3 h-3" /> Confidencial
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditNote(note)}
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  onClick={() => onDeleteNote(note.id)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Eliminar
                </Button>
              </div>
            </div>

            {/* Contenido Clínico Estructurado */}
            <CardContent className="p-6 space-y-4">
              {/* 1. Motivo */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5 mb-1">
                  <ClipboardList className="w-3.5 h-3.5 text-teal-600" />
                  Motivo / Temas Abordados
                </h5>
                <p className="text-sm text-slate-700 leading-relaxed pl-5">
                  {note.reasonForSession}
                </p>
              </div>

              {/* 2. Observaciones Conductuales */}
              {note.behavioralObservations && (
                <div className="pt-3 border-t border-slate-100">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5 mb-1">
                    <Brain className="w-3.5 h-3.5 text-indigo-600" />
                    Observaciones Conductuales y Afecto
                  </h5>
                  <p className="text-sm text-slate-700 leading-relaxed pl-5">
                    {note.behavioralObservations}
                  </p>
                </div>
              )}

              {/* 3. Diagnóstico / Hipótesis */}
              {note.diagnosisHypothesis && (
                <div className="pt-3 border-t border-slate-100">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Diagnóstico / Hipótesis Clínica
                  </h5>
                  <p className="text-sm text-slate-700 leading-relaxed pl-5">
                    {note.diagnosisHypothesis}
                  </p>
                </div>
              )}

              {/* 4. Intervenciones */}
              <div className="pt-3 border-t border-slate-100">
                <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-1">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Intervenciones y Técnicas Aplicadas
                </h5>
                <p className="text-sm text-slate-700 leading-relaxed pl-5 whitespace-pre-line">
                  {note.interventionsApplied}
                </p>
              </div>

              {/* 5. Plan y Tareas */}
              {note.treatmentPlanAndTasks && (
                <div className="pt-3 border-t border-slate-100 bg-teal-50/40 -mx-6 -mb-6 p-6 rounded-b-2xl border-b border-teal-100/50">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5 mb-1">
                    <ClipboardList className="w-3.5 h-3.5 text-teal-700" />
                    Plan Terapéutico y Tareas para la Próxima Sesión
                  </h5>
                  <p className="text-sm text-slate-800 leading-relaxed pl-5 whitespace-pre-line font-medium">
                    {note.treatmentPlanAndTasks}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};
