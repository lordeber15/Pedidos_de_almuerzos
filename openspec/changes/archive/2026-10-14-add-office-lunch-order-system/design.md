# Design

## Context

Proyecto greenfield: el directorio solo contiene la estructura OpenSpec. No hay código previo que mantener. Los requisitos están en la propuesta y los deltas de specs de este cambio; este documento fija las decisiones técnicas para implementarlo.

Restricciones definidas con el usuario:
- Contenedores Docker separados: frontend, backend y base de datos PostgreSQL; todas las variables (BD, credenciales, precios base) en `.env`.
- El pedido del comensal registra solo entrada y fondo; la dirección y el medio de pago se gestionan fuera del sistema (no forman parte del pedido).
- El menú permanece vigente hasta que el administrador lo reemplace; no se archiva automáticamente por día.
- La fecha de "hoy" para los cobros la determina el backend.

## Goals / Non-Goals

**Goals:**
- Tres servicios Docker (`frontend`, `backend`, `db`) orquestados con Docker Compose, configurables por `.env`.
- API REST backend con las capacidades: comensales, menú, precios, pedidos, cobros y admin.
- Frontend SPA con una pantalla pública (registro/identificación por PIN, selección con radio buttons) y un panel de administración (pegar menú, precios, cobros del día).
- Reglas de precios y reparto de delivery con redondeo hacia arriba a 2 decimales, cubiertas por pruebas unitarias.

**Non-Goals:**
- Registro de dirección, medio de pago o capturas de pago en el pedido.
- Pasarelas de pago, notificaciones o integración con Yape/POS.
- Múltiples oficinas, turnos o sedes; el sistema asume una sola oficina.
- Gestión de usuarios comensales (edición/baja) más allá del registro por PIN.

## Decisions

**Stack: Node.js (Express) para backend, React + Vite para frontend.**
Rationale: un CRUD REST simple y un SPA pequeña; ambos ecosistemas tienen imágenes Docker oficiales ligeras y soporte maduro para PostgreSQL (pg) y bcrypt. Alternativas consideradas: FastAPI (válida, pero se elige un solo lenguaje para backend y facilitar el despliegue); Next.js (sobre-dimensionado para una API CRUD interna).

**Base de datos: PostgreSQL 16 con migraciones SQL versionadas aplicadas al arrancar el backend.**
Rationale: requisito explícito del usuario. Migraciones en archivos SQL numerados aplicadas en el arranque simplifican el ciclo de desarrollo sin añadir un ORM completo. Alternativa: Prisma/Knex — se pospone para mantener el arranque simple.

**Modelo de datos:**
- `comensales(id SERIAL PK, nombre TEXT NOT NULL, pin_hash TEXT NOT NULL, creado_en TIMESTAMPTZ)` — índice único sobre `pin_hash` para garantizar unicidad de PIN.
- `menus(id SERIAL PK, texto_original TEXT NOT NULL, entradas JSONB NOT NULL, fondos JSONB NOT NULL, activo BOOLEAN NOT NULL, creado_en TIMESTAMPTZ)` — al publicar uno nuevo, el anterior se desactiva (solo un menú activo).
- `precios(id SERIAL PK, tipo TEXT UNIQUE CHECK (tipo IN ('entrada_fondo','ceviche_fondo','solo_entrada','solo_ceviche')), monto NUMERIC(6,2) NOT NULL)` — seed con 15.00, 18.00, 6.00, 8.00.
- `pedidos(id SERIAL PK, comensal_id INT FK, menu_id INT FK, entrada TEXT NOT NULL, fondo TEXT NULL, precio_base NUMERIC(6,2) NOT NULL, estado TEXT NOT NULL CHECK (estado IN ('pendiente','pagado')) DEFAULT 'pendiente', fecha DATE NOT NULL, creado_en TIMESTAMPTZ)`.

**Seguridad de PIN: hash bcrypt del PIN de 4 dígitos; unicidad de PIN resuelta con una tabla `pin_registry(pin_hash UNIQUE)` o, más simple, índice único sobre `comensals.pin_hash`.**
Rationale: bcrypt con salt hace inviable la reversión; el índice único da la garantía a nivel de base de datos. El PIN se envía solo por HTTPS en producción. Alternativa: hash SHA-256 con salt — bcrypt se prefiere por su resistencia comprobada aunque el espacio de PINs sea pequeño.

**Administrador: usuario y contraseña iniciales provistos por `.env` (`ADMIN_USER`, `ADMIN_PASSWORD`), con sesión JWT firmada (cookie httpOnly o header Bearer).**
Rationale: credenciales iniciales simples y cambio de contraseña escribiendo el hash de la nueva contraseña en una tabla `config_admin`. Alternativa: tabla de usuarios admin desde el inicio — se elige `.env` por simplicidad, con la contraseña editable después del login.

**Parser del menú en el backend:** normaliza el texto (minúsculas para las marcas, conserva el original para los platos), busca `ENTRADAS` y luego `FONDOS` (en ese orden) y extrae las líneas no vacías entre ellas; ignora líneas que empiecen con `*` o `#` (markdown/títulos). Valida que ambos marcadores existan y en el orden correcto; si no, responde 422 con mensaje claro y no toca el menú vigente. Fallback de nombre: si no se encuentra `REFRESCO`, se acepta hasta el final del texto para los fondos.
Rationale: el formato del texto del día es consistente (marcas `*ENTRADAS*` y `*FONDOS*`); la validación estricta evita publicar menús corruptos.

**Regla de precios:** el backend determina `precio_base` por combinación: con fondo → `entrada_fondo` (o `ceviche_fondo` si la entrada contiene "ceviche"); solo entrada → `solo_entrada` (o `solo_ceviche` si es ceviche). La comparación de "ceviche" se hace sobre el nombre en minúsculas.
Rationale: la regla de negocio está descrita en la propuesta; concentrarla en el backend evita que el frontend duplique lógica.

**Reparto de delivery:** `por_comensal = ceil((DELIVERY_TOTAL / total_pedidos_dia) * 100) / 100`, con `DELIVERY_TOTAL = 5.00` por defecto desde `.env` (`DELIVERY_TOTAL`). `total = precio_base + por_comensal`.
Rationale: el usuario pidió redondeo hacia arriba a 2 decimales por cuenta (15.8333 → 15.84). Se usa `ceil` sobre céntimos. La división se hace en el momento de consultar los cobros del día (no se persiste), de modo que el reparto refleje siempre el total real de pedidos del día.

**Frontend: React + Vite + TypeScript, con dos rutas principales: `/` (pantalla pública) y `/admin` (panel protegido).**
Rationale: SPA ligera, sin SSR necesario; el backend expone la API. Alternativa: HTML estático + vanilla JS — se descarta por mantener el estado de selección y los formularios.

## Risks / Trade-offs

- [El reparto de delivery usa la fecha del backend, que puede diferir de la zona del usuario] → Se define la zona horaria en `.env` (`TZ=America/Lima`) y se usa la fecha del servidor con esa zona.
- [Un PIN de 4 dígitos tiene poco espacio de búsqueda] → Se mantiene bcrypt con salt; el riesgo de adivinación se mitiga con el esfuerzo de cómputo por intento. Fuera del alcance: límite de intentos (se puede añadir después).
- [El parser asume marcas ENTRADAS/FONDOS consistentes] → Validación estricta con mensaje de error; el menú vigente no se modifica si el formato no coincide.
- [Cambio de precios afecta solo pedidos futuros; un cambio a mitad del día puede confundir] → Los precios se congelan por pedido (`precio_base`), lo que hace el cálculo reproducible; el admin ve los precios vigentes al momento de pedir.
- [Solo un menú activo a la vez; publicar uno nuevo reemplaza el anterior] → Es el comportamiento deseado (el menú permanece hasta ser reemplazado). El texto original queda guardado en `menus.texto_original` para auditoría.

## Migration Plan

Despliegue inicial: `docker compose up --build` con `.env` configurado; el backend aplica migraciones automáticamente al arrancar. Rollback: `docker compose down` (los datos persisten en el volumen de PostgreSQL; un rollback de código no afecta los datos por ser migraciones aditivas en esta primera versión).

## Open Questions

- ¿Se desea un límite de intentos de PIN fallidos para mitigar fuerza bruta? (No afecta los specs; puede añadirse después.)
- ¿Se requiere exportar los cobros del día a CSV/Excel para contabilidad? (Fuera del alcance actual; se puede añadir como nueva capacidad.)
