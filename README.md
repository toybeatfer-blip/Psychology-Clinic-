# 🧠 PsychoCare - Software SaaS para Consultorios de Psicología

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748.svg)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

> Aplicación web Full-Stack moderna para la gestión integral de consultorios psicológicos y clínicas de salud mental. Diseñada bajo principios de **aislamiento de datos multi-tenant por terapeuta**, confidencialidad médica y estándares estructurados de notas de evolución (DSM-5 / CIE-11).

---

## 🌟 Características Principales

### 1. 🔐 Autenticación & Aislamiento de Datos
- Registro y Login seguro con contraseñas cifradas con `bcrypt` y tokens `JWT`.
- **Aislamiento estricto**: Cada psicólogo solo accede y gestiona sus propios pacientes, notas clínicas, citas y configuración.

### 2. 👥 Gestión Integral de Pacientes
- Ficha clínica completa: Datos sociodemográficos, contactos de emergencia, motivo inicial de consulta, antecedentes médicos/psiquiátricos y medicación actual.
- Buscador reactivo en tiempo real con debounce y filtros por estado (Activos / Inactivos).

### 3. 📅 Agenda & Calendario Interactivo
- Vistas de calendario **Mensual**, **Semanal** y **Diaria**.
- Control de estados: `Programada`, `Confirmada`, `Completada`, `Cancelada` y `No asistió`.
- Modalidades: **Presencial (Consultorio)** y **Virtual / Online** (con integración de enlaces a Zoom / Google Meet).

### 4. 📋 Expediente Clínico y Notas de Evolución
- Línea temporal cronológica de sesiones psicoterapéuticas.
- Estructura clínica profesional:
  1. *Motivo específico de la sesión*
  2. *Observaciones conductuales y afecto*
  3. *Hipótesis diagnóstica / Diagnóstico (DSM-5 / CIE-11)*
  4. *Intervenciones y técnicas aplicadas*
  5. *Plan terapéutico y tareas inter-sesión*
  6. *Flag de estricta confidencialidad médica*
- **Autoguardado de borradores**: Guarda el texto en tiempo real para no perder avances en consultas activas.
- Gestor de archivos adjuntos (consentimientos informados firmados y tests psicométricos en PDF).

### 5. 🎨 Personalización Completa de Marca & Interfaz
- Carga de logotipo institucional desde tu equipo (PNG, JPG, SVG).
- Selector de estilo de menú lateral (**Oscuro Elegante**, **Color de Marca**, **Blanco Minimalista**).
- 8 Presets de color clínico + selector hexadecimal personalizado con previsualización en vivo.
- Datos fiscales, pie de página legal para recetas y políticas de cancelación.

### 6. 💾 Base de Datos Propia & Centro de Respaldos
- Base de datos local lista para usar con cero dependencias externas (`dev.db`).
- Exportación e importación de copias de seguridad completas en formato `.json` con 1 clic.
- Compatible con PostgreSQL en la nube (Supabase, Neon, Railway).

---

## 🏗️ Arquitectura Técnica

```
psychocare/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma               # Esquema de base de datos (SQLite / PostgreSQL)
│   │   ├── schema.postgresql.prisma    # Esquema para despliegue en la nube
│   │   └── seed.ts                     # Datos de prueba (Dr. Carlos Mendoza y pacientes)
│   ├── src/
│   │   ├── config/                     # Variables de entorno y cliente Prisma
│   │   ├── middlewares/                # Auth JWT, Validaciones Zod, Error Handler
│   │   ├── modules/
│   │   │   ├── auth/                   # Registro, Login, Me
│   │   │   ├── profile/                # Perfil profesional y respaldos
│   │   │   ├── clinic-settings/        # Personalización de marca, logo y colores
│   │   │   ├── patients/               # CRUD y buscador de pacientes
│   │   │   ├── appointments/           # Agenda y citas
│   │   │   ├── clinical-notes/         # Notas de evolución clínica
│   │   │   ├── attachments/            # Documentos y tests adjuntos
│   │   │   └── dashboard/              # Métricas en tiempo real
│   │   ├── app.ts                      # Configuración de Express y CORS
│   │   └── server.ts                   # Entry point del servidor
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                     # Botones, Modales, Badges, Tabs, Inputs
│   │   │   ├── layout/                 # Sidebar, Header, DashboardLayout
│   │   │   ├── dashboard/              # Tarjetas de métricas y citas
│   │   │   ├── patients/               # Fichas y modales de pacientes
│   │   │   ├── appointments/           # Calendario interactivo y citas
│   │   │   └── clinical-records/       # Notas de sesión y adjuntos
│   │   ├── context/                    # AuthContext y ClinicContext
│   │   ├── pages/                      # Dashboard, Pacientes, Calendario, Expediente, Perfil, Configuración
│   │   ├── App.tsx                     # Enrutador
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── .github/workflows/ci.yml            # Integración Continua (CI)
├── DEPLOYMENT_GUIDE.md                 # Guía paso a paso para Vercel, Render y Supabase
└── README.md
```

---

## ⚡ Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/psychocare.git
cd psychocare
```

### 2. Iniciar el Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```
> El servidor API iniciará en `http://localhost:4000`.

### 3. Iniciar el Frontend (en otra terminal)
```bash
cd frontend
npm install
npm run dev
```
> La aplicación web estará lista en `http://localhost:5173`.

---

## 🔑 Credenciales de Prueba (Demo)
- **Correo**: `dr.carlos@psychocare.com`
- **Contraseña**: `password123`
*(O pulsa el botón **"Acceder con Cuenta de Demostración"** en la pantalla de inicio).*

---

## 🚀 Despliegue en la Nube
Consulta la [Guía de Despliegue en la Nube (DEPLOYMENT_GUIDE.md)](./DEPLOYMENT_GUIDE.md) para publicar en:
- **Frontend**: Vercel
- **Backend**: Render / Railway
- **Base de Datos**: Supabase / Neon (PostgreSQL)

---

## 📄 Licencia
Distribuido bajo la Licencia MIT.
