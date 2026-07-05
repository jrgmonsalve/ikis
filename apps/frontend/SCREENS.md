# Flujo de pantallas — Frontend (PWA)

Define el recorrido pantalla por pantalla del MVP, basado en la API actual del backend (todo bajo el prefijo `/api/v1`):
`POST /api/v1/auth/google`, `POST /api/v1/auth/dev`, `GET /api/v1/me`, `POST /api/v1/families`, `GET|POST|PATCH|DELETE /api/v1/categories`.

Todavía no existe la entidad de transacciones/gastos, así que este flujo cubre únicamente
auth, onboarding de familia y CRUD de categorías.

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

### 4. `/` — Dashboard (placeholder)
- Saludo + nombre de la familia.
- Navegación hacia `/categories`.
- Cáscara mínima por ahora: cuando exista la entidad de gastos, aquí vivirá el resumen/estadísticas.

### 5. `/categories`
- Árbol de categorías (raíz → subcategorías), obtenido de `GET /api/v1/categories`.
- Acciones:
  - "Agregar categoría" (raíz).
  - "Agregar subcategoría" — solo disponible sobre categorías raíz, nunca sobre una subcategoría (el backend rechaza un tercer nivel).
  - Renombrar (`PATCH /api/v1/categories/:id`).
  - Borrar (`DELETE /api/v1/categories/:id`), con confirmación que advierte el borrado en cascada de subcategorías.

### 6. Logout
- Botón en el layout autenticado (header). Limpia el JWT de `localStorage` y redirige a `/login`.

## Pendiente / fuera de este flujo
- Invitación de miembros a una familia existente (fuera del MVP). Cuando se diseñe, debe resolverse con un link/token de invitación ligado directamente al `familyId`, nunca con búsqueda por nombre de familia (el nombre no es único).
- Pantallas de transacciones/gastos — se definen cuando esa entidad exista en el backend.
