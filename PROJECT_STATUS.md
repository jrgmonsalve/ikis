# IKIS - Estado del proyecto

Ultima actualizacion: 6 de junio de 2026

## Estado actual

El MVP esta desplegado y operativo en:

https://ikis-5fed9.web.app

El entorno local continua disponible mediante:

```bash
npm run dev
```

## Funcionalidades implementadas

- Aplicacion Angular PWA con Tailwind CSS.
- Autenticacion con Google en produccion.
- Autenticacion anonima para desarrollo local.
- Persistencia de la sesion y proteccion de rutas.
- Creacion y seleccion de familias.
- Contexto de familia activa.
- Gestion de miembros e invitaciones.
- Creacion y consulta de cuentas.
- Creacion y consulta de categorias.
- Registro de gastos, ingresos y transferencias.
- Actualizacion atomica de saldos mediante Cloud Functions.
- Manejo diferenciado de deuda de tarjetas de credito.
- Creacion y seguimiento de presupuestos.
- Creacion y pago de pagos recurrentes.
- Dashboard con resumen financiero.
- Reportes por periodo y categoria.
- Pantalla de configuracion y perfil.
- Cambio de idioma entre espanol e ingles.
- Formato monetario para COP y USD.
- Carga diferida de pantallas mediante rutas lazy.

## Firebase

Recursos desplegados en el proyecto `ikis-5fed9`:

- Firebase Hosting.
- Firebase Authentication.
- Cloud Firestore.
- Reglas e indices de Firestore.
- Cloud Functions de segunda generacion con Node.js 22.

Functions publicadas:

- `acceptInvitation`
- `createFamily`
- `createExpense`
- `createIncome`
- `createTransfer`
- `markRecurringPaymentAsPaid`

El proyecto utiliza el plan Blaze. Artifact Registry elimina automaticamente imagenes con mas de siete dias.

## Desarrollo local

El modo local utiliza Firebase Emulator Suite:

```text
Angular:       http://localhost:4200/
Emulator UI:   http://localhost:4000/
Auth:          http://localhost:9099/
Functions:     http://localhost:5001/
Firestore:     http://localhost:8081/
```

La configuracion de desarrollo usa `useEmulators: true`. La configuracion de produccion usa `useEmulators: false`.

El procedimiento completo esta documentado en `DEVELOPMENT.md`.

## Validaciones actuales

- 13 pruebas frontend aprobadas.
- 11 pruebas de reglas Firestore aprobadas.
- Validacion TypeScript de Functions aprobada.
- Build de Angular aprobado.
- Build de Functions aprobado.
- Hosting de produccion responde correctamente.
- `git diff --check` sin errores.

Validacion completa:

```bash
npm run validate
```

Este comando debe ejecutarse con `npm run dev` detenido porque inicia un Firestore Emulator temporal.

## CI/CD

Los workflows estan activos y realizan:

- Validacion automatica de pull requests.
- Pruebas frontend y de reglas Firestore.
- Compilacion de Angular y Cloud Functions.
- Despliegue automatico a Firebase al integrar cambios en `main`.

GitHub tiene configurado el secret:

```text
FIREBASE_SERVICE_ACCOUNT_IKIS_5FED9
```

Las GitHub Actions estan configuradas para ejecutar sus acciones JavaScript con Node.js 24. La aplicacion y las Cloud Functions conservan Node.js 22 como runtime de proyecto.

## Pendientes para continuar

### Prioridad alta

- Revisar visualmente en produccion el cambio completo entre espanol e ingles.
- Probar el flujo completo de invitacion con dos cuentas Google reales.
- Confirmar desde la interfaz los permisos de `owner`, `admin` y `member`.
- Registrar y priorizar los ajustes de experiencia de usuario encontrados durante las pruebas.

### Mejoras funcionales

- Agregar edicion y desactivacion de cuentas.
- Agregar edicion y desactivacion de categorias.
- Mejorar el historial y consulta de movimientos.
- Definir e implementar frecuencia personalizada para pagos recurrentes.
- Evaluar cancelacion o reverso controlado de transacciones.
- Mejorar estados de carga, confirmaciones y mensajes de error.

### Calidad y operacion

- Agregar pruebas end-to-end para los flujos principales.
- Ampliar pruebas de reglas para todas las colecciones y operaciones.
- Revisar accesibilidad y comportamiento responsive.
- Revisar experiencia PWA e instalacion en dispositivos moviles.
- Configurar alertas de presupuesto y facturacion en Google Cloud.

## Punto de reanudacion

El siguiente bloque debe comenzar con la validacion visual de idioma en produccion. Despues se deben ejecutar las pruebas manuales de invitaciones y permisos con cuentas Google separadas, registrando cualquier ajuste concreto antes de iniciar funcionalidades posteriores al MVP.
