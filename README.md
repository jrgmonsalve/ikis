# ikis

Aplicación de gestión financiera para familias. Monorepo con el backend (Hono + Cloudflare Workers + D1 + Drizzle) en `apps/backend` y el frontend (Vite + React PWA) en `apps/frontend`.

## Requisitos

- Node.js >= 22
- pnpm 11 (`corepack enable` lo resuelve automáticamente vía `packageManager` en `package.json`)

## Levantar el entorno en local

```bash
pnpm install         # instalar dependencias del monorepo
cp apps/backend/.dev.vars.example apps/backend/.dev.vars   # variables de entorno locales (ver apps/backend/AUTH.md)
pnpm dev             # backend (Wrangler + D1 local, sin Cloudflare remoto) y frontend (Vite) en paralelo
```

Por defecto: backend en `http://localhost:8787`, frontend en `http://localhost:5173`. Para verificar que el backend responde:

```bash
curl http://localhost:8787/health
# {"status":"ok"}
```

### En background (`scripts/dev-up.sh` / `scripts/dev-down.sh`)

`pnpm dev` deja la terminal ocupada; si preferís correrlo en background, estos scripts lo manejan como un solo grupo de procesos (evita tener que buscar y matar a mano el `workerd` que `wrangler dev` desprende como proceso hijo):

```bash
./scripts/dev-up.sh    # levanta pnpm dev en background, logs en /tmp/ikis-dev.log
./scripts/dev-down.sh  # apaga todo el árbol de procesos (backend + frontend + workerd)
```

## Otros comandos

```bash
pnpm test                    # correr toda la suite de tests (Vitest)
pnpm --filter @ikis/backend test <archivo>   # correr un test puntual
pnpm typecheck               # chequeo de tipos de TypeScript
pnpm build                   # build de producción del backend
```

### Base de datos (Drizzle + D1)

```bash
pnpm --filter @ikis/backend db:generate       # generar migraciones a partir del schema
pnpm --filter @ikis/backend db:migrate:local  # aplicar migraciones a D1 local
pnpm --filter @ikis/backend db:migrate:remote # aplicar migraciones a D1 en Cloudflare
```

Para inspeccionar el contenido de la D1 local (debug):

```bash
pnpm --filter @ikis/backend exec wrangler d1 execute ikis --local --command "SELECT * FROM users"
```

### Notas para escribir tests de integración con D1

El pool de tests (`@cloudflare/vitest-pool-workers`) **no resetea el storage de D1 entre `it()` de un mismo archivo** — las filas se acumulan. Si un test asume que empieza de cero (ej. contar filas de una familia), usar `crypto.randomUUID()` para los ids de scoping (`familyId`, etc.) en vez de strings fijos como `"family-1"`, así los tests no colisionan entre sí sin importar el orden en que corran.

## Autenticación

El backend usa Google Sign-In + JWT propio. Setup de variables de entorno (`JWT_SECRET`, `GOOGLE_CLIENT_ID`, `DEV_AUTH`), cómo probar login sin Google (endpoint de desarrollo) y cómo probar con un token real de Google (OAuth 2.0 Playground): ver **[`apps/backend/AUTH.md`](apps/backend/AUTH.md)**.

## CI/CD (GitHub Actions → Cloudflare Workers)

El workflow `.github/workflows/ci.yml` corre en cada push/PR a `main`:

- **test**: `pnpm install` + `pnpm typecheck` + `pnpm test`.
- **deploy**: solo en push a `main` (y tras pasar `test`) aplica las migraciones pendientes a la D1 remota (`wrangler d1 migrations apply ikis --remote`) y luego despliega `apps/backend` a Cloudflare Workers con `wrangler deploy`.

Para que el job `deploy` funcione hace falta configurar, una sola vez:

### 1. En Cloudflare

- **Cuenta**: la app usa la cuenta con Account ID `56f6e8590b11f86c63b15cd497bfdaed` (visible en `wrangler whoami` o en el dashboard, arriba a la derecha).
- **API Token**: crear en https://dash.cloudflare.com/profile/api-tokens → "Create Token" → plantilla **"Edit Cloudflare Workers"** (incluye permisos de Workers Scripts y D1). Guardarlo, no queda visible después de creado.
- **Base de datos D1 remota**: ya creada (`ikis`, ver `database_id` en `apps/backend/wrangler.toml`). Si hay que recrearla: `pnpm exec wrangler d1 create ikis` y actualizar `database_id` en `wrangler.toml`.

### 2. En GitHub (repo `jrgmonsalve/ikis`)

Secrets en **Settings → Secrets and variables → Actions**:

| Secret | Valor |
|---|---|
| `CLOUDFLARE_API_TOKEN` | El API Token creado arriba |
| `CLOUDFLARE_ACCOUNT_ID` | `56f6e8590b11f86c63b15cd497bfdaed` |

Se pueden configurar por CLI con `gh` (evitando pegar el token como argumento en texto plano — mejor dejar que el prompt interactivo lo pida):

```bash
gh secret set CLOUDFLARE_API_TOKEN --repo jrgmonsalve/ikis
# pega el token cuando lo pida (input oculto)

gh secret set CLOUDFLARE_ACCOUNT_ID --repo jrgmonsalve/ikis --body "56f6e8590b11f86c63b15cd497bfdaed"
```

> Si el token se llega a pegar en texto plano en una terminal o chat (ej. como argumento de un comando), hay que revocarlo en el dashboard de Cloudflare y generar uno nuevo — un token expuesto en texto plano se considera comprometido.

## Estructura

```
/
├─ apps/
│  ├─ backend/           # API Hono sobre Cloudflare Workers
│  └─ frontend/          # PWA Vite + React
├─ scripts/              # helpers de desarrollo (dev-up.sh / dev-down.sh)
├─ pnpm-workspace.yaml
└─ package.json
```

Ver `CLAUDE.md` para las reglas de arquitectura y el alcance del proyecto.
