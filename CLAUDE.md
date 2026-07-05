# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Meta del proyecto

**ikis** es una aplicación de **gestión financiera para familias**.

- **Formato:** PWA multi-idioma.
- **Público:** familias que quieren llevar el control de sus gastos.
- **Estrategia de entrega:** micro-entregas incrementales. No se construye todo de una vez; cada entrega deja algo funcional y desplegado.
- **Estado actual:** liberar primero el **API del backend**. El frontend se define más adelante.

### Dominio
Se registran los **gastos** de una familia, clasificados mediante **categorías jerárquicas** (categoría → subcategoría). Ejemplos:
- `food` → `fast food`, `grocery`
- `transport` → `taxi`, `bus`
- `servicios públicos` → `agua`, `luz`, `internet`
- `salud`

## Reglas del proyecto

### Idioma y estilo
- **Todo el código, nombres e identificadores en inglés.** Los distintos idiomas de la app (i18n) se agregan en el frontend cuando se construya; el backend permanece 100% en inglés.
- **Evitar comentarios.** El código debe ser autodescriptivo (nombres claros, funciones pequeñas). Un comentario suele indicar que el código necesita refactor.
- **TypeScript** en todo el proyecto.

### Desarrollo
- **TDD preferiblemente:** escribir la prueba antes que la implementación.
- **Se debe poder levantar el ambiente en local** (SQLite local vía Wrangler/Miniflare) para desarrollar **sin depender de Cloudflare ni de su base de datos remota**.
- **Arquitectura hexagonal lo más sencilla posible** (ver sección Arquitectura). No sobre-diseñar.

### Git / CI/CD
- Repo **monorepo**: frontend y backend en el mismo repositorio.
- **GitHub** para repositorio y CI/CD (GitHub Actions).
- **Cloudflare** para todo el despliegue:
  - **Workers** → backend API.
  - **Pages** → frontend.
  - **D1** (SQLite) → base de datos.
  - Subdominio: **`ikis.renegarcia.work`**.

## Stack

| Capa | Tecnología |
|------|------------|
| Lenguaje | TypeScript |
| Backend framework | Hono.js sobre Cloudflare Workers |
| Base de datos | Cloudflare D1 (SQLite) |
| ORM / migraciones | Drizzle ORM + drizzle-kit |
| Gestor de paquetes | pnpm |
| Pruebas | Vitest (`@cloudflare/vitest-pool-workers` para tests de adaptadores/D1) |
| Tooling Cloudflare | Wrangler |
| Auth | Google Sign-In + JWT propio |

## Estructura del repositorio (monorepo)

Objetivo (se irá creando en la primera entrega):

```
/
├─ apps/
│  ├─ backend/           # API Hono sobre Workers
│  └─ frontend/          # PWA React + Vite (ver sección "Frontend (PWA)")
├─ .github/workflows/    # CI/CD
└─ pnpm-workspace.yaml
```

`apps/frontend` ya está scaffoldeado (Vite + React + Tailwind + shadcn/ui) con las pantallas de login, onboarding, dashboard y categorías conectadas a la API real; el stack y la estructura completos están definidos abajo.

## Arquitectura (hexagonal simple) — backend

Tres capas por módulo de dominio. Mantenerla mínima: no crear abstracciones que aún no se usan.

```
apps/backend/src/
├─ modules/
│  ├─ users/
│  ├─ families/
│  └─ categories/
│     ├─ domain/          # entidades + reglas de negocio + puertos (interfaces). Sin dependencias externas.
│     ├─ application/     # casos de uso que orquestan el dominio a través de los puertos.
│     └─ infrastructure/  # adaptadores: repositorio Drizzle/D1, rutas Hono, mapeos.
├─ shared/               # utilidades transversales (jwt, errores, config)
└─ index.ts              # composición: wiring de dependencias + app Hono
```

Reglas de dependencia:
- `domain` no importa de `application` ni de `infrastructure`.
- `application` depende solo de puertos del `domain`.
- `infrastructure` implementa los puertos; es la única capa que conoce Hono, Drizzle y D1.
- El *wiring* (inyección de dependencias) se hace en la composición raíz.

Esto permite probar `domain` y `application` con pruebas unitarias puras (sin D1) y probar los adaptadores contra SQLite local.

### Convención de rutas HTTP
Todos los endpoints de negocio van prefijados con `/api/v1` (`/api/v1/auth/*`, `/api/v1/me`, `/api/v1/families`, `/api/v1/categories`, y así las futuras entidades del `SPEC-finanzas-familiares.md`). `GET /health` es la única excepción: queda sin prefijar por ser un check de infraestructura, no un recurso de la API.

### Tenancy y aislamiento de datos
Modelo **multi-tenant con una sola base de datos D1**. Cada entidad de familia lleva `familyId`. NO se usa una base de datos por familia (los bindings de D1 son estáticos y multiplicaría migraciones/operación).

**Regla de seguridad (obligatoria):**
- El `familyId` **siempre** se deriva del usuario autenticado (del JWT), **nunca** de un `familyId` recibido en body/query/params.
- **Todo repositorio filtra obligatoriamente por `familyId`**. El scoping por tenant se centraliza en la capa `infrastructure` (repositorios); ningún caso de uso debe poder leer/escribir datos de otra familia.

## Frontend (PWA)

### Stack

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
| Gestor de paquetes | pnpm (mismo workspace que el backend) |
| Deploy | Cloudflare Pages, subdominio `ikis.renegarcia.work` |

**Por qué shadcn/ui y no Material UI:** los componentes de shadcn/ui se copian al repo como código propio en vez de instalarse como dependencia — da la velocidad de tener inputs/diálogos/tablas ya resueltos y accesibles, sin heredar el look de "panel de admin" de Material Design ni pelear un sistema de temas ajeno para personalizar. Es más liviano (importa para una PWA instalable) y sus formularios están pensados nativamente para trabajar con `react-hook-form` + `zod`, que es lo que necesita una app con tantos formularios (gastos, categorías, presupuestos).

**Estado y complejidad:** nada de Redux/Zustand por ahora — TanStack Query cubre el server state (categorías, familia, transacciones) y `useState`/Context de React alcanza para el estado de UI local. No sobre-diseñar esto hasta que el tamaño real de la app lo pida.

**PWA = instalable, no offline-first:** el alcance de "PWA" acá es manifest + ícono + carga de app shell cacheada para que se pueda instalar: no incluye sincronización de datos offline (crear/editar transacciones sin conexión). Eso queda fuera del MVP.

### Estructura de `apps/frontend`

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

### Autenticación en el frontend

1. Botón de Google Sign-In (Google Identity Services JS) → devuelve un ID token de Google.
2. `POST /api/v1/auth/google` con ese ID token → el backend responde con el JWT propio.
3. El JWT se guarda en `localStorage` (suficiente para el MVP; el backend ya espera `Authorization: Bearer <token>`, no cookies) y se manda en cada request a la API.
4. `GET /api/v1/me` devuelve el usuario autenticado con su `familyId`; el frontend lo usa (guard de ruteo) para decidir entre onboarding (crear familia) o dashboard después del login.

## Primera entrega (alcance actual)

1. **CI/CD del backend funcionando** (GitHub Actions → deploy a Cloudflare Workers).
2. Entidad **User**.
3. Entidad **Family** (un usuario pertenece a **una** familia; **sin roles**; todos los miembros con los mismos permisos).
4. **CRUD de Categories** (ver detalle abajo).

### Flujo de onboarding
1. El usuario hace **login con Google** → se crea (o recupera) el `User`.
2. El usuario **crea su familia** → se crea la `Family` y se **copian las categorías por defecto** con ese `familyId`.
3. Categorías (y futuras entidades como transacciones) se relacionan con esa familia vía `familyId`.

### Modelo de Categories
Una sola tabla auto-referenciada. Cada categoría es una fila; `parentId = null` es categoría raíz, `parentId` con valor es subcategoría.

- **Máximo 2 niveles**: categoría → subcategoría. Una subcategoría **no** puede tener hijos (rechazar si el `parentId` ya apunta a una fila que tiene padre).
- **Scope por familia**: toda categoría lleva `familyId` (regla única, nunca null); el CRUD solo opera sobre las de la familia del usuario autenticado.
- **Categorías predefinidas por copia**: al crear la familia se le **copian** las categorías por defecto ya con su `familyId`. No existen categorías globales/compartidas; cada familia es dueña de las suyas y puede editarlas o borrarlas.
- **Solo gastos** por ahora (sin distinción ingreso/gasto).
- **Borrado en cascada**: al borrar una categoría padre se borran también sus subcategorías.
- El endpoint de lectura devuelve el árbol anidado (`children`).

### Autenticación (Google + JWT)
El backend verifica el **ID token de Google** y emite su **propio JWT**, que se usa en las siguientes peticiones.

Como en esta etapa **solo existe el backend** (sin frontend que haga el login de Google), para **probar** se recomienda:
- Un **endpoint de desarrollo** protegido por variable de entorno (p. ej. `DEV_AUTH=true`, deshabilitado en producción) que emita un JWT para un usuario de prueba **sin pasar por Google**.
- Alternativa: obtener un ID token real desde el [OAuth 2.0 Playground](https://developers.google.com/oauthplayground) y enviarlo a `/api/v1/auth/google`.
- Para pruebas unitarias: generar/verificar JWTs directamente con el secreto de test.

> Cuando lleguemos a la implementación de auth, Claude debe guiar paso a paso la configuración de credenciales de Google y el endpoint de pruebas.

## Comandos

Corren en todo el monorepo (`pnpm -r`) salvo que se indique lo contrario.

```bash
pnpm install                              # instalar dependencias
pnpm dev                                  # backend (Wrangler + D1 local, :8787) y frontend (Vite, :5173) en paralelo
pnpm test                                 # Vitest en backend y frontend
pnpm build                                # build de producción de ambos apps
pnpm typecheck                            # tsc --noEmit en ambos apps
pnpm --filter @ikis/backend db:generate       # generar migraciones (drizzle-kit)
pnpm --filter @ikis/backend db:migrate:local  # aplicar migraciones a D1 local
pnpm --filter @ikis/backend db:migrate:remote # aplicar migraciones a D1 en Cloudflare
```

## Definiciones pendientes

- ~~Nombre y estructura definitiva de las tablas~~ → cerrado (`users`, `families`, `categories` en Drizzle).
- ~~Endpoint `GET /me`~~ → implementado.
- ~~Flujo detallado de cada pantalla del frontend~~ → definido en [`apps/frontend/SCREENS.md`](apps/frontend/SCREENS.md).
- Reglas de invitación de miembros a la familia (fuera del MVP actual).
- **Siguiente entrega del backend: Transacciones, Cuentas y Presupuestos** → spec completo en [`SPEC-finanzas-familiares.md`](SPEC-finanzas-familiares.md) (ya alineado con lo construido: sin roles, categorías jerárquicas existentes, ids `text`, sin prefijo `/api/v1`, arquitectura hexagonal por módulo).
