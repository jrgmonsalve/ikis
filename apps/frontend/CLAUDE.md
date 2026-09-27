# CLAUDE.md — apps/frontend

Contexto específico del frontend. Ver el `CLAUDE.md` raíz para las reglas globales del proyecto (idioma, TDD, comandos).

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | React + Vite |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Componentes UI | shadcn/ui (primitivas Radix, código copiado al repo — no una dependencia de npm que hay que pelear para personalizar) |
| Routing | React Router |
| Server state / data fetching | TanStack Query |
| Formularios | react-hook-form + zod |
| i18n | i18next / react-i18next |
| PWA (manifest, service worker) | vite-plugin-pwa |
| Pruebas | Vitest + React Testing Library |
| Deploy | Cloudflare Pages, subdominio `ikis.renegarcia.work` |

**Por qué shadcn/ui y no Material UI:** los componentes de shadcn/ui se copian al repo como código propio en vez de instalarse como dependencia — da la velocidad de tener inputs/diálogos/tablas ya resueltos y accesibles, sin heredar el look de "panel de admin" de Material Design ni pelear un sistema de temas ajeno para personalizar. Es más liviano (importa para una PWA instalable) y sus formularios están pensados nativamente para trabajar con `react-hook-form` + `zod`.

**Estado y complejidad:** nada de Redux/Zustand por ahora — TanStack Query cubre el server state (categorías, familia, transacciones) y `useState`/Context de React alcanza para el estado de UI local. No sobre-diseñar esto hasta que el tamaño real de la app lo pida.

**PWA = instalable, no offline-first:** el alcance de "PWA" acá es manifest + ícono + carga de app shell cacheada para que se pueda instalar: no incluye sincronización de datos offline. Eso queda fuera del MVP.

## Estructura de `src/`

```
apps/frontend/src/
├─ routes/            # pantallas (login, onboarding, dashboard, categorías, ...)
├─ features/          # un folder por dominio, espejando los módulos del backend
│  └─ <feature>/      # ej. auth/, family/, categories/, transactions/
│     ├─ api.ts        # llamadas al backend (fetch + hooks de TanStack Query)
│     ├─ components/
│     └─ hooks.ts
├─ components/ui/     # componentes shadcn/ui
├─ lib/               # cliente API, storage del JWT, utils
└─ i18n/              # traducciones
```

Flujo detallado de cada pantalla → [`SCREENS.md`](SCREENS.md).

## Autenticación en el frontend

1. Botón de Google Sign-In (Google Identity Services JS) → devuelve un ID token de Google.
2. `POST /api/v1/auth/google` con ese ID token → el backend responde con el JWT propio.
3. El JWT se guarda en `localStorage` (suficiente para el MVP; el backend ya espera `Authorization: Bearer <token>`, no cookies) y se manda en cada request a la API.
4. `GET /api/v1/me` devuelve el usuario autenticado con su `familyId`; el frontend lo usa (guard de ruteo) para decidir entre onboarding (crear familia) o dashboard después del login.
