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
  Printer,
  Eye,
  CheckCircle2,
  Sparkles,
  Calendar,
  X,
  HeartHandshake,
  ShieldAlert,
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
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTestForView, setSelectedTestForView] = useState<PsychometricTest | null>(null);

  // Alerta de crisis activa si el test más reciente de SUICIDE_RISK o ítem 9 de PHQ9 es positivo
  const hasActiveCrisisAlert = tests.some(
    (t) => (t.scaleType === 'SUICIDE_RISK' && t.totalScore >= 4) || (t.scaleType === 'PHQ9' && t.answers?.[8] > 0)
  );

  // Filtrado de tests
  const filteredTests = tests.filter((t) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'DEPRESSION_ANXIETY') return t.scaleType === 'PHQ9' || t.scaleType === 'GAD7' || t.scaleType === 'BAI';
    if (selectedCategory === 'STRESS_BURNOUT') return t.scaleType === 'PSS10' || t.scaleType === 'BURNOUT_MBI';
    if (selectedCategory === 'SELF_ESTEEM_WELLBEING') return t.scaleType === 'ROSENBERG' || t.scaleType === 'SWLS';
    if (selectedCategory === 'CRISIS') return t.scaleType === 'SUICIDE_RISK';
    return true;
  });

  // Cálculo de evolución longitudinal para PHQ-9 o GAD-7 (comparar primero y último)
  const phq9Tests = tests.filter((t) => t.scaleType === 'PHQ9').sort((a, b) => new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime());
  const phq9Delta = phq9Tests.length >= 2 ? phq9Tests[phq9Tests.length - 1].totalScore - phq9Tests[0].totalScore : null;

  const gad7Tests = tests.filter((t) => t.scaleType === 'GAD7').sort((a, b) => new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime());
  const gad7Delta = gad7Tests.length >= 2 ? gad7Tests[gad7Tests.length - 1].totalScore - gad7Tests[0].totalScore : null;

  const handlePrintTest = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acción Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-600" />
            <span>Batería de Tests y Evaluación Psicométrica Estandarizada</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Escalas clínicas auto-calificables para monitoreo de depresión, ansiedad, estrés, autoestima, bienestar y riesgo.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenTestModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-xs"
        >
          Aplicar Nueva Prueba
        </Button>
      </div>

      {/* Banner de Alerta Clínica de Crisis */}
      {hasActiveCrisisAlert && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl flex items-start gap-3.5 text-rose-900 animate-in fade-in">
          <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-rose-950 flex items-center gap-2">
              🚨 Alerta Clínica: Indicador de Riesgo / Crisis Detectado
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              El paciente ha puntuado positivo en reactivos de ideación o protocolo de crisis. Se recomienda verificar contrato de no agresión, activar red de apoyo y plan de seguridad psicoterapéutico.
            </p>
          </div>
        </div>
      )}

      {/* Tarjetas de Métricas y Evolución Longitudinal */}
      {tests.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Evaluaciones</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-slate-900">{tests.length}</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Registradas en el expediente</p>
          </Card>

          {/* Evolución PHQ-9 */}
          <Card className="border-slate-200 p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Evolución Depresión (PHQ-9)</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-slate-900">
                {phq9Tests.length > 0 ? `${phq9Tests[phq9Tests.length - 1].totalScore} pts` : 'N/A'}
              </span>
              {phq9Delta !== null ? (
                <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  phq9Delta < 0 ? 'bg-emerald-50 text-emerald-700' : phq9Delta > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {phq9Delta < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : phq9Delta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : null}
                  {phq9Delta > 0 ? `+${phq9Delta}` : `${phq9Delta}`} pts
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">{phq9Tests.length} aplicación</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {phq9Delta !== null && phq9Delta < 0
                ? '📉 Reducción sintomática favorable'
                : phq9Delta !== null && phq9Delta > 0
                ? '📈 Incremento de sintomatología'
                : 'Monitoreo de sintomatología'}
            </p>
          </Card>

          {/* Evolución GAD-7 */}
          <Card className="border-slate-200 p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Evolución Ansiedad (GAD-7)</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-slate-900">
                {gad7Tests.length > 0 ? `${gad7Tests[gad7Tests.length - 1].totalScore} pts` : 'N/A'}
              </span>
              {gad7Delta !== null ? (
                <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  gad7Delta < 0 ? 'bg-emerald-50 text-emerald-700' : gad7Delta > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {gad7Delta < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : gad7Delta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : null}
                  {gad7Delta > 0 ? `+${gad7Delta}` : `${gad7Delta}`} pts
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">{gad7Tests.length} aplicación</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {gad7Delta !== null && gad7Delta < 0
                ? '📉 Reducción de tensión y ansiedad'
                : gad7Delta !== null && gad7Delta > 0
                ? '📈 Reactivación de ansiedad'
                : 'Monitoreo de ansiedad'}
            </p>
          </Card>

          {/* Último Test */}
          <Card className="border-slate-200 p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Última Escala Aplicada</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-black text-indigo-950 truncate max-w-[150px]">
                {tests[0]?.scaleName.split('(')[0] || 'N/A'}
              </span>
              <Badge variant={tests[0]?.severityColor === 'rose' ? 'danger' : tests[0]?.severityColor === 'orange' || tests[0]?.severityColor === 'amber' ? 'warning' : 'success'} size="sm">
                {tests[0]?.severity.split(' ')[0] || 'Normal'}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {tests[0] ? `📅 ${formatDate(tests[0].appliedDate)}` : 'Sin registros'}
            </p>
          </Card>
        </div>
      )}

      {/* Barra de Filtros */}
      {tests.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todas ({tests.length})
          </button>
          <button
            onClick={() => setSelectedCategory('DEPRESSION_ANXIETY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'DEPRESSION_ANXIETY'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Depresión y Ansiedad (PHQ-9 / GAD-7 / BAI)
          </button>
          <button
            onClick={() => setSelectedCategory('STRESS_BURNOUT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'STRESS_BURNOUT'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Estrés y Burnout (PSS-10 / MBI)
          </button>
          <button
            onClick={() => setSelectedCategory('SELF_ESTEEM_WELLBEING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'SELF_ESTEEM_WELLBEING'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Autoestima y Bienestar (RSES / SWLS)
          </button>
          <button
            onClick={() => setSelectedCategory('CRISIS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'CRISIS'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            ⚠️ Protocolo de Crisis
          </button>
        </div>
      )}

      {/* Lista de Evaluaciones Psicométricas */}
      {filteredTests.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-300">
          <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700">Sin pruebas psicométricas en esta categoría</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Aplica un cuestionario estandarizado (PHQ-9 para Depresión, GAD-7 / BAI para Ansiedad, PSS-10 para Estrés, Rosenberg para Autoestima, SWLS para Satisfacción Vital o Burnout MBI) para monitorear la evolución clínica del paciente.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenTestModal}
            leftIcon={<Plus className="w-4 h-4 text-indigo-600" />}
            className="mt-4"
          >
            Aplicar Primera Evaluación Psicométrica
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTests.map((test) => {
            const badgeVariant =
              test.severityColor === 'rose'
                ? 'danger'
                : test.severityColor === 'orange' || test.severityColor === 'amber'
                ? 'warning'
                : 'success';

            return (
              <Card key={test.id} className="hover:shadow-md transition-shadow border-slate-200">
                <CardContent className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">{test.scaleName}</h4>
                        <Badge variant={badgeVariant} size="sm">
                          {test.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Aplicado el {formatDate(test.appliedDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-xl font-black text-indigo-600">
                          {test.totalScore} / {test.maxScore}
                        </span>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Puntos Obtenidos</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTestForView(test)}
                          leftIcon={<Eye className="w-4 h-4 text-indigo-600" />}
                          title="Ver desglose e informe"
                        >
                          Ver Informe
                        </Button>

                        <button
                          onClick={() => onDeleteTest(test.id)}
                          className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar test del expediente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interpretación Clínica */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                    <span className="font-bold text-indigo-900 shrink-0">💡 Diagnóstico e Interpretación:</span>
                    <span>{test.clinicalInterpretation}</span>
                  </div>

                  {/* Notas del terapeuta */}
                  {test.notes && (
                    <div className="text-xs text-slate-500 italic pl-1 border-l-2 border-indigo-200 py-0.5">
                      "{test.notes}"
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle / Informe Imprimible del Test */}
      {selectedTestForView && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Cabecera del Informe */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Informe de Evaluación Psicométrica</h3>
                  <p className="text-xs text-slate-400">
                    Paciente: <span className="text-white font-semibold">{patient.fullName}</span> • {formatDate(selectedTestForView.appliedDate)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTestForView(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto print:p-0">
              {/* Resumen del Test */}
              <div className="p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">
                    {selectedTestForView.scaleName}
                  </span>
                  <span className="text-2xl font-black text-indigo-300">
                    {selectedTestForView.totalScore} / {selectedTestForView.maxScore} pts
                  </span>
                </div>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-indigo-500 text-white">
                    {selectedTestForView.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  💡 <strong>Interpretación:</strong> {selectedTestForView.clinicalInterpretation}
                </p>
              </div>

              {/* Observaciones del Terapeuta */}
              {selectedTestForView.notes && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <h5 className="font-bold text-xs text-slate-800">Observaciones del Terapeuta:</h5>
                  <p className="text-xs text-slate-600 italic">"{selectedTestForView.notes}"</p>
                </div>
              )}

              {/* Respuestas a los reactivos */}
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Desglose de Reactivos y Respuestas
                </h5>
                <div className="space-y-1.5 border border-slate-200 rounded-2xl p-3 bg-white">
                  {Object.entries(selectedTestForView.answers || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between py-1 px-2 border-b border-slate-100 last:border-b-0 text-xs">
                      <span className="text-slate-600 font-medium">Reactivo #{Number(key) + 1}</span>
                      <span className="font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {val} {val === 1 ? 'punto' : 'puntos'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pie del modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintTest}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Imprimir Informe
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedTestForView(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
