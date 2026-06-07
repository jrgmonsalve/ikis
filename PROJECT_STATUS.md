# IKIS - Estado del proyecto

Ultima actualizacion: 6 de junio de 2026 (Refactorización de Movimientos y Pagos Recurrentes)

## Estado actual

El MVP de IKIS esta implementado y desplegado en:

https://ikis-5fed9.web.app

La rama de trabajo es `main`. El repositorio contiene Angular PWA, Firebase Functions, reglas e indices de Firestore, pruebas y workflows de GitHub Actions.

No hay archivos de credenciales privadas versionados. La configuracion publica del cliente Firebase permanece en los archivos de environment; el JSON de la cuenta de servicio se almacena exclusivamente en el secret de GitHub `FIREBASE_SERVICE_ACCOUNT_IKIS_5FED9`.

## Funcionalidades implementadas

- Autenticacion con Google en produccion y autenticacion local para desarrollo.
- Persistencia de sesion y proteccion de rutas.
- Creacion, seleccion y contexto de familia activa.
- Gestion de miembros, roles e invitaciones.
- Cuentas y categorias (incluyendo edicion y listado).
- Gastos, ingresos y transferencias.
- Actualizacion atomica de saldos mediante Cloud Functions.
- Manejo de deuda de tarjetas de credito.
- Presupuestos y calculo de avance.
- Pagos recurrentes: creacion, edicion, marcado como pagado, alertas e indicadores visuales de estado.
- Dashboard principal: saldos, presupuestos activos, proximos pagos con indicadores, ultimos movimientos y gastos por categoria.
- Movimientos: historial con filtros de fecha personalizados (limite de 3 meses), paginacion de 20 items y reverso/cancelacion.
- Configuracion de perfil, idioma y moneda.
- Traducciones en espanol e ingles para pantallas, estados vacios, validaciones y errores.
- Fechas localizadas en `es-CO` o `en-US` segun el idioma.
- Formato monetario para COP y USD.
- PWA, Tailwind CSS y rutas lazy.

## Cambios recientes

- **Edición de Pagos Recurrentes:** Se habilitó la edición reutilizando `CreateRecurringPaymentComponent` bajo la ruta `/app/recurring-payments/:id/edit` para administradores y owners. La vista muestra condicionalmente "Editar pago recurrente" y "Guardar cambios", cargando los datos preexistentes del pago y persistiendo las modificaciones en Firestore.
- **Indicadores de Estado en Dashboard:** Se añadieron iconos de estado color-coded (verde/check para pagado, amarillo/warning para pendiente, rojo/X para vencido) a la sección "Próximos pagos" en el Dashboard principal, alineándolo con la pantalla de listado de pagos recurrentes.
- **Últimos Movimientos en Dashboard:** Nueva sección en el dashboard que lista las 10 transacciones más recientes globales y añade un enlace directo para ver el reporte de transacciones.
- **Historial de Movimientos Refactorizado:** Se desacopló la pantalla de movimientos del `PeriodService` global. Ahora:
  - Muestra por defecto los últimos 30 días de transacciones.
  - Ofrece filtros de fecha personalizados (Desde / Hasta) validados reactivamente para no superar los 90 días (3 meses).
  - Consulta a Firestore solo las transacciones dentro de ese rango seleccionado.
  - Cuenta con paginación de 20 ítems por página con botones Anterior/Siguiente.
- **Correcciones de Cambios Asíncronos (Zone.js):** Se inyectó `ChangeDetectorRef` y se forzó la detección de cambios (`cdr.detectChanges()`) en los componentes que resuelven datos asíncronamente desde Firebase SDK fuera del Angular Zone (tales como CategoryComponent, TransactionFormComponent, MarkRecurringPaidComponent, DashboardComponent, etc.).

## Firebase

Proyecto: `ikis-5fed9`

Recursos desplegados:

- Firebase Hosting.
- Firebase Authentication.
- Cloud Firestore.
- Reglas e indices de Firestore.
- Cloud Functions de segunda generacion con Node.js 22.

Functions:

- `acceptInvitation`
- `createFamily`
- `createExpense`
- `createIncome`
- `createTransfer`
- `markRecurringPaymentAsPaid`

El proyecto utiliza el plan Blaze. Artifact Registry elimina automaticamente imagenes con mas de siete dias.

## Desarrollo local

Comandos recomendados desde la raiz:

```bash
npm run local:start
npm run local:status
npm run local:logs
npm run local:restart
npm run local:stop
```

`local:start` ejecuta Angular y Firebase Emulator Suite en segundo plano. Los PID y logs se guardan en `.local-runtime/`, que esta ignorado por Git.

Direcciones:

```text
Angular:       http://localhost:4200/
Emulator UI:   http://localhost:4000/
Auth:          http://localhost:9099/
Functions:     http://localhost:5001/
Firestore:     http://localhost:8081/
```

Tambien existe `npm run dev` para ejecutar todo en primer plano y detenerlo con `Ctrl+C`.

La configuracion de desarrollo usa `useEmulators: true`; produccion usa `useEmulators: false`. No es necesario desplegar Functions para probar cambios locales.

El procedimiento completo esta en `DEVELOPMENT.md`.

## Validaciones

Ultima validacion completa aprobada:

- 36 pruebas frontend en 12 archivos (todas aprobadas, incluyendo mocks actualizados de `TransactionService`).
- 11 pruebas de reglas Firestore.
- TypeScript/lint de Functions.
- Build de Angular (build de producción completado con éxito).
- Build de Functions.
- `git diff --check`.

Comando:

```bash
npm run validate
```

Antes de ejecutarlo, detener el entorno persistente con `npm run local:stop`, porque las pruebas de reglas levantan un Firestore Emulator temporal. Al terminar se puede ejecutar `npm run local:start`.

## CI/CD

Workflows activos:

- `.github/workflows/pull-request.yml`: valida pull requests.
- `.github/workflows/deploy-production.yml`: valida y despliega automáticamente los pushes a `main`.

El despliegue incluye Hosting, Functions, reglas e indices de Firestore. La autenticacion de CI usa el secret `FIREBASE_SERVICE_ACCOUNT_IKIS_5FED9`.

## Pendientes prioritarios

1. Revisar visualmente en produccion el cambio completo entre espanol e ingles.
2. Probar el flujo completo de invitacion con dos cuentas Google reales.
3. Confirmar desde la interfaz los permisos de `owner`, `admin` y `member`.
4. Registrar y priorizar ajustes de experiencia de usuario encontrados en esas pruebas.

Las tareas 2 y 3 requieren interaccion manual con cuentas Google distintas; no deben asumirse como aprobadas solo por las pruebas automatizadas.

## Mejoras posteriores al MVP

- Editar y desactivar cuentas.
- Desactivar categorias.
- Definir frecuencia personalizada para pagos recurrentes.
- Agregar pruebas end-to-end para los flujos principales.
- Ampliar pruebas de reglas para todas las colecciones y operaciones.
- Revisar accesibilidad y responsive.
- Probar instalacion y experiencia PWA en dispositivos moviles.
- Configurar alertas de presupuesto y facturacion en Google Cloud.

## Reglas para continuar

- Leer primero `business definitions/`, `technical definitions/` y `development_backlog.md`.
- No crear secciones, flujos o funcionalidades que no esten definidos en esos documentos.
- No versionar claves privadas, secretos OAuth ni JSON de cuentas de servicio.
- Probar localmente antes de hacer push. Usar push cuando corresponda integrar el cambio o validar CI/despliegue.
- Mantener cambios pequenos y seguir los patrones existentes del repositorio.
- No revertir cambios ajenos presentes en el working tree.

## Punto de reanudacion

1. Ejecutar `git status --short --branch` y confirmar que `main` esta sincronizada y limpia.
2. Consultar el ultimo workflow de GitHub Actions y confirmar que termino correctamente.
3. Abrir produccion y validar espanol/ingles en dashboard, cuentas, presupuestos, pagos recurrentes, reportes, miembros y formularios.
4. Ejecutar la prueba manual de invitacion y permisos con dos cuentas Google.
5. Documentar bugs concretos antes de iniciar una mejora posterior al MVP.
