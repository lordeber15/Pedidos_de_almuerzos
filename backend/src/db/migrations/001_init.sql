-- 001_init.sql
-- Esquema inicial del sistema de pedidos de almuerzo

CREATE TABLE IF NOT EXISTS comensales (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL,
    pin_hash    TEXT NOT NULL,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unicidad de PIN: garantiza que ningun PIN este asociado a mas de un comensal
CREATE UNIQUE INDEX IF NOT EXISTS idx_comensales_pin_hash ON comensales (pin_hash);

CREATE TABLE IF NOT EXISTS menus (
    id             SERIAL PRIMARY KEY,
    texto_original TEXT NOT NULL,
    entradas       JSONB NOT NULL,
    fondos         JSONB NOT NULL,
    activo         BOOLEAN NOT NULL DEFAULT false,
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un solo menu activo a la vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_menus_uno_activo ON menus (activo) WHERE activo = true;

CREATE TABLE IF NOT EXISTS precios (
    id     SERIAL PRIMARY KEY,
    tipo   TEXT NOT NULL UNIQUE
              CHECK (tipo IN ('entrada_fondo','ceviche_fondo','solo_entrada','solo_ceviche')),
    monto  NUMERIC(6,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS pedidos (
    id           SERIAL PRIMARY KEY,
    comensal_id  INTEGER NOT NULL REFERENCES comensales(id),
    menu_id      INTEGER NOT NULL REFERENCES menus(id),
    entrada      TEXT NOT NULL,
    fondo        TEXT,
    precio_base  NUMERIC(6,2) NOT NULL,
    estado       TEXT NOT NULL DEFAULT 'pendiente'
                   CHECK (estado IN ('pendiente','pagado')),
    fecha        DATE NOT NULL,
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos (fecha);

-- Configuracion del administrador (contraseña editable)
CREATE TABLE IF NOT EXISTS config_admin (
    id            INTEGER PRIMARY KEY DEFAULT 1,
    usuario       TEXT NOT NULL,
    password_hash TEXT NOT NULL
);
