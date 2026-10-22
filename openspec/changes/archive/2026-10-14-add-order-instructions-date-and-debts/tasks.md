# Tasks

## 1. Instrucciones adicionales (base de datos y backend)

- [x] 1.1 Crear la migración `backend/src/db/migrations/006_instrucciones_pedido.sql` con `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS instrucciones TEXT`; verificar con `docker compose up` (o aplicando el runner) que la columna existe en la tabla `pedidos`
- [x] 1.2 Actualizar `POST /api/pedidos` para aceptar `instrucciones` opcional (trim, saltos de línea a espacio, máximo 300 caracteres, 400 si se excede) y guardarla; verificar con una petición que responde 201 y la instrucción queda en la BD, y con una de 301+ caracteres que responde 400
- [x] 1.3 Actualizar `GET /api/cobros/lista` para seleccionar `p.instrucciones`; verificar con una petición que el JSON la incluye para el pedido que la tiene
- [x] 1.4 Actualizar `textoListaPedidos` para imprimir las instrucciones (prefijo `> `) debajo de la línea del nombre y antes del separador del siguiente comensal, solo cuando existan; verificar con pruebas unitarias en `test/listaPedidos.test.js`: un pedido con instrucciones (aparece bajo su nombre, antes del siguiente) y uno sin ellas (no muestra la línea), y que `npm test` pasa

## 2. Fecha en la pantalla pública

- [x] 2.1 Agregar `fecha` (con `hoy()`) a la respuesta de `GET /api/menu/vigente`; verificar con una petición que devuelve la fecha en formato `YYYY-MM-DD` del día según `TZ`
- [x] 2.2 Mostrar en `PantallaPublica.jsx` la fecha (formateada en español) al lado derecho del saludo `¡Hola, {nombre}!`, usando la fecha del endpoint; verificar visualmente en la vista de selección de almuerzo que la fecha aparece junto al nombre y coincide con la del pedido registrado
- [x] 2.3 Agregar en `PantallaPublica.jsx` un campo opcional de instrucciones en el formulario de pedido, enviarlo en `api.crearPedido` y limpiarlo tras confirmar; verificar que un pedido se registra con la instrucción en la BD (201) y que el campo vacío también funciona

## 3. Cobros: deudas de días no cerrados

- [x] 3.1 Agregar a `GET /api/cobros/dia` el arreglo `dias_pendientes` con las fechas anteriores a hoy que tienen pedidos y sin registro en `cierres_dia` (conservan sus pedidos en la vista, aunque ya estén pagados, hasta que se cierren), cada una con sus pedidos y totales (reutilizando `resumir()`); verificar sembrando un día anterior sin cierre que aparece en la respuesta, que sigue visible al pagar sus pedidos, y que al cerrar ese día desaparece
- [x] 3.2 Cambiar `POST /api/cobros/cerrar` para aceptar `fecha` opcional (default hoy) con las mismas validaciones (no cerrado, con pedidos, todos pagados); verificar que cierra una fecha pasada (201 + fila en `cierres_dia`), que responde 409 si hay pendientes y 409 si ya estaba cerrado
- [x] 3.3 Restringir `PATCH /api/cobros/:id/estado` contra el cierre de la fecha **del pedido** (no solo de hoy); verificar que con un día anterior cerrado no se puede cambiar el estado de sus pedidos (409) y que con el día abierto sí
- [x] 3.4 Mostrar en la pestaña Cobros de `PanelAdmin.jsx` los días pendientes (fecha, pedidos con instrucciones no aplica aquí, totales y acciones de marcar pagado/cerrar ese día) debajo del día de hoy; verificar manualmente con un día anterior sin cerrar que la vista lo muestra hasta cerrarlo, incluida la línea "Para cerrar el día deben estar pagados los N pedido(s) pendientes"
- [x] 3.5 Actualizar `api.js` (`cerrarDia(fecha?)`, `cobrosDelDia` con `dias_pendientes`) y el aviso de cierre exitoso mostrando la fecha cerrada; verificar que el panel funciona sin errores de consola tras cerrar un día anterior

## 4. Verificación final

- [x] 4.1 Ejecutar `npm test` en `backend/` y verificar que todos los tests (existentes + nuevos) pasan
- [x] 4.2 Verificar end-to-end con `docker compose up --build`: registrar un pedido con instrucciones → la pantalla pública muestra la fecha junto al nombre → la pestaña "Pedidos del día" muestra las instrucciones bajo el nombre antes del siguiente comensal → simular un día siguiente con deuda sin cerrar → la deuda sigue visible en Cobros → pagar todo y cerrar el día → la deuda desaparece
