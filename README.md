# ikis

Aplicación de gestión financiera para familias. Monorepo con el backend (Hono + Cloudflare Workers + D1 + Drizzle) en `apps/backend`. El frontend se agrega más adelante.

## Requisitos

- Node.js >= 22
- pnpm 11 (`corepack enable` lo resuelve automáticamente vía `packageManager` en `package.json`)

## Levantar el backend en local

```bash
pnpm install         # instalar dependencias del monorepo
pnpm dev             # levantar el backend (Wrangler + D1 local, sin Cloudflare remoto)
```

Por defecto queda disponible en `http://localhost:8788`. Para verificar que responde:

```bash
curl http://localhost:8788/health
# {"status":"ok"}
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
│  └─ backend/          # API Hono sobre Cloudflare Workers
├─ pnpm-workspace.yaml
└─ package.json
```

Ver `CLAUDE.md` para las reglas de arquitectura y el alcance del proyecto.
