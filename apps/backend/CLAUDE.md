# CLAUDE.md — apps/backend

Contexto específico del backend. Ver el `CLAUDE.md` raíz para las reglas globales del proyecto (idioma, TDD, comandos).

## Arquitectura hexagonal simple

Tres capas por módulo de dominio (`src/modules/<name>/`). Mantenerla mínima: no crear abstracciones que aún no se usan.

```
apps/backend/src/
├─ modules/
│  ├─ users/
│  ├─ families/
│  ├─ categories/
│  ├─ accounts/
│  ├─ transactions/
│  ├─ transfers/
│  ├─ budgets/
│  └─ auth/
│     ├─ domain/          # entidades + reglas de negocio + puertos (interfaces). Sin dependencias externas.
│     ├─ application/     # casos de uso que orquestan el dominio a través de los puertos.
│     └─ infrastructure/  # adaptadores: repositorio Drizzle/D1, rutas Hono, mapeos.
├─ shared/               # utilidades transversales (jwt, errores, config, auth-middleware)
└─ index.ts              # composición: wiring de dependencias + app Hono
```

Reglas de dependencia:
- `domain` no importa de `application` ni de `infrastructure`.
- `application` depende solo de puertos del `domain`.
- `infrastructure` implementa los puertos; es la única capa que conoce Hono, Drizzle y D1.
- El *wiring* (inyección de dependencias) se hace en la composición raíz (`index.ts`).

Esto permite probar `domain` y `application` con pruebas unitarias puras (sin D1) y probar los adaptadores contra SQLite local.

## Convención de rutas HTTP

Todos los endpoints de negocio van prefijados con `/api/v1` (`/api/v1/auth/*`, `/api/v1/me`, `/api/v1/families`, `/api/v1/categories`, `/api/v1/accounts`, `/api/v1/transactions`, `/api/v1/transfers`, `/api/v1/budgets`). `GET /health` es la única excepción: queda sin prefijar por ser un check de infraestructura, no un recurso de la API.

## Tenancy y aislamiento de datos (regla de seguridad obligatoria)

Modelo **multi-tenant con una sola base de datos D1**. Cada entidad de familia lleva `familyId`. NO se usa una base de datos por familia (los bindings de D1 son estáticos y multiplicaría migraciones/operación).

- El `familyId` **siempre** se deriva del usuario autenticado (`c.get("familyId")`, resuelto por `authMiddleware` desde `src/shared/auth-middleware.ts`), **nunca** de un `familyId` recibido en body/query/params.
- **Todo repositorio filtra obligatoriamente por `familyId`**. El scoping por tenant se centraliza en la capa `infrastructure` (repositorios); ningún caso de uso debe poder leer/escribir datos de otra familia.
- Al fallar el scoping (recurso de otra familia), responder `404`, nunca `403` — no filtrar existencia entre familias.

## Modelo de Categories

Una sola tabla auto-referenciada. Cada categoría es una fila; `parentId = null` es categoría raíz, `parentId` con valor es subcategoría.

- **Máximo 2 niveles**: categoría → subcategoría. Una subcategoría **no** puede tener hijos (rechazar si el `parentId` ya apunta a una fila que tiene padre).
- **Scope por familia**: toda categoría lleva `familyId` (regla única, nunca null); el CRUD solo opera sobre las de la familia del usuario autenticado.
- **Categorías predefinidas por copia**: al crear la familia se le copian las categorías por defecto ya con su `familyId`. No existen categorías globales/compartidas.
- **Solo gastos** por ahora (sin distinción ingreso/gasto).
- **Borrado en cascada**: al borrar una categoría padre se borran también sus subcategorías.
- El endpoint de lectura devuelve el árbol anidado (`children`).

## Autenticación

Google Sign-In + JWT propio. Guía completa de setup, variables de entorno, endpoint de desarrollo (`DEV_AUTH`) y prueba manual con OAuth Playground → **[`AUTH.md`](AUTH.md)**.

## Siguiente entrega: Transacciones, Cuentas y Presupuestos

Spec completo, incluyendo decisiones tomadas durante la implementación (transfers, ciclo de presupuesto configurable, patrón revert-and-apply) → invocar el skill `finance-spec` o leer directamente [`../../SPEC-finanzas-familiares.md`](../../SPEC-finanzas-familiares.md).

## Tests

`@cloudflare/vitest-pool-workers` no resetea el storage de D1 entre bloques `it()` del mismo archivo — usar `crypto.randomUUID()` para ids de test, nunca strings fijos como `"family-1"`.
