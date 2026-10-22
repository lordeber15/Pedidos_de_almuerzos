# Design

## Context

Ver `proposal.md` para el motivo. Puntos del estado actual que condicionan el diseño:

- `pedidos.estado` solo modela pago (`pendiente`/`pagado`); el "día cerrado" es la existencia de una fila en `cierres_dia` (creada manualmente por `POST /api/cobros/cerrar`, exigiendo todos los pagados).
- No existe ningún concepto de hora en todo el código: `hoy()` (`backend/src/routes/pedidos.js`) solo produce la fecha en la zona horaria `TZ` (default `America/Lima`).
- `POST /api/comensales/identificar` devuelve `pedido_hoy` sin precios a propósito; el único cálculo de totales (precio base + reparto de delivery) vive en `resumir()` dentro de `backend/src/routes/cobros.js` (no exportado), con `repartirDelivery`/`totalCuenta` en `backend/src/logic/delivery.js`.
- La pantalla pública (`frontend/src/PantallaPublica.jsx`) ya distingue "día cerrado" (`dia_cerrado` de `GET /api/menu/vigente`) para ocultar el formulario.
- Configuración: tabla monofila `config_admin (id=1)` solo con credenciales; migraciones numeradas `00X_*.sql` en `backend/src/db/migrations/`.

## Goals / Non-Goals

**Goals:**

- Una única definición de servidor de "día cerrado para pedidos" (fila en `cierres_dia` **o** hora de corte alcanzada) usada por el rechazo de pedidos, el countdown y la visibilidad del monto.
- Garantizar que el monto que ve el comensal sea idéntico al total que ve el administrador (mismo código de cálculo).
- Que la decisión de corte y el countdown se basen en la hora del servidor, nunca en la del dispositivo.

**Non-Goals:**

- Cierre automático de cobros a la hora (el cierre manual de cobros con todos los pagados no cambia - decisión del usuario).
- Configurar hora distinta por fecha; configurar el monto de delivery (sigue en `DELIVERY_TOTAL`); editar o eliminar pedidos.
- Countdown en el panel del administrador (solo pantalla pública, aunque los datos queden disponibles para reutilizarlos).

## Decisions

**D1 - Almacenamiento: columna nullable `hora_cierre TIME` en `config_admin`.**
Migración `007_hora_cierre.sql` (`ALTER TABLE config_admin ADD COLUMN hora_cierre TIME`), NULL = sin corte automático (retrocompatible). *Alternativas consideradas:* tabla `config_dia` por fecha - rechazada porque el usuario eligió una hora fija diaria y añadiría ciclo de vida de filas; tabla `config` nueva - innecesaria para un solo campo cuando `config_admin` ya es monofila.

**D2 - Lógica de corte en un módulo compartido `backend/src/logic/cierre.js`.**
Expone esencialmente:
- `horaCierre()` → `HH:MM | null` (lee `config_admin`), y `guardarHoraCierre(hhmm|null)` con validación `^([01]\d|2[0-3]):[0-5]\d$`.
- `diaCerradoParaPedidos(fecha, horaCierre, ahoraEnTZ)` → `true` si existe fila en `cierres_dia` **o** (hora configurada **y** `ahora >= hora_cierre` para `fecha`).
- `ahoraTZ()` → "ahora" formateado en `process.env.TZ` (default `America/Lima`), siguiendo el patrón de `hoy()`.

La comparación se hace sobre hora/minuto en la zona horaria configurada (no sobre timestamps UTC del servidor), de modo que el corte ocurra a la hora "de la oficina" aunque la VM corra en UTC. *Alternativa:* job programado (cron/pg_cron) que inserte `cierres_dia` a la hora - rechazada: eso sería cierre automático de cobros (descartado) y añade operación externa.

**D3 - Rechazo en `POST /api/pedidos`:** junto al chequeo existente de `cierres_dia` (líneas 68-74), agregar el chequeo por hora → `409` con mensaje "Los pedidos de hoy ya están cerrados (cierre a HH:MM)." El chequeo ocurre en el servidor antes del `INSERT`; ante una carrera (pedido exactamente en el segundo del corte), decide la hora del servidor. Sin cambios de API: mismo status code y estilo de error que ya se usa.

**D4 - Datos del countdown en `GET /api/menu/vigente`:** agregar al payload `hora_cierre` (`"12:30"` o `null`), `pedidos_abiertos` (booleano según D2) y `ahora` (timestamp ISO del servidor). El frontend calcula el restante una sola vez al recibir la respuesta (`restante = hora_cierre - (ahora + tiempoTranscurridoLocal)`) y baja de a un segundo, resincronizando en cada refetch y al volver a estar visible la pestaña (`visibilitychange`). *Alternativas:* usar el reloj del dispositivo - rechazada (el spec exige hora del servidor); SSE/WebSocket para el tick - desproporcionado para un contador; polling cada segundo - desperdicia requests.

**D5 - Monto en `POST /api/comensales/identificar`:** extraer `resumir()` de `cobros.js` a `backend/src/logic/totales.js` (exportado, sin cambio de comportamiento; `cobros.js` lo importa) y reutilizarlo aquí: si `diaCerradoParaPedidos(hoy)` es true y existe pedido hoy, calcular el resumen del día y devolver `pedido_hoy.monto = total` (y `delivery`); si el día sigue abierto, la respuesta no incluye ningún campo de precio (misma respuesta que hoy). *Alternativa:* calcular solo el pedido del comensal en paralelo con `cobros.js` - rechazada: dos implementaciones pueden divergir y el spec exige igualdad exacta con el total del administrador.

**D6 - UI de configuración:** nuevos endpoints `GET/PUT /api/admin/hora-cierre` (protegidos con `requiereAdmin`), y en `frontend/src/PanelAdmin.jsx` una sección "Horario" (nueva pestaña pequeña o bloque en una pestaña existente, decisión de maquetación al implementar) con input `time`, guardar y opción de vaciar para desactivar el corte. `frontend/src/api.js` agrega los llamados. La pantalla pública muestra el countdown (formato `HH:MM:SS` o `MM:SS` restante) mientras `pedidos_abiertos`; al llegar a 0 muestra el mensaje de pedidos cerrados y oculta el formulario (ya usa `dia_cerrado`, ahora ampliado por `pedidos_abiertos`).

## Risks / Trade-offs

- [Cambiar la hora a mitad de día reabre o cierra pedidos de inmediato (12:30 → 13:00 reabre si son las 12:45)] → Aceptado y especificado: la nueva hora aplica desde que se guarda; el spec de `cierre-horario` lo cubre como escenario.
- [Reloj del cliente atrasado/adelantado o laptop en suspensión congela el contador] → El restante se deriva de `ahora` del servidor + transcurso local, con resincronización en `visibilitychange` y refetch; el límite real siempre lo aplica el servidor (D3), el countdown es solo indicativo.
- [Fuga de precios antes del corte si el backend devuelve `monto` condicional mal scoping] → El campo se agrega solo cuando `diaCerradoParaPedidos` es true; incluir test de regresión: respuesta de `identificar` antes del corte no contiene `monto`, `precio_base`, `delivery` ni `total`.
- [`DELIVERY_TOTAL` leído de `.env` puede cambiar entre el corte y la consulta del comensal] → El comensal y el administrador leen el mismo valor con el mismo `resumir()` en el momento de consultar; si cambia el env y se reinicia, ambos ven el recálculo. Fuera de alcance migrarlo a BD.
- [Dos fuentes de verdad de "cerrado" (fila `cierres_dia` vs hora)] → Un solo predicado `diaCerradoParaPedidos` (D2) usado en los tres puntos; se agrega test unitario de la lógica en `backend/test/`.

## Migration Plan

1. Migración aditiva `007_hora_cierre.sql` (columna nullable) - no rompe datos existentes; al desplegar sin configurar la hora, el comportamiento es el actual (sin corte).
2. Despliegue backend primero (endpoints nuevos/extendidos), luego frontend.
3. Rollback: revertir el código y, si se desea, `ALTER TABLE config_admin DROP COLUMN hora_cierre`; no hay cambios de datos destructivos ni en `pedidos`.

## Open Questions

Ninguna abierta: la granularidad de la configuración (hora fija diaria) y el alcance del corte (solo corta pedidos, no cierra cobros) fueron resueltos con el usuario antes de escribir este documento.
