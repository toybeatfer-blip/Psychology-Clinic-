import React, { useState, useEffect } from 'react';
import { Patient, ClinicalEvaluation, MentalStateExam } from '../../types/index';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';
import {
  Brain,
  Search,
  Save,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  AlertCircle,
  Stethoscope,
  HeartHandshake,
  Lightbulb,
} from 'lucide-react';

interface ClinicalEvaluationTabProps {
  patient: Patient;
  onSaveEvaluation: (evaluation: ClinicalEvaluation) => Promise<void>;
}

const COMMON_DSM5_DIAGNOSES = [
  { code: 'F41.1', name: 'Trastorno de Ansiedad Generalizada (TAG)' },
  { code: 'F32.1', name: 'Trastorno Depresivo Mayor, Episodio Único (Moderado)' },
  { code: 'F33.1', name: 'Trastorno Depresivo Recurrente' },
  { code: 'F43.10', name: 'Trastorno de Estrés Postraumático (TEPT)' },
  { code: 'F41.0', name: 'Trastorno de Pánico (Crisis de Angustia)' },
  { code: 'F42.2', name: 'Trastorno Obsesivo-Compulsivo (TOC)' },
  { code: 'F43.2', name: 'Trastorno de Adaptación (con Ánimo Depresivo/Ansioso)' },
  { code: 'F90.2', name: 'Trastorno por Déficit de Atención e Hiperactividad (TDAH)' },
  { code: 'F60.3', name: 'Trastorno de Personalidad Límite (TLP)' },
  { code: 'F31.9', name: 'Trastorno Afectivo Bipolar' },
  { code: 'F50.0', name: 'Anorexia Nerviosa / Trastorno de la Conducta Alimentaria' },
  { code: 'Z63.0', name: 'Problemas en la Relación de Pareja / Conyugal' },
  { code: 'Z62.820', name: 'Problemas de Relación Entre Padres e Hijos' },
  { code: 'Z56.9', name: 'Estrés Laboral Crónico / Síndrome de Burnout' },
];

export const ClinicalEvaluationTab: React.FC<ClinicalEvaluationTabProps> = ({
  patient,
  onSaveEvaluation,
}) => {
  const existing = patient.clinicalEvaluation;

  const [formData, setFormData] = useState<Partial<ClinicalEvaluation>>({
    reasonForConsultationDetailed: existing?.reasonForConsultationDetailed || patient.initialReason || '',
    symptomOnsetDuration: existing?.symptomOnsetDuration || '',
    familyHistoryGenogram: existing?.familyHistoryGenogram || '',
    personalHistory: existing?.personalHistory || patient.clinicalBackground || '',
    dsm5Code: existing?.dsm5Code || '',
    dsm5Diagnosis: existing?.dsm5Diagnosis || '',
    diagnosticNotes: existing?.diagnosticNotes || '',
    treatmentObjectives: existing?.treatmentObjectives || '',
    theoreticalApproach: existing?.theoreticalApproach || 'Terapia Cognitivo-Conductual (TCC)',
    mentalStateExam: existing?.mentalStateExam || {
      appearance: 'Adecuada, aseada y acorde al contexto',
      consciousness: 'Lúcido/a y alerta',
      orientation: 'Orientado/a en tiempo, espacio y persona (autopsíquica y alopsíquica)',
      affectMood: 'Eutímico / Reactivo',
      speechLanguage: 'Fluido, coherente y espontáneo',
      thoughtProcess: 'Lógico, coherente y sin alteraciones en el curso o contenido',
      perception: 'Sin alteraciones sensoperceptivas (sin alucinaciones)',
      judgmentInsight: 'Juicio conservado con adecuada conciencia de enfermedad (insight presente)',
      riskAssessment: 'NONE',
    },
  });

  const [dsmSearch, setDsmSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (patient.clinicalEvaluation) {
      setFormData({
        ...patient.clinicalEvaluation,
      });
    }
  }, [patient.clinicalEvaluation]);

  const handleMentalExamChange = (field: keyof MentalStateExam, value: string) => {
    setFormData((prev) => ({
      ...prev,
      mentalStateExam: {
        ...(prev.mentalStateExam || {}),
        [field]: value,
      },
    }));
  };

  const handleSelectDsm = (dsm: typeof COMMON_DSM5_DIAGNOSES[0]) => {
    setFormData((prev) => ({
      ...prev,
      dsm5Code: dsm.code,
      dsm5Diagnosis: dsm.name,
    }));
    setDsmSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);

    const evaluation: ClinicalEvaluation = {
      id: existing?.id || `eval-${Date.now()}`,
      patientId: patient.id,
      therapistId: patient.therapistId,
      evaluationDate: existing?.evaluationDate || new Date().toISOString(),
      reasonForConsultationDetailed: formData.reasonForConsultationDetailed,
      symptomOnsetDuration: formData.symptomOnsetDuration,
      familyHistoryGenogram: formData.familyHistoryGenogram,
      personalHistory: formData.personalHistory,
      mentalStateExam: formData.mentalStateExam,
      dsm5Code: formData.dsm5Code,
      dsm5Diagnosis: formData.dsm5Diagnosis,
      diagnosticNotes: formData.diagnosticNotes,
      treatmentObjectives: formData.treatmentObjectives,
      theoreticalApproach: formData.theoreticalApproach,
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSaveEvaluation(evaluation);
      setSuccessMessage('Evaluación clínica y diagnóstico guardados exitosamente.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error al guardar evaluación:', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredDsm = COMMON_DSM5_DIAGNOSES.filter(
    (d) =>
      d.name.toLowerCase().includes(dsmSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(dsmSearch.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 1. Motivo de Consulta & Historia de la Enfermedad / Síntomas */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            <span>1. Motivo de Consulta & Sintomatología Actual</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descripción Detallada del Motivo de Consulta
            </label>
            <Textarea
              placeholder="Describa el motivo de consulta según el paciente y las circunstancias desencadenantes..."
              value={formData.reasonForConsultationDetailed}
              onChange={(e) => setFormData({ ...formData, reasonForConsultationDetailed: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Inicio, Duración y Frecuencia de los Síntomas
              </label>
              <Input
                placeholder="Ej: Inicio hace 6 meses tras pérdida de empleo, diario..."
                value={formData.symptomOnsetDuration}
                onChange={(e) => setFormData({ ...formData, symptomOnsetDuration: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enfoque Terapéutico Principal
              </label>
              <select
                value={formData.theoreticalApproach}
                onChange={(e) => setFormData({ ...formData, theoreticalApproach: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                <option value="Terapia Cognitivo-Conductual (TCC)">Terapia Cognitivo-Conductual (TCC)</option>
                <option value="Terapia Sistémica y Familiar">Terapia Sistémica y Familiar</option>
                <option value="Terapia de Aceptación y Compromiso (ACT)">Terapia de Aceptación y Compromiso (ACT)</option>
                <option value="Psicoanálisis y Psicodinámica">Psicoanálisis y Psicodinámica</option>
                <option value="Terapia Humanista / Gestalt">Terapia Humanista / Gestalt</option>
                <option value="Terapia Breve Centrada en Soluciones">Terapia Breve Centrada en Soluciones</option>
                <option value="Enfoque Integrativo">Enfoque Integrativo</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Examen del Estado Mental (Sensorio y Funciones Psíquicas) */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
            <Brain className="w-4 h-4 text-indigo-600" />
            <span>2. Examen del Estado Mental (EEM / Psicometría Cualitativa)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Apariencia y Porte</label>
            <Input
              value={formData.mentalStateExam?.appearance}
              onChange={(e) => handleMentalExamChange('appearance', e.target.value)}
              placeholder="Ej: Aseado/a, contacto visual conservado..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Orientación & Conciencia</label>
            <Input
              value={formData.mentalStateExam?.orientation}
              onChange={(e) => handleMentalExamChange('orientation', e.target.value)}
              placeholder="Ej: Orientado/a en tiempo, espacio y persona"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Estado de Ánimo y Afecto</label>
            <Input
              value={formData.mentalStateExam?.affectMood}
              onChange={(e) => handleMentalExamChange('affectMood', e.target.value)}
              placeholder="Ej: Disfórico, ansioso, congruente con el relato..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pensamiento y Lenguaje</label>
            <Input
              value={formData.mentalStateExam?.thoughtProcess}
              onChange={(e) => handleMentalExamChange('thoughtProcess', e.target.value)}
              placeholder="Ej: Curso lógico, sin ideas delirantes ni fuga de ideas"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Juicio e Introspección (Insight)</label>
            <Input
              value={formData.mentalStateExam?.judgmentInsight}
              onChange={(e) => handleMentalExamChange('judgmentInsight', e.target.value)}
              placeholder="Ej: Conciencia plena de la problemática"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nivel de Riesgo Clínico</label>
            <select
              value={formData.mentalStateExam?.riskAssessment || 'NONE'}
              onChange={(e) => handleMentalExamChange('riskAssessment', e.target.value)}
              className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="NONE">🟢 Sin Riesgo Detectado</option>
              <option value="LOW">🟡 Riesgo Bajo / Ideación pasiva</option>
              <option value="MEDIUM">🟠 Riesgo Moderado</option>
              <option value="HIGH">🔴 Riesgo Alto / Alerta de Crisis</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 3. Hipótesis Diagnóstica (DSM-5 / CIE-11) */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
            <FileCheck2 className="w-4 h-4 text-purple-600" />
            <span>3. Hipótesis Diagnóstica (DSM-5 / CIE-11) & Objetivos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Código CIE / DSM</label>
              <Input
                placeholder="Ej: F41.1"
                value={formData.dsm5Code}
                onChange={(e) => setFormData({ ...formData, dsm5Code: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Diagnóstico Clínico</label>
              <Input
                placeholder="Ej: Trastorno de Ansiedad Generalizada"
                value={formData.dsm5Diagnosis}
                onChange={(e) => setFormData({ ...formData, dsm5Diagnosis: e.target.value })}
              />
            </div>
          </div>

          {/* Buscador Rápido de Diagnósticos DSM-5 */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Sugerencias Rápidas de Diagnóstico DSM-5 / CIE-11
              </span>
              <div className="w-48">
                <Input
                  placeholder="Filtrar códigos..."
                  value={dsmSearch}
                  onChange={(e) => setDsmSearch(e.target.value)}
                  leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
              {filteredDsm.map((dsm) => (
                <button
                  key={dsm.code}
                  type="button"
                  onClick={() => handleSelectDsm(dsm)}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 rounded-lg text-xs font-medium text-slate-700 transition-colors text-left cursor-pointer"
                >
                  <span className="font-bold text-purple-700">{dsm.code}</span> {dsm.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Objetivos Terapéuticos y Plan de Tratamiento
            </label>
            <Textarea
              placeholder="Ej: 1. Psicoeducación en ansiedad. 2. Identificación de distorsiones cognitivas. 3. Desensibilización sistemática..."
              value={formData.treatmentObjectives}
              onChange={(e) => setFormData({ ...formData, treatmentObjectives: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Dinámica Familiar & Antecedentes */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
            <HeartHandshake className="w-4 h-4 text-amber-600" />
            <span>4. Dinámica Familiar & Genograma Descriptivo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <Textarea
            placeholder="Estructura familiar, relaciones significativas, red de apoyo, pérdidas o duelos no elaborados..."
            value={formData.familyHistoryGenogram}
            onChange={(e) => setFormData({ ...formData, familyHistoryGenogram: e.target.value })}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Botón de Guardado */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={saving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Guardar Evaluación Clínica & Diagnóstico
        </Button>
      </div>
    </form>
  );
};
