# CLAUDE.md

Este archivo tiene solo las reglas globales del proyecto. El detalle específico de cada app vive en su propio `CLAUDE.md` (se carga automáticamente al trabajar ahí) y en skills invocables bajo demanda — no lo dupliques acá.

- Backend (arquitectura hexagonal, tenancy, rutas, categorías) → [`apps/backend/CLAUDE.md`](apps/backend/CLAUDE.md)
- Frontend (stack, estructura, auth) → [`apps/frontend/CLAUDE.md`](apps/frontend/CLAUDE.md)
- Setup y prueba de autenticación Google/JWT → skill `google-auth-setup`
- Spec de Transacciones, Cuentas, Presupuestos y Transferencias → skill `finance-spec`

## Meta del proyecto

**ikis** es una aplicación de **gestión financiera para familias**.

- **Formato:** PWA multi-idioma.
- **Público:** familias que quieren llevar el control de sus gastos.
- **Estrategia de entrega:** micro-entregas incrementales. No se construye todo de una vez; cada entrega deja algo funcional y desplegado.
- **Estado actual:** backend con User, Family, Categories, auth y el módulo de finanzas (accounts/transactions/transfers/budgets) construidos; frontend con login, onboarding, dashboard y categorías conectados a la API real.

### Dominio

Se registran los **gastos** de una familia, clasificados mediante **categorías jerárquicas** de máximo 2 niveles (categoría → subcategoría). Ejemplos: `food` → `fast food`, `grocery`; `transport` → `taxi`, `bus`; `servicios públicos` → `agua`, `luz`, `internet`; `salud`.

## Reglas del proyecto

### Idioma y estilo
- **Todo el código, nombres e identificadores en inglés.** Los distintos idiomas de la app (i18n) se agregan en el frontend; el backend permanece 100% en inglés.
- **Evitar comentarios.** El código debe ser autodescriptivo (nombres claros, funciones pequeñas). Un comentario suele indicar que el código necesita refactor.
- **TypeScript** en todo el proyecto.

### Desarrollo
- **TDD preferiblemente:** escribir la prueba antes que la implementación.
- **Se debe poder levantar el ambiente en local** (SQLite local vía Wrangler/Miniflare) para desarrollar **sin depender de Cloudflare ni de su base de datos remota**.
- **Arquitectura hexagonal lo más sencilla posible** en el backend (detalle → [`apps/backend/CLAUDE.md`](apps/backend/CLAUDE.md)). No sobre-diseñar.

### Git / CI/CD
- Repo **monorepo**: frontend y backend en el mismo repositorio.
- **GitHub** para repositorio y CI/CD (GitHub Actions).
- **Cloudflare** para todo el despliegue: Workers (backend), Pages (frontend), D1 (base de datos). Subdominio: **`ikis.renegarcia.work`**.

### Seguridad multi-tenant (resumen — detalle en [`apps/backend/CLAUDE.md`](apps/backend/CLAUDE.md))
El `familyId` **siempre** se deriva del JWT del usuario autenticado, **nunca** de body/query/params. Todo repositorio filtra obligatoriamente por `familyId`.

## Estructura del repositorio (monorepo)

```
/
├─ apps/
│  ├─ backend/           # API Hono sobre Workers — ver apps/backend/CLAUDE.md
│  └─ frontend/          # PWA React + Vite — ver apps/frontend/CLAUDE.md
├─ .github/workflows/    # CI/CD
└─ pnpm-workspace.yaml
```

## Comandos

Corren en todo el monorepo (`pnpm -r`) salvo que se indique lo contrario.

```bash
pnpm install                              # instalar dependencias
pnpm dev                                  # backend (Wrangler + D1 local, :8787) y frontend (Vite, :5173) en paralelo
./scripts/dev-up.sh                       # igual que `pnpm dev`, pero en background (logs en /tmp/ikis-dev.log)
./scripts/dev-down.sh                     # apaga TODO el árbol de procesos de dev-up.sh (incluye el workerd que Wrangler desprende)
pnpm test                                 # Vitest en backend y frontend
pnpm build                                # build de producción de ambos apps
pnpm typecheck                            # tsc --noEmit en ambos apps
pnpm --filter @ikis/backend db:generate       # generar migraciones (drizzle-kit)
pnpm --filter @ikis/backend db:migrate:local  # aplicar migraciones a D1 local
pnpm --filter @ikis/backend db:migrate:remote # aplicar migraciones a D1 en Cloudflare
```

## Definiciones pendientes

- Reglas de invitación de miembros a la familia (fuera del MVP actual).
- Siguiente entrega del backend: Transacciones, Cuentas y Presupuestos → ya construida; detalle y decisiones tomadas durante la implementación en el skill `finance-spec`.
