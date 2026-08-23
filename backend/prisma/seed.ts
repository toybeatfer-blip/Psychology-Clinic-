import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la siembra de datos de prueba...');

  // Limpiar base de datos
  await prisma.attachment.deleteMany();
  await prisma.clinicalNote.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.therapistProfile.deleteMany();
  await prisma.user.deleteMany();

  // 1. Crear Terapeuta de Ejemplo
  const passwordHash = await bcrypt.hash('password123', 10);

  const therapist = await prisma.user.create({
    data: {
      email: 'dr.carlos@psychocare.com',
      passwordHash,
      fullName: 'Dr. Carlos Mendoza',
      role: 'THERAPIST',
      profile: {
        create: {
          professionalId: 'PSI-849201',
          specialty: 'Psicología Clínica y Terapia Cognitivo-Conductual (TCC)',
          phone: '+52 55 1234 5678',
          clinicAddress: 'Av. Insurgentes Sur 1450, Consultorio 402, CDMX',
          bio: 'Especialista en trastornos del estado de ánimo, ansiedad, manejo del estrés y terapia individual de adultos con más de 10 años de experiencia clínica.',
          hourlyRate: 60.0,
          currency: 'USD',
          avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
        },
      },
    },
  });

  console.log(`✅ Terapeuta creado: ${therapist.fullName} (${therapist.email})`);

  // 2. Crear Pacientes
  const patient1 = await prisma.patient.create({
    data: {
      therapistId: therapist.id,
      fullName: 'Valeria Gómez Sánchez',
      email: 'valeria.gomez@gmail.com',
      phone: '+52 55 9876 5432',
      birthDate: new Date('1994-05-14'),
      gender: 'Femenino',
      occupation: 'Diseñadora Gráfica UI/UX',
      maritalStatus: 'Soltera',
      address: 'Colonia Condesa, Calle Amsterdam 88, CDMX',
      emergencyName: 'María Sánchez (Madre)',
      emergencyPhone: '+52 55 8765 4321',
      emergencyRelation: 'Madre',
      initialReason: 'Episodios recurrentes de ansiedad generalizada, taquicardias nocturnas y sobrecarga laboral (burnout).',
      clinicalBackground: 'Sin antecedentes psiquiátricos previos. Gastritis nerviosa diagnosticada en 2022.',
      currentMedication: 'Ninguna',
      isActive: true,
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      therapistId: therapist.id,
      fullName: 'Alejandro Ramos Silva',
      email: 'alejandro.ramos@outlook.com',
      phone: '+52 55 4567 8901',
      birthDate: new Date('1988-11-23'),
      gender: 'Masculino',
      occupation: 'Ingeniero de Software',
      maritalStatus: 'Casado',
      address: 'Colonia Roma Norte, Guanajuato 120, CDMX',
      emergencyName: 'Lucía Ortiz (Esposa)',
      emergencyPhone: '+52 55 2345 6789',
      emergencyRelation: 'Cónyuge',
      initialReason: 'Dificultades en regulación emocional, irritabilidad en el entorno familiar y pérdida de motivación profesional.',
      clinicalBackground: 'Episodio depresivo leve en 2019 tratado con psicoterapia breve.',
      currentMedication: 'Escitalopram 10mg / día (indicado por psiquiatra externo)',
      isActive: true,
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      therapistId: therapist.id,
      fullName: 'Camila Herrera Torres',
      email: 'camila.herrera@yahoo.com',
      phone: '+52 55 3456 7890',
      birthDate: new Date('2001-08-30'),
      gender: 'Femenino',
      occupation: 'Estudiante Universitaria de Medicina',
      maritalStatus: 'Soltera',
      address: 'Colonia Del Valle, Calle San Borja 410, CDMX',
      emergencyName: 'Roberto Herrera (Padre)',
      emergencyPhone: '+52 55 6789 0123',
      emergencyRelation: 'Padre',
      initialReason: 'Fobia social y bloqueo en presentaciones orales universitarias. Dificultad para establecer límites interpersonales.',
      clinicalBackground: 'Alergias estacionales.',
      currentMedication: 'Ninguna',
      isActive: true,
    },
  });

  console.log(`✅ 3 Pacientes creados para el terapeuta.`);

  // 3. Crear Citas
  const today = new Date();
  const pastDate1 = new Date(today);
  pastDate1.setDate(pastDate1.getDate() - 7);
  pastDate1.setHours(10, 0, 0, 0);

  const pastDate2 = new Date(today);
  pastDate2.setDate(pastDate2.getDate() - 3);
  pastDate2.setHours(16, 0, 0, 0);

  const todayAppointmentDate = new Date(today);
  todayAppointmentDate.setHours(11, 0, 0, 0);
  const todayEnd = new Date(todayAppointmentDate);
  todayEnd.setHours(12, 0, 0, 0);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 5);
  nextWeek.setHours(17, 0, 0, 0);

  const appt1 = await prisma.appointment.create({
    data: {
      therapistId: therapist.id,
      patientId: patient1.id,
      startDateTime: pastDate1,
      endDateTime: new Date(pastDate1.getTime() + 60 * 60 * 1000),
      modality: 'IN_PERSON',
      status: 'COMPLETED',
      locationNotes: 'Consultorio 402',
      notes: 'Primera sesión de encuadre y evaluación inicial.',
      price: 60.0,
      isPaid: true,
    },
  });

  const appt2 = await prisma.appointment.create({
    data: {
      therapistId: therapist.id,
      patientId: patient2.id,
      startDateTime: pastDate2,
      endDateTime: new Date(pastDate2.getTime() + 60 * 60 * 1000),
      modality: 'ONLINE',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      status: 'COMPLETED',
      notes: 'Evaluación de sintomatología afectiva y registro de pensamientos automáticos.',
      price: 60.0,
      isPaid: true,
    },
  });

  await prisma.appointment.create({
    data: {
      therapistId: therapist.id,
      patientId: patient1.id,
      startDateTime: todayAppointmentDate,
      endDateTime: todayEnd,
      modality: 'IN_PERSON',
      status: 'CONFIRMED',
      locationNotes: 'Consultorio 402',
      notes: 'Sesión de reestructuración cognitiva para distorsiones catastróficas.',
      price: 60.0,
      isPaid: false,
    },
  });

  await prisma.appointment.create({
    data: {
      therapistId: therapist.id,
      patientId: patient3.id,
      startDateTime: nextWeek,
      endDateTime: new Date(nextWeek.getTime() + 60 * 60 * 1000),
      modality: 'ONLINE',
      meetingUrl: 'https://zoom.us/j/1234567890',
      status: 'SCHEDULED',
      notes: 'Entrenamiento en desensibilización sistemática y role-playing.',
      price: 60.0,
      isPaid: false,
    },
  });

  console.log(`✅ Citas agendadas creadas.`);

  // 4. Crear Notas Clínicas Estructuradas (Expediente)
  await prisma.clinicalNote.create({
    data: {
      therapistId: therapist.id,
      patientId: patient1.id,
      appointmentId: appt1.id,
      sessionNumber: 1,
      sessionDate: pastDate1,
      reasonForSession: 'Evaluación diagnóstica inicial, motivo de consulta y establecimiento del encuadre terapéutico.',
      behavioralObservations: 'Paciente orientada en tiempo, espacio y persona. Contacto visual adecuado, discurso fluido aunque acelerado al hablar de su empleo. Manifiesta tensión muscular perceptible en hombros.',
      diagnosisHypothesis: 'Trastorno de Ansiedad Generalizada (CIE-11: 6B00 / DSM-5: 300.02) con rasgos de perfeccionismo desadaptativo.',
      interventionsApplied: 'Psicoeducación sobre el ciclo de la ansiedad y el sistema nervioso simpático. Establecimiento de objetivos SMART terapéuticos. Explicación del modelo A-B-C de Ellis.',
      treatmentPlanAndTasks: '1. Registro diario de niveles de ansiedad (escala 1-10) ante detonantes laborales.\n2. Práctica de respiración diafragmática 5 minutos, dos veces al día.',
      isConfidential: true,
    },
  });

  await prisma.clinicalNote.create({
    data: {
      therapistId: therapist.id,
      patientId: patient2.id,
      appointmentId: appt2.id,
      sessionNumber: 1,
      sessionDate: pastDate2,
      reasonForSession: 'Identificación de detonantes de frustración y patrones de comunicación en pareja.',
      behavioralObservations: 'Afecto aplanado al inicio, reactivo ante mención de conflictos conyugales. Discurso coherente y buena capacidad de insight.',
      diagnosisHypothesis: 'Episodio depresivo leve en remisión parcial con dificultades en asertividad emocional.',
      interventionsApplied: 'Técnica de la flecha descendente para creencias nucleares de exigencia. Modelado de comunicación no violenta (CNV).',
      treatmentPlanAndTasks: '1. Autorregistro de pensamientos automáticos de frustración.\n2. Aplicar técnica de tiempo fuera (Time-out) antes de responder en discusiones.',
      isConfidential: true,
    },
  });

  // 5. Crear Archivos Adjuntos (PDF / Tests / Consentimiento)
  await prisma.attachment.create({
    data: {
      therapistId: therapist.id,
      patientId: patient1.id,
      fileName: 'Consentimiento_Informado_Valeria_Gomez.pdf',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileSize: 145200,
      mimeType: 'application/pdf',
      type: 'CONSENT_FORM',
      description: 'Consentimiento informado firmado digitalmente para tratamiento psicoterapéutico individual.',
    },
  });

  await prisma.attachment.create({
    data: {
      therapistId: therapist.id,
      patientId: patient1.id,
      fileName: 'Inventario_Ansiedad_Beck_BAI_Resultados.pdf',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileSize: 256800,
      mimeType: 'application/pdf',
      type: 'PSYCHOMETRIC_TEST',
      description: 'Puntaje BAI: 28 puntos (Ansiedad moderada-severa).',
    },
  });

  console.log('🎉 Siembra de datos completada con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
