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
  Flame,
  Smile,
  Zap,
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
    category: 'DEPRESSION' | 'ANXIETY' | 'STRESS' | 'SELF_ESTEEM' | 'WELLBEING' | 'BURNOUT' | 'CRISIS' | 'OTHER';
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
    description: 'Instrumento clínico estandarizado internacionalmente para evaluar la presencia y severidad de síntomas depresivos mayores.',
    instructions: 'Durante las últimas 2 semanas, ¿con qué frecuencia ha experimentado los siguientes síntomas?',
    category: 'DEPRESSION',
    options: [
      { label: 'Para nada (0)', value: 0 },
      { label: 'Varios días (1)', value: 1 },
      { label: 'Más de la mitad (2)', value: 2 },
      { label: 'Casi a diario (3)', value: 3 },
    ],
    questions: [
      '1. Poco interés o placer en hacer las cosas (anhedonia)',
      '2. Sentirse desanimado/a, deprimido/a o sin esperanza',
      '3. Problemas para conciliar el sueño, mantenerse dormido/a o dormir demasiado',
      '4. Sentirse cansado/a o con poca energía',
      '5. Poco apetito o comer en exceso',
      '6. Sentirse mal con uno/a mismo/a, sentir que ha fracasado o defraudado a su familia',
      '7. Dificultad para concentrarse en cosas tales como leer o ver televisión',
      '8. Moverse o hablar tan despacio que los demás lo han notado, o estar demasiado inquieto/a',
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
      let interpretation = 'Puntuación dentro de límites normales. No se detecta depresión clínicamente significativa.';

      if (score >= 5 && score <= 9) {
        severity = 'Depresión Leve';
        severityColor = 'emerald';
        interpretation = 'Presencia de síntomas leves. Sugerido monitoreo clínico, psicoeducación y hábitos de autocuidado.';
      } else if (score >= 10 && score <= 14) {
        severity = 'Depresión Moderada';
        severityColor = 'amber';
        interpretation = 'Trastorno depresivo probable. Requiere intervención psicoterapéutica focalizada (Activación Conductual, TCC).';
      } else if (score >= 15 && score <= 19) {
        severity = 'Depresión Moderadamente Severa';
        severityColor = 'orange';
        interpretation = 'Sintomatología depresiva importante con compromiso funcional. Se sugiere psicoterapia intensiva y valoración médica.';
      } else if (score >= 20) {
        severity = 'Depresión Severa';
        severityColor = 'rose';
        interpretation = 'Afectación funcional severa. Indicada psicoterapia estructurada inmediata y valoración psiquiátrica.';
      }

      return { score, maxScore: 27, severity, severityColor, interpretation, hasCrisisAlert };
    },
  },

  GAD7: {
    name: 'GAD-7 (Escala de Ansiedad Generalizada)',
    description: 'Herramienta clínica estandarizada para evaluar la severidad de síntomas de ansiedad, preocupación incontrolable y tensión.',
    instructions: 'Durante las últimas 2 semanas, ¿con qué frecuencia se ha sentido molesto/a por los siguientes problemas?',
    category: 'ANXIETY',
    options: [
      { label: 'Nunca (0)', value: 0 },
      { label: 'Varios días (1)', value: 1 },
      { label: 'Más de la mitad (2)', value: 2 },
      { label: 'Casi a diario (3)', value: 3 },
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
        interpretation = 'Sintomatología ansiosa leve. Recomendadas técnicas de regulación emocional, respiración y relajación muscular.';
      } else if (score >= 10 && score <= 14) {
        severity = 'Ansiedad Moderada';
        severityColor = 'amber';
        interpretation = 'Trastorno de ansiedad generalizada probable. Indicada reestructuración cognitiva, desensibilización y manejo de rumiación.';
      } else if (score >= 15) {
        severity = 'Ansiedad Severa';
        severityColor = 'rose';
        interpretation = 'Ansiedad severa e invalidante con alta somatización. Tratamiento psicoterapéutico prioritario.';
      }

      return { score, maxScore: 21, severity, severityColor, interpretation };
    },
  },

  BAI: {
    name: 'BAI (Inventario de Ansiedad de Beck)',
    description: 'Cuestionario de 21 reactivos diseñado por Aaron Beck para discriminar síntomas somáticos, cognitivos y fisiológicos de ansiedad.',
    instructions: 'Indique en qué grado se ha sentido molesto/a por cada síntoma durante la última semana:',
    category: 'ANXIETY',
    options: [
      { label: 'En absoluto (0)', value: 0 },
      { label: 'Levemente (1)', value: 1 },
      { label: 'Moderado (2)', value: 2 },
      { label: 'Severo (3)', value: 3 },
    ],
    questions: [
      '1. Entumecimiento u hormigueo en el cuerpo',
      '2. Sensación de calor o sofocación',
      '3. Temblores o debilidad en las piernas',
      '4. Incapacidad para relajarse o calmarse',
      '5. Miedo a que suceda lo peor',
      '6. Mareo, inestabilidad o aturdimiento',
      '7. Palpitaciones, latidos fuertes o taquicardia',
      '8. Inestabilidad o temblor físico generalizado',
      '9. Terror, pánico o miedo repentino e inexplicable',
      '10. Nerviosismo o inquietud interior constante',
      '11. Sensación de ahogo o atragantamiento',
      '12. Manos temblorosas',
      '13. Temblores o sacudidas corporales',
      '14. Miedo a perder el control o volverse loco/a',
      '15. Dificultad para respirar (disnea)',
      '16. Miedo a morir',
      '17. Sobresalto o asustarse fácilmente',
      '18. Molestias estomacales, náuseas o indigestión',
      '19. Sensación de desmayo o desvanecimiento',
      '20. Rubor o enrojecimiento facial repentino',
      '21. Sudoración fría o excesiva no debida al calor',
    ],
    calculateResult: (answers) => {
      let score = 0;
      for (let i = 0; i < 21; i++) {
        score += answers[i] || 0;
      }

      let severity = 'Ansiedad Baja / Normal';
      let severityColor: 'emerald' | 'amber' | 'orange' | 'rose' | 'indigo' = 'emerald';
      let interpretation = 'El paciente presenta niveles normales o basales de respuesta ansiosa.';

      if (score >= 22 && score <= 35) {
        severity = 'Ansiedad Moderada';
        severityColor = 'amber';
        interpretation = 'Presencia significativa de activación fisiológica y somática. Requiere intervención en técnicas de afrontamiento y exposición.';
      } else if (score >= 36) {
        severity = 'Ansiedad Severa';
        severityColor = 'rose';
        interpretation = 'Nivel muy elevado de ansiedad con afectación somática grave (posible trastorno de pánico o crisis de angustia).';
      }

      return { score, maxScore: 63, severity, severityColor, interpretation };
    },
  },

  PSS10: {
    name: 'PSS-10 (Escala de Estrés Percibido de Cohen)',
    description: 'Medida clásica de 10 ítems para evaluar el grado en que las situaciones de la vida son valoradas como impredecibles, incontrolables o sobrecargadas.',
    instructions: 'En el último mes, ¿con qué frecuencia ha sentido o pensado lo siguiente?',
    category: 'STRESS',
    options: [
      { label: 'Nunca (0)', value: 0 },
      { label: 'Casi nunca (1)', value: 1 },
      { label: 'A veces (2)', value: 2 },
      { label: 'A menudo (3)', value: 3 },
      { label: 'Muy a menudo (4)', value: 4 },
    ],
    questions: [
      '1. ¿Con qué frecuencia ha estado afectado por algo que ocurrió inesperadamente?',
      '2. ¿Con qué frecuencia ha sentido que era incapaz de controlar las cosas importantes en su vida?',
      '3. ¿Con qué frecuencia se ha sentido nervioso/a o estresado/a?',
      '4. ¿Con qué frecuencia ha manejado con éxito los pequeños problemas cotidianos? (*Inverso)',
      '5. ¿Con qué frecuencia ha sentido que afrontaba efectivamente los cambios en su vida? (*Inverso)',
      '6. ¿Con qué frecuencia ha estado seguro/a sobre su capacidad para manejar problemas personales? (*Inverso)',
      '7. ¿Con qué frecuencia ha sentido que las cosas le iban bien? (*Inverso)',
      '8. ¿Con qué frecuencia ha sentido que no podía afrontar todas las cosas que tenía que hacer?',
      '9. ¿Con qué frecuencia ha podido controlar las dificultades de su vida? (*Inverso)',
      '10. ¿Con qué frecuencia ha sentido que tenía todo bajo control? (*Inverso)',
    ],
    calculateResult: (answers) => {
      let score = 0;
      const reverseItems = [3, 4, 5, 6, 8, 9]; // Índices 0-based de ítems inversos

      for (let i = 0; i < 10; i++) {
        const val = answers[i] || 0;
        if (reverseItems.includes(i)) {
          score += 4 - val; // 0->4, 1->3, 2->2, 3->1, 4->0
        } else {
          score += val;
        }
      }

      let severity = 'Estrés Bajo / Adaptativo';
      let severityColor: 'emerald' | 'amber' | 'orange' | 'rose' | 'indigo' = 'emerald';
      let interpretation = 'Capacidad adecuada de autorregulación y control percibido frente a las demandas ambientales.';

      if (score >= 14 && score <= 26) {
        severity = 'Estrés Moderado';
        severityColor = 'amber';
        interpretation = 'Nivel de estrés moderado. Se recomienda entrenamiento en habilidades de afrontamiento, asertividad y gestión del tiempo.';
      } else if (score >= 27) {
        severity = 'Estrés Alto / Sobrecarga Crónica';
        severityColor = 'rose';
        interpretation = 'Sobrecarga alostática severa con riesgo de somatización y desgaste psicofisiológico. Intervención prioritaria en reducción de estresores.';
      }

      return { score, maxScore: 40, severity, severityColor, interpretation };
    },
  },

  ROSENBERG: {
    name: 'Escala de Autoestima de Rosenberg (RSES)',
    description: 'Cuestionario psicométrico de 10 ítems para evaluar el nivel de autoestima global, autovalía y autoaceptación.',
    instructions: 'Indique su grado de acuerdo con cada una de las siguientes afirmaciones:',
    category: 'SELF_ESTEEM',
    options: [
      { label: 'Muy en desacuerdo (1)', value: 1 },
      { label: 'En desacuerdo (2)', value: 2 },
      { label: 'De acuerdo (3)', value: 3 },
      { label: 'Muy de acuerdo (4)', value: 4 },
    ],
    questions: [
      '1. Siento que soy una persona digna de aprecio, al menos en igual medida que los demás',
      '2. Siento que tengo cualidades positivas',
      '3. En general, me inclino a sentir que soy un/a fracasado/a (*Inverso)',
      '4. Soy capaz de hacer las cosas tan bien como la mayoría de la gente',
      '5. Siento que no tengo mucho de lo que enorgullecerme (*Inverso)',
      '6. Adopto una actitud positiva hacia mí mismo/a',
      '7. En general, me siento satisfecho/a conmigo mismo/a',
      '8. Desearía tener más respeto por mí mismo/a (*Inverso)',
      '9. A veces me siento ciertamente inútil (*Inverso)',
      '10. A veces pienso que no soy bueno/a para nada (*Inverso)',
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
      let interpretation = 'Autoestima disminuida con autocrítica y sentimiento de minusvalía elevados. Recomendado trabajo en autocompasión y autovalía.';

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

  SWLS: {
    name: 'SWLS (Escala de Satisfacción con la Vida - Diener)',
    description: 'Instrumento de 5 ítems que evalúa el componente cognitivo del bienestar subjetivo y la satisfacción vital global.',
    instructions: 'Indique su grado de acuerdo con las siguientes afirmaciones sobre su vida:',
    category: 'WELLBEING',
    options: [
      { label: 'Muy en desacuerdo (1)', value: 1 },
      { label: 'En desacuerdo (2)', value: 2 },
      { label: 'Ligeramente en desacuerdo (3)', value: 3 },
      { label: 'Neutral (4)', value: 4 },
      { label: 'Ligeramente de acuerdo (5)', value: 5 },
      { label: 'De acuerdo (6)', value: 6 },
      { label: 'Muy de acuerdo (7)', value: 7 },
    ],
    questions: [
      '1. En la mayoría de los aspectos, mi vida es como yo quiero que sea',
      '2. Las circunstancias de mi vida son excelentes',
      '3. Estoy completamente satisfecho/a con mi vida',
      '4. Hasta ahora, he conseguido las cosas que son importantes en mi vida',
      '5. Si pudiera vivir mi vida de nuevo, no cambiaría casi nada',
    ],
    calculateResult: (answers) => {
      let score = 0;
      for (let i = 0; i < 5; i++) {
        score += answers[i] || 1;
      }

      let severity = 'Insatisfacción Severa';
      let severityColor: 'emerald' | 'amber' | 'orange' | 'rose' | 'indigo' = 'rose';
      let interpretation = 'Sentimiento marcado de descontento vital. Explorar áreas de insatisfacción y metas personales.';

      if (score >= 10 && score <= 14) {
        severity = 'Insatisfecho/a con la Vida';
        severityColor = 'orange';
        interpretation = 'Nivel bajo de satisfacción. El paciente percibe brechas significativas entre sus expectativas y su realidad.';
      } else if (score >= 15 && score <= 19) {
        severity = 'Ligeramente por debajo del promedio';
        severityColor = 'amber';
        interpretation = 'Satisfacción levemente disminuida con áreas específicas susceptibles de mejora.';
      } else if (score >= 20 && score <= 24) {
        severity = 'Satisfacción Promedio';
        severityColor = 'indigo';
        interpretation = 'Nivel de satisfacción vital promedio y funcional.';
      } else if (score >= 25 && score <= 29) {
        severity = 'Satisfecho/a con la Vida';
        severityColor = 'emerald';
        interpretation = 'El paciente evalúa su vida positivamente en la mayoría de los dominios.';
      } else if (score >= 30) {
        severity = 'Altamente Satisfecho/a';
        severityColor = 'emerald';
        interpretation = 'Nivel óptimo de bienestar subjetivo y autorrealización personal.';
      }

      return { score, maxScore: 35, severity, severityColor, interpretation };
    },
  },

  BURNOUT_MBI: {
    name: 'MBI-HSS (Escala de Burnout y Desgaste Emocional)',
    description: 'Evaluación psicométrica de 9 reactivos focalizada en agotamiento emocional, sobrecarga laboral/académica y despersonalización.',
    instructions: '¿Con qué frecuencia experimenta cada una de las siguientes sensaciones con respecto a su trabajo o rutina?',
    category: 'BURNOUT',
    options: [
      { label: 'Nunca (0)', value: 0 },
      { label: 'Pocas veces al año (1)', value: 1 },
      { label: 'Una vez al mes (2)', value: 2 },
      { label: 'Pocas veces al mes (3)', value: 3 },
      { label: 'Una vez por semana (4)', value: 4 },
      { label: 'Pocas veces por semana (5)', value: 5 },
      { label: 'Diariamente (6)', value: 6 },
    ],
    questions: [
      '1. Me siento emocionalmente agotado/a por mi trabajo o responsabilidades diarias',
      '2. Me siento cansado/a al levantarme por la mañana y tener que enfrentar otra jornada',
      '3. Trabajar o interactuar todo el día con personas me produce tensión y fatiga mental',
      '4. Me siento frustrado/a o desmotivado/a por mis tareas cotidianas',
      '5. Siento que estoy trabajando demasiado y al límite de mis capacidades',
      '6. Me siento "quemado/a" o exhausto/a por mi rutina actual',
      '7. Siento que me he vuelto más insensible o distante con las personas a mi alrededor',
      '8. Me preocupa que este ritmo de vida me esté endureciendo emocionalmente',
      '9. Siento que me cuesta empatizar con las demandas y quejas de los demás',
    ],
    calculateResult: (answers) => {
      let score = 0;
      for (let i = 0; i < 9; i++) {
        score += answers[i] || 0;
      }

      let severity = 'Bajo / Sin Desgaste Relevante';
      let severityColor: 'emerald' | 'amber' | 'orange' | 'rose' | 'indigo' = 'emerald';
      let interpretation = 'Niveles saludables de energía y compromiso con sus actividades cotidianas.';

      if (score >= 19 && score <= 29) {
        severity = 'Riesgo Moderado de Burnout';
        severityColor = 'amber';
        interpretation = 'Presencia de fatiga acumulada y desmotivación. Recomendado establecimiento de límites laborales y espacios de desconexión.';
      } else if (score >= 30) {
        severity = 'Síndrome de Burnout Severo';
        severityColor = 'rose';
        interpretation = 'Agotamiento psicofísico severo y despersonalización. Requiere intervención inmediata en balance vida-trabajo y prevención de colapso.';
      }

      return { score, maxScore: 54, severity, severityColor, interpretation };
    },
  },

  SUICIDE_RISK: {
    name: 'Protocolo de Detección de Riesgo de Crisis y Conducta Suicida',
    description: 'Exploración clínica estructurada de factores de riesgo, ideación, intención, letalidad y factores protectores.',
    instructions: 'Marque la presencia e intensidad de cada factor observado durante la entrevista clínica:',
    category: 'CRISIS',
    options: [
      { label: 'Ausente (0)', value: 0 },
      { label: 'Leve / Dudoso (1)', value: 1 },
      { label: 'Presente / Significativo (2)', value: 2 },
      { label: 'Severo / Inminente (3)', value: 3 },
    ],
    questions: [
      '1. Ideación de muerte pasiva ("desearía dormirme y no despertar")',
      '2. Ideación activa ("he pensado en cómo quitarme la vida")',
      '3. Plan estructurado / Método disponible y accesible',
      '4. Antecedentes de intentos previos o conductas autolesivas repetitivas',
      '5. Sentimientos intensos de desesperanza, dolor insoportable o carga para los demás',
      '6. Ausencia o ruptura de red de apoyo familiar y social continente',
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
      let interpretation = 'Sin indicadores de riesgo inminente. Mantener alianza terapéutica y monitoreo regular.';

      if (score >= 4 && score <= 8) {
        severity = 'Riesgo Moderado';
        severityColor = 'amber';
        interpretation = 'Presencia de ideación. Establecer Contrato de No Agresión / Plan de Seguridad de Crisis, involucrar red de apoyo y programar citas frecuentes.';
      } else if (score >= 9 || planScore >= 2 || ideationActive >= 3) {
        severity = 'Riesgo Alto / Crítico';
        severityColor = 'rose';
        interpretation = '🚨 ALERTA CLÍNICA: Riesgo inminente. Activar protocolo de crisis, acompañamiento permanente 24/7 por familiares y derivación médica/urgencias.';
      }

      return {
        score,
        maxScore: 18,
        severity,
        severityColor,
        interpretation,
        hasCrisisAlert: score >= 9 || planScore >= 2 || ideationActive >= 2,
      };
    },
  },

  CUSTOM: {
    name: 'Evaluación Personalizada',
    description: 'Registro libre para escalas psicométricas complementarias.',
    instructions: '',
    category: 'OTHER',
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
              <h3 className="text-base font-bold">Batería de Tests Psicométricos Estandarizados</h3>
              <p className="text-xs text-slate-300">
                Paciente: <span className="text-indigo-300 font-semibold">{patientName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Escalas con Píldoras Estilizadas */}
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
            onClick={() => handleSelectScale('BAI')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedScale === 'BAI'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            BAI (Ansiedad Beck)
          </button>
          <button
            type="button"
            onClick={() => handleSelectScale('PSS10')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedScale === 'PSS10'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            PSS-10 (Estrés)
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
            onClick={() => handleSelectScale('SWLS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedScale === 'SWLS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            SWLS (Satisfacción Vital)
          </button>
          <button
            type="button"
            onClick={() => handleSelectScale('BURNOUT_MBI')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedScale === 'BURNOUT_MBI'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            MBI (Burnout)
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
            ⚠️ Protocolo de Crisis
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
                <div className="flex flex-wrap gap-2">
                  {currentScaleData.options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleAnswerChange(qIdx, opt.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer flex-1 min-w-[110px] ${
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
              placeholder="Ej: Paciente refiere mayor reactividad emocional tras evento estresante laboral reciente..."
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
