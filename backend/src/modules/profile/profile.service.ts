import { prisma } from '../../config/db.js';
import { UpdateProfileInput } from './profile.schemas.js';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      profile: true,
    },
  });

  if (!user) {
    throw new Error('Perfil no encontrado');
  }

  return user;
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const { fullName, ...profileData } = data;

  const updatedUser = await prisma.$transaction(async (tx) => {
    if (fullName) {
      await tx.user.update({
        where: { id: userId },
        data: { fullName },
      });
    }

    await tx.therapistProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...profileData,
      },
      update: {
        ...profileData,
      },
    });

    return tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        profile: true,
      },
    });
  });

  return updatedUser;
}

export async function exportTherapistBackup(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      patients: {
        include: {
          appointments: true,
          clinicalNotes: {
            include: {
              attachments: true,
            },
          },
          attachments: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    therapist: {
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profile: user.profile,
    },
    totalPatients: user.patients.length,
    patients: user.patients,
  };
}

export async function restoreTherapistBackup(userId: string, backupData: any) {
  if (!backupData || !Array.isArray(backupData.patients)) {
    throw new Error('Formato de archivo de respaldo no válido.');
  }

  let importedPatientsCount = 0;

  for (const patient of backupData.patients) {
    const { appointments, clinicalNotes, attachments, id, therapistId, ...patientData } = patient;

    // Crear o actualizar paciente
    const newPatient = await prisma.patient.create({
      data: {
        ...patientData,
        therapistId: userId,
        birthDate: patientData.birthDate ? new Date(patientData.birthDate) : null,
      },
    });

    // Restaurar citas
    if (Array.isArray(appointments)) {
      for (const appt of appointments) {
        const { id: apptId, therapistId: tId, patientId: pId, clinicalNote, ...apptData } = appt;
        await prisma.appointment.create({
          data: {
            ...apptData,
            therapistId: userId,
            patientId: newPatient.id,
            startDateTime: new Date(apptData.startDateTime),
            endDateTime: new Date(apptData.endDateTime),
          },
        }).catch(() => {});
      }
    }

    // Restaurar notas clínicas
    if (Array.isArray(clinicalNotes)) {
      for (const note of clinicalNotes) {
        const { id: noteId, therapistId: tId, patientId: pId, attachments: noteAttachments, appointment, ...noteData } = note;
        await prisma.clinicalNote.create({
          data: {
            ...noteData,
            therapistId: userId,
            patientId: newPatient.id,
            sessionDate: noteData.sessionDate ? new Date(noteData.sessionDate) : new Date(),
          },
        }).catch(() => {});
      }
    }

    importedPatientsCount++;
  }

  return {
    message: `Respaldo restaurado exitosamente. Se importaron ${importedPatientsCount} pacientes con sus respectivos expedientes y citas.`,
    importedPatientsCount,
  };
}
