# Proposal

## Why

Hoy los pedidos se aceptan hasta que el administrador cierra el día manualmente, sin un límite de hora: cualquiera puede seguir pidiendo mientras el día siga abierto, lo que impide definir cuándo el reparto del delivery queda fijo. Además, el comensal nunca ve cuánto debe pagar porque el monto solo se calcula al cerrar; sin una hora de corte no hay momento en el que el monto pueda mostrarse con certeza.

## What Changes

- El administrador configura una **hora de cierre de pedidos** (una hora fija diaria) desde el panel; si aún no se configura, no hay corte automático (comportamiento actual).
- Al llegar la hora configurada, el sistema **deja de aceptar pedidos nuevos** (rechazo en el servidor); esto **solo corta pedidos**: el cierre manual de cobros con todos los pagados continúa igual.
- La pantalla pública muestra un **countdown** con el tiempo restante hasta la hora de cierre para que el comensal sepa hasta cuándo puede pedir; al llegar a cero muestra que ya no se aceptan pedidos.
- Una vez pasada la hora de cierre (día ya no acepta pedidos), cuando el comensal se identifica con su PIN ve, junto a lo que pidió, **el monto a pagar** (precio base + su parte del delivery). **Antes de la hora de cierre no se muestra ningún monto**, porque el delivery se divide entre el total de pedidos y todavía pueden entrar más comensales.

## Capabilities

### New Capabilities

- `cierre-horario`: configuración por parte del administrador de la hora diaria de cierre de pedidos, el rechazo de nuevos pedidos a partir de esa hora y el countdown visible en la pantalla pública.
- `monto-comensal`: visualización por el comensal (vía PIN) del monto a pagar recién cuando el día quedó cerrado para pedidos, con su parte de delivery incluida; y su ocultamiento mientras el día siga abierto.

### Modified Capabilities

<!-- Ninguna capacidad existente cambia requisitos: el corte y el monto son comportamientos nuevos; el cierre manual de cobros y el reparto del delivery quedan tal cual. -->

## Impact

- **Backend**
  - `backend/src/db/migrations/` — nueva migración para guardar la hora de cierre (extiende `config_admin` o tabla de configuración).
  - `backend/src/routes/admin.js` (o nueva ruta de configuración) — endpoint para leer/guardar la hora de cierre.
  - `backend/src/routes/pedidos.js` — rechazar `POST /api/pedidos` cuando ya pasó la hora de cierre del día.
  - `backend/src/routes/menu.js` (`GET /api/menu/vigente`) — exponer hora de cierre y estado del corte para el countdown.
  - `backend/src/routes/comensales.js` (`POST /api/comensales/identificar`) — incluir el monto a pagar cuando el día ya cerró; seguir sin incluirlo antes.
  - `backend/src/routes/cobros.js` — reutilizar el cálculo de totales existente (`resumir()`, `repartirDelivery`) para el monto del comensal.
- **Frontend**
  - `frontend/src/PantallaPublica.jsx` — countdown hasta la hora de cierre y monto a pagar en la vista del comensal identificado.
  - `frontend/src/PanelAdmin.jsx` — nueva configuración de la hora de cierre (pestaña existente o nueva).
  - `frontend/src/api.js` — llamadas a los nuevos/modificados endpoints.
- **Fuera de alcance**: monto del delivery (sigue viniendo de `DELIVERY_TOTAL`), edición/eliminación de pedidos, y el flujo manual de cobros/pago.
