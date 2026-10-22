-- 008_deudas_excepciones.sql
-- Deudas pendientes: un comensal con pedidos sin pagar de dias anteriores
-- no puede pedir, salvo que el administrador le de una excepcion para ese
-- dia. La excepcion se puede otorgar todas las veces que haga falta (una
-- fila por dia) y tambien permite cerrar un dia con sus pedidos impagos,
-- que quedan como deuda acumulada.

CREATE TABLE IF NOT EXISTS excepciones_deuda (
    id           SERIAL PRIMARY KEY,
    comensal_id  INTEGER NOT NULL REFERENCES comensales(id),
    fecha        DATE NOT NULL,
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (comensal_id, fecha)
);

-- Pedido registrado con deuda pendiente gracias a una excepcion.
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS con_excepcion BOOLEAN NOT NULL DEFAULT false;

-- Momento del pago: permite cobrar una deuda despues de cerrar su dia.
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pagado_en TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pedidos_pendientes
    ON pedidos (comensal_id, fecha) WHERE estado = 'pendiente';
