# Flujo de pantallas — Frontend (PWA)

Define el recorrido pantalla por pantalla, basado en la API actual del backend (todo bajo el prefijo `/api/v1`):
`POST /api/v1/auth/google`, `POST /api/v1/auth/dev`, `GET /api/v1/me`, `POST /api/v1/families`,
`GET|POST|PATCH|DELETE /api/v1/categories`, `GET|POST|PATCH /api/v1/accounts`,
`GET|POST|PATCH|DELETE /api/v1/transactions`, `GET|POST|PATCH|DELETE /api/v1/transfers`,
`GET|POST|PATCH /api/v1/budgets`.

Las pantallas 1–10 (auth, onboarding, categorías, cuentas, transacciones, transferencias,
presupuestos) ya están construidas.

**Nota sobre el backend:** `GET /api/v1/transactions` no tiene los filtros que planteaba
originalmente `SPEC-finanzas-familiares.md` (`?accountId=&categoryId=&from=&to=&page=`) —
devuelve el listado plano de la familia. A la escala de una familia esto es aceptable para
filtrar en el cliente; si la lista crece, hay que agregar esos filtros en el backend antes
de que el frontend sufra.

## Diagrama

```
┌─────────────┐
│   /login    │  "Sign in with Google" (GIS)
│             │  + "Continuar como usuario de prueba" (solo si VITE_DEV_AUTH=true)
└──────┬──────┘
       │  POST /api/v1/auth/google  ó  POST /api/v1/auth/dev  →  guarda JWT
       ▼
┌───────────────────────┐
│  Auth bootstrap        │  GET /api/v1/me → { familyId }
│  (guard, sin pantalla) │
└──────┬─────────────────┘
       │
   familyId === null?
   ┌───┴────┐
   │ sí     │ no
   ▼        ▼
┌───────────────────────────┐   ┌──────────────────────────┐
│/onboarding/family          │   │  /  (dashboard)           │
│ form: nombre               │   │  saludo + nombre familia  │
│ POST /api/v1/families      │   │  nav → /categories        │
└────────────┬───────────────┘   └───────────┬──────────────┘
             │                                │
          └───────► /  (dashboard) ◄┘
                          │
                          ▼
                    /categories
                    árbol + CRUD
                    (agregar raíz, agregar subcategoría
                     solo sobre raíces, renombrar, borrar)
```

## Dirección visual (mobile-first)

- **Paleta**: índigo (`--primary` #4E48B0, tono más oscuro `#241F6B` en el hero) + blanco cálido
  (`--background` #FBFAF7) como base. El **dorado terroso** (`--gold` #C99A4F) se reserva
  **solo para acentos puntuales** — nunca como color de fondo masivo: el badge de cierre de
  ciclo en el dashboard, el ícono de un ingreso en la lista de transacciones, el punto del tab
  activo en la barra inferior.
- **Navegación**: tab bar fija abajo (Inicio / Cuentas / **+** / Presupuestos / Categorías) en
  vez del nav de texto que había arriba. El **+** central es un FAB que abre el modal de
  "Agregar movimiento" (solo creación) desde cualquier pantalla — reemplaza el botón que antes
  vivía únicamente en el dashboard. `/transactions` conserva además su propio botón "Agregar" en
  el header, que reutiliza el mismo modal para creación y para edición inline de un movimiento o
  transferencia existente.
- **Header superior**: minimal en todas las pantallas — solo el wordmark "ikis" y el botón de
  logout (ícono), la navegación principal vive en la tab bar.
- Tokens y componentes en `apps/frontend/src/index.css` (`:root`/`.dark`); `.dark` está definido
  por consistencia pero **no hay toggle de tema todavía** — la app siempre corre en claro.

## Pantallas

### 1. `/login`
- Botón "Sign in with Google" (Google Identity Services JS) → `POST /api/v1/auth/google { idToken }` → guarda el JWT devuelto.
- Botón adicional "Continuar como usuario de prueba", visible **solo** si la env var de build `VITE_DEV_AUTH` está en `true` (espejo del `DEV_AUTH` del backend). Nunca debe aparecer en el build de producción. Llama a `POST /api/v1/auth/dev`.

### 2. Auth bootstrap (guard, sin UI propia)
- Al cargar la app, si hay JWT en `localStorage`, llama a `GET /api/v1/me`.
- Sin JWT válido → redirige a `/login`.
- `familyId === null` → redirige a `/onboarding/family`.
- `familyId` presente → deja pasar a las rutas protegidas (dashboard, categorías).

### 3. `/onboarding/family`
- Un único input: nombre de la familia → `POST /api/v1/families { name }`.
- Si la respuesta es 409 ("el usuario ya pertenece a una familia"), simplemente se refresca `GET /api/v1/me` y se redirige adentro (no es un error visible para el usuario).
- Nota de diseño: el nombre de familia **no es único** — dos familias distintas pueden compartir nombre porque el scoping siempre es por `familyId`, nunca por nombre. Es solo una etiqueta de visualización.

### 4. `/` — Dashboard
- **Hero índigo**: saludo, badge dorado con los días que faltan para el cierre del ciclo actual
  (calculado en cliente a partir de `family.budgetCycleStartDay` + fecha de hoy — no depende de
  ningún presupuesto en particular), balance total (suma de `GET /api/v1/accounts`) y el rango
  de fechas del ciclo actual (p. ej. "27 jun – 26 jul").
- **Resumen de presupuesto** (dentro del hero, debajo del rango de fechas; solo se pinta cuando
  `GET /api/v1/accounts` y `GET /api/v1/budgets` ya resolvieron):
  - **Capital**: suma de `balance` de las cuentas activas (`archivedAt === null`) que no son
    `credit_card` — las tarjetas de crédito representan deuda, no fondos propios asignables.
  - **Diferencia presupuesto vs capital**: `capital − disponible en presupuestos`, donde
    "disponible en presupuestos" es la suma de `amountLimit − spent` de cada presupuesto del
    ciclo (no la suma de los `amountLimit` originales). Usar el límite original en vez del
    disponible cuenta el gasto dos veces, porque el capital ya baja en tiempo real con cada
    transacción — ver `features/budgets/summary.ts` (`calculateUnassignedFunds`). Este número
    se mantiene estable mientras el gasto no exceda lo presupuestado, y solo cambia cuando se
    crea/edita un presupuesto o entra dinero nuevo sin asignar.
- **Cuentas**: gráfico de torta (`conic-gradient`) con la proporción de cada cuenta sobre el
  total (los saldos negativos no restan área del gráfico, se tratan como 0% para la proporción,
  pero sí se muestran con su signo real en la leyenda) y el total en el centro. Leyenda apilada
  debajo del gráfico, una cuenta por línea (nombre, monto, %). Link "Ver todo" → `/accounts`.
- **Presupuesto del mes actual**: `GET /api/v1/budgets?period=<mes actual>`, igual que antes
  (categoría, gastado / límite). Link "Ver todo" → `/budgets`.
- **Transacciones recientes**: últimos 3 movimientos de `GET /api/v1/transactions` (ordenados
  por `createdAt`), con ícono de entrada/salida. Link "Ver todas" → `/transactions`.
- El punto de entrada para registrar un movimiento ya no vive aquí — es el **+** de la tab bar
  (ver "Dirección visual" y sección 8).

### 5. `/categories`
- Árbol de categorías (raíz → subcategorías), obtenido de `GET /api/v1/categories`.
- Acciones:
  - "Agregar categoría" (raíz).
  - "Agregar subcategoría" — solo disponible sobre categorías raíz, nunca sobre una subcategoría (el backend rechaza un tercer nivel).
  - Renombrar (`PATCH /api/v1/categories/:id`).
  - Borrar (`DELETE /api/v1/categories/:id`), con confirmación que advierte el borrado en cascada de subcategorías.

### 6. Logout
- Botón ícono en el header del layout autenticado. Limpia el JWT de `localStorage` y redirige a `/login`.

### 7. `/accounts`
- Lista de cuentas (`GET /api/v1/accounts`): nombre, tipo (`checking`/`savings`/`credit_card`/`cash`), saldo, moneda.
- "Agregar cuenta" → `POST /api/v1/accounts { name, type, currency? }`.
- Renombrar / cambiar tipo → `PATCH /api/v1/accounts/:id`.
- **No hay borrado de cuentas** — el backend no expone `DELETE /accounts` (a propósito: una cuenta con historial de transacciones no debería poder desaparecer). No ofrecer ese botón en la UI.

### 8. Botón "+" — registrar Gasto / Ingreso / Transferencia
Un modal/dialog con 3 pestañas, disponible desde el FAB de la tab bar (cualquier pantalla, solo
creación) y desde el botón "Agregar" de `/transactions` (que además lo reutiliza para editar un
movimiento o transferencia existente). Cada pestaña llama a un endpoint distinto — son entidades
separadas en el backend, no una sola con un campo "tipo":

- **Gasto**: cuenta (select), categoría (select, **requerida**), monto (el usuario escribe un positivo, el formulario lo manda como negativo), fecha, descripción → `POST /api/v1/transactions { accountId, categoryId, amount: -monto, occurredAt, description }`.
- **Ingreso**: cuenta (select), monto (positivo), fecha, descripción — **sin categoría** (el backend rechaza `categoryId` en transacciones con `amount > 0`) → `POST /api/v1/transactions { accountId, categoryId: null, amount, occurredAt, description }`.
- **Transferencia**: cuenta origen (select), cuenta destino (select, debe ser distinta de origen — mismo error que ya valida el backend), monto (siempre positivo), fecha, descripción → `POST /api/v1/transfers { fromAccountId, toAccountId, amount, occurredAt, description }`.

Al guardar cualquiera de las 3, invalidar las queries de cuentas (`/accounts`), dashboard y la lista correspondiente (`/transactions` o transferencias) para que los saldos se vean actualizados sin recargar.

### 9. `/transactions`
Dos pestañas dentro de la misma pantalla (no se combinan en una sola lista — son datos de fuentes distintas y mezclarlos de un lado del cliente reintroduce el mismo riesgo que se evitó al separar `transfers` de `transactions` en el backend):

- **Movimientos**: lista de `GET /api/v1/transactions` (fecha, cuenta, categoría, monto, descripción). Filtro simple en cliente (por cuenta y/o mes, ya que el backend no filtra — ver nota arriba). Cada fila: editar (abre el mismo formulario de "Gasto/Ingreso" precargado) → `PATCH /api/v1/transactions/:id`; borrar (con confirmación) → `DELETE /api/v1/transactions/:id`.
- **Transferencias**: lista de `GET /api/v1/transfers` (fecha, cuenta origen → destino, monto, descripción). Editar → `PATCH /api/v1/transfers/:id`; borrar → `DELETE /api/v1/transfers/:id`.

### 10. `/budgets`
- Selector de mes (`<input type="month">`, produce directamente el formato `'YYYY-MM'` que espera la API).
- Lista de `GET /api/v1/budgets?period=<mes seleccionado>`: categoría, límite, gastado, barra de progreso (estado visual distinto si `spent > amountLimit`).
- "Agregar presupuesto" → categoría (select, solo categorías sin presupuesto ya creado para ese mes — el backend rechaza duplicados de `familyId+categoryId+period`) + límite → `POST /api/v1/budgets { categoryId, period, amountLimit }`.
- Editar límite → `PATCH /api/v1/budgets/:id { amountLimit }`.

## Pendiente / fuera de este flujo
- Invitación de miembros a una familia existente (fuera del MVP). Cuando se diseñe, debe resolverse con un link/token de invitación ligado directamente al `familyId`, nunca con búsqueda por nombre de familia (el nombre no es único).
- Filtros de servidor para `GET /transactions` (`accountId`, `categoryId`, `from`, `to`, `page`) — el backend los describe en el spec original pero no están implementados; hoy el frontend filtraría en el cliente sobre el listado completo de la familia.
- `transaction_revisions` (auditoría) y `/admin/reconcile` — no tienen pantalla propia contemplada; son herramientas de backend/soporte, no flujo de usuario final por ahora.
