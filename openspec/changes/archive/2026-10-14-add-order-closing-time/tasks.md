# Tasks

## 1. Base de datos y lógica de corte

- [x] 1.1 Crear migración `backend/src/db/migrations/007_hora_cierre.sql` que agrega la columna nullable `hora_cierre TIME` a `config_admin` y verificar con `node backend/src/db/migrate.js` que corre sin error y la columna existe (NULL por defecto, sin corte).
- [x] 1.2 Crear `backend/src/logic/cierre.js` con `horaCierre()`, `guardarHoraCierre()` (valida formato `HH:MM` y acepta vacío para desactivar), `diaCerradoParaPedidos()` y `ahoraTZ()`, y verificar con `backend/test/cierre.test.js` (`node --test`): sin hora configurada el día queda abierto; antes de la hora abierto; en o después de la hora cerrado; fila en `cierres_dia` también cierra.
- [x] 1.3 Cubrir en `backend/test/cierre.test.js` que la evaluación del corte usa la zona horaria configurada (`TZ`, default `America/Lima`) y no la hora UTC del servidor, y verificar que los tests pasan con `node --test`.

## 2. Rechazo de pedidos y datos del countdown (backend)

- [x] 2.1 Integrar el chequeo `diaCerradoParaPedidos` en `POST /api/pedidos` (junto al chequeo existente de `cierres_dia`) devolviendo `409` con mensaje de pedidos cerrados incluyendo la hora, y verificar con un test o llamada manual que un pedido hecho "después" de la hora se rechaza sin crear el registro.
- [x] 2.2 Ampliar `GET /api/menu/vigente` para incluir `hora_cierre` (`"HH:MM"` o `null`), `pedidos_abiertos` y `ahora` (timestamp ISO del servidor), y verificar que la respuesta JSON contiene esos campos tanto con hora configurada como sin ella.

## 3. Configuración de la hora por el administrador

- [x] 3.1 Agregar `GET /api/admin/hora-cierre` y `PUT /api/admin/hora-cierre` en `backend/src/routes/admin.js` con `requiereAdmin`, y verificar: sin token → 401, `13:00` se guarda y se recupera, cuerpo vacío/`null` desactiva el corte, formato inválido → 400.
- [x] 3.2 Agregar las llamadas a los nuevos endpoints en `frontend/src/api.js` y verificar que existen y usan el token de `localStorage.token_admin` como el resto de las llamadas admin.
- [x] 3.3 Agregar en `frontend/src/PanelAdmin.jsx` una sección "Horario" con campo `time`, botón guardar y opción de vaciar para desactivar, y verificar en el navegador: guardar 12:30, recargar y verla persistida; vaciar y recargar, queda sin hora.

## 4. Monto del comensal después del corte (backend)

- [x] 4.1 Extraer `resumir()` de `backend/src/routes/cobros.js` a `backend/src/logic/totales.js` exportándolo, actualizar los imports de `cobros.js`, y verificar con `node --test` que la suite existente sigue pasando (sin cambio de comportamiento en `/api/cobros/dia`).
- [x] 4.2 Modificar `POST /api/comensales/identificar` en `backend/src/routes/comensales.js` para incluir en `pedido_hoy` el `monto` y el `delivery` calculados con `resumir()` solo cuando `diaCerradoParaPedidos(hoy)` sea true, y verificar con tests: antes del corte la respuesta no contiene `monto`, `precio_base`, `delivery` ni `total`; después del corte (hora pasada o `cierres_dia` existente) sí los contiene.
- [x] 4.3 Agregar test que compare el monto devuelto al comensal con el total del mismo comensal en `GET /api/cobros/dia` para el mismo día y verificar que coinciden exactamente (incluye el redondeo del reparto de delivery).

## 5. Countdown y monto en la pantalla pública

- [x] 5.1 En `frontend/src/PantallaPublica.jsx` mostrar el countdown restante hasta `hora_cierre` derivado del `ahora` del servidor con tick de 1 segundo y resincronización en `visibilitychange`/refetch, y verificar en el navegador: con pedidos abiertos se ve contando hacia atrás, con la hora ya pasada llega a 0 y muestra el mensaje de pedidos cerrados ocultando el formulario de pedido.
- [x] 5.2 Verificar en el navegador que sin `hora_cierre` configurada la pantalla pública no muestra countdown ni límite de hora (comportamiento actual).
- [x] 5.3 Mostrar en la vista del comensal identificado el monto a pagar junto a su pedido cuando el backend lo envía, y verificar: antes del corte no aparece ningún precio en pantalla; después del corte se ve el monto (ej. S/15.00 + S/1.00 = S/16.00 con 5 pedidos).

## 6. Verificación integral

- [x] 6.1 Correr toda la suite de backend con `node --test` y verificar que todos los tests (existentes y nuevos) pasan.
- [x] 6.2 Recorrer el flujo end-to-end completo: configurar hora futura → comensal pide → countdown visible → avanzar la hora → nuevo pedido rechazado (409) → comensal identifica con PIN y ve su monto igual al de la pestaña Cobros → administrador cierra el día manualmente y todo sigue funcionando; verificar cada paso observado.
- [x] 6.3 Ejecutar `openspec validate "add-order-closing-time"` y verificar que el cambio valida sin errores.
