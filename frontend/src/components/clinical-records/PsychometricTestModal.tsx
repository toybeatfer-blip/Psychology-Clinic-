import React, { useState } from 'react';
import { PsychometricTest, PsychometricScaleType } from '../../types/index';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Textarea';
import {
  BrainCircuit,
  Activity,
  Heart,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Award,
  Calendar,
} from 'lucide-react';

interface PsychometricTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSaveTest: (test: PsychometricTest) => Promise<void>;
}

// Bancos de preguntas oficiales y estandarizadas
const SCALES_DATA: Record<
  PsychometricScaleType,
  {
    name: string;
    description: string;
    instructions: string;
    options: { label: string; value: number }[];
    questions: string[];
    calculateResult: (answers: Record<number, number>) => {
      score: number;
      maxScore: number;
      severity: string;
      severityColor: 'emerald' | 'amber' | 'orange' | 'rose' | 'indigo';
      interpretation: string;
      hasCrisisAlert?: boolean;
    };
  }
> = {
  PHQ9: {
    name: 'PHQ-9 (Cuestionario de Salud del Paciente - Depresión)',
    description: 'Instrumento clínico estandarizado para evaluar la presencia y gravedad de sintomatología depresiva.',
    instructions: 'Durante las últimas 2 semanas, ¿con qué frecuencia ha experimentado los siguientes síntomas?',
    options: [
      { label: 'Para nada (0)', value: 0 },
      { label: 'Varios días (1)', value: 1 },
      { label: 'Más de la mitad de los días (2)', value: 2 },
      { label: 'Casi todos los días (3)', value: 3 },
    ],
    questions: [
      '1. Poco interés o placer en hacer las cosas (anhedonia)',
      '2. Sentirse desanimado/a, deprimido/a o sin esperanza',
      '3. Problemas para conciliar el sueño, mantenerse dormido/a o dormir demasiado',
      '4. Sentirse cansado/a o con poca energía',
      '5. Poco apetito o comer en exceso',
      '6. Sentirse mal con uno/a mismo/a, sentir que ha fracasado o que ha defraudado a su familia',
      '7. Dificultad para concentrarse en cosas tales como leer o ver televisión',
      '8. Moverse o hablar tan despacio que los demás lo han notado, o lo contrario: estar inquieto/a o agitado/a',
      '9. Pensamientos de que estaría mejor muerto/a o de lastimarse de alguna manera',
    ],
    calculateResult: (answers) => {
      let score = 0;
      for (let i = 0; i < 9; i++) {
        score += answers[i] || 0;
      }
      const item9Score = answers[8] || 0;
      const hasCrisisAlert = item9Score > 0;

      let severity = 'Sin síntomas depresivos / Mínimo';
      let severityColor: 'emerald' | 'amber' | 'orange' | 'rose' | 'indigo' = 'emerald';
      let interpretation = 'Puntuación dentro de límites normales. No se detecta depresión significativa.';

      if (score >= 5 && score <= 9) {
        severity = 'Sintomatología Depresiva Leve';
        severityColor = 'emerald';
        interpretation = 'Presencia de síntomas leves. Sugerido monitoreo clínico y psicoeducación.';
      } else if (score >= 10 && score <= 14) {
        severity = 'Depresión Moderada';
        severityColor = 'amber';
        interpretation = 'Requiere plan de tratamiento psicoterapéutico focalizado (ej. TCC, Activación Conductual).';
      } else if (score >= 15 && score <= 19) {
        severity = 'Depresión Moderadamente Severa';
        severityColor = 'orange';
        interpretation = 'Trastorno depresivo importante. Se recomienda psicoterapia intensiva y posible valoración psiquiátrica.';
      } else if (score >= 20) {
        severity = 'Depresión Severa';
        severityColor = 'rose';
        interpretation = 'Afectación funcional grave. Requiere intervención psicoterapéutica inmediata y evaluación médica psiquiátrica.';
      }

      return { score, maxScore: 27, severity, severityColor, interpretation, hasCrisisAlert };
    },
  },

  GAD7: {
    name: 'GAD-7 (Escala del Trastorno de Ansiedad Generalizada)',
    description: 'Herramienta de tamizaje clínico para evaluar síntomas de ansiedad, preocupación y tensión.',
    instructions: 'Durante las últimas 2 semanas, ¿con qué frecuencia se ha sentido molesto/a por los siguientes problemas?',
    options: [
      { label: 'Nunca (0)', value: 0 },
      { label: 'Varios días (1)', value: 1 },
      { label: 'Más de la mitad de los días (2)', value: 2 },
      { label: 'Casi todos los días (3)', value: 3 },
    ],
    questions: [
      '1. Sentirse nervioso/a, intranquilo/a o con los nervios de punta',
      '2. No poder parar o controlar las preocupaciones',
      '3. Preocuparse demasiado por diferentes cosas',
      '4. Dificultad para relajarse',
      '5. Estar tan inquieto/a que es difícil quedarse quieto/a',
      '6. Ponerse fácilmente irritable o molesto/a',
      '7. Sentir miedo como si algo terrible fuera a pasar',
    ],
    calculateResult: (answers) => {
      let score = 0;
      for (let i = 0; i < 7; i++) {
        score += answers[i] || 0;
      }

      let severity = 'Ansiedad Mínima';
      let severityColor: 'emerald' | 'amber' | 'orange' | 'rose' | 'indigo' = 'emerald';
      let interpretation = 'Nivel de ansiedad basal esperado. Sin interferencia funcional relevante.';

      if (score >= 5 && score <= 9) {
        severity = 'Ansiedad Leve';
        severityColor = 'emerald';
        interpretation = 'Sintomatología ansiosa leve. Recomendadas técnicas de relajación y respiración diafragmática.';
      } else if (score >= 10 && score <= 14) {
        severity = 'Ansiedad Moderada';
        severityColor = 'amber';
        interpretation = 'Presencia de trastorno de ansiedad probable. Indicada intervención en reestructuración cognitiva y exposición.';
      } else if (score >= 15) {
        severity = 'Ansiedad Severa';
        severityColor = 'rose';
        interpretation = 'Ansiedad invalidante con alta respuesta somática. Tratamiento psicoterapéutico prioritario.';
      }

      return { score, maxScore: 21, severity, severityColor, interpretation };
    },
  },

  ROSENBERG: {
    name: 'Escala de Autoestima de Rosenberg (RSES)',
    description: 'Cuestionario de 10 ítems para evaluar el nivel de autoestima global y autoaceptación.',
    instructions: 'Indique su grado de acuerdo con cada una de las siguientes afirmaciones:',
    options: [
      { label: 'Muy en desacuerdo (1)', value: 1 },
      { label: 'En desacuerdo (2)', value: 2 },
      { label: 'De acuerdo (3)', value: 3 },
      { label: 'Muy de acuerdo (4)', value: 4 },
    ],
    questions: [
      '1. Siento que soy una persona digna de aprecio, al menos en igual medida que los demás',
      '2. Siento que tengo cualidades positivas',
      '3. En general, me inclino a sentir que soy un/a fracasado/a (*ítem inverso)',
      '4. Soy capaz de hacer las cosas tan bien como la mayoría de la gente',
      '5. Siento que no tengo mucho de lo que enorgullecerme (*ítem inverso)',
      '6. Adopto una actitud positiva hacia mí mismo/a',
      '7. En general, me siento satisfecho/a conmigo mismo/a',
      '8. Desearía tener más respeto por mí mismo/a (*ítem inverso)',
      '9. A veces me siento ciertamente inútil (*ítem inverso)',
      '10. A veces pienso que no soy bueno/a para nada (*ítem inverso)',
    ],
    calculateResult: (answers) => {
      let score = 0;
      const reverseItems = [2, 4, 7, 8, 9]; // Índices 0-based de ítems inversos

      for (let i = 0; i < 10; i++) {
        const val = answers[i] || 1;
        if (reverseItems.includes(i)) {
          score += 5 - val; // 1->4, 2->3, 3->2, 4->1
        } else {
          score += val;
        }
      }

      let severity = 'Autoestima Baja';
      let severityColor: 'emerald' | 'amber' | 'orange' | 'rose' | 'indigo' = 'amber';
      let interpretation = 'Autoestima disminuida con autocrítica elevada. Recomendado trabajo en autocompasión y autovalía.';

      if (score >= 26 && score <= 29) {
        severity = 'Autoestima Media / Adecuada';
        severityColor = 'indigo';
        interpretation = 'Nivel de autoestima promedio con capacidad de autoaceptación funcional.';
      } else if (score >= 30) {
        severity = 'Autoestima Elevada / Óptima';
        severityColor = 'emerald';
        interpretation = 'Autoestima sólida, percepción saludable de autoeficacia y valía personal.';
      }

      return { score, maxScore: 40, severity, severityColor, interpretation };
    },
  },

  SUICIDE_RISK: {
    name: 'Protocolo de Detección de Riesgo de Crisis y Conducta Suicida',
    description: 'Exploración clínica estructurada de factores de riesgo, ideación, intención y factores protectores.',
    instructions: 'Marque la presencia de cada factor observado durante la entrevista clínica:',
    options: [
      { label: 'Ausente (0)', value: 0 },
      { label: 'Leve / Dudoso (1)', value: 1 },
      { label: 'Presente / Significativo (2)', value: 2 },
      { label: 'Severo / Inminente (3)', value: 3 },
    ],
    questions: [
      '1. Ideación de muerte pasiva ("desearía dormirme y no despertar")',
      '2. Ideación activa ("he pensado en cómo quitarme la vida")',
      '3. Plan estructurado / Método disponible',
      '4. Antecedentes de intentos previos o conductas autolesivas',
      '5. Sentimientos intensos de desesperanza o carga para los demás',
      '6. Ausencia de red de apoyo familiar o social continente',
    ],
    calculateResult: (answers) => {
      let score = 0;
      for (let i = 0; i < 6; i++) {
        score += answers[i] || 0;
      }
      const planScore = answers[2] || 0;
      const ideationActive = answers[1] || 0;

      let severity = 'Riesgo Bajo / Nulo';
      let severityColor: 'emerald' | 'amber' | 'orange' | 'rose' | 'indigo' = 'emerald';
      let interpretation = 'Sin indicadores de riesgo inminente. Mantener alianza terapéutica y monitoreo.';

      if (score >= 4 && score <= 8) {
        severity = 'Riesgo Moderado';
        severityColor = 'amber';
        interpretation = 'Presencia de ideación. Establecer Contrato de No Agresión / Plan de Seguridad de Crisis y contactar red de apoyo.';
      } else if (score >= 9 || planScore >= 2 || ideationActive >= 3) {
        severity = 'Riesgo Alto / Crítico';
        severityColor = 'rose';
        interpretation = '🚨 ALERTA CLÍNICA: Riesgo inminente. Activar protocolo de crisis, acompañamiento permanente por familiares y derivación médica/urgencias.';
      }

      return { score, maxScore: 18, severity, severityColor, interpretation, hasCrisisAlert: score >= 9 || planScore >= 2 };
    },
  },

  CUSTOM: {
    name: 'Evaluación Personalizada',
    description: 'Registro libre',
    instructions: '',
    options: [],
    questions: [],
    calculateResult: () => ({
      score: 0,
      maxScore: 10,
      severity: 'Personalizado',
      severityColor: 'indigo',
      interpretation: 'Registro libre',
    }),
  },
};

export const PsychometricTestModal: React.FC<PsychometricTestModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSaveTest,
}) => {
  const { user } = useAuth();
  const [selectedScale, setSelectedScale] = useState<PsychometricScaleType>('PHQ9');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const currentScaleData = SCALES_DATA[selectedScale];
  const results = currentScaleData.calculateResult(answers);

  const handleAnswerChange = (questionIndex: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  const handleSelectScale = (scale: PsychometricScaleType) => {
    setSelectedScale(scale);
    setAnswers({});
  };

  const handleSave = async () => {
    setSaving(true);
    const test: PsychometricTest = {
      id: `test-${Date.now()}`,
      therapistId: user?.id || 'therapist',
      patientId,
      scaleType: selectedScale,
      scaleName: currentScaleData.name,
      appliedDate: new Date().toISOString(),
      answers,
      totalScore: results.score,
      maxScore: results.maxScore,
      severity: results.severity,
      severityColor: results.severityColor,
      clinicalInterpretation: results.interpretation,
      notes: clinicalNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      await onSaveTest(test);
      onClose();
    } catch (error) {
      console.error('Error al guardar test:', error);
    } finally {
      setSaving(false);
    }
  };

  const isComplete = currentScaleData.questions.every((_, idx) => answers[idx] !== undefined);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-400">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">Batería de Tests Psicométricos</h3>
              <p className="text-xs text-slate-300">
                Paciente: <span className="text-indigo-300 font-semibold">{patientName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Escalas */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleSelectScale('PHQ9')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedScale === 'PHQ9'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            PHQ-9 (Depresión)
          </button>
          <button
            type="button"
            onClick={() => handleSelectScale('GAD7')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedScale === 'GAD7'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            GAD-7 (Ansiedad)
          </button>
          <button
            type="button"
            onClick={() => handleSelectScale('ROSENBERG')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedScale === 'ROSENBERG'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Autoestima Rosenberg
          </button>
          <button
            type="button"
            onClick={() => handleSelectScale('SUICIDE_RISK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedScale === 'SUICIDE_RISK'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            ⚠️ Riesgo / Crisis
          </button>
        </div>

        {/* Contenido del Cuestionario */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs sm:text-sm">
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
            <h4 className="font-black text-indigo-950 text-sm">{currentScaleData.name}</h4>
            <p className="text-xs text-slate-600 mt-1">{currentScaleData.description}</p>
            <p className="text-xs text-indigo-700 font-semibold mt-2">👉 {currentScaleData.instructions}</p>
          </div>

          {/* Preguntas */}
          <div className="space-y-4">
            {currentScaleData.questions.map((question, qIdx) => (
              <div
                key={qIdx}
                className={`p-3.5 rounded-2xl border transition-colors ${
                  answers[qIdx] !== undefined ? 'bg-slate-50 border-slate-200' : 'bg-white border-dashed border-slate-300'
                }`}
              >
                <p className="font-bold text-slate-800 text-xs sm:text-sm mb-2">{question}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {currentScaleData.options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleAnswerChange(qIdx, opt.value)}
                      className={`p-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                        answers[qIdx] === opt.value
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Calificación Automática en Vivo */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 uppercase tracking-wider font-semibold">
                Calificación Automática
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-indigo-300">
                  {results.score} / {results.maxScore} pts
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black ${
                  results.severityColor === 'rose'
                    ? 'bg-rose-500 text-white'
                    : results.severityColor === 'orange'
                    ? 'bg-orange-500 text-white'
                    : results.severityColor === 'amber'
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {results.severity}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              💡 <strong>Interpretación Clínica:</strong> {results.interpretation}
            </p>

            {results.hasCrisisAlert && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Atención: El ítem de ideación / crisis puntuó positivo. Evaluar protocolo de seguridad.</span>
              </div>
            )}
          </div>

          {/* Notas Clínicas del Terapeuta */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observaciones y Contexto Clínico del Terapeuta (Opcional)
            </label>
            <Textarea
              placeholder="Ej: Paciente refiere mayor reactividad emocional tras evento estresante laboral..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={saving}
            disabled={!isComplete}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Guardar en Expediente ({results.score} pts)
          </Button>
        </div>
      </div>
    </div>
  );
};
