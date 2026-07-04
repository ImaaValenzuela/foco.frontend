# 🎨 Mente — Frontend Web Application (`mente-frontend`)

Este repositorio contiene la aplicación interactiva de **Mente**, accesible en [app.mente.com](https://app.mente.com). Aquí reside toda la interfaz visual, el lienzo infinito (canvas), la barra lateral de Inbox y los módulos de productividad personal.

---

## 🎯 Propósito del Repositorio

- **Experiencia de Usuario (UX):** Proveer una interfaz premium, responsiva y ágil basada en arrastrar y soltar (Drag & Drop).
- **Interactividad:** Canvas interactivo donde los usuarios conectan ideas de forma visual con flechas y bloques dinámicos.
- **Gestión del Tiempo:** Integrar el Habit Tracker, el Pomodoro y la visualización de tareas recurrentes.

---

## 🛠️ Stack Tecnológico Recomendado (Propuesta)

- **Framework:** React con **Next.js** (App Router).
- **Gestión de Estado:** `zustand` o `jotai` (lógica de estado ágil y ligera para posiciones de bloques).
- **Drag & Drop:** `@atlaskit/pragmatic-drag-and-drop` (Pragmatic Drag and Drop de Atlassian, el motor moderno detrás de Trello y Jira).
- **Animaciones:** `framer-motion` (transiciones suaves, arrastre visual).
- **Estilos:** Vanilla CSS / TailwindCSS.
- **Fetching de Datos:** `tanstack-query` (React Query) para sincronización optimizada con la API del backend.

---

## 📂 Estructura del Proyecto

```
mente-frontend/
├── src/
│   ├── app/             # Rutas y páginas (Next.js App Router)
│   ├── components/      # Componentes UI (Canvas, Blocks, Pomodoro, Habits)
│   ├── hooks/           # Custom hooks para lógica de negocio y queries
│   ├── store/           # Stores de Zustand (estado global del canvas y UI)
│   ├── styles/          # Estilos globales y tokens del sistema de diseño
│   └── utils/           # Utilidades y funciones de soporte
├── public/              # Recursos gráficos y fuentes locales
├── docs/                # Enlace a documentación del sub-proyecto
└── README.md            # Este archivo
```

---

## ⚙️ Variables de Entorno (.env.local)

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api  # Dirección de mente.backend
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Llave pública Stripe Sandbox
```

---

## 🚀 Inicio Rápido (Local)

1. **Instalar dependencias:**

   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**

   ```bash
   cp .env.example .env.local
   # Configura las variables internas en .env.local
   ```

3. **Correr en modo desarrollo:**

   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:3000` (o `3001` si la landing está corriendo).

4. **Correr suite de pruebas:**
   ```bash
   npm run test
   ```

---

## 📑 Documentación Relacionada

Para entender el diseño de componentes, modelo de datos en el cliente y alcance funcional:

- [Funcionalidades del MVP (Canvas, Inbox, Widgets)](./docs/03-funcionalidades-mvp.md)
- [Arquitectura Técnica Consolidada](./docs/02-arquitectura-tecnica.md)
- [Estrategia Git y Configuración de GitHub](./docs/07-devops-y-git.md)
