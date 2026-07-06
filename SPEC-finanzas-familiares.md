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
- **transfers** (no estaba en el planteamiento original, agregada durante la implementación — ver sección "Transferencias entre cuentas" abajo): `id` (text pk), `family_id` (not null), `from_account_id` (fk accounts), `to_account_id` (fk accounts), `created_by_user_id` (fk users), `amount` (integer not null, siempre positivo), `description` (text), `occurred_at` (text ISO date), `created_at`, `updated_at`, `deleted_at` (nullable).

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

## Transferencias entre cuentas (`transfers`)

**No estaba en el planteamiento original de este spec** — surgió como pregunta durante la implementación: ¿cómo se mueve dinero entre dos cuentas de la misma familia (ej. Checking → Ahorros)?

Modelarlo como dos `transactions` sueltas (-monto en A, +monto en B) rompería el principio no negociable #1 ("`transactions` es la única fuente de verdad" para presupuestos/reportes): la pata negativa contaría como gasto real en `spent` de algún presupuesto, cuando mover el propio dinero no es ni gasto ni ingreso. Tampoco quedarían vinculadas — borrar una sin la otra descuadra el balance para siempre.

**Decisión:** entidad separada `transfers`, módulo hexagonal propio (`src/modules/transfers/{domain,application,infrastructure}/`), sin relación con `transactions` ni con `categories` (una transferencia no es categorizable, no es gasto ni ingreso). Reglas de dominio: `amount` siempre positivo (dirección la dan `fromAccountId`/`toAccountId`), `fromAccountId !== toAccountId`.

Casos de uso — mismo patrón revert-and-apply que `transactions`, pero **siempre** toca dos cuentas (nunca colapsa al caso "misma cuenta" que sí existe en `updateTransaction`):

- `createTransfer`: batch de 3 — INSERT en `transfers`, `UPDATE accounts SET balance = balance - :amount WHERE id = :fromAccountId`, `UPDATE accounts SET balance = balance + :amount WHERE id = :toAccountId`.
- `updateTransfer`: batch de 5 — UPDATE de `transfers`, luego revierte el efecto viejo (+amount viejo en el from viejo, -amount viejo en el to viejo) y aplica el nuevo (-amount nuevo en el from nuevo, +amount nuevo en el to nuevo). Si alguna cuenta no cambió, son dos UPDATEs seguidos a la misma fila dentro del mismo batch — correcto y atómico, solo un poco menos eficiente que colapsar el caso; se prefirió así por ser un único camino de código en vez de bifurcar según qué cambió.
- `deleteTransfer`: batch de 3 — soft delete + revertir ambas cuentas.

Implementado y testeado (`test/modules/transfers/`): casos de uso con repo en memoria (validaciones: monto ≤0, mismo origen/destino, cuenta de otra familia) + integración contra D1 real (débito/crédito al crear, ajuste por diferencia de monto, mover el destino de una cuenta a otra, soft delete revierte ambas, aislamiento multi-tenant).

**Pendiente:** exponer `GET/POST/PATCH/DELETE /api/v1/transfers` (mismo paso que falta para `transactions`/`accounts`); decidir si el endpoint de listado de "actividad de una cuenta" combina `transactions` + `transfers` o se consultan por separado desde el frontend.

## Ciclo de presupuesto configurable (`budgetCycleStartDay`)

**No estaba en el planteamiento original** — surgió al usar la app: no todo el mundo recibe su sueldo el día 1. Se agregó `budgetCycleStartDay` (entero 1-28, default 1) a `families`, para que "julio 2026" pueda significar, por ejemplo, 27 jul → 26 ago en vez de 1-31 jul. Se limita a 1-28 a propósito para no lidiar con meses de 28/29/30/31 días — casi nadie cobra el día 29-31, y así `date(period, '+1 month')` en SQLite siempre es seguro.

Decisiones clave (la primera es la que costó un bug real en el camino, vale la pena leerla):

- **Los presupuestos ya creados son una foto fija de su rango de fechas — nunca se recalculan cuando cambia `budgetCycleStartDay`.** `budgets.period` sigue siendo `'YYYY-MM-DD'`, pero ahora ese día puede ser cualquiera entre 1-28, fijado al momento de crear el presupuesto según el ajuste de la familia en ese momento. **Bug encontrado probando manualmente:** si se recalcula el rango con el día *actual* de la familia en cada lectura, un presupuesto viejo (creado con día 1) se vuelve invisible en cuanto la familia cambia el día — el `WHERE period = :recalculado` deja de coincidir con lo guardado. La corrección: las lecturas (`GET /budgets`, chequeo de duplicados al crear) ya NO recalculan nada; matchean por **mes calendario del valor ya guardado** (`substr(period, 1, 7) = :publicPeriod`), y el rango de transacciones de cada presupuesto se calcula individualmente a partir de su propio `period` guardado (`date(b.period, '+1 month')` en SQL). Así, dos presupuestos de la misma familia para "julio" pueden convivir con días de inicio distintos (uno viejo en el día 1, uno nuevo en el día 27) sin pisarse ni desaparecer.
- `createBudget` sigue siendo el único lugar que necesita saber el `budgetCycleStartDay` *actual* de la familia (para fijar el día del nuevo presupuesto). `getBudgetStatus` no necesita el dato de la familia en absoluto.
- API pública: `PATCH /api/v1/families { budgetCycleStartDay }` y `GET /api/v1/families` (no existían — solo había `POST` para crear la familia). Frontend: un input numérico simple junto al selector de mes en `/budgets`, sin pantalla de "Configuración" dedicada.

## Consulta de presupuestos

**Los presupuestos solo se crean sobre categorías padre (raíz), nunca sobre subcategorías** — `createBudget` rechaza con `"Budgets can only be created for parent categories"` si `category.parentId !== null`. Un gasto registrado en cualquier subcategoría de esa padre (p. ej. `food › fast food`) también cuenta hacia el presupuesto de `food`; no hay presupuestos independientes por subcategoría. Como las categorías tienen máximo 2 niveles, esto no requiere recursión: basta con incluir en la suma las transacciones cuyo `category_id` sea la propia categoría del presupuesto **o** cualquier categoría cuyo `parent_id` sea esa categoría.

`getBudgetStatus(familyId, period)` en `src/modules/budgets/application/`: JOIN de `budgets` con SUM de `transactions`, agrupado por presupuesto, usando el propio `period` de cada fila (no uno recalculado desde la familia) para el rango:

```sql
SELECT b.id, b.category_id, b.amount_limit,
       COALESCE(SUM(CASE WHEN t.amount < 0 THEN -t.amount ELSE 0 END), 0) AS spent
FROM budgets b
LEFT JOIN categories c
  ON c.id = b.category_id OR c.parent_id = b.category_id
LEFT JOIN transactions t
  ON t.family_id = b.family_id
 AND t.category_id = c.id
 AND t.occurred_at >= b.period
 AND t.occurred_at < date(b.period, '+1 month')
 AND t.deleted_at IS NULL
WHERE b.family_id = :familyId AND substr(b.period, 1, 7) = :publicPeriod
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

1. ~~Schema + migración inicial (`accounts`, `transactions`)~~ → hecho.
2. ~~Casos de uso de `transactions` con los batches (corazón del sistema) + tests 1, 2, 3, 4, 6~~ → hecho.
3. ~~Schema + casos de uso de `transfers`~~ → hecho (ver sección "Transferencias entre cuentas" arriba; no estaba en el plan original).
4. ~~Rutas Hono para `accounts`, `transactions`, `transfers`~~ → hecho (bajo `/api/v1`, detrás de `authMiddleware`).
5. ~~Schema + casos de uso + rutas de `budgets` + test 5~~ → hecho (ver nota de formato de `period` abajo).
6. Reconciliación + test 7.
7. `transaction_revisions` (auditoría) — estaba en el spec original, quedó sin implementar al construir `transactions`; decidir si se hace antes o después de reconciliación.

**Nota sobre el formato de `period`:** la API pública (`POST /budgets`, `GET /budgets?period=`) usa `'YYYY-MM'` (lo que produce un `<input type="month">` del frontend), no `'YYYY-MM-01'`. La conversión a formato de almacenamiento (`toStoragePeriod`) pasa en la capa `application`, antes de tocar el repositorio — el `'-01'` es un detalle interno de almacenamiento, no un contrato de la API.

Trabajar por fases: al terminar cada fase, correr los tests y mostrar un resumen antes de continuar con la siguiente.
