---
name: finance-spec
description: Spec completo de Transacciones, Cuentas, Presupuestos y Transferencias del backend de ikis (esquema, casos de uso, batches revert-and-apply, ciclo de presupuesto configurable, API). Usar al trabajar en los módulos accounts, transactions, transfers o budgets.
---

Leer `SPEC-finanzas-familiares.md` (raíz del repo) completo antes de tocar cualquiera de estos módulos. Contiene, en este orden:

1. Alineación con lo ya construido (qué cambió respecto al planteamiento original: ids `text`, sin roles, categorías de 2 niveles existentes, sin `/api/v1` en el spec original pero sí en el proyecto).
2. Principios de diseño no negociables (transactions como única fuente de verdad, balance como caché sincronizado en el mismo `db.batch()`, dinero en INTEGER, multi-tenant estricto, soft delete, patrón revert-and-apply).
3. Esquema Drizzle de las tablas nuevas (`accounts`, `transactions`, `budgets`, `transaction_revisions`, `transfers`).
4. Casos de uso de `application` con el detalle de cada batch.
5. Transferencias entre cuentas (por qué es una entidad separada y no dos transactions).
6. Ciclo de presupuesto configurable (`budgetCycleStartDay`) — incluye un bug real ya corregido, vale la pena leer esa sección antes de tocar `budgets`.
7. Consulta de presupuestos (por qué solo se crean sobre categorías padre, el query SQL de `getBudgetStatus`).
8. API pública, tests mínimos requeridos, y el orden de implementación (con lo ya hecho marcado).

No copies este contenido a `CLAUDE.md`: el spec vive en su propio archivo porque es denso y de uso puntual; este skill es solo la puerta de entrada liviana.
