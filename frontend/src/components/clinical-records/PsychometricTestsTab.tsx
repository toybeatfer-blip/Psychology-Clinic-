import React, { useState } from 'react';
import { Patient, PsychometricTest } from '../../types/index';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';
import {
  BrainCircuit,
  Plus,
  Activity,
  Trash2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  FileText,
} from 'lucide-react';

interface PsychometricTestsTabProps {
  patient: Patient;
  onOpenTestModal: () => void;
  onDeleteTest: (testId: string) => Promise<void>;
}

export const PsychometricTestsTab: React.FC<PsychometricTestsTabProps> = ({
  patient,
  onOpenTestModal,
  onDeleteTest,
}) => {
  const tests = patient.psychometricTests || [];

  return (
    <div className="space-y-6">
      {/* Encabezado y Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-600" />
            <span>Evaluaciones y Tests Psicométricos Aplicados</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de escalas estandarizadas (PHQ-9, GAD-7, Rosenberg, Protocolo de Crisis)
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenTestModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Aplicar Nuevo Test
        </Button>
      </div>

      {tests.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-300">
          <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700">Sin pruebas psicométricas registradas</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Aplica un cuestionario estandarizado (PHQ-9 para Depresión, GAD-7 para Ansiedad o Escala de Autoestima) para monitorear la evolución clínica del paciente.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenTestModal}
            leftIcon={<Plus className="w-4 h-4 text-indigo-600" />}
            className="mt-4"
          >
            Aplicar Primera Evaluación
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => {
            const badgeVariant =
              test.severityColor === 'rose'
                ? 'danger'
                : test.severityColor === 'orange' || test.severityColor === 'amber'
                ? 'warning'
                : 'success';

            return (
              <Card key={test.id} className="hover:shadow-md transition-shadow border-slate-200">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">{test.scaleName}</h4>
                        <Badge variant={badgeVariant} size="sm">
                          {test.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        📅 Aplicado el {formatDate(test.appliedDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xl font-black text-indigo-600">
                          {test.totalScore} / {test.maxScore}
                        </span>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Puntos</p>
                      </div>

                      <button
                        onClick={() => onDeleteTest(test.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar test del historial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Interpretación Clínica */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                    <strong>💡 Interpretación:</strong> {test.clinicalInterpretation}
                  </div>

                  {/* Notas del terapeuta si existen */}
                  {test.notes && (
                    <div className="text-xs text-slate-500 italic pl-1">
                      "{test.notes}"
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
