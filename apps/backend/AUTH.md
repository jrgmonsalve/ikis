# Autenticación (Google Sign-In + JWT)

El backend verifica un **ID token de Google** y emite su **propio JWT** (HS256, firmado con `JWT_SECRET`), que se usa en el header `Authorization: Bearer <token>` de las siguientes peticiones.

El JWT solo lleva `sub` (el id del usuario) — **no** lleva `familyId`. El `familyId` se busca en la base de datos en cada request (ver `src/shared/auth-middleware.ts`), así nunca queda desactualizado si el usuario crea su familia después de loguearse.

## Variables de entorno necesarias

| Variable | Tipo | Dónde se configura |
|---|---|---|
| `JWT_SECRET` | secreto | `.dev.vars` en local; `wrangler secret put JWT_SECRET` en remoto |
| `GOOGLE_CLIENT_ID` | pública | `wrangler.toml` (`[vars]`, commiteado) y `.dev.vars` en local |
| `DEV_AUTH` | pública | `wrangler.toml` (`"false"` en producción); `.dev.vars` (`"true"` en local) |

### Setup local (primera vez)

```bash
cp apps/backend/.dev.vars.example apps/backend/.dev.vars
```

Editar `apps/backend/.dev.vars`:
- `JWT_SECRET`: generar uno random, por ejemplo `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
- `GOOGLE_CLIENT_ID`: pedirlo a quien tenga acceso a las credenciales de Google Cloud Console del proyecto (ver sección abajo), o crear uno nuevo.
- `DEV_AUTH`: dejar en `true` para poder usar el endpoint de pruebas sin Google.

`.dev.vars` está en `.gitignore`, nunca se commitea.

### Setup remoto (Cloudflare, una sola vez)

```bash
pnpm --filter @ikis/backend exec wrangler secret put JWT_SECRET
# pega un valor random cuando lo pida (input oculto)
```

`GOOGLE_CLIENT_ID` y `DEV_AUTH` van directo en `apps/backend/wrangler.toml` bajo `[vars]` (no son secretos). `DEV_AUTH` **debe** quedar en `"false"` en `wrangler.toml` para que el endpoint de pruebas esté deshabilitado en producción.

## Probar login sin Google (endpoint de desarrollo)

Con `DEV_AUTH=true`, `POST /auth/dev` crea (o recupera) un usuario de prueba fijo (`dev@ikis.local`) y devuelve un JWT, sin pasar por Google:

```bash
pnpm dev   # en otra terminal

curl -X POST http://localhost:8788/auth/dev
# {"token":"eyJhbGciOiJIUzI1NiJ9...."}
```

Si `DEV_AUTH` no es `"true"`, el endpoint responde `404`.

Usar el token en peticiones a rutas protegidas:

```bash
curl http://localhost:8788/algun-endpoint-protegido \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...."
```

## Probar login real con Google (OAuth 2.0 Playground)

Sin frontend todavía, se puede sacar un ID token real de Google así:

1. Ir a https://developers.google.com/oauthplayground
2. Ícono de engranaje (⚙️, arriba a la derecha) → marcar **"Use your own OAuth credentials"** → pegar el `GOOGLE_CLIENT_ID` y el **Client Secret** (de Google Cloud Console, no se usa en el backend pero lo pide el Playground).
3. En "Input your own scopes" escribir `openid email profile` → **"Authorize APIs"**.
4. Iniciar sesión con una cuenta de Google y aceptar.
5. En el **Step 2**, click **"Exchange authorization code for tokens"**.
6. Copiar el campo `id_token` de la respuesta (no el `access_token` ni el `refresh_token` — esos no hacen falta y son más sensibles).

Enviarlo al backend:

```bash
curl -X POST http://localhost:8788/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"<pegar el id_token acá>"}'
```

Devuelve `{"token": "..."}` (nuestro JWT) y crea el `User` en D1 si es la primera vez que ese `googleId` inicia sesión. El `id_token` de Google expira en ~1 hora.

> Después de probar, conviene revocar el acceso de "OAuth Playground" en https://myaccount.google.com/permissions — el `refresh_token` que devuelve el Playground puede generar nuevos `access_token` indefinidamente hasta que se revoque.

## Crear las credenciales de Google (si no existen todavía)

1. https://console.cloud.google.com/apis/credentials → crear o seleccionar un proyecto.
2. **"Create Credentials"** → **"OAuth client ID"** → tipo **"Web application"**.
3. En **"Authorized redirect URIs"** agregar `https://developers.google.com/oauthplayground` (para poder probar como arriba).
4. Copiar el **Client ID** (termina en `.apps.googleusercontent.com`) y el **Client Secret**.

El Client ID es público (va en `wrangler.toml`, commiteado); el Client Secret solo hace falta para configurar el OAuth Playground y no lo usa el backend — no se guarda en el repo.

## Tests

- `src/shared/jwt.ts` (`signAppJwt` / `verifyAppJwt`) tiene tests unitarios directos con un secreto fijo de prueba (`test/shared/jwt.test.ts`).
- Los casos de uso `loginWithGoogle` / `loginAsDevUser` se testean con un `GoogleIdTokenVerifier` fake — no llaman a Google real (`test/modules/auth/application/`).
- Las rutas HTTP (`/auth/dev`, validación de `/auth/google`) tienen un test de integración contra D1 local (`test/modules/auth/infrastructure/auth-routes.test.ts`). No se testea el flujo de Google real automatizado (requiere un ID token real); para eso usar el flujo manual del Playground descrito arriba.
