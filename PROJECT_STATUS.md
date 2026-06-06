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

- 9 pruebas frontend aprobadas.
- 8 pruebas de reglas Firestore aprobadas.
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

Se crearon workflows para:

- Validar pull requests.
- Desplegar automaticamente al integrar cambios en `main`.

GitHub tiene configurado el secret:

```text
FIREBASE_SERVICE_ACCOUNT_IKIS_5FED9
```

Los workflows y el resto de cambios actuales todavia deben confirmarse y subirse al repositorio para quedar activos en GitHub.

## Pendientes para continuar

### Prioridad alta

- Realizar commit y push del estado actual.
- Ejecutar una validacion manual completa del MVP en produccion.
- Confirmar los permisos de owner, admin y member desde la interfaz.
- Probar el flujo completo de invitacion con dos cuentas Google reales.
- Revisar que la traduccion inglesa cubra todos los textos, validaciones y errores.
- Registrar y priorizar los ajustes de experiencia de usuario encontrados durante la prueba.

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
- Verificar el primer despliegue automatico desde GitHub Actions.

## Punto de reanudacion

La siguiente sesion debe comenzar revisando la aplicacion de produccion y creando una lista concreta de mejoras observadas. Antes de realizar nuevos cambios, conviene hacer commit y push del estado estable actual.


Token usage: total=1,373,783 input=1,216,954 (+ 33,105,920 cached) output=156,829 (reasoning 21,846)
To continue this session, run codex resume 019e977f-390f-7fe1-a2f3-9ae4fc20cfe5