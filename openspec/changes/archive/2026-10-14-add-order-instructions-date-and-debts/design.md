# Design

## Context

- Los pedidos viven en la tabla `pedidos` (migración `001_init.sql`), con un único pedido por comensal y fecha (índice único, `005`).
- `GET /api/cobros/dia` filtra hoy con `hoy()` (zona horaria de `TZ`, por defecto `America/Lima`) y solo lee `cierres_dia` de esa misma fecha: al pasar la medianoche, un día sin cerrar con deudas pendientes deja de aparecer.
- `POST /api/cobros/cerrar` cierra únicamente la fecha de hoy.
- La pestaña "Pedidos del día" consume `GET /api/cobros/lista`, que arma el texto con `textoListaPedidos(pedidos)` (agrupa por comensal con separador de guiones bajos).
- La pantalla pública (`PantallaPublica.jsx`) saluda con `¡Hola, {nombre}!` y registra el pedido vía `POST /api/pedidos`.
- Ver proposal.md para la motivación y specs/ para los requisitos.

## Goals / Non-Goals

**Goals:**

- Guardar instrucciones adicionales opcionales en el pedido y mostrarlas en la lista de cocina debajo del nombre, antes del siguiente comensal.
- Mostrar la fecha del día junto al saludo en la vista pública de selección de almuerzo, consistente con la fecha con que se registra el pedido.
- Que la vista de cobros muestre los pedidos pendientes de cualquier día no cerrado hasta que el administrador cierre ese día, incluyendo el cierre de días anteriores desde esa misma vista.

**Non-Goals:**

- Editar o eliminar instrucciones después de registrar el pedido (se mantiene la regla actual: cambios solo pidiendo ayuda al administrador).
- Cambiar el modelo de precios, delivery o el cierre de día vigente (hoy).
- Historial de días cerrados más allá del resumen que ya guarda `cierres_dia`.
- Notificaciones o alertas de deuda.

## Decisions

**1. Instrucciones como columna en `pedidos`, no en otra tabla.**
Nueva migración `006_instrucciones_pedido.sql` con `instrucciones TEXT` (nullable). *Alternativa considerada:* tabla `pedido_instrucciones` — rechazada: es un texto libre único por pedido, sin historial ni múltiples líneas que justifiquen normalizar.
Validación en backend: trim, un solo salto de línea reemplazado por espacio y máximo 300 caracteres (400 si se excede). No entra en el cálculo de precio.

**2. Fecha del día servida por el backend, no calculada en el cliente.**
`GET /api/menu/vigente` agrega `fecha` (con `hoy()`, la misma función que usa `POST /api/pedidos`). *Alternativa considerada:* `new Date()` en el navegador — rechazada: si el equipo tiene otra zona horaria que `TZ`, la fecha mostrada podría no coincidir con la fecha con que se guarda el pedido. El frontend solo formatea para mostrarla (ej. "14 de octubre de 2026") al lado derecho del saludo.

**3. Cobros: conservar la forma actual de respuesta y agregar días pendientes.**
`GET /api/cobros/dia` mantiene `fecha`, `pedidos`, `totales`, `cerrado`, etc. para hoy, y agrega `dias_pendientes`: fechas anteriores (menores a hoy) que tienen pedidos `pendiente` y **no** tienen registro en `cierres_dia`; para cada una incluye sus pedidos con `precio_base`, `delivery`, `total` y `estado`, más sus totales, usando el mismo motor `resumir()`. *Alternativa considerada:* cambiar la respuesta a una lista de días (rompe el contrato actual) o un endpoint nuevo obligatorio — se descartó por más churn; el frontend y backend se despliegan juntos pero no hay razón para romper lo que ya funciona.
Nota: los totales de un día anterior se recalculan con el `DELIVERY_TOTAL` vigente; `precio_base` ya está fijado por pedido, así que solo el reparto de delivery podría variar si cambió el env (riesgo asumido abajo).

**4. Cierre parametrizado por fecha.**
`POST /api/cobros/cerrar` acepta `{ fecha }` opcional (default: hoy, compatible con el cliente actual). Misma validación: día no cerrado, con pedidos, todos pagados; se inserta el resumen en `cierres_dia` con esa fecha. Una vez cerrado, esa fecha sale de `dias_pendientes`.

**5. Lista de cocina: las instrucciones van en el bloque del comensal.**
`textoListaPedidos` inserta una línea con prefijo de comentario (p. ej. `> sin cebolla`) después de la línea del nombre (`Menus Criollos (KELLY)`) y antes del separador del siguiente comensal; solo si el pedido tiene instrucciones. El query de `/api/cobros/lista` agrega `p.instrucciones`.

## Risks / Trade-offs

- [Respuesta de `/cobros/dia` crece con varios días pendientes acumulados] → Acumulación solo posible si el admin nunca cierra; la vista lista cada día por separado y el cierre los libera. Si fuera problemático, se puede limitar a los últimos N días sin cerrar.
- [Cálculo de totales de un día anterior con `DELIVERY_TOTAL` distinto al del día original] → La vista muestra los totales antes de cerrar y el admin decide; documentar en la interfaz que el cierre usa el delivery vigente.
- [Instrucciones con texto largo o saltos de línea rompen el formato de texto de la lista] → Validación de 300 caracteres y normalización a una sola línea antes de guardar.
- [Zona horaria incorrecta en `TZ`] → Se reutiliza `hoy()` en todos los lados (pedidos, cobros, cierre y `fecha` del menú) para que al menos sean consistentes entre sí.
- [Cierre de un día anterior cuando ya hay pedidos de hoy] → `cierres_dia` es por fecha (`UNIQUE(fecha)`), no hay conflicto; los estados de pago se bloquean después del cierre de su propia fecha, como hoy.

## Migration Plan

1. Migración `006_instrucciones_pedido.sql` idempotente (`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS instrucciones TEXT`), aplicada por el runner existente al arrancar.
2. Backend y frontend se despliegan juntos con `docker compose up --build`; no hay fases intermedias que expongan contratos viejos a código nuevo.
3. Rollback: volver a la imagen anterior; la columna extra es compatible hacia atrás (el código viejo la ignora) — no requiere revert de migración.

## Open Questions

- Ninguno que afecte specs, enfoque o desglose de tareas.
