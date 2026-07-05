# Spec: Transacciones, Cuentas y Presupuestos (siguiente entrega)

> Este spec describe la **siguiente entrega** sobre el backend ya construido (ver `CLAUDE.md`). No es un diseño desde cero: donde chocaba con lo ya implementado (User, Family, Categories, auth), se ajustó el spec a lo existente en vez de al revés. La sección siguiente explica exactamente qué se conservó y qué se adaptó.

## Alineación con lo ya construido (leer antes de implementar)

- **IDs:** el spec original asumía `integer` autoincrement. El proyecto ya usa `text` (UUID) como PK en `families`, `users`, `categories` — las tablas nuevas (`accounts`, `transactions`, `budgets`, `transaction_revisions`) siguen esa misma convención, no autoincrement.
- **`families`:** ya existe (`src/modules/families/infrastructure/persistence/families.schema.ts`). Sin cambios.
- **`users`:** ya existe (`src/modules/users/.../users.schema.ts`) con `googleId`, `email`, `name`, `familyId` (nullable — el usuario existe antes de tener familia, ver flujo de onboarding en `CLAUDE.md`). **Sin campo `role`**: `CLAUDE.md` fija explícitamente "un usuario pertenece a una familia; sin roles; todos los miembros con los mismos permisos" para el alcance actual. El spec original tenía `role: 'owner' | 'member'` — se elimina de aquí; si más adelante se agregan roles (p. ej. para invitaciones a la familia, ya marcado como "fuera del MVP" en `CLAUDE.md`), se hace como entrega aparte.
- **`categories`:** ya existe, y es **estructuralmente distinta** a lo que planteaba el spec original (`kind: 'income'|'expense'` plano). Lo que ya está construido es una jerarquía de 2 niveles (categoría → subcategoría, auto-referenciada por `parentId`) y **solo para gastos** (`CLAUDE.md`: "Solo gastos por ahora, sin distinción ingreso/gasto"). Se conserva tal cual — no se agrega `kind`. Consecuencia para `transactions`: una transacción de ingreso (`amount > 0`) simplemente no lleva `categoryId` (columna nullable); no hay categorías de ingreso todavía. Si eso se vuelve necesario, es una decisión de producto a discutir aparte, no algo que se resuelve de una vez en esta entrega.
- **Auth de tenant:** ya existe como `authMiddleware` (`src/shared/auth-middleware.ts`), inyecta `userId` y `familyId` (nunca `role`, porque no existe) en el contexto de Hono vía `c.set(...)`. El spec original proponía un middleware `tenantAuth` nuevo con `role` — se usa el existente tal cual, sin `role`.
- **Prefijo de rutas:** todas las rutas de negocio ya van bajo `/api/v1` (`/api/v1/auth/*`, `/api/v1/families`, `/api/v1/categories`, `/api/v1/me`; `GET /health` es la única excepción, sin prefijo). Las rutas nuevas (`/api/v1/transactions`, `/api/v1/accounts`, `/api/v1/budgets`) siguen esa misma convención.
- **Arquitectura:** el spec original sugería una carpeta plana `src/{db,middleware,routes,services,validators}`. El proyecto ya usa arquitectura hexagonal por módulo (`src/modules/<name>/{domain,application,infrastructure}/`, ver `CLAUDE.md` § Arquitectura). Los módulos nuevos (`accounts`, `transactions`, `budgets`) siguen ese mismo patrón: puertos + entidades en `domain/`, casos de uso en `application/`, repositorio Drizzle + rutas Hono en `infrastructure/`. El `TransactionService`/`BudgetService` del spec original se traduce a casos de uso en `application/` que reciben el repositorio como puerto — no un servicio monolítico.
- **Validación:** el proyecto no usa `zod` todavía (las rutas actuales validan a mano, ej. `if (!body.name)`). Para `transactions` la validación es más rica (fechas, montos, "al menos un campo en PATCH"); introducir `zod`/`@hono/zod-validator` aquí es razonable pero es una **decisión a tomar en la implementación**, no algo ya resuelto — si se adopta, evaluar si conviene extenderlo luego a los módulos existentes por consistencia.
- **`/api/v1/admin/reconcile`:** el spec original lo restringía a `role: 'owner'`. Como no hay roles, por ahora queda abierto a cualquier miembro autenticado de la familia (mismo criterio que el resto de endpoints: aislamiento por `familyId`, no por rol). Revisar cuando exista un sistema de roles.

Todo lo demás del spec original (money en INTEGER, soft delete, patrón revert-and-apply, `accounts.balance` como caché sincronizado en el mismo `db.batch()`, índices compuestos por `family_id`) es nuevo terreno — no choca con nada existente y se mantiene tal cual estaba planteado.

## Contexto y stack

Ya vigente en el proyecto — sin cambios:

- **Runtime:** Cloudflare Workers
- **Framework HTTP:** Hono.js
- **Base de datos:** Cloudflare D1 (SQLite)
- **ORM:** drizzle-orm (driver `drizzle-orm/d1`)
- **Migraciones:** drizzle-kit generando SQL, aplicadas con `wrangler d1 migrations apply`
- **Tests:** Vitest con `@cloudflare/vitest-pool-workers`

## Principios de diseño (no negociables)

1. **`transactions` es la única fuente de verdad.** Presupuestos y reportes se DERIVAN con consultas; nunca se almacenan valores calculados de presupuesto.
2. **El saldo de cuenta (`accounts.balance`) es un caché** que se mantiene sincronizado: toda mutación de una transacción y su ajuste de saldo van en el MISMO `db.batch()` (atómico en D1).
3. **Dinero siempre en INTEGER** (unidades mínimas de la moneda). Prohibido REAL/float para montos. El formateo a moneda es responsabilidad del cliente.
4. **Multi-tenant estricto:** toda tabla de datos lleva `family_id` (ya es la convención del proyecto). Todo índice compuesto empieza por `family_id`. Todo repositorio recibe `familyId` como parámetro obligatorio (no opcional) — mismo patrón que `CategoryRepository`/`FamilyRepository` ya existentes. Ningún endpoint acepta `family_id` del body: se obtiene de `c.get("familyId")` (ya resuelto por `authMiddleware`).
5. **Soft delete** en transacciones (`deleted_at`); toda consulta filtra `deleted_at IS NULL`.
6. **Ediciones de transacciones usan el patrón revert-and-apply:** revertir el efecto del estado anterior sobre el saldo y aplicar el nuevo, con matemática relativa (`balance = balance - old + new`) dentro del batch. Nunca leer el saldo, calcular en JS y escribir el valor absoluto (race condition).

## Esquema Drizzle (tablas nuevas)

Cada tabla en su módulo (`src/modules/<accounts|transactions|budgets>/infrastructure/persistence/*.schema.ts`), mismo estilo que `categories.schema.ts` (`text("id").primaryKey()`, columnas `snake_case` vía `text("family_id")`, etc.):

- **accounts**: `id` (text pk), `family_id` (not null), `name` (text not null), `type` (text: `'checking'|'savings'|'credit_card'|'cash'`), `currency` (text, default `'COP'`), `balance` (integer not null default 0), `created_at`.
- **transactions**: `id` (text pk), `family_id` (not null), `account_id` (fk accounts), `category_id` (fk categories, nullable — ver nota sobre ingresos arriba), `created_by_user_id` (fk users), `amount` (integer not null; negativo = gasto, positivo = ingreso), `description` (text), `occurred_at` (text ISO date `'YYYY-MM-DD'`, not null), `created_at`, `updated_at`, `deleted_at` (nullable).
- **budgets**: `id` (text pk), `family_id`, `category_id` (fk categories), `period` (text `'YYYY-MM-01'`), `amount_limit` (integer not null). Unique(`family_id`, `category_id`, `period`).
- **transaction_revisions**: `id` (text pk), `transaction_id` (fk transactions), `snapshot` (text JSON del estado anterior), `changed_by_user_id`, `changed_at`. Se inserta una fila antes de cada UPDATE/DELETE de una transacción, dentro del mismo batch.

Índices:
- `idx_tx_family_account` sobre `transactions(family_id, account_id)` WHERE `deleted_at IS NULL`.
- `idx_tx_family_budget` sobre `transactions(family_id, category_id, occurred_at)` WHERE `deleted_at IS NULL`.

Nota: los índices parciales (`WHERE`) se definen en la migración SQL si drizzle-kit no los soporta directamente; verificar la versión instalada (`drizzle-kit@^0.31.5`).

## Casos de uso (application layer)

Equivalente al `TransactionService` del planteamiento original, pero como casos de uso independientes en `src/modules/transactions/application/` (mismo patrón que `create-category.ts`, `rename-category.ts`, etc. ya existentes), cada uno recibiendo el repositorio como puerto. Cada uno construye un array de sentencias Drizzle y lo ejecuta con `db.batch([...])`:

### `createTransaction(familyId, userId, input)`
Batch:
1. INSERT en `transactions`.
2. UPDATE `accounts` SET `balance = balance + :amount` WHERE `id = :accountId AND family_id = :familyId`.

### `updateTransaction(familyId, userId, txId, changes)`
1. SELECT previo de la transacción (fuera del batch) validando `family_id` y `deleted_at IS NULL`. Si no existe → 404.
2. Batch:
   a. INSERT en `transaction_revisions` con el snapshot anterior.
   b. UPDATE `accounts` SET `balance = balance - :oldAmount` WHERE `id = :oldAccountId AND family_id = :familyId`.
   c. UPDATE `transactions` SET ..., `updated_at = now` WHERE `id = :txId AND family_id = :familyId`.
   d. UPDATE `accounts` SET `balance = balance + :newAmount` WHERE `id = :newAccountId AND family_id = :familyId`.
   (b y d funcionan también cuando old y new account son la misma cuenta.)

### `deleteTransaction(familyId, userId, txId)`
1. SELECT previo (mismas validaciones).
2. Batch:
   a. INSERT en `transaction_revisions`.
   b. UPDATE `transactions` SET `deleted_at = now` WHERE `id = :txId AND family_id = :familyId AND deleted_at IS NULL`.
   c. UPDATE `accounts` SET `balance = balance - :amount` WHERE `id = :accountId AND family_id = :familyId`.

### Punto de extensión (efectos futuros)
Centralizar la construcción del batch en un helper `buildTransactionEffects({ before, after }): Statement[]` que devuelve las sentencias de efectos colaterales (hoy: solo saldo; mañana: resúmenes mensuales, outbox, etc.). Los casos de uso create/update/delete lo invocan con `before=null` o `after=null` según el caso. NO implementar todavía un event bus ni tabla outbox; solo dejar este helper como costura de extensión.

## Consulta de presupuestos

`getBudgetStatus(familyId, period)` en `src/modules/budgets/application/`: JOIN de `budgets` con SUM de `transactions` del mes:

```sql
SELECT b.id, b.category_id, b.amount_limit,
       COALESCE(SUM(CASE WHEN t.amount < 0 THEN -t.amount ELSE 0 END), 0) AS spent
FROM budgets b
LEFT JOIN transactions t
  ON t.family_id = b.family_id
 AND t.category_id = b.category_id
 AND t.occurred_at >= :periodStart
 AND t.occurred_at < :periodEnd
 AND t.deleted_at IS NULL
WHERE b.family_id = :familyId AND b.period = :periodStart
GROUP BY b.id;
```

Implementar con el query builder de Drizzle si es razonable; si queda ilegible, usar `sql` template tagged de drizzle-orm. Nunca concatenar strings.

## API (Hono)

Bajo el prefijo `/api/v1` (consistente con `/api/v1/auth`, `/api/v1/families`, `/api/v1/categories`, `/api/v1/me` ya existentes), todas detrás de `authMiddleware` (ya existente, sin `role`):

- `POST /api/v1/transactions` — crear.
- `PATCH /api/v1/transactions/:id` — editar (monto, cuenta, categoría, fecha, descripción).
- `DELETE /api/v1/transactions/:id` — soft delete.
- `GET /api/v1/transactions?accountId=&categoryId=&from=&to=&page=` — listar paginado.
- `GET /api/v1/accounts` — listar con saldos.
- `POST /api/v1/accounts`, `PATCH /api/v1/accounts/:id`.
- `GET /api/v1/budgets?period=YYYY-MM` — devuelve `amount_limit` + `spent` derivado.
- `POST /api/v1/budgets`, `PATCH /api/v1/budgets/:id`.

(`GET/POST/PATCH/DELETE /api/v1/categories` ya existen — no se tocan.)

Las respuestas de mutación de transacciones devuelven: la transacción resultante + el/los saldos de cuenta actualizados, para que el frontend refresque sin segunda llamada.

Validaciones clave: `amount` es integer ≠ 0; `occurred_at` es fecha ISO válida; en PATCH al menos un campo presente. (Ver nota sobre `zod` arriba — decisión a tomar en la implementación.)

## Endpoint de reconciliación (safety net)

`GET /api/v1/admin/reconcile` (cualquier miembro autenticado de la familia — no hay `role` todavía, ver nota arriba): recalcula por cuenta `SUM(amount)` de `transactions` activas y lo compara con `accounts.balance`. Devuelve las desviaciones sin corregirlas (dry-run) y acepta `?fix=true` para corregir.

## Tests (Vitest)

Como mínimo:
1. Crear transacción actualiza el saldo.
2. Editar el monto de una transacción ajusta el saldo por la diferencia.
3. Editar la transacción cambiándola de cuenta A a cuenta B revierte en A y aplica en B.
4. Soft delete revierte el saldo y la transacción deja de aparecer en listados y en `spent` del presupuesto.
5. Presupuesto: `spent` refleja creaciones, correcciones y eliminaciones sin ningún código de "actualización de presupuesto".
6. Aislamiento multi-tenant: un usuario de la familia 1 no puede leer ni mutar (404, no 403, para no filtrar existencia) transacciones de la familia 2.
7. Reconciliación detecta un saldo corrupto sembrado a mano.

**Recordatorio del proyecto:** `@cloudflare/vitest-pool-workers` no resetea el storage de D1 entre bloques `it()` del mismo archivo — usar `crypto.randomUUID()` para ids de test, nunca strings fijos como `"family-1"`.

## Orden de implementación

1. Schema + migración inicial (`accounts`, `transactions`, `budgets`, `transaction_revisions`).
2. Casos de uso de `transactions` con los batches (corazón del sistema) + tests 1–4.
3. Casos de uso de `budgets` + test 5.
4. Rutas Hono (sin prefijo, detrás de `authMiddleware`) + test 6.
5. Reconciliación + test 7.

Trabajar por fases: al terminar cada fase, correr los tests y mostrar un resumen antes de continuar con la siguiente.
