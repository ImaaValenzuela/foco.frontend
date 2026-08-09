# 🏗️ Arquitectura Técnica

## 1. Visión General de la Arquitectura

El proyecto sigue una **arquitectura desacoplada en repositorios independientes**, cada uno con su propio ciclo de vida, dominio de deployment y responsabilidad técnica.

```text
foco/
├── foco.landing/        # Sitio comercial estático (foco.com)
├── foco.frontend/       # Aplicación web interactiva (app.foco.com)
├── foco.admin/          # Panel administrativo (admin.foco.com)
├── foco.backend/        # API RESTful + IA + Pasarela de Pago
└── foco.app/            # App móvil de captura rápida Brain Dump (Expo / React Native)
```

---

## 2. Repositorios y Responsabilidades

### 2.1 `foco.landing` — Sitio Comercial
- **URL objetivo:** `foco.com`
- **Propósito:** Conversión y SEO. Landing page estática enfocada en captar usuarios nuevos.
- **Stack:** HTML5 Semántico + Vanilla JS / Web Components + CSS3 / Vite.
- **Contenido:** Hero, Features, Precios, FAQ, CTA de registro.
- **KPIs:** Tasa de conversión a registro, bounce rate, posicionamiento SEO.

### 2.2 `foco.frontend` — Aplicación Web
- **URL objetivo:** `app.foco.com`
- **Propósito:** La experiencia principal del usuario. Canvas interactivo, gestión de bloques, barra lateral de Inbox y habits.
- **Stack:** **React / Next.js** (App Router recomendado).
- **Características clave:**
  - Lógica de estado compleja para el Canvas (posicionamiento de bloques, drag & drop)
  - Barra lateral de Inbox con notas recibidas en tiempo real desde `foco.app` y web.
  - Componentes de tiempo (Pomodoro, Habit Tracker)
  - Routing entre vistas (Panel General → Áreas → Proyectos)
  - Integración con el backend vía API REST y Supabase Realtime
- **Librerías sugeridas:**
  - `@atlaskit/pragmatic-drag-and-drop` (Pragmatic Drag and Drop de Atlassian)
  - `zustand` o `jotai` — Gestión de estado ligera
  - `framer-motion` — Animaciones del canvas y transiciones
  - `react-query` o `SWR` — Fetching y caché de datos del servidor

### 2.3 `foco.admin` — Panel Administrativo
- **URL objetivo:** `admin.foco.com`
- **Propósito:** Panel de control centralizado para los administradores, enfocado en auditoría de usuarios y KPIs del negocio.
- **Stack:** React / Vite para una SPA administrativa rápida.
- **Características clave:**
  - Consume endpoints `/api/admin/*` protegidos por rol de administrador.
  - Gráficos de analíticas (DAU/MAU, bloques creados, etc.).
  - Búsqueda y gestión de usuarios (bajas, auditoría).

### 2.4 `foco.backend` — API RESTful
- **Propósito:** Validaciones de negocio, seguridad, encriptación, orquestación con IA y pasarela de pago.
- **Stack:** **Node.js con NestJS** o Express + **Supabase PostgreSQL**.
- **Responsabilidades:**
  - Autenticación (JWT + refresh tokens)
  - CRUD de entidades (Users, Areas, Projects, Blocks, Habits)
  - Lógica del Canvas (relaciones entre bloques, estado `inbox`)
  - Integración con AI (perfil de usuario → recomendaciones)
  - Integración con pasarela de pago (Stripe o sandbox local)
  - Panel Admin (métricas, auditoría de usuarios)

### 2.5 `foco.app` — Aplicación Móvil (Captura Rápida)
- **Propósito:** Captura instantánea e ininterrumpida de notas y enlaces sobre la marcha (estilo Google Keep).
- **Stack:** **React Native + Expo (SDK 54)**.
- **Características clave:**
  - Cero fricción (Brain Dump): guardar notas sin elegir carpeta ni proyecto.
  - Sincronización transparente con Supabase (`inbox: true`, `project_id: null`).
  - Soporte *offline-first* para guardar sin internet y sincronizar al reconectar.

---

## 3. Stack Tecnológico Consolidado

| Capa | Tecnología | Justificación |
|---|---|---|
| **Frontend Web** | React + Next.js | Ecosistema maduro, App Router para la app web `app.foco.com` |
| **App Móvil** | React Native + Expo | Multiplataforma (iOS/Android), captura ágil y experiencia fluida |
| **Backend** | Node.js + NestJS | Modular, TypeScript nativo, ideal para APIs REST escalables |
| **Base de Datos** | PostgreSQL vía **Supabase** | Compatibilidad nativa PostgreSQL, Auth integrado, Realtime nativo |
| **ORM** | Prisma | Type-safe, migraciones automáticas, excelente DX con TypeScript |
| **Autenticación** | JWT / Supabase Auth | Flexible, seguro, compatible con el modelo de roles |
| **Pasarela de Pago** | Stripe (modo sandbox) | Estándar de la industria, fácil de integrar |
| **IA / Chatbot** | OpenAI API (GPT-4o-mini) o Google Gemini API | Bajo costo por token, personalización según perfil |
| **Hosting** | Vercel (frontend + landing) + Railway/Render (backend) | Capa gratuita suficiente para MVP, CI/CD automático |
| **Control de Versiones** | Git + GitHub | Equipos e independencia por repositorio |

---

## 4. Diagrama de Arquitectura General

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CLIENTES (Browser & Mobile)                                │
│                                                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌────────────────────┐  │
│  │   foco.landing   │    │  foco.frontend   │    │    foco.admin    │    │      foco.app      │  │
│  │   (foco.com)     │    │  (app.foco.com)  │    │ (admin.foco.com) │    │  (iOS / Android)   │  │
│  │   Vite / HTML    │    │  React + Next.js │    │   React / Vite   │    │ React Native/Expo  │  │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘    └─────────┬──────────┘  │
└───────────┼───────────────────────┼───────────────────────┼─────────────────────────┼────────────┘
            │                       │                       │                         │
            │ (Redirect registro)   │ (REST API & Realtime) │ (REST API Admin)        │ (Realtime DB)
            │                       ▼                       ▼                         │
┌───────────┼─────────────────────────────────────────────────────────────────────────┼────────────┐
│           │                     BACKEND & PERSISTENCIA                              │            │
│           │                     Node.js + NestJS API & Supabase                     │            │
│           │                                                                         │            │
│           │   ┌──────────┐       ┌──────────┐       ┌──────────┐                    │            │
│           └──►│  Auth    │       │  Core    │       │  Admin   │◄───────────────────┘            │
│               │  Module  │       │  API     │       │ Dashboard│                                 │
│               └──────────┘       └────┬─────┘       └──────────┘                                 │
│                                       │                                                          │
│           ┌───────────────────────────┼───────────────────────────┐                              │
│           │                           │                           │                              │
│    ┌──────▼──────┐             ┌──────▼────────┐           ┌──────▼───┐                          │
│    │  Supabase   │             │ OpenAI/Gemini │           │  Stripe  │                          │
│    │  PostgreSQL │             │ API (Chatbot) │           │ (Pagos)  │                          │
│    └─────────────┘             └───────────────┘           └──────────┘                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Flujo de Autenticación

```text
Usuario → Registro → Formulario Onboarding (Rutina/Intereses/Motivaciones)
       → Datos persisten en DB → JWT emitido
       → Redirigido a app.foco.com/dashboard

Usuario → Login → Validación → JWT refresh → App
```

---

## 6. Límites del MVP (Out of Scope)

Estas funcionalidades están **explícitamente fuera del alcance** del MVP v1.0:

- ❌ Sincronización multiusuario en tiempo real simultánea (estilo Figma cooperativo)
- ❌ Exportación avanzada a PDF/Markdown del canvas
- ❌ Colaboración entre cuentas (tableros compartidos multi-tenant)

*(Nota: La captura móvil nativa está cubierta por `foco.app`)*

---

## 7. Consideraciones de Seguridad

- Todas las contraseñas hasheadas con **bcrypt** (salt rounds ≥ 12)
- Tokens JWT con **expiración corta** (15 min access / 7 días refresh)
- Variables de entorno gestionadas vía `.env` con validación en arranque (NestJS `@nestjs/config`)
- CORS restringido a los dominios `foco.com`, `app.foco.com` y la app móvil `foco.app`
- Rate limiting en endpoints de autenticación (`@nestjs/throttler`)
- Validación de inputs con `class-validator` en todos los DTOs
