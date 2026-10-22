# Proposal

## Why

Los pedidos de almuerzo de la oficina se organizan manualmente por chat: no hay una fuente única del menú del día, el reparto del delivery se calcula a mano con errores de redondeo, y controlar quién pagó se hace con hojas de cálculo propensas a fallos. Se necesita un sistema que publique el menú diario, registre los pedidos de cada comensal y calcule los cobros del día de forma automática y verificable.

## What Changes

- Se crea un sistema web greenfield con tres contenedores Docker separados: frontend (SPA), backend (API REST) y base de datos PostgreSQL. Todas las variables van en `.env`.
- **Pantalla pública**: muestra el menú vigente con radio buttons; el comensal se identifica con nombre + PIN de 4 dígitos y confirma su pedido (entrada y fondo, o solo entradas).
- **Identidad de comensal**: registro con nombre y PIN único e irrepetible (guardado con hash); el PIN permite volver a identificarse para pedir nuevamente, relacionado siempre con su nombre.
- **Publicación del menú por pegado de texto**: el administrador pega el texto del día (formato `MENU CRIOLLO ... *ENTRADAS* ... *FONDOS* ... *REFRESCO*`); el sistema extrae las entradas entre las marcas ENTRADAS y FONDOS, y los fondos entre FONDOS y REFRESCO. El menú permanece vigente hasta ser reemplazado.
- **Precios configurables por el administrador**: entrada+fondo = S/15.00; entrada con ceviche+fondo = S/18.00; solo entrada = S/6.00; solo ceviche = S/8.00. Valores editables.
- **Delivery repartido**: S/5.00 agregados al día y divididos entre todos los pedidos del día; cada cuenta recibe su parte redondeada hacia arriba a 2 decimales (ej. 15.8333 → S/15.84).
- **Panel de administración**: login `admin`/`admin123` (contraseña editable) con una pestaña de **Cobros del día** que lista a todos los que pidieron, con su pedido y total, y permite marcar cada uno como pagado o pendiente.

## Capabilities

### New Capabilities

- `menu-daily`: publicación del menú pegando texto del día, extracción de secciones ENTRADAS/FONDOS, menú vigente en pantalla pública y su permanencia hasta ser reemplazado.
- `comensal-identidad`: registro de comensal con nombre y PIN de 4 dígitos único, e identificación por PIN para pedir nuevamente.
- `pedidos-y-precios`: registro de pedidos (entrada [+ fondo]) con selección por radio buttons, precios según combinación (incluye ceviche) y configuración de precios generales por el administrador.
- `delivery-reparto`: reparto del delivery del día entre todos los pedidos y redondeo hacia arriba a 2 decimales por cuenta.
- `admin-cobros`: autenticación de administración con contraseña editable, listado de cobros del día con totales y estado pagado/pendiente por pedido.

### Modified Capabilities

Ninguno — este es un proyecto nuevo; no existen capacidades previas en `openspec/specs/`.

## Impact

- **Código**: nuevo proyecto; no hay código previo que modificar.
- **Infraestructura**: `docker-compose.yml` con servicios `frontend`, `backend` y `db` (PostgreSQL 16); `.env` y `.env.example` con credenciales de BD, puerto, precio base de delivery y credenciales admin iniciales.
- **APIs**: endpoints REST para comensales (registro/identificación), menú (publicación/vigente), precios (CRUD admin), pedidos (registro) y cobros del día (listado/estado).
- **Datos**: tablas `comensales`, `menus`, `precios` y `pedidos` en PostgreSQL.
- **Dependencias**: stack de frontend y backend por definir en design.md; psycopg/bcrypt/JWT u equivalentes.
