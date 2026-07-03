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
| Front (futuro) | PWA — por definir |

## Estructura del repositorio (monorepo)

Objetivo (se irá creando en la primera entrega):

```
/
├─ apps/
│  └─ backend/          # API Hono sobre Workers
├─ .github/workflows/   # CI/CD
└─ pnpm-workspace.yaml
```

El frontend se añadirá bajo `apps/` cuando se defina.

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

### Tenancy y aislamiento de datos
Modelo **multi-tenant con una sola base de datos D1**. Cada entidad de familia lleva `familyId`. NO se usa una base de datos por familia (los bindings de D1 son estáticos y multiplicaría migraciones/operación).

**Regla de seguridad (obligatoria):**
- El `familyId` **siempre** se deriva del usuario autenticado (del JWT), **nunca** de un `familyId` recibido en body/query/params.
- **Todo repositorio filtra obligatoriamente por `familyId`**. El scoping por tenant se centraliza en la capa `infrastructure` (repositorios); ningún caso de uso debe poder leer/escribir datos de otra familia.

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
- Alternativa: obtener un ID token real desde el [OAuth 2.0 Playground](https://developers.google.com/oauthplayground) y enviarlo a `/auth/google`.
- Para pruebas unitarias: generar/verificar JWTs directamente con el secreto de test.

> Cuando lleguemos a la implementación de auth, Claude debe guiar paso a paso la configuración de credenciales de Google y el endpoint de pruebas.

## Comandos

> Se completan al inicializar el proyecto. Objetivo:

```bash
pnpm install                 # instalar dependencias
pnpm dev                     # levantar backend en local (Wrangler + D1 local)
pnpm test                    # correr Vitest
pnpm test <archivo>          # correr un test concreto
pnpm build                   # build de producción
pnpm db:generate             # generar migraciones (drizzle-kit)
pnpm db:migrate:local        # aplicar migraciones a D1 local
pnpm db:migrate:remote       # aplicar migraciones a D1 en Cloudflare
```

## Definiciones pendientes

- Nombre y estructura definitiva de las tablas (se cierra al escribir el schema de Drizzle).
- Detalles del frontend (PWA): framework, i18n.
- Reglas de invitación de miembros a la familia (fuera del MVP actual).
