# Tasks

## 1. Esqueleto e infraestructura

- [x] 1.1 Crear `docker-compose.yml` con servicios `frontend`, `backend` y `db` (PostgreSQL 16), red interna y volumen para la BD; verificar con `docker compose config` que la configuración es válida
- [x] 1.2 Crear `.env.example` con todas las variables (credenciales de BD, puerto, `DELIVERY_TOTAL`, `TZ`, `ADMIN_USER`, `ADMIN_PASSWORD`, `JWT_SECRET`) y `.gitignore`; verificar que no hay secretos hardcodeados en el código
- [x] 1.3 Montar el proyecto backend (Node/Express) con healthcheck `/health` y el `Dockerfile` correspondiente; verificar que el contenedor arranca y responde

## 2. Base de datos y migraciones

- [x] 2.1 Implementar migraciones SQL versionadas (tablas `comensales`, `menus`, `precios`, `pedidos`, `config_admin`) y el runner que las aplica al arrancar; verificar con `docker compose up` que las tablas existen en PostgreSQL
- [x] 2.2 Agregar seeds: precios por defecto (15.00, 18.00, 6.00, 8.00) y registro admin inicial desde `.env`; verificar con un query que los precios y el admin existen

## 3. API de comensales (identidad)

- [x] 3.1 Implementar registro de comensal (nombre + PIN de 4 dígitos) con hash bcrypt y validación de formato del PIN; verificar con una petición de registro que responde 201 y guarda el hash (no el PIN en texto plano)
- [x] 3.2 Implementar unicidad de PIN (índico único sobre `pin_hash`) y el endpoint de identificación por PIN existente; verificar con dos registros del mismo PIN que el segundo es rechazado y que identificarse con un PIN válido devuelve el nombre

## 4. API de menú

- [x] 4.1 Implementar el parser del texto pegado (extrae entradas entre ENTRADAS y FONDOS, fondos entre FONDOS y REFRESCO, con validación de marcas y orden); verificar con pruebas unitarias usando el texto de ejemplo del usuario (MENU CRIOLLO) y un texto sin marcas que falla
- [x] 4.2 Implementar endpoint de publicación de menú (admin) que desactiva el menú anterior y activa el nuevo, y endpoint público del menú vigente; verificar que tras publicar, el endpoint público devuelve entradas y fondos correctos y que un texto inválido devuelve 422 sin modificar el menú vigente

## 5. API de precios y pedidos

- [x] 5.1 Implementar CRUD de precios para el admin (ver y editar los 4 tipos); verificar que los cambios se persisten y se aplican a un cálculo posterior
- [x] 5.2 Implementar el endpoint de registro de pedido que calcula `precio_base` según la combinación (entrada+fondo, ceviche+fondo, solo entrada, solo ceviche); verificar con pruebas unitarias las 4 combinaciones (incluye "ceviche" en minúsculas)

## 6. Lógica de delivery

- [x] 6.1 Implementar la función de reparto: `por_comensal = ceil((DELIVERY_TOTAL / total_pedidos_dia) * 100) / 100` y `total = precio_base + por_comensal`; verificar con pruebas unitarias: 5 pedidos → S/1.00 c/u, y un caso con redondeo (15.8333 → 15.84)

## 7. API de cobros y admin

- [x] 7.1 Implementar endpoint de cobros del día: lista todos los pedidos de la fecha actual con `por_comensal` y `total` calculados (incluye pedidos solo entrada); verificar con pedidos de distintos tipos que los totales son correctos y con 0 pedidos devuelve lista vacía
- [x] 7.2 Implementar endpoint de cambio de estado pagado/pendiente; verificar que el estado se persiste y aparece en la lista de cobros
- [x] 7.3 Implementar login de admin (usuario/contraseña desde `.env`) con JWT, middleware de protección y endpoint de cambio de contraseña; verificar que login incorrecto es 401, login correcto accede, y tras cambiar la contraseña la anterior deja de funcionar

## 8. Frontend público

- [x] 8.1 Montar el frontend React+Vite con ruta `/` que muestra el menú vigente; verificar con `docker compose up` que la pantalla lista entradas y fondos con radio buttons (una entrada y un fondo a la vez)
- [x] 8.2 Implementar la pantalla de registro/identificación por PIN (nombre + PIN de 4 dígitos, o solo PIN si ya existe) y el envío del pedido; verificar el flujo completo: registrarse, ver el menú, seleccionar entrada y fondo, confirmar y ver el pedido registrado en la respuesta

## 9. Frontend de administración

- [x] 9.1 Implementar la ruta `/admin` con login y el formulario para pegar el texto del día y publicar el menú; verificar que un texto válido publica el menú y un texto sin marcas muestra el error sin cambiar el menú
- [x] 9.2 Implementar la pestaña de gestión de precios; verificar que los cambios se guardan y se reflejan en el cálculo de un pedido nuevo
- [x] 9.3 Implementar la pestaña de cobros del día con la lista de comensales, su pedido, total (precio + delivery) y el botón de estado pagado/pendiente; verificar que el estado cambia y persiste al recargar

## 10. Integración y verificación final

- [x] 10.1 Verificar el despliegue end-to-end con `docker compose up --build`: los tres contenedores arrancan, las variables se leen del `.env`, y el flujo completo funciona (publicar menú → comensal se registra con PIN → pide entrada+fondo → admin ve el cobro del día con delivery repartido y puede marcarlo pagado)
