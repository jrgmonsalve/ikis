---
name: google-auth-setup
description: Guía para configurar y probar la autenticación Google Sign-In + JWT del backend de ikis (variables de entorno, endpoint DEV_AUTH, OAuth Playground). Usar cuando se implemente, depure o pruebe algo relacionado con auth/login.
---

Leer y seguir `apps/backend/AUTH.md` — contiene la guía completa y actualizada:

- Variables de entorno necesarias (`JWT_SECRET`, `GOOGLE_CLIENT_ID`, `DEV_AUTH`) y dónde se configuran (local vs Cloudflare).
- Setup local paso a paso (`.dev.vars`).
- Cómo probar sin Google usando el endpoint de desarrollo (`POST /api/v1/auth/dev`).
- Cómo obtener un ID token real de Google vía OAuth 2.0 Playground para probar `POST /api/v1/auth/google`.
- Cómo crear las credenciales OAuth en Google Cloud Console si no existen.
- Dónde están los tests de auth (`test/shared/jwt.test.ts`, `test/modules/auth/`).

No dupliques este contenido en `CLAUDE.md`: `AUTH.md` es la fuente de verdad y se mantiene junto al código que describe.
