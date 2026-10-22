# Proposal

## Why

En el uso diario faltan tres datos operativos: (1) los comensales necesitan indicar instrucciones adicionales con su pedido (ej. "sin cebolla"), que hoy no se pueden guardar ni ver; (2) en la pantalla de selección de almuerzo no se muestra la fecha, así que no queda claro de qué día es el menú; (3) si un día no se cobra al 100%, las deudas pendientes desaparecen de la vista de cobros al cambiar la fecha, aunque el día nunca se haya cerrado — el administrador pierde el rastro de quién debe.

## What Changes

- Los pedidos aceptan un campo opcional de **instrucciones adicionales** (texto libre) que se guarda con el pedido.
- La pestaña **"Pedidos del día"** (lista de texto para cocina/reparto) muestra las instrucciones de cada comensal debajo de su nombre, antes del siguiente comensal.
- La **pantalla pública** muestra la fecha actual al lado derecho del saludo con el nombre del comensal (vista donde se elige el almuerzo).
- La vista de **cobros** conserva los pedidos pendientes de cualquier día **no cerrado** aunque haya cambiado la fecha, hasta que el administrador cierre ese día; se puede cerrar un día pendiente desde la vista (exigiendo que sus pedidos estén todos pagados).

## Capabilities

### New Capabilities

- `lista-pedidos-dia`: la pestaña de texto "Pedidos del día" agrupada por comensal (para copiar/pegar en cocina o reparto), incluyendo las instrucciones adicionales bajo el nombre de cada comensal.

### Modified Capabilities

- `pedidos-y-precios`: nuevo requisito de instrucciones adicionales opcionales al registrar un pedido (se guardan con él y no afectan el precio).
- `menu-daily`: la pantalla pública muestra la fecha del día junto al saludo con el nombre del comensal.
- `admin-cobros`: la vista de cobros conserva los pedidos pendientes de días no cerrados al cambiar la fecha, y permite cerrar un día pendiente desde esa vista.

## Impact

- **Base de datos**: migración nueva — columna `instrucciones` (texto, opcional) en la tabla `pedidos`.
- **Backend**:
  - `routes/pedidos.js` — `POST /api/pedidos` acepta y persiste `instrucciones`.
  - `routes/cobros.js` — `GET /api/cobros/dia` incluye pedidos pendientes de días no cerrados anteriores; `POST /api/cobros/cerrar` admite cerrar un día pendiente (fecha distinta a hoy).
  - `logic/listaPedidos.js` — el texto agrupado incluye las instrucciones bajo el nombre.
- **Frontend**:
  - `PantallaPublica.jsx` — campo opcional de instrucciones en el formulario de pedido y fecha al lado del saludo.
  - `PanelAdmin.jsx` — pestaña Cobros muestra días no cerrados con sus deudas y botón de cierre por día.
  - `api.js` — firma de `crearPedido` y parámetro de cierre por fecha.
- **Pruebas**: `test/listaPedidos.test.js` y cobros afectados; se añade cobertura para instrucciones y días pendientes.
