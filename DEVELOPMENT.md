# IKIS - Desarrollo local y despliegue

Esta guia describe el orden exacto para trabajar en IKIS. Ejecuta los comandos desde la raiz del repositorio:

```bash
cd ~/projects/ikis
```

## 1. Preparacion inicial (solo una vez)

### 1.1 Verificar Node.js y npm

```bash
node --version
npm --version
```

El proyecto utiliza Angular 22. Usa una version de Node.js compatible con Angular 22:

- Node.js `^22.22.3`
- Node.js `^24.15.0`
- Node.js `>=26.0.0`

En Windows, si tienes Node.js instalado en `C:\Program Files\nodejs`, la actualizacion del MSI debe ejecutarse como Administrador.

### 1.2 Verificar Java

Firestore Emulator necesita Java 11 o superior. Se recomienda Java 21.

```bash
java -version
```

Si Java no esta instalado en Ubuntu:

```bash
sudo apt update
sudo apt install -y openjdk-21-jdk
```

### 1.3 Verificar Firebase CLI

```bash
firebase --version
```

Si no esta instalado:

```bash
npm install -g firebase-tools
```

### 1.4 Instalar dependencias

```bash
npm install --prefix apps/web
npm install --prefix functions
npm install --prefix tests/firestore
```

## 2. Iniciar el entorno local (uso diario)

### Opcion recomendada: un solo comando

Desde `~/projects/ikis` ejecuta:

```bash
npm run local:start
```

En Windows PowerShell ejecuta:

```powershell
npm run local:start:win
```

Este comando realiza el proceso en este orden:

1. Compila Cloud Functions.
2. Inicia Auth Emulator.
3. Inicia Firestore Emulator.
4. Inicia Functions Emulator.
5. Espera hasta que los emuladores esten listos.
6. Inicia Angular en `http://localhost:4200/`.

El comando espera hasta que Angular y los emuladores esten listos y luego devuelve el control de la terminal.

Comandos de control:

```bash
npm run local:status
npm run local:logs
npm run local:restart
```

Comandos equivalentes en Windows:

```powershell
npm run local:status:win
npm run local:logs:win
npm run local:restart:win
```

### Entrar a la aplicacion

1. Abre `http://localhost:4200/`.
2. Pulsa **Entrar en desarrollo**.
3. La aplicacion inicia una sesion anonima dentro de Auth Emulator.
4. La aplicacion crea automaticamente el perfil local de Firestore.

No se utilizan credenciales fijas y esta sesion solo existe en el entorno local.

### Detener el entorno

```bash
npm run local:stop
```

En Windows PowerShell:

```powershell
npm run local:stop:win
```

Esto detiene Angular y todos los emuladores iniciados por `local:start`.

Para ejecutar el entorno en primer plano durante una sesion de depuracion tambien puedes usar `npm run dev` y detenerlo con `Ctrl+C`.

En Windows PowerShell usa:

```powershell
npm run dev:win
```

## 3. Alternativa: usar dos terminales

Usa esta opcion si quieres reiniciar Angular y Firebase por separado.

Terminal 1, desde `~/projects/ikis`:

```bash
npm run emulators
```

Espera el mensaje:

```text
All emulators ready! It is now safe to connect your app.
```

Terminal 2, desde `~/projects/ikis`:

```bash
npm start
```

Luego abre `http://localhost:4200/`.

## 4. Direcciones locales (informacion)

```text
Angular:          http://localhost:4200/
Emulator UI:      http://localhost:4000/
Auth Emulator:    http://localhost:9099/
Functions:        http://localhost:5001/
Firestore:        http://localhost:8081/
```

Puedes inspeccionar usuarios, documentos y llamadas desde `http://localhost:4000/`.

## 5. Validar cambios antes de terminar

Desde la raiz del repositorio:

```bash
npm run build
npm run test:web
npm run test:rules
```

El comando `npm run test:rules` inicia un Firestore Emulator temporal. Ejecutalo con `npm run dev` detenido para evitar conflictos en el puerto `8081`.

Para ejecutar toda la validacion usada por CI:

```bash
npm run validate
```

Comandos adicionales:

```bash
npm run build:web
npm run build:functions
npm run lint:functions
```

## 6. Desarrollo local vs. Firebase real

El archivo de desarrollo usa:

```ts
useEmulators: true
```

Por lo tanto, `npm start` se conecta a Firebase local. Los datos locales no se envian al proyecto real.

El build de produccion usa:

```ts
useEmulators: false
```

Por lo tanto, la aplicacion desplegada se conecta al proyecto Firebase real.

No necesitas desplegar Functions para probar cambios locales. Reinicia `npm run dev` cuando cambies configuracion o codigo de Functions y quieras asegurar una recarga limpia.

## 7. Despliegue a Firebase

### Requisitos previos

1. Iniciar sesion en Firebase CLI:

```bash
firebase login
```

2. Confirmar el proyecto configurado:

```bash
firebase use
```

3. Ejecutar validaciones:

```bash
npm run build
npm --prefix apps/web test
```

### Desplegar solo reglas Firestore

```bash
firebase deploy --only firestore:rules
```

### Desplegar Functions y reglas

```bash
firebase deploy --only functions,firestore:rules
```

### Desplegar todo el MVP configurado

```bash
firebase deploy --only hosting,functions,firestore:rules,firestore:indexes
```

### Importante: plan Blaze

El despliegue de Cloud Functions requiere que el proyecto Firebase use el plan Blaze.

El plan Blaze no es necesario para desarrollo local con Emulator Suite.

## 8. Integracion continua y despliegue desde GitHub

Cada pull request ejecuta automaticamente:

1. Validacion TypeScript de Functions.
2. Pruebas del frontend.
3. Pruebas de reglas de Firestore con el emulador.
4. Build de Angular y Functions.

El workflow de produccion se ejecuta al integrar cambios en `main` o manualmente desde la pestana **Actions** de GitHub.

Antes del primer despliegue automatico debes crear el secret:

```text
FIREBASE_SERVICE_ACCOUNT_IKIS_5FED9
```

Pasos:

1. En Google Cloud Console abre **IAM y administracion > Cuentas de servicio**.
2. Selecciona el proyecto `ikis-5fed9`.
3. Crea o selecciona una cuenta de servicio para despliegues.
4. Genera una clave JSON.
5. En GitHub abre **Settings > Secrets and variables > Actions**.
6. Crea un repository secret llamado `FIREBASE_SERVICE_ACCOUNT_IKIS_5FED9`.
7. Pega como valor el contenido completo del JSON.

No agregues el archivo JSON al repositorio.

## 9. Solucion de problemas

### `ERR_CONNECTION_REFUSED` en los puertos 9099, 8081 o 5001

Significa que los emuladores no estan ejecutandose.

Solucion:

1. Deten Angular si esta abierto.
2. Desde la raiz ejecuta `npm run dev`.
3. Espera a que los emuladores y Angular indiquen que estan listos.
4. Recarga el navegador.

### Firestore muestra errores CORS o modo offline

Normalmente ocurre cuando Angular intenta conectarse a Firestore Emulator pero el emulador no esta activo.

Confirma los puertos:

```bash
lsof -i :9099 -i :8081 -i :5001 -i :4000 -P -n
```

### El puerto 4200 esta ocupado

```bash
lsof -i :4200 -P -n
```

Si es un servidor Angular anterior:

```bash
kill <PID>
```

Para usar otro puerto directamente desde la app web:

```bash
npm --prefix apps/web start -- --port 4201
```

### El puerto 8080 esta ocupado

IKIS usa `8081` para Firestore Emulator precisamente para evitar conflictos comunes con servicios que usan `8080`.

### La interfaz aparece sin estilos

1. Deten Angular.
2. Ejecuta `npm run build:web`.
3. Inicia nuevamente con `npm run dev`.
4. Haz una recarga completa del navegador (`Ctrl+Shift+R`).

Tailwind se configura en:

```text
apps/web/.postcssrc.json
apps/web/src/styles.css
```

### Java no esta disponible

```bash
sudo apt update
sudo apt install -y openjdk-21-jdk
java -version
```
