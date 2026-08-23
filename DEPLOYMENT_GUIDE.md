# Guía de Despliegue y Configuración en la Nube
## PsychoCare - Sistema SaaS para Consultorio de Psicología

Esta guía detalla los pasos exactos para configurar variables de entorno, aprovisionar la base de datos PostgreSQL y desplegar tanto el Backend (Node.js/Express) como el Frontend (React/Vite) en servicios cloud gratuitos o de producción (Supabase/Neon + Render/Railway + Vercel).

---

## 1. Arquitectura de Despliegue en la Nube

```
                 ┌────────────────────────────────┐
                 │       Frontend (Vercel)        │
                 │   React 18 + Vite + Tailwind   │
                 └───────────────┬────────────────┘
                                 │ HTTPS / REST API (JWT)
                                 ▼
                 ┌────────────────────────────────┐
                 │    Backend (Render / Railway)  │
                 │   Node.js + Express + Prisma   │
                 └───────────────┬────────────────┘
                                 │ TCP Pooler (Prisma ORM)
                                 ▼
                 ┌────────────────────────────────┐
                 │ Base de Datos PostgreSQL Cloud │
                 │   (Supabase / Neon / Railway)  │
                 └────────────────────────────────┘
```

---

## 2. Paso 1: Base de Datos PostgreSQL Cloud (Supabase o Neon)

### Opción A: Supabase (Recomendado)
1. Crea una cuenta gratuita en [supabase.com](https://supabase.com).
2. Crea un nuevo proyecto llamado `psychocare-db`.
3. Ve a **Project Settings -> Database -> Connection string**.
4. Copia la URI de conexión en modo **URI** (o modo Session Pooler para Prisma):
   ```bash
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```

### Opción B: Neon Serverless Postgres
1. Crea un proyecto en [neon.tech](https://neon.tech).
2. Copia la cadena `DATABASE_URL` provista en el panel.

---

## 3. Paso 2: Despliegue del Backend (Render / Railway)

### Opción A: Render (Web Service)
1. Crea una cuenta en [render.com](https://render.com) y conecta tu repositorio de GitHub.
2. Selecciona **New -> Web Service**.
3. Configuración:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start` (o `node dist/server.js`)
4. Configura las siguientes **Environment Variables**:

| Variable | Valor de Ejemplo | Descripción |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Entorno de producción |
| `PORT` | `4000` | Puerto HTTP del servicio |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Conexión a PostgreSQL |
| `JWT_SECRET` | `genera_un_hash_aleatorio_seguro_de_64_caracteres` | Clave para firmar tokens JWT |
| `JWT_EXPIRES_IN` | `7d` | Tiempo de expiración del token |
| `CORS_ORIGIN` | `https://tu-frontend.vercel.app` | URL pública de tu frontend en Vercel |

5. Ejecutar migraciones iniciales y seed:
   Desde el panel de Render, abre la pestaña **Shell** del servicio y ejecuta:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

---

## 4. Paso 3: Despliegue del Frontend (Vercel)

1. Crea una cuenta en [vercel.com](https://vercel.com) y conecta tu repositorio.
2. Selecciona **Import Project**.
3. Configuración:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Configura la **Environment Variable**:

| Variable | Valor de Ejemplo | Descripción |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://psychocare-api.onrender.com/api` | URL pública del backend en Render |

5. Haz clic en **Deploy**.

---

## 5. Configuración de Archivos `.env` para Desarrollo Local

### `backend/.env`
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/psychoclinic_db?schema=public"
JWT_SECRET="super-secret-jwt-key-for-psychoclinic-change-in-production"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
```

### `frontend/.env`
```env
VITE_API_URL="http://localhost:4000/api"
```

---

## 6. Comandos de Inicialización Local

### Backend:
```bash
cd backend
npm install
npx prisma generate
# Para crear las tablas en tu PostgreSQL local:
npx prisma migrate dev --name init
# Para sembrar datos de prueba (Terapeuta Dr. Carlos Mendoza y 3 pacientes):
npx tsx prisma/seed.ts
# Iniciar servidor en modo desarrollo:
npm run dev
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

Abre tu navegador en `http://localhost:5173`.
Credenciales de prueba generadas por el seed:
- **Email**: `dr.carlos@psychocare.com`
- **Contraseña**: `password123`
